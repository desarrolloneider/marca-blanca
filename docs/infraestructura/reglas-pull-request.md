# Reglas de Pull Request

Lo que todo PR tiene que cumplir para poder mergearse, y por qué. No son sugerencias — son
las reglas de protección de rama configuradas en GitHub (`Settings → Branches`), así que
quien no las cumpla simplemente no puede mergear, sin excepción manual salvo administradores
con bypass explícito.

## 1. Nombre de la rama

| Vas a mergear hacia | Tu rama debe empezar con |
|---|---|
| `develop` | `feature/*`, `bugfix/*`, `hotfix/*`, `docs/*`, `chore/*` o `refactor/*` |
| `main` | solo se acepta desde `develop`, o desde `hotfix/*` directo |

Lo valida el check **`Branch Policy / check-base-branch`**, automático y obligatorio. Si tu
rama no cumple el patrón, el PR falla ese check de inmediato — no importa qué tan bueno sea
el código. Si te equivocaste de prefijo, no hay que pelear con el PR: borra la rama remota,
renómbrala local (`git branch -m nombre-correcto`) y vuelve a empujarla.

| Prefijo | Para qué |
|---|---|
| `feature/*` | Funcionalidad nueva |
| `bugfix/*` | Corrige un error encontrado en `develop` o QA, antes de llegar a producción |
| `hotfix/*` | Corrige algo que **ya está en producción**, ahora mismo — única rama que puede ir directo contra `main` |
| `docs/*` | Solo documentación |
| `chore/*` | Tareas de mantenimiento, configuración, infraestructura del propio repo (CI, scripts) |
| `refactor/*` | Reestructura código sin cambiar comportamiento |

## 2. Checks obligatorios antes de mergear

No se puede mergear mientras alguno de estos esté en rojo o pendiente:

- **`Branch Policy / check-base-branch`** — la convención de nombres de arriba.
- **`Backend CI / Build & test (Java 25)`** — compila y corre las pruebas del backend. Se
  salta (✅ `skipped`, cuenta como aprobado) si el PR no tocó nada de `backend/`.
- **`Frontend CI / Install & build`** — instala dependencias y compila el frontend. Se salta
  igual si el PR no tocó `frontend/`.

Ambos CI corren en el runner propio (`dev-vm`), no en los minutos facturables de GitHub.

### Rama actualizada

Además, **"Require branches to be up to date before merging"** está activo: si `develop`
avanzó después de que abriste tu PR, tienes que darle **"Update branch"** antes de poder
mergear. Esto existe porque, sin esa regla, un PR se puede mergear sin los últimos commits de
otra rama sin que nadie lo note — nos pasó varias veces configurando este mismo pipeline.

## 3. SonarQube — Quality Gate

El análisis de SonarQube corre en cada PR (jobs `SonarQube analysis` de ambos CI) y **bloquea
de verdad**: si el Quality Gate queda en rojo (cobertura insuficiente, código duplicado,
vulnerabilidades, bugs nuevos), el paso falla y el PR no puede mergearse. No es solo un dato
en el dashboard — el pipeline espera la respuesta real de SonarQube
(`sonar.qualitygate.wait=true`) antes de continuar.

## 4. Seguridad de las imágenes — Trivy

Cuando el PR se mergea y se publica la imagen Docker (`publish.yml`), Trivy la escanea:

- **CRITICAL bloquea** la publicación.
- **HIGH se reporta** en el log del workflow, sin bloquear todavía.

Esto corre después del merge, no en el PR — así que no retrasa la revisión, pero sí puede
impedir que una imagen con una vulnerabilidad crítica llegue a desplegarse.

## 5. Documentación obligatoria (rampa de adopción)

Si el PR toca código sensible (dominio/aplicación/infraestructura del backend,
`frontend/src/**`, workflows, infraestructura, o el changelog de Liquibase) sin tocar también
su documentación correspondiente en `/docs`, el workflow `ci-docs.yml` deja un **comentario
automático** señalándolo.

**Hoy esto solo avisa, no bloquea** (primer mes de adopción). Va a pasar a bloquear más
adelante — ver [`ci-docs.yml`](../../.github/workflows/ci-docs.yml) para el detalle exacto de
qué ruta exige qué documento.

## 6. Dependabot

No es una regla de PR que tú tengas que cumplir, pero sí vas a ver sus PRs: revisa
semanalmente actualizaciones de Maven, npm/pnpm, imágenes Docker base y versiones de GitHub
Actions. Trátalos como cualquier otro PR — mismos checks, misma revisión.

## Antes de abrir el PR — checklist rápido

- [ ] La rama tiene el prefijo correcto para la rama destino (`develop` o `main`)
- [ ] Usaste la plantilla correspondiente ([backend](../../.github/PULL_REQUEST_TEMPLATE/backend.md) o [frontend](../../.github/PULL_REQUEST_TEMPLATE/frontend.md))
- [ ] Si tocaste código sensible, actualizaste también su documentación en `/docs`
- [ ] Corriste las pruebas localmente antes de empujar (no dependas solo del CI para enterarte de un error obvio)
- [ ] El mensaje de los commits sigue `tipo(alcance): descripción` (ver [CLAUDE.md](../../CLAUDE.md), D-03 — Conventional Commits)
