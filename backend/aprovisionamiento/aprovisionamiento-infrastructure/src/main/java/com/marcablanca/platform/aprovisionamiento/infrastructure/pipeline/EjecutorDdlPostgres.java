package com.marcablanca.platform.aprovisionamiento.infrastructure.pipeline;

import com.marcablanca.platform.aprovisionamiento.application.port.out.ActivadorDeModulosDeEmpresa;
import com.marcablanca.platform.aprovisionamiento.application.port.out.PasosDeAprovisionamiento;
import com.marcablanca.platform.aprovisionamiento.domain.Empresa;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.util.Set;

/**
 * Unica pieza que ejecuta DDL. crearBaseDeDatos y crearRolesDeTenant usan la
 * conexion de mantenimiento (owner @ 'postgres', autocommit -- CREATE DATABASE no
 * admite transaccion). aplicarSemilla y registrarVersionDeEsquema abren una
 * conexion a la base recien clonada. registrarConexion escribe en la base de
 * control. poblarModulos delega en modulos-empresa via un puerto ACL.
 *
 * Cada metodo es idempotente: comprueba antes de actuar, para poder reanudar el
 * pipeline desde cualquier checkpoint sin duplicar efectos.
 */
@Component
class EjecutorDdlPostgres implements PasosDeAprovisionamiento {

    private static final Logger log = LoggerFactory.getLogger(EjecutorDdlPostgres.class);
    private static final String SLUG_SEGURO = "[a-z][a-z0-9_]*";

    private final JdbcTemplate mantenimiento;
    private final JdbcTemplate control;
    private final ActivadorDeModulosDeEmpresa activadorModulos;
    private final String plantilla;
    private final String hostCliente;
    private final int puertoCliente;
    private final String ownerUsuario;
    private final String ownerClave;

    EjecutorDdlPostgres(DataSource dataSourceMantenimiento,
                        @Qualifier("controlDataSource") DataSource controlDataSource,
                        ActivadorDeModulosDeEmpresa activadorModulos,
                        @Value("${app.aprovisionamiento.plantilla:db_plantilla_maestra}") String plantilla,
                        @Value("${app.aprovisionamiento.cliente-host:localhost}") String hostCliente,
                        @Value("${app.aprovisionamiento.cliente-puerto:5432}") int puertoCliente,
                        @Value("${app.aprovisionamiento.mantenimiento.username:guajiranet_owner}") String ownerUsuario,
                        @Value("${app.aprovisionamiento.mantenimiento.password:guajiranet_owner}") String ownerClave) {
        this.mantenimiento = new JdbcTemplate(dataSourceMantenimiento);
        this.control = new JdbcTemplate(controlDataSource);
        this.activadorModulos = activadorModulos;
        this.plantilla = plantilla;
        this.hostCliente = hostCliente;
        this.puertoCliente = puertoCliente;
        this.ownerUsuario = ownerUsuario;
        this.ownerClave = ownerClave;
    }

    @Override
    public void crearBaseDeDatos(Empresa empresa) {
        String nombreBd = empresa.getIdentificador().nombreBaseDeDatos();
        exigirNombreSeguro(nombreBd);
        Integer existe = mantenimiento.queryForObject(
                "select count(*) from pg_database where datname = ?", Integer.class, nombreBd);
        if (existe != null && existe > 0) {
            log.info("La base {} ya existe; no se clona de nuevo.", nombreBd);
            return;
        }
        log.info("Clonando {} desde la plantilla {}", nombreBd, plantilla);
        mantenimiento.execute("create database " + nombreBd + " template " + plantilla);
    }

    @Override
    public void aplicarSemilla(Empresa empresa) {
        if (empresa.getHashContrasenaMaestra() == null) {
            log.warn("La empresa {} no tiene hash de contrasena maestra; se omite el usuario semilla.",
                    empresa.getIdentificador().valor());
            return;
        }
        String nombreBd = empresa.getIdentificador().nombreBaseDeDatos();
        JdbcTemplate cliente = jdbcCliente(nombreBd);

        String correoAdmin = "admin@" + empresa.getDominio();
        String nombreComercial = empresa.getNombreComercial() != null
                ? empresa.getNombreComercial()
                : empresa.getNombreLegal();

        Long rolId = cliente.query(
                "select id from seguridad.tbl_roles where nombre = 'ADMIN'",
                rs -> rs.next() ? rs.getLong(1) : null);
        if (rolId == null) {
            cliente.update("insert into seguridad.tbl_roles (nombre, descripcion, es_del_sistema) "
                    + "values ('ADMIN', 'Administrador de la empresa', true)");
            rolId = cliente.queryForObject("select id from seguridad.tbl_roles where nombre = 'ADMIN'", Long.class);
        }

        Long usuarioId = cliente.query(
                "select id from seguridad.tbl_usuarios where correo = ?",
                rs -> rs.next() ? rs.getLong(1) : null, correoAdmin);
        if (usuarioId == null) {
            cliente.update(
                    "insert into seguridad.tbl_usuarios (correo, hash_contrasena, nombre_completo, es_activo) "
                            + "values (?, ?, ?, true)",
                    correoAdmin, empresa.getHashContrasenaMaestra().valor(), "Administrador " + nombreComercial);
            usuarioId = cliente.queryForObject(
                    "select id from seguridad.tbl_usuarios where correo = ?", Long.class, correoAdmin);
        }

        Integer yaAsignado = cliente.queryForObject(
                "select count(*) from seguridad.tbl_usuarios_roles where usuario_id = ? and rol_id = ?",
                Integer.class, usuarioId, rolId);
        if (yaAsignado == null || yaAsignado == 0) {
            cliente.update("insert into seguridad.tbl_usuarios_roles (usuario_id, rol_id) values (?, ?)",
                    usuarioId, rolId);
        }

        log.info("Semilla aplicada en {}: usuario maestro {} con rol ADMIN", nombreBd, correoAdmin);
    }

