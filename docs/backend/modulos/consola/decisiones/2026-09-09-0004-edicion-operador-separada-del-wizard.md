# ADR 0004 — Edición desde la consola: camino de operador separado del wizard

**Fecha:** 2026-09-09
**Estado:** Aceptada
**Módulos afectados:** aprovisionamiento, consola

## Resumen

Para que la consola pueda editar los datos, la marca y los módulos de una
empresa **ya aprovisionada**, `aprovisionamiento` gana casos de uso nuevos que
**no relajan** el candado `BORRADOR` del wizard. El wizard y la consola son dos
caminos distintos hacia el mismo agregado, con reglas de estado distintas.

## Contexto

El wizard de registro (`PersonalizarEmpresa`, `SeleccionarModulo`,
`FinalizarRegistro`) solo permite tocar marca y módulos mientras la empresa
está en `BORRADOR` — es a propósito: una empresa cliente no debe poder
re-brandearse después de finalizar. Además esos endpoints son **públicos**
(`/api/v1/registro/**`, sin autenticación).

Si se relajara ese candado para que la consola editara empresas `ACTIVA` /
`SUSPENDIDA`, se abriría el mismo endpoint público a cualquiera con un id de
empresa. Hacía falta un camino paralelo, detrás de la sesión de operador.

## Decisión

En `aprovisionamiento`:

- **Nuevas transiciones en el agregado `Empresa`**:
  `suspender()` (`ACTIVA -> SUSPENDIDA`), `reactivar()` (`SUSPENDIDA -> ACTIVA`),
  `actualizarDatos(...)`, y el guard `esEditablePorOperador()` /
  `exigirEditablePorOperador()`. Estados editables por operador:
  `PENDIENTE_APROVISIONAMIENTO`, `ACTIVA`, `SUSPENDIDA`. `BORRADOR` (del wizard)
  e `INACTIVA` quedan fuera → `EmpresaNoEditableException` (409). También
  `EmpresaNoSuspendibleException` / `EmpresaNoReactivableException`.
- **Casos de uso nuevos (puertos de entrada)**, todos con decorador
  `@Transactional` en infraestructura:
  - `ListarEmpresas` — read model `ResumenDeEmpresa` (datos + estado del
    pipeline) vía el puerto de salida nuevo `ConsultaDeEmpresas` (JDBC sobre
    `controlDataSource`, `LEFT JOIN` a `tbl_aprovisionamiento_tareas`).
  - `CambiarEstadoDeEmpresa` (`SUSPENDER` / `REACTIVAR`).
  - `ObtenerDetalleDeEmpresa` — compone `ConsultaDeEmpresas.datosYMarca(id)`
    (`tbl_empresas` + `tbl_empresas_marca`) con el catálogo de módulos de la
    empresa (`ActivadorDeModulosDeEmpresa.listar(id)`, que a su vez pasa por
    `PuenteModulosEmpresa` hacia `modulos-empresa`).
  - `ActualizarDatosDeEmpresa`.
  - `ActualizarPersonalizacionDeEmpresa` — reusa el value object
    `Personalizacion`, sin gate `BORRADOR` (a diferencia del
    `PersonalizarEmpresaService` del wizard).
  - `GestionarModulosDeEmpresa` — activar / desactivar módulo post-registro
    (el `SeleccionarModuloService` del wizard sí está atado a `BORRADOR`).

En `consola`: el puerto ACL `AdministracionDeEmpresas` y su puente delegan en
esos casos de uso. Cada edición se audita.

## Alcance

- **`identificador` y `dominio` son solo lectura** — nombran la base física
  (`db_cliente_<slug>`); renombrarlos es una operación pesada (renombrar base,
  roles, fila de conexión) que queda fuera.
- **El correo de contacto (`tbl_empresas.correo_contacto`) es independiente del
  correo de acceso** de los usuarios del tenant
  (`db_cliente_<slug>.seguridad.tbl_usuarios.correo`). Editar el contacto **no**
  renombra al usuario administrador dentro de la base del cliente — son dos
  datos en dos bases distintas. Cambiar el login de un usuario de tenant desde
  la consola es una funcionalidad aparte (gestión de usuarios del tenant), no
  hecha.

## Consecuencias

- El wizard queda intacto: sus servicios siguen exigiendo `BORRADOR`.
- `aprovisionamiento` crece con seis casos de uso de administración; su núcleo
  sigue sin depender de la consola (la relación va en un solo sentido, y la
  consola llega vía ACL).
- La suspensión hoy se hace efectiva en el login del tenant solo a través de la
  capa de ruteo (`listarConexionesActivas` / `buscarConexionActivaPorIdentificador`
  exigen `estado = 'activa'`), no en `AutenticarUsuarioService`. El mensaje de
  error del login se ajustó para no confundir "empresa suspendida" con "correo
  inexistente". Enforcement explícito en el flujo de autenticación queda
  pendiente.
