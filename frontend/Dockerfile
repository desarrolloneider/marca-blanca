# syntax=docker/dockerfile:1

# ---------- Etapa 1: build ----------
FROM node:24-alpine AS build

WORKDIR /app

# Habilita pnpm vía corepack (viene incluido en Node 24)
RUN corepack enable

# Copiamos primero los manifiestos para aprovechar la cache de capas de Docker
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Ahora sí copiamos el resto del código y compilamos
COPY . .
RUN pnpm exec ng build --configuration production

# ---------- Etapa 2: runtime (Nginx sirviendo el build estático) ----------
FROM nginx:alpine AS runtime

COPY --from=build /app/dist/mi-proyecto-frontend/browser /usr/share/nginx/html
# La imagen base de nginx corre envsubst sobre /etc/nginx/templates/*.template
# al arrancar (docker-entrypoint.d) y deja el resultado en conf.d -- asi
# BACKEND_HOST se puede fijar por variable de entorno sin reconstruir la
# imagen (ej. en Render, donde el host interno del backend no se conoce
# hasta el deploy). Default para docker-compose local.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Defaults para docker-compose local (DNS interna de Docker); en Render se
# pisan con la URL PUBLICA del backend (ver render.yaml) porque el nombre de
# red privada entre servicios no resolvia de forma confiable.
ENV BACKEND_SCHEME=http
ENV BACKEND_HOST=backend:8080
ENV DNS_RESOLVER=127.0.0.11

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
