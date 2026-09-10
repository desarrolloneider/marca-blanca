# ADR 0001 — Consola de operación separada (Opción C, híbrida)

**Fecha:** 2026-09-09
**Estado:** Aceptada
**Módulos afectados:** consola (nuevo), autenticacion

## Resumen

El back-office de la plataforma (administrar todas las empresas, la
configuración global y a los propios operadores) se construye como un
**contexto nuevo con identidad, ruta y cadena de seguridad propias**, pero
**sin** separarlo todavía en un despliegue ni en un frontend aparte. Esa
separación total queda diferida.

## Contexto

No existía ningún lugar desde el cual GuajiraNet administrara la plataforma:
suspender una empresa, configurar el SMTP o dar de alta un operador se hacía
por SQL directo. El equipo evaluó tres formas de construirlo:

- **A — consola totalmente separada**: proyecto Angular propio, subdominio
  propio, módulo backend propio, identidad de operador propia.
- **B — todo en la app actual + tabla de permisos**: el operador es un
  usuario más con un rol `SUPER_ADMIN`, y las vistas se ocultan según
  permisos.
- **C — híbrida**: el backend y la identidad de A, con el frontend arrancando
  como una sección `/consola` dentro de la app de empresas.

El modelo multi-tenant enruta cada petición por `identificadorEmpresa`
(subdominio o resolución por correo); un operador **no pertenece a ninguna
empresa**, así que no hay dónde alojarlo dentro de ese modelo sin abrir un
agujero en el aislamiento entre clientes.

## Decisión

Se adopta la **Opción C**.

- **No negociable (backend e identidad):** la identidad de operador vive en la
  base de control, las rutas son `/api/v1/consola/**` con su propia cadena de
  seguridad, y el token es un JWT con `scope=plataforma` sin claim `empresa`.
  Esto es idéntico a la Opción A.
- **Diferido (frontend/despliegue):** el código de operador arranca como una
  sección `/consola` de la app Angular actual, cargada con `loadChildren`
  (lazy) y protegida por un guard propio. El token de operador y el
  interceptor son propios (claves `consola_*` en `localStorage`), y los
  interceptores de tenant ignoran `/api/v1/consola/**`.

Se **descarta la Opción B pura** (operador = fila de usuario de tenant con
permisos): es la única variante que deja el aislamiento entre clientes en
manos de un solo chequeo de permiso en runtime, y que obliga a decidir en qué
base de tenant vive el operador.

## Consecuencias

- El aislamiento entre "una empresa" y "toda la plataforma" es físico en el
  servidor (otra ruta, otra identidad, otro `scope` de token), aunque el
  frontend comparta bundle y dominio por ahora.
- `autenticacion` gana dos cortes de aislamiento: `JwtAuthFilter.shouldNotFilter`
  para `/api/v1/consola/**` y `JwtVerificadorDeToken` rechazando tokens con
  claim `scope` (ver ADR 0002).
- Mientras el frontend comparta origen con la app de tenant, hace falta CSP
  estricta y no exponer el login de operador en dominios `*.mb`.
- **Trigger para separar el frontend** a `frontend/projects/consola/` con
  subdominio propio: cuando aparezcan facturación B2B, soporte a escala o
  impersonación, o cuando una revisión de seguridad marque el mismo-origen.
  Hasta entonces, montar un segundo proyecto Angular para pocas pantallas
  internas es sobre-ingeniería. El costo de separarlo después es bajo porque
  la lógica ya está detrás de un guard y consume otra API.

## Referencias

- Comparativa completa presentada al equipo:
  <https://claude.ai/code/artifact/c0bfc12f-60da-4b6a-b049-1826372a9a83>
  ("Separar o unificar la consola de operación").
