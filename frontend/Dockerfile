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
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
