# Proceso de trabajo con Git

Reglas aprendidas durante el desarrollo inicial del backend, después de varios incidentes reales. No son opcionales.

## Ramas

- **Nunca** se trabaja ni se comitea directo en `develop` o `main`.
- Una rama = un propósito específico. No se mezclan cambios de distintos módulos o capas en la misma rama.
- El nombre **debe** empezar con `feature/`, `bugfix/` o `hotfix/` — lo exige el workflow `branch-policy.yml`, que rechaza el PR si no cumple.
- Flujo estándar para empezar algo nuevo:
  ```bash
  git checkout develop
  git pull
  git checkout -b feature/nombre-descriptivo
  ```
- La rama se borra después de fusionarse (local y remota). No se acumulan ramas viejas fusionadas.

## Antes de cada commit

- Confirmar `git status` **siempre** antes de comitear — revisar que los archivos listados son los que realmente se esperaban, ni de más ni de menos.
- No usar `git add .` a ciegas cuando se trabajó en varias cosas — agregar rutas específicas si hace falta separar en más de un commit.

## Pull Requests

- Van siempre contra `develop`, nunca contra `main`.
- **Nunca fusionar `main` hacia `develop`** ni viceversa fuera del flujo normal — ver el postmortem `docs/postmortems/2026-09-01-0001-perdida-estructura-por-merge-cruzado.md` para el incidente real que esto causó.
- Revisar que los checks de CI (`ci.yml`: build + SonarQube de backend y/o frontend según qué cambió, `branch-policy.yml`: nombre de rama) estén en verde antes de fusionar.

## Identidad de commits

Configurada a propósito, distinta del login personal de GitHub:
```bash
git config --global user.name "Luis DEV"
git config --global user.email "desarrollo@guajiranet.com"
```

## Documentación

- Se documenta el módulo apenas se construye una pieza funcional completa — no se acumula para "documentar todo junto" después.
- Estructura: cada módulo tiene su propia carpeta en `docs/backend/modulos/<modulo>/`, con un `README.md` vivo (se edita in place) y una carpeta `decisiones/` con archivos fechados (`AAAA-MM-DD-NNNN-titulo.md`) que **no se editan** una vez creados — si una decisión cambia, se escribe una nueva que reemplaza a la anterior.
- Incidentes grandes (no bugs sueltos — esos van en GitHub Issues) se documentan como postmortem en `docs/postmortems/`, mismo formato de nombre fechado.
