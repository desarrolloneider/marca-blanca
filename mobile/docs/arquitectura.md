# Arquitectura de GUAJIRANET Mobile

## Objetivo

La aplicación móvil debe crecer manteniendo bajo acoplamiento, alta capacidad de mantenimiento y separación clara entre reglas de negocio, acceso a datos y presentación.

La arquitectura se organiza por funcionalidad y utiliza Clean Architecture.

## Estructura general

```text
lib/
│
├── core/
│   ├── almacenamiento/
│   ├── configuracion/
│   ├── errores/
│   ├── navegacion/
│   ├── red/
│   ├── seguridad/
│   ├── tema/
│   └── utilidades/
│
├── features/
│   └── autenticacion/
│       ├── data/
│       │   ├── datasources/
│       │   ├── models/
│       │   └── repositories/
│       │
│       ├── domain/
│       │   ├── entities/
│       │   ├── repositories/
│       │   └── use_cases/
│       │
│       └── presentation/
│           ├── pages/
│           ├── providers/
│           └── widgets/
│
├── Aplicacion.dart
└── main.dart
```

## Dependencias

La dirección permitida es:

```text
presentation
      │
      ▼
   domain
      ▲
      │
     data
```

## Domain

Es la capa más independiente.

Contiene:

- Entidades.
- Contratos de repositorio.
- Casos de uso.

No debe importar:

- Flutter.
- Riverpod.
- Dio/http.
- SQLite.
- SharedPreferences.
- APIs nativas.
- Android.
- iOS.

## Data

Implementa los contratos del dominio.

Contiene:

- Modelos de transferencia.
- Datasources.
- Implementaciones de repositorios.
- Mapeadores entre modelos externos y entidades.

La información proveniente de REST no debe propagarse directamente hasta la UI.

## Presentation

Contiene:

- Pages.
- Widgets.
- Providers.
- Estado de presentación.

No debe realizar llamadas HTTP directamente.

La interacción debe seguir:

```text
Widget
  ↓
Provider
  ↓
Caso de uso
  ↓
Contrato de dominio
  ↓
Repositorio
  ↓
Datasource
  ↓
API REST
```

## Riverpod

Riverpod se utiliza como mecanismo de:

- Estado.
- Inyección de dependencias.
- Composición de servicios.
- Coordinación entre presentación y dominio.

No debe convertirse en una dependencia del dominio.

## Plataformas

El mismo código Flutter debe servir para Android e iOS.

Las particularidades específicas de cada plataforma deben quedar aisladas en los puntos estrictamente necesarios.

La regla general es:

```text
domain
  ↓
no conoce plataforma

data
  ↓
conoce contratos técnicos mediante abstracciones

presentation
  ↓
conoce Flutter

infraestructura/plataforma
  ↓
Android / iOS / servicios del dispositivo
```

## Autenticación

La autenticación será transversal.

Su responsabilidad deberá centralizarse en:

```text
core/seguridad/
core/almacenamiento/
core/red/
```

Las funcionalidades no deben implementar individualmente:

- almacenamiento del JWT;
- renovación del token;
- cierre de sesión;
- interceptores;
- manejo global de expiración;
- lectura de credenciales.

## API

La comunicación con el backend se centralizará.

Las features no deben crear clientes HTTP independientes sin una justificación arquitectónica.

La API debe quedar detrás de abstracciones para evitar que los detalles técnicos se propaguen por toda la aplicación.

## White-label

La configuración visual debe poder adaptarse a la empresa/marca sin contaminar la lógica de negocio.

La temática y configuración de marca deben permanecer dentro de:

```text
core/tema/
core/configuracion/
```

## Crecimiento por funcionalidades

Cada módulo funcional debe permanecer encapsulado:

```text
features/
├── autenticacion/
├── clientes/
├── productos/
├── inventario/
├── ventas/
└── ...
```

Una feature puede depender de `core` y de contratos claramente definidos, pero no debe acceder arbitrariamente a la implementación interna de otra feature.

## Regla principal

La arquitectura debe hacer que un cambio en:

- API REST;
- almacenamiento;
- autenticación;
- proveedor HTTP;
- sistema operativo;
- UI;

no obligue automáticamente a modificar las demás capas.

El objetivo es reducir el acoplamiento y aislar los cambios.
