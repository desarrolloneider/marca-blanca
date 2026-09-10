# Módulo Autenticación

> Resumen vivo. Se actualiza *in place* cada vez que el módulo cambia.

## 1. Qué es y qué NO es

**Autenticación = todo lo relacionado a la sesión:** login, access token (JWT), refresh token, su rotación. Separado de `usuarios` (2026-09-03) porque "quién sos" (identidad) y "cómo probás que seguís siendo vos entre requests" (sesión) son responsabilidades distintas.

**Desde el 2026-09-05, no depende del dominio de `usuarios` en absoluto** — ver [ADR 0006](decisiones/2026-09-05-0006-acl-contra-usuarios.md). Toda la relación pasa por un puerto propio (`VerificadorDeUsuarios`) y un único adaptador que hace la traducción.

Depende de `empresas-application` (necesita `ContextoEmpresaActual`) — nunca al revés.

## 2. Estructura de paquetes

```
autenticacion/
├── autenticacion-domain/.../autenticacion/domain/
│   ├── TokenDeRefrescoInvalidoException.java
│   └── CredencialesInvalidasException.java, UsuarioNoDisponibleException.java   <- propias, desde ADR 0006
├── autenticacion-application/.../autenticacion/application/
│   ├── AutenticarUsuarioService.java, RenovarTokenService.java
│   ├── ResultadoAutenticacion.java
│   ├── GeneradorTokenDeRefresco.java   <- utilidad interna, package-private
│   └── port/
│       ├── in/AutenticarUsuario.java, RenovarToken.java
│       └── out/GeneradorDeToken.java, VerificadorDeToken.java, UsuarioAutenticado.java,
│              AlmacenDeTokensDeRefresco.java, DatosDeUsuario.java, VerificadorDeUsuarios.java
└── autenticacion-infrastructure/.../autenticacion/infrastructure/
    ├── seguridad/
    │   ├── JwtGeneradorDeToken.java, JwtVerificadorDeToken.java
    │   ├── JwtAuthFilter.java, SecurityConfig.java
    │   └── AdaptadorVerificadorDeUsuarios.java   <- UNICO archivo que conoce usuarios.domain
    ├── persistencia/
    │   ├── SesionEntity.java, SesionJpaRepository.java
    │   └── AlmacenDeTokensDeRefrescoJpa.java
    ├── web/
    │   ├── AuthController.java
    │   ├── LoginRequest.java, LoginResponse.java, RefreshRequest.java, RefreshResponse.java
    │   ├── ErrorResponse.java, ManejadorErroresAuth.java
    └── ConfiguracionAutenticacion.java
```

## 3. Dominio

- **`TokenDeRefrescoInvalidoException`**: refresh token inexistente, ya usado (rotación) o expirado.
- **`CredencialesInvalidasException`** / **`UsuarioNoDisponibleException`**: propias desde el ACL (ADR 0006) — antes eran las de `usuarios.domain`, importadas directo.

## 4. Aplicación

### `AutenticarUsuarioService` (login)
Ya no conoce `Usuario`/`Correo`/`Contrasena` — delega la verificación completa a `VerificadorDeUsuarios.verificarCredenciales(...)`, que devuelve `DatosDeUsuario` (id + correo, nada más). Lee `ContextoEmpresaActual` (ya establecido por `AuthController`) para saber qué empresa embeber en el token.

### `RenovarTokenService` (refresh)
Mismo cambio: usa `VerificadorDeUsuarios.buscarPorId(...)` en vez de `RepositorioUsuarios` directo.

### Puertos de salida
- `GeneradorDeToken.generarPara(DatosDeUsuario, String identificadorEmpresa): String` — cambió de firma (antes recibía `Usuario`).
- `VerificadorDeToken.verificar(String): Optional<UsuarioAutenticado>`.
- `VerificadorDeUsuarios` (nuevo, ADR 0006): `verificarCredenciales(...)`, `buscarPorId(...)` — el único puerto de este módulo que, del otro lado, toca `usuarios`.
- `DatosDeUsuario` (nuevo): `record(UUID id, String correo)` — no confundir con `UsuarioAutenticado` (eso sale de verificar un JWT: usuario + empresa; esto es lo que entra para generar uno).
- `AlmacenDeTokensDeRefresco`: sin cambios.

