# Módulo `consola`

El **back-office de operación de GuajiraNet**: el sitio desde el cual el equipo
de la plataforma administra a *todas* las empresas cliente, la configuración
global (correo, catálogo de módulos) y a los propios operadores. No lo usan las
empresas — es la herramienta interna, con su propia identidad y su propio login.

Convive con el resto de la plataforma en el mismo repositorio y en el mismo
proceso (`bootstrap`), pero está separado a nivel de **identidad, ruta y
seguridad**: un operador nunca es un usuario de tenant y viceversa. Ver
[ADR 0001](decisiones/2026-09-09-0001-consola-separada-opcion-c.md) para el
porqué de este enfoque ("Opción C").

## Qué hace

| Puerto de entrada | Para qué |
|---|---|
| `AutenticarOperador` | Login de operador: correo + contraseña, **sin** identificador de empresa. Devuelve un JWT con `scope=plataforma`. |
| `CambiarContrasenaDeOperador` | Cambio de la contraseña temporal (obligatorio en el primer ingreso). |
| `AdministrarEmpresas` | Listado de todas las empresas · detalle · suspender / reactivar · editar datos de contacto · editar marca · activar / desactivar módulos. Cada mutación queda auditada. |

Además expone, bajo `/api/v1/consola/**` y protegido por la sesión de operador,
dos CRUD que **delegan en otros módulos** (ver
[ADR 0003](decisiones/2026-09-09-0003-la-consola-habla-por-acl.md)):

| Endpoint | Delega en | Módulo dueño |
|---|---|---|
| `/api/v1/consola/config-correo` | `GestionarConfiguracionCorreo` | `correo` |
| `/api/v1/consola/modulos` | `GestionarCatalogoDeModulos` + `ListarModulos` | `modulos-empresa` |

## Contrato REST

Todo bajo `/api/v1/consola/**`. `/auth/login` es público; el resto exige un
token de operador válido (`scope=plataforma`). Mientras la contraseña sea
temporal, el token solo sirve para `/api/v1/consola/auth/**`.

```
POST   /api/v1/consola/auth/login                 { correo, contrasena }         -> { operadorId, correo, rol, token, debeCambiarContrasena }
POST   /api/v1/consola/auth/cambiar-contrasena     { contrasenaActual, contrasenaNueva }  -> 204

GET    /api/v1/consola/empresas                                                   -> [ EmpresaConsolaResponse ]
GET    /api/v1/consola/empresas/{id}                                              -> DetalleEmpresaConsola
POST   /api/v1/consola/empresas/{id}/suspender                                    -> 204
POST   /api/v1/consola/empresas/{id}/reactivar                                    -> 204
PUT    /api/v1/consola/empresas/{id}/datos         { nombreLegal, representanteLegal, correo, telefono, sitioWeb }  -> 204
PUT    /api/v1/consola/empresas/{id}/marca         { colorPrimario, colorSecundario, urlLogo, tipoLogin, tipoPantallaPrincipal }  -> 204
POST   /api/v1/consola/empresas/{id}/modulos/{codigo}                             -> 204
DELETE /api/v1/consola/empresas/{id}/modulos/{codigo}                             -> 204

GET    /api/v1/consola/config-correo                                              -> [ ConfiguracionSmtp ]
POST   /api/v1/consola/config-correo               ConfigCorreoRequest            -> 201 ConfiguracionSmtp
PUT    /api/v1/consola/config-correo/{id}          ConfigCorreoRequest            -> ConfiguracionSmtp
POST   /api/v1/consola/config-correo/{id}/activar                                 -> ConfiguracionSmtp
POST   /api/v1/consola/config-correo/{id}/probar?destinatario=...                 -> { enviado } | 502 { enviado:false, error }
DELETE /api/v1/consola/config-correo/{id}                                         -> 204

GET    /api/v1/consola/modulos                                                    -> [ Modulo ]
POST   /api/v1/consola/modulos                     ModuloRequest                  -> 201 Modulo
PUT    /api/v1/consola/modulos/{id}                ModuloRequest                  -> Modulo
DELETE /api/v1/consola/modulos/{id}                                               -> 204
```

## Estructura

