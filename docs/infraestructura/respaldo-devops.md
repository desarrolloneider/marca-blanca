# Respaldo de la plataforma DevOps (C-52)

Esto no es el respaldo de la aplicación ni de los datos del cliente — es el respaldo de la
infraestructura que hace posible el pipeline: lo que si se pierde, hay que reconstruir el
CI/CD desde cero en vez de solo perder un dato.

## Qué se respalda automáticamente

Workflow [`backup-devops.yml`](../../.github/workflows/backup-devops.yml), semanal (domingos
3am) y disponible para correr a mano desde la pestaña Actions. Corre el script
[`infra/scripts/backup-devops.sh`](../../infra/scripts/backup-devops.sh) en la VM de dev
(`dev-vm`):

| Qué | Por qué importa | Dónde queda | Retención |
|---|---|---|---|
| Base de datos de SonarQube (`sonarqube-db`) | 7+ proyectos, historial de análisis, Quality Gates ya configurados. Perderla no es perder un dato: es reconfigurar SonarQube entero. | `~/backups/devops/sonarqube-db-*.sql.gz` en la VM | 30 días |
| Registro del runner self-hosted (`.runner`, `.credentials`) | Sin esto, el runner `dev-vm` deja de poder autenticarse contra GitHub y hay que re-registrarlo a mano con un token nuevo. | `~/backups/devops/runner-config-*.tar.gz` en la VM | 30 días |

**Pendiente de coordinar con Dainer:** estos respaldos quedan hoy dentro de la misma VM —
si la VM se pierde completa, se pierden también. Falta que el respaldo a nivel de VM que ya
tiene resuelto (Frente 1) incluya esta carpeta (`~/backups/devops`), o que este script copie
los archivos a un destino fuera de la VM (el servidor Samba que ya corre ahí mismo es un
candidato obvio, una vez se defina cómo escribirle desde `devops`).

## Qué NO se puede respaldar (y por qué)

Los *valores* de los secrets de GitHub Actions nunca se pueden copiar ni leer — GitHub no los
expone ni al dueño del repositorio, en ningún punto después de guardarlos. "Respaldarlos" en
el sentido de una copia no es posible; lo que sí se puede hacer es dejar documentado qué
secreto existe, para qué sirve y cómo se regenera si se pierde el acceso.

### Inventario de secretos y variables de GitHub Actions

| Nombre | Tipo | Para qué sirve | Cómo se regenera si se pierde |
|---|---|---|---|
| `SONAR_TOKEN` | Secret | Login del pipeline contra SonarQube (`http://10.104.0.11:9000`) para publicar el análisis | Entrar a SonarQube → tu usuario → My Account → Security → Generate Token, y actualizar el secret en `Settings → Secrets and variables → Actions` |
| `SONAR_HOST_URL` | Variable (no es secreto) | URL del servidor de SonarQube | `http://10.104.0.11:9000` — si SonarQube se muda de VM, actualizar aquí |
| `GITHUB_TOKEN` | Secret automático | Login a GHCR para publicar/bajar imágenes, comentar en PRs (`ci-docs.yml`) | Lo genera y rota GitHub solo, por cada ejecución del workflow — nunca hay que crearlo ni guardarlo a mano |

### Credenciales fuera de GitHub (viven en la VM, no en Actions)

| Qué | Dónde vive | Cómo se regenera si se pierde |
|---|---|---|
| Contraseña del usuario `devops` (SSH a `10.104.0.11`) | La VM | Pedir reseteo a Dainer (administrador de la VM) |
| Variables de entorno del contenedor `backend` (`DB_PASSWORD`, `REDIS_PASSWORD`, `SAMBA_PASSWORD`, etc.) | `/opt/app/.env` en la VM (no accesible para `devops` directamente, solo a través de un contenedor montado con permisos de root) | Pedir a Dainer el contenido de `/opt/app/.env` — es la fuente real, el contenedor solo la hereda |
| Usuario/contraseña de administrador de SonarQube | SonarQube mismo | Pedir reseteo desde la base de datos de SonarQube (requiere acceso de administrador a esa VM) a quien administre ese servicio |

## Restaurar desde un respaldo

1. **SonarQube:** `gunzip -c sonarqube-db-FECHA.sql.gz | docker exec -i sonarqube-db psql -U sonar sonarqube` (vía el wrapper con sudo, igual que el resto de comandos Docker en esta VM).
2. **Runner:** copiar `.runner`/`.credentials`/`.credentials_rsaparams` de vuelta a `~/actions-runner/` y reiniciar el proceso (`nohup ./run.sh > runner.log 2>&1 &`). Si el token de esos archivos ya expiró o fue revocado, no sirve restaurarlos — hay que re-registrar el runner desde cero (ver el proceso en el historial del chat de configuración, o pedirlo de nuevo).