    @Override
    public void crearRolesDeTenant(Empresa empresa) {
        String slug = empresa.getIdentificador().valor();
        exigirNombreSeguro(slug);
        crearRolSiFalta("cli_" + slug + "_app", "guajiranet_app");
        crearRolSiFalta("cli_" + slug + "_lectura", "guajiranet_lectura");
    }

    @Override
    public void registrarConexion(Empresa empresa) {
        String nombreBd = empresa.getIdentificador().nombreBaseDeDatos();
        Integer existe = control.queryForObject(
                "select count(*) from plataforma.tbl_empresa_conexiones c "
                        + "join plataforma.tbl_empresas e on e.id = c.empresa_id where e.uuid = ?",
                Integer.class, empresa.getId());
        if (existe != null && existe > 0) {
            return;
        }
        control.update(
                "insert into plataforma.tbl_empresa_conexiones (empresa_id, host, puerto, nombre_bd, secreto_ref, es_activa) "
                        + "select e.id, ?, ?, ?, 'dev-local', true from plataforma.tbl_empresas e where e.uuid = ?",
                hostCliente, puertoCliente, nombreBd, empresa.getId());
    }

    @Override
    public void registrarVersionDeEsquema(Empresa empresa) {
        Integer existe = control.queryForObject(
                "select count(*) from plataforma.tbl_empresa_esquema_version v "
                        + "join plataforma.tbl_empresas e on e.id = v.empresa_id where e.uuid = ?",
                Integer.class, empresa.getId());
        if (existe != null && existe > 0) {
            return;
        }
        control.update(
                "insert into plataforma.tbl_empresa_esquema_version (empresa_id, ultima_migracion_aplicada) "
                        + "select e.id, ? from plataforma.tbl_empresas e where e.uuid = ?",
                ultimaMigracionDe(empresa.getIdentificador().nombreBaseDeDatos()), empresa.getId());
    }

    @Override
    public void poblarModulos(Empresa empresa, Set<String> modulosSolicitados) {
        for (String codigo : modulosSolicitados) {
            try {
                activadorModulos.activar(empresa.getId(), codigo);
                log.info("Modulo '{}' activado para {}", codigo, empresa.getIdentificador().valor());
            } catch (RuntimeException e) {
                // Un codigo de modulo invalido no debe bloquear la activacion de la empresa.
                log.warn("No se pudo activar el modulo '{}' para {}: {}",
                        codigo, empresa.getIdentificador().valor(), e.getMessage());
            }
        }
    }

    private String ultimaMigracionDe(String nombreBd) {
        try {
            String id = jdbcCliente(nombreBd).queryForObject(
                    "select id from public.databasechangelog order by dateexecuted desc, orderexecuted desc limit 1",
                    String.class);
            return id != null ? id : "desconocida";
        } catch (EmptyResultDataAccessException e) {
            return "sin-changelog";
        } catch (RuntimeException e) {
            log.warn("No se pudo leer databasechangelog de {}: {}", nombreBd, e.getMessage());
            return "desconocida";
        }
    }

    private void crearRolSiFalta(String rol, String grupo) {
        // Password = nombre del rol: convencion SOLO-DEV (igual que 0000-crear-roles-motor).
        // En QA/PROD la genera el aprovisionador y la guarda en el vault (ver ADR 0004).
        mantenimiento.execute(
                "do $$ begin "
                        + "if not exists (select from pg_roles where rolname = '" + rol + "') then "
                        + "create role " + rol + " login password '" + rol + "'; "
                        + "grant " + grupo + " to " + rol + "; "
                        + "end if; end $$;");
    }

    private JdbcTemplate jdbcCliente(String nombreBd) {
        DriverManagerDataSource ds = new DriverManagerDataSource(
                "jdbc:postgresql://" + hostCliente + ":" + puertoCliente + "/" + nombreBd,
                ownerUsuario, ownerClave);
        ds.setDriverClassName("org.postgresql.Driver");
        return new JdbcTemplate(ds);
    }

    private static void exigirNombreSeguro(String identificador) {
        if (identificador == null || !identificador.matches(SLUG_SEGURO)) {
            throw new IllegalStateException("Identificador no seguro para DDL: " + identificador);
        }
    }
}
