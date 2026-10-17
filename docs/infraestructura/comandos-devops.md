# Comandos de DevOps — chuleta de referencia

Todo lo que se usa en el día a día de la VM de dev (`10.104.0.11`) y del flujo de PR. No es
teoría: son los comandos reales que se usaron para armar y depurar el pipeline.

## Conectarse a la VM

```bash
ssh devops@10.104.0.11
```

Usa el usuario `devops` (tiene permiso para `docker run`/`compose`/etc. a través del wrapper).
El usuario `dev` solo puede `ps`/`logs` — sirve para mirar, no para desplegar.

## El wrapper de Docker

En esta VM, `docker` no se usa directo: todo pasa por un wrapper con `sudo` NOPASSWD que
valida qué subcomando puede correr cada usuario.

```bash
sudo /usr/local/bin/docker-rbac/devops-wrapper <subcomando> [argumentos...]
```

Subcomandos confirmados que acepta para `devops`: `ps`, `logs`, `pull`, `stop`, `rm`, `create`,
`start`, `run`, `exec`, `inspect`, `network connect`, `network disconnect`, `login`.

### Ver qué está corriendo

```bash
sudo /usr/local/bin/docker-rbac/devops-wrapper ps
docker ps -a | grep <nombre>              # incluye los detenidos/caídos
sudo /usr/local/bin/docker-rbac/devops-wrapper logs <nombre> --tail 50
```

### Entrar a un contenedor sin saber su contraseña

```bash
sudo /usr/local/bin/docker-rbac/devops-wrapper exec <nombre> <comando>
# ejemplo: respaldo de la base de SonarQube
sudo /usr/local/bin/docker-rbac/devops-wrapper exec sonarqube-db pg_dump -U sonar sonarqube
```

### Leer un archivo al que `devops` no tiene permiso directo

Montarlo de solo lectura dentro de un contenedor (ahí sí eres root):

```bash
sudo /usr/local/bin/docker-rbac/devops-wrapper run --rm -v /opt/app:/opt/app:ro eclipse-temurin:25 cat /opt/app/docker-compose.yml
```

### Recrear un contenedor con una imagen nueva, SIN perder su red ni sus variables

**Nunca usar `docker run` directo para esto** — crea y arranca de una, y si el contenedor
necesita más de una red (ej. `backend` está en `backend-net`, `data-net` y `monitoring-net`),
intenta resolver nombres como `postgres` antes de alcanzar a conectarse a esas otras redes, y
se cae con `UnknownHostException`. El orden correcto es **crear → conectar todas sus redes →
arrancar**:

```bash
sudo /usr/local/bin/docker-rbac/devops-wrapper create --name backend --network backend-net \
  -e VAR1=valor1 -e VAR2=valor2 \
  ghcr.io/desarrolloneider/marca-blanca-backend:dev

sudo /usr/local/bin/docker-rbac/devops-wrapper network connect data-net backend
sudo /usr/local/bin/docker-rbac/devops-wrapper network connect monitoring-net backend

sudo /usr/local/bin/docker-rbac/devops-wrapper start backend
```

En el pipeline esto ya está automatizado: [`infra/scripts/deploy-container.sh`](../../infra/scripts/deploy-container.sh)
hace exactamente esta secuencia, copiando la configuración (red, puertos, variables) del
contenedor que va a reemplazar — así nunca hace falta escribir contraseñas reales en el
repositorio ni en GitHub Actions.

```bash
# Uso manual del script (normalmente lo corre el pipeline solo):
infra/scripts/deploy-container.sh <nombre-del-contenedor> <imagen-nueva>
infra/scripts/deploy-container.sh backend ghcr.io/desarrolloneider/marca-blanca-backend:dev
infra/scripts/deploy-container.sh frontend ghcr.io/desarrolloneider/marca-blanca-frontend:dev
```

### Login a GHCR desde la VM

