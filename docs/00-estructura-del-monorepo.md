# Estructura del monorepo

Confirma dónde vive cada cosa en el repo. Es la referencia rápida antes de
buscar "¿esto en qué carpeta va?" — el detalle de cada área tiene su propia
documentación enlazada abajo.

## Por qué monorepo (por ahora)

El backend (Java/Spring Boot) y el frontend (Angular) viven en el mismo
repositorio, con un solo workflow orquestador (`ci.yml`) que detecta qué
cambió y corre el pipeline de backend, el de frontend, o los dos. No hay plan activo de separarlos
en repos distintos ni de migrar a microservicios — se probó como experimento
local puntual (extraer `usuarios` a un microservicio standalone) y se decidió
seguir en monorepo mientras el equipo sea chico. Si esto cambia, se
documenta acá.

## Carpetas en la raíz

| Carpeta | Qué contiene |
|---|---|
| `backend/` | API Java 25 / Spring Boot 4.1.1, Maven multi-módulo, arquitectura hexagonal. |
| `frontend/` | SPA Angular 22. |
| `docs/` | Toda la documentación técnica del proyecto (este archivo incluido). |
| `infra/` | Configuración de infraestructura local: SonarQube (`infra/docker/sonarqube`). |
| `migracion/` | Entorno efímero y scripts para migrar datos del sistema anterior (MariaDB → Postgres). No es infraestructura de la app. |
| `.github/workflows/` | Pipelines de CI/CD (build, test, Sonar, Liquibase, publish a GHCR, branch policy). |
| `docker-compose.yml` (raíz) | Levanta el stack completo (backend + frontend + Postgres de la app) con un comando. |

## Backend — módulos Maven

Reactor multi-módulo, cada bounded context separado en `domain` /
`application` / `infrastructure` (arquitectura hexagonal — puertos y
adaptadores). Ver [`backend/00-arquitectura-hexagonal.md`](backend/00-arquitectura-hexagonal.md)
para el detalle de la regla de dependencia.

- `shared-kernel/` — código compartido entre bounded contexts (eventos, tipos base).
- `usuarios/` — gestión de usuarios (`usuarios-domain`, `usuarios-application`, `usuarios-infrastructure`).
- `autenticacion/` — login/JWT, separado de `usuarios` (`autenticacion-application`, `autenticacion-infrastructure`).
- `omnicanal/` — mensajería/canales (`omnicanal-domain`, `omnicanal-application`, `omnicanal-infrastructure`). En construcción.
- `bootstrap/` — punto de entrada de la aplicación (`@SpringBootApplication`), ensambla todos los módulos y expone la app en el puerto 8080.

Un test de ArchUnit (`backend/bootstrap/src/test/.../ArquitecturaHexagonalTest.java`)
verifica automáticamente que estas fronteras se respeten en cada build.

## Frontend — estructura de `src/app`

- `core/` — servicios transversales: `auth/`, `guards/`, `interceptors/`, `services/`.
- `features/` — una carpeta por funcionalidad de negocio: `auth/`, `usuarios/`, `omnicanal/`, `tareas/`, `3cx/`, `home/`.
- `layout/` — shell visual de la aplicación (header, sidebar, etc.).

Ver [`docs/frontend/README.md`](frontend/README.md) para el detalle.

## Dónde está documentado cada área

- Proceso de Git del equipo: [`docs/PROCESO-DE-TRABAJO.md`](PROCESO-DE-TRABAJO.md)
- Backend: [`docs/backend/`](backend/)
- Frontend: [`docs/frontend/`](frontend/)
- Base de datos: [`docs/base-de-datos/`](base-de-datos/)
- Infraestructura (Docker, CI/CD, runners): [`docs/infraestructura/`](infraestructura/)
- Postmortems: [`docs/postmortems/`](postmortems/)