## 5. Infraestructura

### `seguridad/`
- **`AdaptadorVerificadorDeUsuarios`** (nuevo): implementa `VerificadorDeUsuarios` usando `RepositorioUsuarios`/`CifradorDeContrasenas`/`Usuario` de `usuarios.domain`. **Atrapa** `CredencialesInvalidasException`/`UsuarioNoDisponibleException` de `usuarios.domain` y lanza las propias de `autenticacion.domain` — la traducción de errores pasa por acá también, no solo los datos de éxito.
- **`JwtGeneradorDeToken`** / **`JwtVerificadorDeToken`**: sin cambios de comportamiento, solo de tipo (`DatosDeUsuario` en vez de `Usuario`).
- **`JwtAuthFilter`**: establece `ContextoEmpresaActual` en cada request autenticado, deja la empresa como atributo del request.

### `web/`
Sin cambios de contrato — `AuthController` sigue estableciendo/limpiando `ContextoEmpresaActual` alrededor de login/refresh.

## 6. Contrato REST

Sin cambios respecto a la versión anterior — ver tabla en versiones previas de este documento o en el historial de ADR.

## 7. Decisiones de diseño relacionadas

- [`decisiones/2026-09-03-0003-refresh-token-revocable.md`](decisiones/2026-09-03-0003-refresh-token-revocable.md)
- [`decisiones/2026-09-03-0004-refresh-token-postgres-tbl-sesiones.md`](decisiones/2026-09-03-0004-refresh-token-postgres-tbl-sesiones.md)
- [`decisiones/2026-09-04-0005-jwt-lleva-empresa-como-claim.md`](decisiones/2026-09-04-0005-jwt-lleva-empresa-como-claim.md)
- [`decisiones/2026-09-05-0006-acl-contra-usuarios.md`](decisiones/2026-09-05-0006-acl-contra-usuarios.md) — Anti-Corruption Layer, este cambio.

## 8. Pendiente / próximos pasos

- Detección de reutilización de refresh token con revocación en cascada.
- Duración diferenciada web/móvil.
- Protección contra fuerza bruta en `/login` — sigue pendiente; el intento anterior (CRUD revertido) no llegó a aplicarse.
- **Probar login real de punta a punta con `curl`** — sigue faltando una empresa/usuario de prueba en algún ambiente.

## 9. Cómo compilar/probar localmente

```bash
mvn -f backend/pom.xml install -DskipTests -pl autenticacion/autenticacion-domain,autenticacion/autenticacion-application,autenticacion/autenticacion-infrastructure -am
```

---

## Historial de cambios

- **2026-09-04** — Luis — Documentación inicial, refresh token completo.
- **2026-09-04** — Luis — JWT lleva la empresa como claim; corregido el bug crítico de `ContextoEmpresaActual`.
- **2026-09-05** — Luis — Anti-Corruption Layer contra `usuarios` (ADR 0006): ya no depende de su dominio en absoluto.
- **2026-09-08** — Leidi — Contraseña temporal en el primer login: `login`/`refresh` devuelven `debeCambiarContrasena`, el JWT lleva el claim `pwd_temp`, `JwtAuthFilter` bloquea todo salvo `/api/v1/auth/**` mientras esté activo, y nuevo `POST /api/v1/auth/cambiar-contrasena`. Ver [flujo de onboarding](../../flujos/onboarding-de-empresas.md#8-paso-8--primer-login-con-contrase%C3%B1a-temporal) y [ADR 0007 de aprovisionamiento](../aprovisionamiento/decisiones/2026-09-08-0007-contrasena-temporal-y-primer-login.md).
- **2026-09-09** — Aislamiento del token de la consola de operación (comparte `app.jwt.secret`): `JwtAuthFilter.shouldNotFilter` para `/api/v1/consola/**`, y `JwtVerificadorDeToken` rechaza cualquier token que traiga la claim `scope`. Ver [`consola`](../consola/README.md) y su [ADR 0002](../consola/decisiones/2026-09-09-0002-identidad-de-operador-separada.md).