```bash
echo "$TOKEN" | sudo /usr/local/bin/docker-rbac/devops-wrapper login ghcr.io -u <usuario> --password-stdin
```

## El runner self-hosted (`dev-vm`)

Instalado en `~/actions-runner` del usuario `devops` (no de `dev` — el proceso necesita poder
usar el wrapper de Docker, y solo `devops` tiene permisos amplios).

### Registrar uno nuevo

1. Saca un token en `https://github.com/desarrolloneider/marca-blanca/settings/actions/runners/new`
2. Descarga y extrae (la página te da la versión exacta y el checksum):
   ```bash
   mkdir actions-runner && cd actions-runner
   curl -o actions-runner-linux-x64-<version>.tar.gz -L https://github.com/actions/runner/releases/download/v<version>/actions-runner-linux-x64-<version>.tar.gz
   echo "<checksum>  actions-runner-linux-x64-<version>.tar.gz" | sha256sum -c
   tar xzf ./actions-runner-linux-x64-<version>.tar.gz
   ```
3. Configura con la etiqueta `dev-vm` (así lo apuntan los workflows con `runs-on: [self-hosted, dev-vm]`):
   ```bash
   ./config.sh --url https://github.com/desarrolloneider/marca-blanca --token <TOKEN> --labels dev-vm --name dev-vm --unattended
   ```
4. Déjalo corriendo en segundo plano (sin `tmux`/`screen`, `nohup` basta):
   ```bash
   nohup ./run.sh > ~/actions-runner/runner.log 2>&1 &
   disown
   ```
5. Verifica:
   ```bash
   ps aux | grep Runner.Listener
   ```

### Quitarlo

```bash
kill $(pgrep -f Runner.Listener)
```

Y bórralo de `https://github.com/desarrolloneider/marca-blanca/settings/actions/runners` —
si aparece "Offline" lo dejan quitar con un clic, sin pedir token.

## SonarQube

- URL: `http://10.104.0.11:9000`
- Proyectos: deben coincidir el *Project key* con `backend/pom.xml` y `frontend/sonar-project.properties`
- Token para CI: tu usuario → My Account → Security → Generate Token → guardar como secret `SONAR_TOKEN` en GitHub
- `SONAR_HOST_URL` es una **variable** del repo (no secreta), apunta a `http://10.104.0.11:9000`

## Git / GitHub

### Convención de ramas (obligatoria, la valida `branch-policy.yml`)

| Rama destino | Prefijos permitidos |
|---|---|
| `develop` | `feature/*`, `bugfix/*`, `hotfix/*`, `docs/*`, `chore/*`, `refactor/*` |
| `main` | solo `develop` o `hotfix/*` |

Un PR con un prefijo distinto (ej. `fix/*` en vez de `bugfix/*`) falla el check
`check-base-branch` de inmediato, aunque el código esté perfecto.

### Flujo típico de un PR

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-descriptivo

# ... cambios ...

git add <archivos>
git commit -m "tipo(alcance): descripción corta"
git push -u origin feature/nombre-descriptivo
```

Luego abrir el PR en `https://github.com/desarrolloneider/marca-blanca/compare/develop...feature/nombre-descriptivo`.

### Ver qué hay pendiente de mergear en una rama

```bash
git fetch origin
git log --oneline origin/develop..origin/<tu-rama>
```

### Si el PR dice "out-of-date with base branch"

Es la regla **"Require branches to be up to date before merging"** haciendo su trabajo — antes
de esto, los PR se mergeaban sin los últimos commits sin que nadie se diera cuenta. Dale clic a
**"Update branch"** y espera a que los checks vuelvan a correr antes de mergear.

## Generar PDF/recalcular archivos de office en este entorno

Ver [[entorno-generacion-pdf-sin-poppler]] en la memoria del asistente — este entorno no tiene
`poppler`/Python real por PATH, se usa el Python que trae LibreOffice.
