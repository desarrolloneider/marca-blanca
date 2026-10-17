## Qué cambia

<!-- Resume en 1-3 líneas qué hace este PR y por qué. -->

## Área afectada

<!-- Marca las que toque, borra las que no apliquen -->

- [ ] `core/` (auth, guards, interceptors, servicios transversales)
- [ ] `features/` — cuál: ____
- [ ] `layout/` (shell, navegación)
- [ ] `shared/` (componentes, animaciones, marca)
- [ ] Estilos/temas globales

## Tipo de cambio

- [ ] Funcionalidad nueva (`feature/*`)
- [ ] Corrección de bug (`bugfix/*`)
- [ ] Hotfix de producción (`hotfix/*`)
- [ ] Cambio visual/UX sin lógica nueva
- [ ] Solo configuración/infraestructura (`chore/*`)

## Pantallas / capturas

<!-- Antes y después, si el cambio es visual. Arrastra las imágenes aquí. -->

## Documentación

- [ ] Actualicé `docs/frontend/**` si el cambio lo amerita (ver [reglas de PR](../docs/infraestructura/reglas-pull-request.md))
- [ ] No aplica (cambio interno sin impacto en la documentación existente)

## Cómo probarlo

<!-- Pasos concretos para que quien revise pueda reproducir el cambio -->

1.
2.

## Checklist antes de pedir revisión

- [ ] `pnpm exec ng build --configuration production` pasa localmente
- [ ] `pnpm exec ng test --watch=false` pasa localmente
- [ ] Probé en al menos un navegador real, no solo leí el código
- [ ] La rama sigue la convención (`feature/*`, `bugfix/*`, `hotfix/*`, `docs/*`, `chore/*`, `refactor/*`)
- [ ] El mensaje de los commits sigue `tipo(alcance): descripción`
