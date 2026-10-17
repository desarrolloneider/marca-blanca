#!/usr/bin/env bash
# Reemplaza un contenedor por una imagen nueva, sin tocar su configuracion
# de red ni sus variables de entorno -- las copia del contenedor que ya
# esta corriendo justo antes de borrarlo, en vez de recibirlas por
# parametro o por secreto. Asi nunca hace falta guardar contrasenas de
# produccion/dev (DB_PASSWORD, REDIS_PASSWORD, SAMBA_PASSWORD, etc.) en el
# repositorio ni en GitHub Actions: la fuente de la verdad es el propio
# contenedor que ya existe en la VM.
#
# Uso: deploy-container.sh <nombre-del-contenedor> <imagen-nueva>
# Ejemplo: deploy-container.sh backend ghcr.io/desarrolloneider/marca-blanca-backend:dev
#
# Requiere el wrapper de docker con sudo NOPASSWD (ver infra/docker/sonarqube
# y las notas de CI): pull, inspect, stop, rm, create, start, network connect.
set -euo pipefail

WRAPPER="sudo /usr/local/bin/docker-rbac/devops-wrapper"
NAME="${1:?Uso: deploy-container.sh <nombre-del-contenedor> <imagen-nueva>}"
IMAGE="${2:?Uso: deploy-container.sh <nombre-del-contenedor> <imagen-nueva>}"

if ! $WRAPPER inspect "$NAME" >/dev/null 2>&1; then
  echo "No existe un contenedor '$NAME' corriendo -- no hay de donde copiar su configuracion. Abortando." >&2
  exit 1
fi

echo "==> Bajando $IMAGE"
$WRAPPER pull "$IMAGE"

echo "==> Leyendo configuracion actual de '$NAME' (env, redes, puertos)"
mapfile -t ENV_LINES < <($WRAPPER inspect "$NAME" --format '{{range .Config.Env}}{{println .}}{{end}}')
ENV_ARGS=()
for line in "${ENV_LINES[@]}"; do
  [ -n "$line" ] && ENV_ARGS+=(-e "$line")
done

mapfile -t PORT_LINES < <($WRAPPER inspect "$NAME" --format '{{range $p, $conf := .HostConfig.PortBindings}}{{range $conf}}{{.HostPort}}:{{$p}}{{println}}{{end}}{{end}}' | sed 's#/tcp$##')
PORT_ARGS=()
for line in "${PORT_LINES[@]}"; do
  [ -n "$line" ] && PORT_ARGS+=(-p "$line")
done

mapfile -t RAW_NETWORKS < <($WRAPPER inspect "$NAME" --format '{{range $k, $v := .NetworkSettings.Networks}}{{println $k}}{{end}}')
NETWORKS=()
for net in "${RAW_NETWORKS[@]}"; do
  [ -n "$net" ] && NETWORKS+=("$net")
done
if [ "${#NETWORKS[@]}" -eq 0 ]; then
  echo "El contenedor '$NAME' no esta en ninguna red -- eso no deberia pasar. Abortando." >&2
  exit 1
fi
FIRST_NET="${NETWORKS[0]}"

echo "==> Deteniendo y quitando el contenedor viejo"
$WRAPPER stop "$NAME"
$WRAPPER rm "$NAME"

# Importante: se crea con "create" (no arranca todavia) y se conecta a
# TODAS sus redes antes de "start". Si se usara "run" (crea y arranca de
# una), la app intenta resolver nombres como "postgres" o "redis" apenas
# arranca -- antes de que alcance a conectarse a las redes que no sean la
# primera -- y se cae con UnknownHostException. Paso en caliente el 17 de
# octubre: el backend quedo caido varios minutos en dev por esto mismo.
echo "==> Creando '$NAME' con la imagen nueva (sin arrancar todavia)"
$WRAPPER create --name "$NAME" --network "$FIRST_NET" "${ENV_ARGS[@]}" "${PORT_ARGS[@]}" "$IMAGE"

for net in "${NETWORKS[@]:1}"; do
  echo "==> Conectando tambien a la red '$net' (antes de arrancar)"
  $WRAPPER network connect "$net" "$NAME"
done

echo "==> Arrancando '$NAME', ya conectado a todas sus redes"
$WRAPPER start "$NAME"

echo "==> Listo: '$NAME' quedo corriendo con $IMAGE"
