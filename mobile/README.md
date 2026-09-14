# GUAJIRANET Mobile

Aplicación móvil oficial de GuajiraNet Platform.

## Plataformas

La aplicación está preparada para:

- Android
- iOS

La base de código es única y está desarrollada con Flutter.

## Arquitectura

La aplicación utiliza Clean Architecture organizada por funcionalidad:

```text
lib/
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
│       ├── domain/
│       └── presentation/
│
├── Aplicacion.dart
└── main.dart
```

## Estado

Riverpod es la solución oficial para gestión de estado y composición de dependencias.

## Convenciones

El código propio del proyecto mantiene la convención de nombres definida para el backend Java/Spring Boot:

- Clases: PascalCase
- Métodos: camelCase
- Variables: camelCase
- Constantes: MAYUSCULAS_CON_GUION_BAJO

Los archivos requeridos por Flutter/Dart conservan las convenciones obligatorias del framework, por ejemplo `main.dart`.

## Reglas arquitectónicas

1. `domain` no depende de Flutter, Riverpod, HTTP, almacenamiento ni componentes de infraestructura.
2. `presentation` no realiza llamadas HTTP directamente.
3. `presentation` consume casos de uso y estado expuesto mediante providers.
4. `data` implementa los contratos definidos por `domain`.
5. Los modelos de API no se exponen directamente a `presentation`.
6. La transformación entre modelos externos y entidades de dominio se realiza dentro de `data`.
7. Autenticación, tokens, almacenamiento y manejo de errores deben permanecer centralizados.
8. La lógica específica de Android/iOS no debe entrar al dominio.
9. Las reglas de negocio pertenecen al backend; Flutter coordina presentación, interacción, estado y consumo de servicios.
10. Cada funcionalidad debe mantenerse aislada dentro de `features`.

## Calidad

Antes de registrar cambios:

```bash
flutter pub get
flutter analyze
flutter test
```
