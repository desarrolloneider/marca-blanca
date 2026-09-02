# syntax=docker/dockerfile:1

# ---------- Etapa 1: build ----------
FROM eclipse-temurin:25-jdk AS build

WORKDIR /app

# Instala Maven (la imagen de Temurin solo trae el JDK)
RUN apt-get update && apt-get install -y --no-install-recommends maven \
    && rm -rf /var/lib/apt/lists/*

# Copiamos primero los pom.xml de todos los módulos para aprovechar la cache de capas de Docker:
# si solo cambia el código fuente, esta capa de dependencias no se vuelve a descargar.
COPY pom.xml ./
COPY shared-kernel/pom.xml shared-kernel/pom.xml
COPY usuarios/usuarios-domain/pom.xml usuarios/usuarios-domain/pom.xml
COPY usuarios/usuarios-application/pom.xml usuarios/usuarios-application/pom.xml
COPY usuarios/usuarios-infrastructure/pom.xml usuarios/usuarios-infrastructure/pom.xml
COPY omnicanal/omnicanal-domain/pom.xml omnicanal/omnicanal-domain/pom.xml
COPY omnicanal/omnicanal-application/pom.xml omnicanal/omnicanal-application/pom.xml
COPY omnicanal/omnicanal-infrastructure/pom.xml omnicanal/omnicanal-infrastructure/pom.xml
COPY bootstrap/pom.xml bootstrap/pom.xml

RUN mvn -B -ntp -q dependency:go-offline || true

# Ahora sí copiamos el código fuente completo y compilamos
COPY . .
RUN mvn -B -ntp clean package -DskipTests

# ---------- Etapa 2: runtime ----------
FROM eclipse-temurin:25-jre AS runtime

WORKDIR /app

# Usuario sin privilegios para no correr como root dentro del contenedor
RUN groupadd -r spring && useradd -r -g spring spring
USER spring

COPY --from=build /app/bootstrap/target/marca-blanca-backend.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