```
backend/consola/
├── consola-domain/
│   └── .../consola/domain/
│       ├── Operador.java                          agregado de identidad: correo, hash, rol, activo, contrasenaTemporal
│       ├── RolOperador.java                       SUPER_ADMIN | SOPORTE
│       ├── CredencialesDeOperadorInvalidasException.java   (401)
│       ├── OperadorInactivoException.java                  (403)
│       └── OperadorNoEncontradoException.java              (404)
│
├── consola-application/
│   └── .../consola/application/
│       ├── port/in/
│       │   ├── AutenticarOperador.java
│       │   ├── CambiarContrasenaDeOperador.java
│       │   └── AdministrarEmpresas.java           listar/detalle/suspender/reactivar/actualizarDatos/actualizarMarca/activar|desactivarModulo
│       ├── port/out/
│       │   ├── RepositorioOperadores.java
│       │   ├── CifradorDeContrasenaDeOperador.java
│       │   ├── EmisorDeTokenDeOperador.java       produce el JWT scope=plataforma
│       │   ├── AdministracionDeEmpresas.java      ACL hacia aprovisionamiento
│       │   └── RegistroDeAuditoria.java           escribe plataforma.tbl_auditoria_consola
│       ├── AutenticarOperadorService.java
│       ├── CambiarContrasenaDeOperadorService.java
│       ├── AdministrarEmpresasService.java        orquesta + audita cada mutacion
│       ├── ResultadoLoginOperador.java
│       └── EmpresaParaConsola.java / DetalleEmpresaConsola.java / DatosEmpresaConsola.java / MarcaConsola.java
│
└── consola-infrastructure/
    └── .../consola/infrastructure/
        ├── ConfiguracionConsola.java              conecta los servicios como beans
        ├── CambiarContrasenaDeOperadorTransaccional.java   decorador @Transactional (unidad "control")
        ├── seguridad/
        │   ├── ConfiguracionSeguridadConsola.java  SecurityFilterChain @Order(1) con securityMatcher("/api/v1/consola/**")
        │   ├── ConsolaAuthFilter.java              valida el token de operador, gate de contrasena temporal
        │   ├── EmisorJwtDeOperador.java            JWT: sub=operadorId, scope=plataforma, rol, pwd_temp
        │   ├── VerificadorJwtDeOperador.java       exige scope=plataforma
        │   ├── OperadorAutenticado.java
        │   └── CifradorBCryptDeOperador.java
        ├── persistencia/
        │   ├── RepositorioOperadoresJdbc.java      JdbcTemplate contra controlDataSource (tabla chica, sin JPA)
        │   └── RegistroDeAuditoriaJdbc.java
        ├── arranque/
        │   └── SembradorDeOperadorInicial.java     fija la contrasena del 1er SUPER_ADMIN al arrancar
        ├── aprovisionamiento/
        │   └── PuenteAdministracionDeEmpresas.java  ACL: unico punto que conoce los puertos de aprovisionamiento
        └── web/
            ├── ConsolaAuthController.java           /api/v1/consola/auth
            ├── ConsolaEmpresasController.java       /api/v1/consola/empresas
            ├── ConsolaConfigCorreoController.java   /api/v1/consola/config-correo (delega en `correo`)
            ├── ConsolaCatalogoModulosController.java /api/v1/consola/modulos (delega en `modulos-empresa`)
            ├── *Request.java / *Response.java
            └── ManejadorErrores{Consola, EmpresasConsola, ConsolaConfig}.java   scoped por assignableTypes
```

## Identidad y seguridad

- **Los operadores viven en la base de control**, tabla `plataforma.tbl_operadores`
  — nunca en `seguridad.tbl_usuarios` de un tenant. Ver
  [ADR 0002](decisiones/2026-09-09-0002-identidad-de-operador-separada.md).
- **Login propio**: `POST /api/v1/consola/auth/login` no recibe
  `identificadorEmpresa`. El JWT firmado con el mismo `app.jwt.secret` que el
  token de tenant, pero con forma distinta: `scope=plataforma`, `rol`, **sin**
  claim `empresa`, expiración corta (`app.consola.jwt.expiracion-minutos`, 15).
- **Dos mundos de token que no se cruzan**:
  - `ConfiguracionSeguridadConsola` registra un `SecurityFilterChain` con
    `@Order(1)` y `securityMatcher("/api/v1/consola/**")`, con prioridad sobre
    la cadena de `autenticacion`.
  - `JwtAuthFilter` (el filtro de tenant, registrado globalmente) hace
    `shouldNotFilter` para `/api/v1/consola/**`.
  - `JwtVerificadorDeToken` (tenant) rechaza cualquier token que traiga la
    claim `scope`.
- **Alta de operadores**: no hay registro público. El primer `SUPER_ADMIN` se
  siembra por changeset (`0020-sembrar-operador-super-admin`, correo desde
  `consola.superadmin.correo`, hash sentinela `PENDIENTE`), y
  `SembradorDeOperadorInicial` le fija la contraseña al arrancar — desde
  `CONSOLA_SUPERADMIN_PASSWORD` si está, o una temporal generada que se
  escribe en el log. En ambos casos `es_contrasena_temporal = true`.
- **Primer login obliga a cambiar la contraseña** (`ConsolaAuthFilter`: con
  `pwd_temp=true` el token solo sirve para `/api/v1/consola/auth/**`).
- **Frontend**: sección `/consola` de la app Angular actual, cargada con
  `loadChildren` (lazy) y protegida por `operadorGuard`. Token propio en
  `localStorage` (`consola_*`), interceptor propio (`consolaAuthInterceptor`);
  `authInterceptor` y `refreshTokenInterceptor` de tenant ignoran
  `/api/v1/consola/**`.

## Auditoría

Toda mutación pasa por `AdministrarEmpresasService` (o los controllers de
config), que llaman a `RegistroDeAuditoria.registrar(operadorId, accion, empresaUuid)`
**solo si la operación no lanzó excepción**. Se escribe en
`plataforma.tbl_auditoria_consola`. Acciones: `empresa.suspendida`,
`empresa.reactivada`, `empresa.datos_editados`, `empresa.marca_editada`,
`empresa.modulo_activado`, `empresa.modulo_desactivado`, `correo.config_creada`
/ `_editada` / `_activada` / `_eliminada` / `correo.prueba_enviada`,
`modulo.creado` / `_editado` / `_eliminado`. Para acciones de config global,
`empresa_uuid` es `null`.

