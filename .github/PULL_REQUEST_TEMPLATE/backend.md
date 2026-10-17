## Qué cambia

<!-- Resume en 1-3 líneas qué hace este PR y por qué. -->

## Módulo(s) afectado(s)

<!-- Marca los que toque, borra los que no apliquen -->

- [ ] `shared-kernel`
- [ ] `usuarios` (domain / application / infrastructure)
- [ ] `omnicanal` (domain / application / infrastructure)
- [ ] `bootstrap`
- [ ] Otro: ____

## Tipo de cambio

- [ ] Funcionalidad nueva (`feature/*`)
- [ ] Corrección de bug (`bugfix/*`)
- [ ] Hotfix de producción (`hotfix/*`)
- [ ] Refactor sin cambio de comportamiento (`refactor/*`)
- [ ] Solo configuración/infraestructura (`chore/*`)

## Arquitectura hexagonal

- [ ] `dominio/` sigue sin importar nada de `org.springframework.*` ni de `infraestructura/`
- [ ] Si agregué un caso de uso nuevo, tiene su `Command`/`Query` junto a él en `aplicacion/`
- [ ] Si agregué un puerto de salida nuevo, su adaptador vive en `infraestructura/salida/`
- [ ] Las pruebas de ArchUnit del módulo pasan localmente

## Base de datos

- [ ] Este PR **no** toca el changelog de Liquibase
- [ ] Este PR **sí** toca el changelog — agregué el changeset nuevo, no edité uno ya aplicado

## Documentación

- [ ] Actualicé `docs/backend/**` si el cambio lo amerita (ver [reglas de PR](../docs/infraestructura/reglas-pull-request.md))
- [ ] No aplica (cambio interno sin impacto en la documentación existente)

## Cómo probarlo

<!-- Pasos concretos para que quien revise pueda reproducir el cambio -->

1.
2.

## Checklist antes de pedir revisión

- [ ] `mvn clean verify` pasa localmente
- [ ] La rama sigue la convención (`feature/*`, `bugfix/*`, `hotfix/*`, `docs/*`, `chore/*`, `refactor/*`)
- [ ] El mensaje de los commits sigue `tipo(alcance): descripción`
