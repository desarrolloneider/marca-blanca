# ADR 0002 — La identidad de operador es separada de los usuarios de tenant

**Fecha:** 2026-09-09
**Estado:** Aceptada
**Módulos afectados:** consola, autenticacion

## Resumen

Un operador de la plataforma es un agregado propio (`consola.domain.Operador`)
que vive en la **base de control** (`plataforma.tbl_operadores`), con su propio
flujo de login y su propio formato de token. No reutiliza el modelo `Usuario`
de `usuarios` ni la tabla `seguridad.tbl_usuarios` de ningún tenant.

## Contexto

El registro de una empresa es un wizard público que aprovisiona una base y
crea un usuario administrador dentro de esa base. Un operador de GuajiraNet no
sigue ese camino: no tiene empresa, no se registra solo, y su alcance es toda
la plataforma. Meterlo como una fila en `seguridad.tbl_usuarios` de algún
tenant implicaría que ese tenant lo puede ver, editar o borrar, y que el token
tendría que llevar un `identificadorEmpresa` que no significa nada para él.

## Decisión

- **Tabla propia en la base de control**: `plataforma.tbl_operadores`
  (`correo`, `hash_contrasena`, `nombre`, `rol`, `activo`,
  `es_contrasena_temporal`, `mfa_secret`). Se accede con `JdbcTemplate` sobre
  `controlDataSource` — es una tabla chica y sigue el mismo patrón que el
  pipeline de aprovisionamiento para la base de control, sin sumar una unidad
  de persistencia JPA.
- **Login propio**: `POST /api/v1/consola/auth/login` recibe solo
  `{ correo, contrasena }`. Autentica contra la base de control.
- **Token propio**: JWT firmado con el mismo `app.jwt.secret`, pero con forma
  distinta — `sub = operadorId`, `scope = plataforma`, `rol`, `pwd_temp`, y
  **sin** claim `empresa`. Expiración corta (`app.consola.jwt.expiracion-minutos`,
  15 por defecto).
- **Aislamiento de los dos mundos de token** (comparten secreto de firma):
  - `ConsolaAuthFilter` (cadena de seguridad de la consola) solo acepta
    tokens con `scope=plataforma` (`VerificadorJwtDeOperador`).
  - `JwtAuthFilter` (tenant, registrado globalmente) hace `shouldNotFilter`
    para `/api/v1/consola/**`.
  - `JwtVerificadorDeToken` (tenant) devuelve `Optional.empty()` ante
    cualquier token que traiga la claim `scope` — un token de operador nunca
    autentica como usuario de empresa.
- **Alta**: sin self-service. El primer `SUPER_ADMIN` se siembra por
  changeset (`0020-sembrar-operador-super-admin`) con un hash sentinela
  `PENDIENTE`; `SembradorDeOperadorInicial` (evento `ApplicationReadyEvent`,
  idempotente) le fija la contraseña real al arrancar: desde
  `CONSOLA_SUPERADMIN_PASSWORD` si está, o una temporal generada que escribe
  en el log. En ambos casos `es_contrasena_temporal = true`.
- **Primer login obliga a cambiar la contraseña**: con `pwd_temp=true` el
  token solo sirve para `/api/v1/consola/auth/**`. Al cambiarla, el frontend
  cierra la sesión y pide re-login con un token limpio (el backend no reemite
  en ese paso).

## Consecuencias

- Roles de operador (`SUPER_ADMIN`, `SOPORTE`) son un enum propio
  (`RolOperador`), no los roles de un tenant.
- El cambio de contraseña se envuelve en un decorador `@Transactional`
  (`CambiarContrasenaDeOperadorTransaccional`) que usa el `transactionManager`
  `@Primary` (unidad "control"), manteniendo el servicio de aplicación libre
  de framework.
- Cada mutación de la consola se audita en `plataforma.tbl_auditoria_consola`
  con el `operadorId` que sale del token.
- La columna `mfa_secret` ya existe pero no se usa: MFA (TOTP) queda pendiente.
