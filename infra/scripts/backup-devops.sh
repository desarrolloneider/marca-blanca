#!/usr/bin/env bash
# Respaldo de la plataforma DevOps misma (C-52): lo que no es la
# aplicacion ni los datos del cliente, sino la infraestructura que hace
# posible el pipeline. Dos cosas, porque son las unicas con estado real
# que no vive en GitHub y que nadie mas respalda:
#   1. La base de datos de SonarQube (7+ proyectos, historial de analisis,
#      Quality Gates configurados -- perderla significa reconfigurar todo
#      desde cero, no solo perder un dato).
#   2. El registro del runner self-hosted (.runner, .credentials): sin
#      esto, el runner deja de poder autenticarse contra GitHub y hay que
#      re-registrarlo a mano, con un token nuevo.
#
# Lo que NO cubre este script: los valores de los secrets de GitHub
# Actions (SONAR_TOKEN, GITHUB_TOKEN) -- GitHub nunca los expone para
# leerlos, ni siquiera al dueno del repo, asi que no se pueden "respaldar"
# en el sentido de copiarlos. Ver docs/infraestructura/respaldo-devops.md
# para el inventario de cuales existen y como regenerar cada uno si se
# pierden.
#
# Uso: backup-devops.sh
# Pensado para correr desde infra/scripts/backup-devops.sh via el workflow
# programado backup-devops.yml, en el runner dev-vm.
set -euo pipefail

WRAPPER="sudo /usr/local/bin/docker-rbac/devops-wrapper"
BACKUP_DIR="$HOME/backups/devops"
RETENCION_DIAS=30
FECHA="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "==> Respaldando la base de datos de SonarQube"
$WRAPPER exec sonarqube-db pg_dump -U sonar sonarqube | gzip > "$BACKUP_DIR/sonarqube-db-$FECHA.sql.gz"
echo "    Guardado en $BACKUP_DIR/sonarqube-db-$FECHA.sql.gz"

echo "==> Respaldando el registro del runner self-hosted"
tar -czf "$BACKUP_DIR/runner-config-$FECHA.tar.gz" \
  -C "$HOME/actions-runner" .runner .credentials .credentials_rsaparams 2>/dev/null || \
  echo "    Aviso: alguno de los archivos de registro no existia (puede ser normal segun como se instalo el runner)"
echo "    Guardado en $BACKUP_DIR/runner-config-$FECHA.tar.gz"

echo "==> Borrando respaldos de mas de $RETENCION_DIAS dias"
find "$BACKUP_DIR" -type f -mtime "+$RETENCION_DIAS" -print -delete

echo "==> Respaldos actuales en $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"
