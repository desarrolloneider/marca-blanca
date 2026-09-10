# Módulo Aprovisionamiento

> Resumen vivo. Se actualiza *in place* cada vez que el módulo cambia.

## 1. Qué es y qué NO es

Dueño del **onboarding de empresas**: el wizard público de registro, el
aprovisionamiento de la base física de cada cliente (`db_cliente_<slug>`) y el
correo de bienvenida.

Flujo completo, paso a paso, endpoints y estados:
[`docs/backend/flujos/onboarding-de-empresas.md`](../../flujos/onboarding-de-empresas.md).

**No le corresponde**:
- Resolver a qué base va cada petición en runtime — eso es [`empresas`](../empresas/README.md).
- Ser dueño del catálogo de módulos — eso es [`modulos-empresa`](../modulos-empresa/README.md); este módulo lo **invoca** vía puente ACL.
- Servir la marca a una empresa activa — eso es [`identidad-visual`](../identidad-visual/README.md); este módulo **escribe** `tbl_empresas_marca` durante el wizard con su propio mapeo (ADR 0006).
- Login / cambio de contraseña — eso es [`autenticacion`](../autenticacion/README.md); este módulo solo genera la contraseña temporal.

## 2. Contrato REST (todo público, `permitAll` en `SecurityConfig`)

| Método | Ruta | Paso |
|---|---|---|
| `POST` | `/api/v1/registro/empresas` | 1 — registro (crea `borrador`) → `201` |
| `POST` | `/api/v1/registro/empresas/{id}/modulos/{codigo}/activar` | 2 — elegir módulo → `204` |
| `POST` | `/api/v1/registro/empresas/{id}/modulos/{codigo}/desactivar` | 2 → `204` |
| `PUT`  | `/api/v1/registro/empresas/{id}/personalizacion` | 3-5 — colores, logo, variantes → `204` |
| `POST` | `/api/v1/registro/empresas/{id}/finalizar` | 6 — dispara el pipeline → `202` `{ url }` |

## 3. Estados de la empresa

```
borrador ──(finalizar)──► pendiente_aprovisionamiento ──(pipeline)──► activa
```

Solo se puede modificar (módulos/personalización) mientras esté en `borrador`;
si no, `409` (`EmpresaNoModificableException`).

## 4. La saga del pipeline (`tbl_aprovisionamiento_tareas.paso_actual`)

`SondeadorDeEventos` (`@Scheduled`) reclama el outbox con `FOR UPDATE SKIP LOCKED`
→ `EjecutarAprovisionamientoService` corre estos pasos idempotentes, con
checkpoint tras cada uno y reintentos con backoff:

| # | `paso_actual` | Qué hace |
|---|---|---|
| 1 | `base_creada` | `CREATE DATABASE db_cliente_<slug> TEMPLATE db_plantilla_maestra` |
| 2 | `semilla_aplicada` | crea el rol `ADMIN` (el usuario se crea en el paso 8) |
| 3 | `roles_creados` | `CREATE ROLE cli_<slug>_app / _lectura` + `GRANT` |
| 4 | `conexion_registrada` | `INSERT` en `tbl_empresa_conexiones` |
| 5 | `version_registrada` | `INSERT` en `tbl_empresa_esquema_version` (último id de `databasechangelog`) |
| 6 | `modulos_poblados` | activa los módulos elegidos vía puente ACL a `modulos-empresa` |
| 7 | `empresa_activada` | `Empresa.activar()` → `estado = activa` |
| 8 | `bienvenida_enviada` | genera contraseña temporal, siembra el usuario admin (`es_contrasena_temporal = true`), envía el correo. Idempotente por `tbl_empresas.bienvenida_enviada_en`. Sin SMTP → loguea el correo (DEV). |

## 5. Estructura de paquetes

```
aprovisionamiento-domain/.../domain/
  Empresa, Identificador, ColorHex, Personalizacion, EstadoEmpresa,
  PasoDeAprovisionamiento, EstadoTarea, TareaDeAprovisionamiento,
  EmpresaRegistrada, EventoDeDominio, HashContrasenaMaestra, *Exception
aprovisionamiento-application/.../application/
  RegistrarEmpresaService, SeleccionarModuloService, PersonalizarEmpresaService,
  FinalizarRegistroService, EjecutarAprovisionamientoService
  Comando/Resultado records
  port/in/  RegistrarEmpresa, SeleccionarModulo, PersonalizarEmpresa,
            FinalizarRegistro, EjecutarAprovisionamiento
  port/out/ RepositorioEmpresas, RepositorioPersonalizacion,
            RepositorioTareasDeAprovisionamiento, RegistroDeEventos,
            ActivadorDeModulosDeEmpresa, PasosDeAprovisionamiento,
            CifradorDeContrasenaMaestra
aprovisionamiento-infrastructure/.../infrastructure/
  ConfiguracionAprovisionamiento
  *Transaccional  (decoradores @Transactional del registro y del finalizar)
  web/          AltaEmpresaController, RegistroModulosController,
                RegistroPersonalizacionController, RegistroFinalizacionController,
                DTOs, ManejadorErroresAprovisionamiento
  pipeline/     SondeadorDeEventos, EjecutorDdlPostgres, PuenteModulosEmpresa,
                ConfiguracionPipeline
  persistencia/ EmpresaDeAprovisionamientoEntity, MarcaDeAprovisionamientoEntity,
                TareaDeAprovisionamientoEntity, EventoSalienteEntity,
                mappers + adaptadores JPA + BCryptCifradorDeContrasenaMaestra
```

