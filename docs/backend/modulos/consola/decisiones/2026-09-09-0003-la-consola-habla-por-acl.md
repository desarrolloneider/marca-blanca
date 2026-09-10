# ADR 0003 — La consola habla con otros contextos solo por ACL

**Fecha:** 2026-09-09
**Estado:** Aceptada
**Módulos afectados:** consola, aprovisionamiento, correo, modulos-empresa

## Resumen

El núcleo de `consola` (`domain` + `application`) no conoce a ningún otro
contexto. Toda interacción con `aprovisionamiento`, `correo` o `modulos-empresa`
pasa por un **puerto de salida propio de la consola**, implementado por un
adaptador en `consola-infrastructure` — el único lugar donde la consola importa
código de esos módulos.

## Contexto

La consola administra empresas (dueñas de `aprovisionamiento`), la
configuración SMTP (dueña de `correo`) y el catálogo de módulos (dueño de
`modulos-empresa`). Sin una frontera explícita, `consola.application` terminaría
importando los DTOs y puertos de tres contextos distintos, acoplando su núcleo
a los cambios internos de cada uno.

El proyecto ya usa este patrón: `aprovisionamiento` llama a `modulos-empresa`
solo a través de `PuenteModulosEmpresa` (ACL en su capa de infraestructura).

## Decisión

- **Puerto ACL para empresas**: `consola.application.port.out.AdministracionDeEmpresas`
  (listar, detalle, suspender, reactivar, actualizarDatos, actualizarMarca,
  activar/desactivarModulo). Lo implementa
  `consola.infrastructure.aprovisionamiento.PuenteAdministracionDeEmpresas`,
  que traduce los DTOs de la consola a/desde los puertos de entrada de
  `aprovisionamiento` (`ListarEmpresas`, `CambiarEstadoDeEmpresa`,
  `ObtenerDetalleDeEmpresa`, `ActualizarDatosDeEmpresa`,
  `ActualizarPersonalizacionDeEmpresa`, `GestionarModulosDeEmpresa`).
- **CRUD de config de correo y catálogo de módulos**: como ambos son un
  passthrough casi puro sobre casos de uso que ya existen en sus módulos
  dueños (`correo.GestionarConfiguracionCorreo` /
  `modulos-empresa.GestionarCatalogoDeModulos`), los controllers de la consola
  (`ConsolaConfigCorreoController`, `ConsolaCatalogoModulosController`) inyectan
  directamente esos puertos de entrada. Viven en `consola-infrastructure.web`
  (donde importar otro contexto está permitido), agregan la auth de operador y
  la auditoría, y no meten lógica propia en `consola.application`.
- **Regla ArchUnit**: `consola.domain` y `consola.application` no pueden
  depender de `..empresas..`, `..modulosempresa..`, `..identidadvisual..`,
  `..usuarios..`, `..autenticacion..`, `..aprovisionamiento..`, `..omnicanal..`
  ni `..correo..`. (Mismo tipo de regla que ya existía para `aprovisionamiento`.)

## Consecuencias

- `consola-infrastructure` suma dependencias de Maven a `aprovisionamiento-*`,
  `correo-*` y `modulos-empresa-*`; el núcleo de la consola sigue dependiendo
  solo de su propio dominio.
- Cada acción de config global (`correo.config_*`, `modulo.*`) se audita en
  `tbl_auditoria_consola` con `empresa_uuid = null`.
- Los errores de `correo` (`ConfiguracionCorreoNoEncontradaException`,
  `IllegalStateException` para "no borrar la activa", `EnvioDeCorreoFallidoException`)
  los traduce el `@RestControllerAdvice` global de ese módulo — la consola no
  los re-maneja. Los de `modulos-empresa` (`ModuloYaExiste`, `ModuloEnUso`,
  `ModuloNoEncontrado`) sí los mapea `ManejadorErroresConsolaConfig` (409/404).
- Para que `aprovisionamiento` pudiera exponer estos casos de uso, hubo que
  agregarlos en ese módulo (ver ADR 0004).
