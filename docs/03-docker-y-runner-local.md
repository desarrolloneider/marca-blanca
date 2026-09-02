# Docker y runner self-hosted (entorno local)

Esta guía explica cómo levantar el proyecto completo en tu máquina con Docker,
y cómo está configurado el runner self-hosted de GitHub Actions que corre en
esta misma PC para el CI/CD.

## 1. Requisitos previos

- **Docker Desktop** instalado y corriendo (ícono de la ballena en la barra
  de tareas).
- Repositorio clonado en `C:\xampp\htdocs\mi-proyecto-monorepo\marca-blanca`
  (o la ruta que uses).

## 2. Backend (Spring Boot) con Docker

### Build de la imagen

```powershell
cd C:\xampp\htdocs\mi-proyecto-monorepo\marca-blanca
docker build -t marca-blanca-backend ./backend
```

El `Dockerfile` (`backend/Dockerfile`) es multi-stage:
1. **build**: `eclipse-temurin:25-jdk` + Maven, compila los 8 módulos del
   reactor (`shared-kernel`, `usuarios-*`, `omnicanal-*`, `bootstrap`) y
   empaqueta el jar ejecutable.
2. **runtime**: `eclipse-temurin:25-jre`, corre como usuario `spring`
   (no-root), expone el puerto **8080**.

### Levantar el contenedor

```powershell
docker run -d -p 8080:8080 --name marca-blanca-backend marca-blanca-backend
```

- `-d`: corre en segundo plano (no depende de mantener la consola abierta).
- Ver logs en cualquier momento: `docker logs -f marca-blanca-backend`.
- Probar que responde: `curl http://localhost:8080/api/auth/login` (da 401,
  es esperado — confirma que el servidor está vivo).

> **Nota de seguridad pendiente**: hoy el backend arranca con el
> `UserDetailsService` en memoria autogenerado por Spring Security (se ve un
> warning en el log con una contraseña random). El `AuthController` real
> (`/api/auth/login`) todavía no está conectado como fuente de autenticación
> de Spring Security — falta registrar un `UserDetailsService` propio antes
> de un release a producción.

## 3. Frontend (Angular) con Docker

### Build de la imagen

```powershell
docker build -t marca-blanca-frontend ./frontend
```

El `Dockerfile` (`frontend/Dockerfile`) es multi-stage:
1. **build**: `node:24-alpine` + pnpm (via corepack), corre
   `ng build --configuration production`.
2. **runtime**: `nginx:alpine`, sirve el build estático desde
   `dist/mi-proyecto-frontend/browser`, con `nginx.conf` configurado para
   rutas SPA de Angular (sin esto, refrescar una ruta que no sea `/` da 404).

### Levantar el contenedor

```powershell
docker run -d -p 4200:80 --name marca-blanca-frontend marca-blanca-frontend
```

Abrí `http://localhost:4200` en el navegador.

## 4. Dejarlos corriendo (uso diario con Docker Desktop)

Una vez creados con `docker run` la primera vez, **no hace falta volver a
correr esos comandos**. Los contenedores quedan guardados en Docker Desktop
mientras no los borres (🗑️):

- **Prender**: botón ▶️ al lado del contenedor, en Docker Desktop.
- **Apagar**: botón ⏹️.
- **Ver logs**: click en el nombre del contenedor → pestaña "Logs".
- **Borrar** (solo si querés reconstruir desde cero): ícono de basurero. Si
  cambiaste código y querés reflejarlo, hay que volver a hacer `docker build`
  y `docker run` (o borrar y recrear) — Docker no actualiza solo el
  contenido de una imagen ya construida.

## 5. Runner self-hosted de GitHub Actions

El CI (`backend-ci.yml`, `frontend-ci.yml`) corre los jobs de build+test en
runners de GitHub (`ubuntu-latest`), pero el job de **SonarQube** corre en un
runner **self-hosted en esta misma PC**, porque SonarQube vive en
`http://localhost:9000` y un runner de la nube de GitHub no puede alcanzarlo.

### Cómo está instalado

- Carpeta: `C:\actions-runner\actions-runner`
- Instalado como **servicio de Windows** (no depende de tener una consola
  abierta): `actions.runner.desarrolloneider-marca-blanca.DESKTOP-3GBTCUV`
- Cuenta del servicio: `LocalSystem` (para evitar problemas de permisos con
  carpetas de usuario).
- Arranca automáticamente con Windows (`Automatic`, delayed start).

### Comandos útiles

```powershell
# Ver estado del servicio
Get-Service actions.runner.desarrolloneider-marca-blanca.DESKTOP-3GBTCUV

# Prender / apagar manualmente
Start-Service actions.runner.desarrolloneider-marca-blanca.DESKTOP-3GBTCUV
Stop-Service actions.runner.desarrolloneider-marca-blanca.DESKTOP-3GBTCUV
```

### Si el runner deja de aparecer "Idle" en GitHub

1. Confirmá que el servicio está `Running` (comando de arriba).
2. Confirmá que `mvn` está en el **PATH del sistema** (no solo el de tu
   usuario): `[Environment]::GetEnvironmentVariable("Path","Machine")`.
   Si agregás algo nuevo al PATH del sistema, el servicio necesita un
   **reinicio completo de Windows** para verlo (no alcanza con reiniciar
   solo el servicio).
3. Si GitHub dice "the runner registration has been deleted", hay que
   volver a registrarlo con un token nuevo (`Settings → Actions → Runners →
   New self-hosted runner` en el repo) y correr `config.cmd` de nuevo desde
   `C:\actions-runner\actions-runner`.

## 6. SonarQube local

Ver [`infra/docker/sonarqube/README.md`](../infra/docker/sonarqube/README.md)
para cómo levantarlo, crear los proyectos y generar el token.

## 7. Resumen de puertos usados en esta máquina

| Servicio                | Puerto local | Cómo se levanta                        |
|--------------------------|:------------:|------------------------------------------|
| Backend (Spring Boot)     | 8080         | Contenedor Docker `marca-blanca-backend`  |
| Frontend (Angular/Nginx)  | 4200         | Contenedor Docker `marca-blanca-frontend` |
| SonarQube                 | 9000         | `docker compose` en `infra/docker/sonarqube` |
| PostgreSQL (de SonarQube) | 5432 (interno, no expuesto al host) | Contenedor `mi-proyecto-sonarqube-db` |
