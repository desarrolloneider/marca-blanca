# Flujo — Consola de operación

> Cómo el equipo de GuajiraNet entra a la consola, administra las empresas
> cliente y la configuración global de la plataforma. Es la contracara del
> [onboarding de empresas](onboarding-de-empresas.md): allá el cliente se
> registra solo; acá el operador administra.

Diseño y motivación en [`docs/backend/modulos/consola/`](../modulos/consola/README.md).

## 1. Panorama

```
Login operador       POST   /api/v1/consola/auth/login              -> 200  { operadorId, correo, rol, token(scope=plataforma), debeCambiarContrasena }
(1er ingreso)        POST   /api/v1/consola/auth/cambiar-contrasena -> 204  -> el front cierra sesión y pide re-login

Empresas             GET    /api/v1/consola/empresas                -> [ { id, identificador, dominio, correo, estado, pasoAprovisionamiento, estadoTarea, creadaEn } ]
                     GET    /api/v1/consola/empresas/{id}           -> DetalleEmpresaConsola (datos + marca + módulos)
                     POST   /api/v1/consola/empresas/{id}/suspender -> 204   activa -> suspendida
                     POST   /api/v1/consola/empresas/{id}/reactivar -> 204   suspendida -> activa
                     PUT    /api/v1/consola/empresas/{id}/datos     -> 204
                     PUT    /api/v1/consola/empresas/{id}/marca     -> 204
                     POST   /api/v1/consola/empresas/{id}/modulos/{codigo}   -> 204   activar
                     DELETE /api/v1/consola/empresas/{id}/modulos/{codigo}   -> 204   desactivar

Config de correo     GET/POST/PUT/DELETE  /api/v1/consola/config-correo[/{id}]      (delega en `correo`)
                     POST   /api/v1/consola/config-correo/{id}/activar
                     POST   /api/v1/consola/config-correo/{id}/probar?destinatario=...

Catálogo de módulos  GET/POST/PUT/DELETE  /api/v1/consola/modulos[/{id}]            (delega en `modulos-empresa`)

        ── toda mutación escribe una fila en plataforma.tbl_auditoria_consola ──
```

## 2. Antes del primer login — siembra del operador

1. Changeset `control/0020-sembrar-operador-super-admin`: inserta un `SUPER_ADMIN`
   con correo `${consola.superadmin.correo}` (default `admin@guajiranet.com`,
   override `CONSOLA_SUPERADMIN_CORREO`) y `hash_contrasena = 'PENDIENTE'`
   (sentinela que nunca valida). Idempotente (`ON CONFLICT (correo) DO NOTHING`).
2. Al arrancar la app, `SembradorDeOperadorInicial` (`ApplicationReadyEvent`)
   busca operadores con hash `'PENDIENTE'` y les fija la contraseña:
   - si está `CONSOLA_SUPERADMIN_PASSWORD` → la usa;
   - si no → genera una temporal de 14 caracteres y la escribe en el log a
     nivel `WARN`.
   En ambos casos `es_contrasena_temporal` sigue en `true`. Idempotente: una
   vez que el hash deja de ser `'PENDIENTE'`, no vuelve a tocar nada.

## 3. Login y cambio de contraseña

`POST /api/v1/consola/auth/login` — `{ correo, contrasena }`. Sin
`identificadorEmpresa`: un operador no tiene empresa.

- `AutenticarOperadorService`: busca el operador por correo en
  `plataforma.tbl_operadores`, verifica el hash (BCrypt), exige `activo`, y
  pide el token a `EmisorJwtDeOperador`.
- El JWT: `sub = operadorId`, `scope = "plataforma"`, `rol`, `correo`,
  `pwd_temp`, firmado con `app.jwt.secret`, expiración
  `app.consola.jwt.expiracion-minutos` (15).

Mientras `pwd_temp = true`, `ConsolaAuthFilter` rechaza (403) cualquier ruta
distinta de `/api/v1/consola/auth/**`. El front manda a
`/consola/cambiar-contrasena`:

`POST /api/v1/consola/auth/cambiar-contrasena` — `{ contrasenaActual,
contrasenaNueva }` (mínimo 10). Verifica la actual, guarda la nueva cifrada,
levanta `es_contrasena_temporal`. El token viejo todavía lleva `pwd_temp=true`
(el backend no reemite acá), así que el front **cierra la sesión** y pide
re-login con un token limpio.

## 4. Aislamiento del token de operador

El token de operador y el de tenant comparten el secreto de firma. Tres cortes
evitan que se crucen:

| Corte | Dónde |
|---|---|
| Cadena de seguridad propia, `@Order(1)`, `securityMatcher("/api/v1/consola/**")` | `ConfiguracionSeguridadConsola` (consola) |
| `shouldNotFilter` para `/api/v1/consola/` | `JwtAuthFilter` (autenticacion, filtro global de tenant) |
| Rechaza todo token con claim `scope` | `JwtVerificadorDeToken` (autenticacion) |