## 6. Configuración (`application.yml`, `app.aprovisionamiento`)

| Propiedad | Default DEV | Env |
|---|---|---|
| `sondeo-ms` | 5000 | `APROV_SONDEO_MS` |
| `plantilla` | `db_plantilla_maestra` | `APROV_PLANTILLA` |
| `sufijo-dominio` | `mb` | `APROV_SUFIJO_DOMINIO` |
| `cliente-host` / `cliente-puerto` | `localhost` / `5432` | `APROV_CLIENTE_HOST` / `_PUERTO` |
| `mantenimiento.url` / `username` / `password` | owner @ `postgres` | `APROV_MANT_*` |
| `smtp-password` | *(vacío → correo se loguea)* | `APROV_SMTP_PASSWORD` |

## 7. Decisiones de diseño

- [0001](decisiones/2026-09-07-0001-modulo-separado-para-aprovisionamiento.md) — módulo separado.
- [0002](decisiones/2026-09-07-0002-dos-capas-alta-y-pipeline.md) — dos capas (rol app vs owner).
- [0003](decisiones/2026-09-07-0003-outbox-transaccional.md) — outbox transaccional.
- [0004](decisiones/2026-09-07-0004-credenciales-por-tenant.md) — credenciales por tenant y `secreto_ref`.
- [0005](decisiones/2026-09-08-0005-onboarding-publico-sin-pasarela-de-pago.md) — onboarding público, sin pago.
- [0006](decisiones/2026-09-08-0006-wizard-escribe-config-directo.md) — el wizard escribe la config (módulos vía ACL, marca directo).
- [0007](decisiones/2026-09-08-0007-contrasena-temporal-y-primer-login.md) — contraseña temporal + cambio forzado.

## 8. Pendiente

- Reconciliar el envío de correo (`EjecutorDdlPostgres` + `tbl_config_correo` +
  `app.aprovisionamiento.smtp-password`) con `spring.mail.*` / `app.correo.*` de
  `application.yml`.
- Vault real (QA/PROD) para `cli_<slug>_*` y `secreto_ref`; que el enrutador use
  el rol por-tenant (ADR 0004).
- Capa 2 como deployable aparte con su propio IAM/secreto (ADR 0002).
- Barrido de eventos colgados del outbox (`procesando` con worker caído).
- Anti-abuso (rate limit / captcha) en el registro público.
- Alinear el `id` del changeset `0016` de control con el nombre de archivo.

---

## Historial de cambios

- **2026-09-07** — Leidi — Creación del módulo: Capa 1 (alta admin + outbox), Capa 2
  (sondeador + pipeline de 7 pasos), puente ACL a `modulos-empresa`, roles por-tenant
  en DEV. ADRs 0001–0004.
- **2026-09-08** — Leidi — Onboarding público de autoservicio: wizard de 6 pasos
  (`/api/v1/registro/**`), estado `borrador`, personalización (colores/logo/variantes)
  escrita directo en `tbl_empresas_marca`, paso `bienvenida_enviada` del pipeline
  (contraseña temporal + correo), y cambio forzado de contraseña en el primer login
  (`autenticacion` + `usuarios`). ADRs 0005–0007.
- **2026-09-09** — Casos de uso de administración para la consola de operación:
  `Empresa.suspender()` / `.reactivar()` / `.actualizarDatos(...)` /
  `esEditablePorOperador()`, y los puertos de entrada `ListarEmpresas`,
  `CambiarEstadoDeEmpresa`, `ObtenerDetalleDeEmpresa`, `ActualizarDatosDeEmpresa`,
  `ActualizarPersonalizacionDeEmpresa`, `GestionarModulosDeEmpresa` + el puerto de
  lectura `ConsultaDeEmpresas`. Camino de operador separado del wizard (no relaja el
  candado `BORRADOR`). Ver [ADR 0004 de `consola`](../consola/decisiones/2026-09-09-0004-edicion-operador-separada-del-wizard.md).