Todavía **no hay pantalla** que lea esta tabla — se consulta por SQL.

## Cambios en otros módulos

- `aprovisionamiento` es el dueño del agregado `Empresa`; para la consola ganó:
  `Empresa.suspender()` / `.reactivar()` / `.actualizarDatos(...)` /
  `esEditablePorOperador()`, y los casos de uso `ListarEmpresas`,
  `CambiarEstadoDeEmpresa`, `ObtenerDetalleDeEmpresa`,
  `ActualizarDatosDeEmpresa`, `ActualizarPersonalizacionDeEmpresa`,
  `GestionarModulosDeEmpresa` + el puerto de lectura `ConsultaDeEmpresas`. Ver
  [ADR 0004](decisiones/2026-09-09-0004-edicion-operador-separada-del-wizard.md).
- `modulos-empresa`: `Modulo` ahora lleva `precio` + `moneda`; se agregó el
  caso de uso `GestionarCatalogoDeModulos` (crear / actualizar / eliminar).
- `autenticacion`: `JwtAuthFilter.shouldNotFilter` y `JwtVerificadorDeToken`
  rechazando tokens con `scope` (aislamiento de planos).

## Configuración

| Propiedad | Default DEV | Variable de entorno |
|---|---|---|
| `app.consola.jwt.expiracion-minutos` | 15 | `CONSOLA_JWT_MIN` |
| `consola.superadmin.correo` (parámetro Liquibase) | `admin@guajiranet.com` | `CONSOLA_SUPERADMIN_CORREO` |
| — (contraseña inicial del operador) | generada + logueada | `CONSOLA_SUPERADMIN_PASSWORD` |

Comparte `app.jwt.secret` con el módulo `autenticacion`.

## Pendiente

- **RBAC real por rol**: hoy cualquier operador autenticado (`SUPER_ADMIN` o
  `SOPORTE`) puede hacer todo. Falta distinguir acciones destructivas /
  gestión de operadores (solo `SUPER_ADMIN`).
- **Gestión de operadores** desde la consola (invitar, desactivar, cambiar
  rol) — hoy solo existe el sembrado.
- **Pantalla de auditoría** con filtros por operador / empresa / acción / fecha.
- **MFA (TOTP)** obligatorio para operadores (la columna `mfa_secret` ya existe
  en `tbl_operadores`).
- **Impersonación** ("entrar como empresa") con token de tenant acotado y
  auditado.
- **Detalle del pipeline de aprovisionamiento** + re-aprovisionar empresas en
  `ERROR`, y suspensión que corte el login del tenant en
  `AutenticarUsuarioService` (hoy solo lo corta la capa de ruteo).
- `identificador` y `dominio` son **solo lectura** en la edición — renombrarlos
  implica renombrar la base física, fuera de alcance.
- El **correo de contacto** de la empresa (`tbl_empresas.correo_contacto`) es
  independiente del correo de acceso de los usuarios del tenant
  (`seguridad.tbl_usuarios.correo`); editar uno no toca el otro.
- Separar el frontend a un proyecto Angular propio (`frontend/projects/consola/`)
  con subdominio (`panel.guajiranet.com`) — diferido hasta que el back-office
  lo justifique (ADR 0001).

## Decisiones de diseño relacionadas

- [`decisiones/2026-09-09-0001-consola-separada-opcion-c.md`](decisiones/2026-09-09-0001-consola-separada-opcion-c.md)
- [`decisiones/2026-09-09-0002-identidad-de-operador-separada.md`](decisiones/2026-09-09-0002-identidad-de-operador-separada.md)
- [`decisiones/2026-09-09-0003-la-consola-habla-por-acl.md`](decisiones/2026-09-09-0003-la-consola-habla-por-acl.md)
- [`decisiones/2026-09-09-0004-edicion-operador-separada-del-wizard.md`](decisiones/2026-09-09-0004-edicion-operador-separada-del-wizard.md)

Flujo de punta a punta: [`docs/backend/flujos/consola-de-operacion.md`](../../flujos/consola-de-operacion.md).

---

## Historial de cambios

- **2026-09-09** — Creación del módulo. Fase 0-1: identidad de operador
  (`tbl_operadores`, `tbl_auditoria_consola`, seed del primer `SUPER_ADMIN`),
  login propio con JWT `scope=plataforma`, cambio de contraseña obligatorio.
  Fase 2: listado de empresas + suspender / reactivar vía ACL a
  `aprovisionamiento`, con auditoría. Fase 3: detalle y edición de una empresa
  (datos, marca, módulos) por un camino de operador separado del wizard. Fase 4:
  CRUD del catálogo de módulos (`precio` + `moneda`) y de la configuración SMTP,
  ambos delegando en sus módulos dueños. Frontend: sección `/consola` lazy con
  guard e interceptor propios.
