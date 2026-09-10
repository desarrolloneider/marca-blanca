# Módulo Módulos-Empresa

> Resumen vivo. Se actualiza *in place* cada vez que el módulo cambia.

## 1. Qué es y qué NO es

Catálogo de módulos del producto (`tbl_modulos`) y su activación/desactivación por empresa (`tbl_empresa_modulos`). Extraído de `empresas` el 2026-09-05 — ver [ADR 0001](decisiones/2026-09-05-0001-modulo-separado-de-empresas.md).

**Cero dependencia con `empresas`, en cualquier dirección.** Tiene su propio mapeo mínimo y de solo lectura de `tbl_empresas` (`EmpresaRefDeModulosEmpresa`) — no reutiliza nada del otro módulo.

**NO le corresponde:** resolver a qué base de datos conectarse (eso es `empresas`), ni la marca visual (eso es `identidad-visual`).

## 2. Estructura de paquetes

```
modulos-empresa/
├── modulos-empresa-domain/.../modulosempresa/domain/
│   ├── Modulo.java, ModuloDeEmpresa.java
│   └── ModuloNoEncontradoException.java, EmpresaNoEncontradaException.java
├── modulos-empresa-application/.../modulosempresa/application/
│   ├── ListarModulosService.java, ListarModulosDeEmpresaService.java
│   ├── ActivarModuloDeEmpresaService.java, DesactivarModuloDeEmpresaService.java
│   └── port/
│       ├── in/ListarModulos.java, ListarModulosDeEmpresa.java,
│       │      ActivarModuloDeEmpresa.java, DesactivarModuloDeEmpresa.java
│       └── out/RepositorioModulos.java, RepositorioModulosDeEmpresa.java
└── modulos-empresa-infrastructure/.../modulosempresa/infrastructure/
    ├── ModuloEntity.java, EmpresaModuloEntity.java
    ├── EmpresaRefDeModulosEmpresa.java   <- mapeo minimo propio, sin depender de "empresas"
    ├── ModuloJpaRepository.java, EmpresaModuloJpaRepository.java
    ├── RepositorioModulosJpa.java, RepositorioModulosDeEmpresaJpa.java
    ├── ConfiguracionModulosDeEmpresa.java
    └── web/
        ├── ModulosAdminController.java
        ├── ClaveAdminInterceptor.java, ClaveAdminInvalidaException.java, ConfiguracionWebAdmin.java
        └── ErrorResponse.java, ManejadorErroresAdmin.java
```

## 3. Dominio

- **`Modulo`**: `record(UUID id, String codigo, String nombre, String descripcion)` — una fila del catálogo.
- **`ModuloDeEmpresa`**: `record(String codigo, String nombre, String descripcion, boolean activo)` — un módulo + su estado para una empresa puntual.
- **`ModuloNoEncontradoException`** / **`EmpresaNoEncontradaException`** — esta última es propia de este módulo, no la de `empresas.domain`.

## 4. Aplicación

4 casos de uso, cada uno un thin wrapper sobre su puerto de salida: `ListarModulos` (catálogo completo), `ListarModulosDeEmpresa` (catálogo + estado por empresa), `ActivarModuloDeEmpresa`/`DesactivarModuloDeEmpresa` — **idempotentes**, activar algo ya activo no falla.

## 5. Infraestructura

### Persistencia
- **`EmpresaRefDeModulosEmpresa`**: mapeo de solo lectura de `tbl_empresas`, con lo mínimo (`id`, `uuid`, `identificador`, `estado`). Se llamó `EmpresaRefEntity` originalmente; renombrada tras un choque de nombre de entidad JPA con la clase homónima de `identidad-visual` (ver ADR 0001, sección de bug).
- **`EmpresaModuloJpaRepository`**: la consulta que cruza con `EmpresaRefDeModulosEmpresa` para resolver el id interno a partir del UUID de empresa.
- Vive en la unidad de persistencia **"control"** (`ConfiguracionPersistenciaControl`, en `bootstrap`).

### `web/` — protección por clave compartida (interina)
Sin cambios respecto a como funcionaba dentro de `empresas`: `/api/v1/admin/**` protegido por `X-Admin-Key` vía `ClaveAdminInterceptor` — ver la ADR correspondiente en el README de `empresas` para el razonamiento completo (Odoo, `admin_passwd`).

## 6. Contrato REST

| Método | Ruta | Protección | Respuesta OK | Errores |
|---|---|---|---|---|
| GET | `/api/v1/admin/modulos` | `X-Admin-Key` | 200 + lista de `Modulo` | 401 |
| GET | `/api/v1/admin/empresas/{id}/modulos` | `X-Admin-Key` | 200 + lista de `ModuloDeEmpresa` | 401 · 404 |
| POST | `/api/v1/admin/empresas/{id}/modulos/{codigo}/activar` | `X-Admin-Key` | 204 | 401 · 404 |
| POST | `/api/v1/admin/empresas/{id}/modulos/{codigo}/desactivar` | `X-Admin-Key` | 204 | 401 · 404 |

Sin cambios respecto al contrato que tenía dentro de `empresas` — solo cambió dónde vive el código.

## 7. Decisiones de diseño relacionadas

- [`decisiones/2026-09-05-0001-modulo-separado-de-empresas.md`](decisiones/2026-09-05-0001-modulo-separado-de-empresas.md)

## 8. Pendiente / próximos pasos

- Reemplazar la clave compartida por un sistema real de identidad de administrador de plataforma, cuando haga falta (heredado de cuando esto vivía en `empresas`).
- Si `tbl_empresas` cambia de forma con frecuencia, reevaluar si vale la pena centralizar el mapeo mínimo en `shared-kernel` (ver ADR 0001).

## 9. Cómo compilar/probar localmente

```bash
mvn -f backend/pom.xml install -DskipTests -pl modulos-empresa/modulos-empresa-domain,modulos-empresa/modulos-empresa-application,modulos-empresa/modulos-empresa-infrastructure -am
```

---

## Historial de cambios

- **2026-09-05** — Luis — Extraído de `empresas` como módulo independiente. Documentación inicial.
- **2026-09-09** — CRUD del catálogo (antes solo lectura): `Modulo` gana `precio` +
  `moneda`; nuevo caso de uso `GestionarCatalogoDeModulos` (crear / actualizar /
  eliminar), con `ModuloYaExisteException` / `ModuloEnUsoException`. Se expone desde la
  consola de operación (`/api/v1/consola/modulos`). Ver [`consola`](../consola/README.md).