En el frontend: `consolaAuthInterceptor` adjunta el token de operador solo a
`/api/v1/consola/**`; `authInterceptor` y `refreshTokenInterceptor` de tenant
ignoran esas rutas. Claves de `localStorage` separadas (`consola_*` vs `mp_*`).

## 5. Administración de empresas

`GET /api/v1/consola/empresas` — `ListarEmpresas` (aprovisionamiento) vía el
puerto de lectura `ConsultaDeEmpresas`: `tbl_empresas` `LEFT JOIN`
`tbl_aprovisionamiento_tareas`, ordenado por fecha de registro.

`GET /api/v1/consola/empresas/{id}` — `ObtenerDetalleDeEmpresa`: datos +
`tbl_empresas_marca` + catálogo de módulos con flag activo/inactivo (vía
`modulos-empresa`).

### Suspender / reactivar

`POST …/suspender` → `Empresa.suspender()` (`ACTIVA -> SUSPENDIDA`).
`POST …/reactivar` → `Empresa.reactivar()` (`SUSPENDIDA -> ACTIVA`).
Cualquier otro estado de origen → `409`.

**Efecto de la suspensión:** hoy corta el login del tenant solo a través de la
capa de ruteo (el resolver correo→empresa y la búsqueda de conexión por
identificador exigen `estado = 'activa'`), no en `AutenticarUsuarioService`. El
mensaje de error del login se ajustó para no confundir "empresa suspendida" con
"correo inexistente".

### Editar datos / marca / módulos

Camino de operador, **separado del wizard** (que solo edita en `BORRADOR` y por
endpoints públicos). Estados editables: `PENDIENTE_APROVISIONAMIENTO`, `ACTIVA`,
`SUSPENDIDA`. `BORRADOR` / `INACTIVA` → `409` (`EmpresaNoEditableException`).

- `PUT …/datos` → `ActualizarDatosDeEmpresa` → `Empresa.actualizarDatos(...)`.
  Edita `nombre_legal`, `representante_legal`, `correo_contacto`, `telefono`,
  `sitio_web`. **No** toca el correo de acceso de los usuarios del tenant.
- `PUT …/marca` → `ActualizarPersonalizacionDeEmpresa` → `tbl_empresas_marca`
  (2 colores, logo, tipoLogin 1-3, tipoPantallaPrincipal 1-3). Reusa el value
  object `Personalizacion`, sin gate `BORRADOR`.
- `POST` / `DELETE …/modulos/{codigo}` → `GestionarModulosDeEmpresa` → activa /
  desactiva vía `modulos-empresa`.

`identificador` y `dominio` son **solo lectura** (nombran la base física).

## 6. Configuración global

### Correo (SMTP)

`/api/v1/consola/config-correo` delega en `GestionarConfiguracionCorreo` y
`ProbarConfiguracionCorreo` del módulo `correo`. La consola solo agrega la auth
de operador y la auditoría. La clave SMTP se guarda **cifrada por fila** en
`tbl_config_correo.clave_cifrada`; el CRUD valida contra un envío real antes de
guardar. Como máximo una config activa a la vez. Detalle en
[`docs/backend/modulos/correo/README.md`](../modulos/correo/README.md).

### Catálogo de módulos

`/api/v1/consola/modulos` delega en `GestionarCatalogoDeModulos` de
`modulos-empresa`. `Modulo` lleva `codigo` (único, no editable), `nombre`,
`descripcion`, `precio`, `moneda`. Borrar un módulo asignado a alguna empresa
→ `409` (`ModuloEnUsoException`).

## 7. Auditoría

`plataforma.tbl_auditoria_consola` — `{ operador_id, accion, empresa_uuid,
detalle, ip, creado_en }`. Se escribe **solo si la operación no lanzó
excepción**, desde `AdministrarEmpresasService` (empresas) o los controllers de
config (config global, con `empresa_uuid = null`).

Acciones: `empresa.suspendida`, `empresa.reactivada`, `empresa.datos_editados`,
`empresa.marca_editada`, `empresa.modulo_activado`, `empresa.modulo_desactivado`,
`correo.config_creada` / `_editada` / `_activada` / `_eliminada`,
`correo.prueba_enviada`, `modulo.creado` / `_editado` / `_eliminado`.

Todavía no hay pantalla que lea esta tabla — se consulta por SQL.

## 8. Frontend

- Sección `/consola` de la app Angular actual, `loadChildren` (lazy), guard
  `operadorGuard` (+ variante que permite quedarse en `cambiar-contrasena`).
- Pantallas: `login`, `cambiar-contrasena`, `` (listado de empresas),
  `empresas/:id` (detalle/edición por secciones: Datos / Marca / Módulos),
  `modulos` (catálogo), `config-correo`.
- Nav compartida (`ConsolaNavComponent`): Empresas · Módulos · Correo + correo
  del operador + salir.

## 9. Pendiente

Ver la sección "Pendiente" del
[README de `consola`](../modulos/consola/README.md#pendiente): RBAC por rol,
gestión de operadores, pantalla de auditoría, MFA, impersonación, detalle del
pipeline + re-aprovisionar, enforcement de la suspensión en el login, y la
separación del frontend a un proyecto propio.
