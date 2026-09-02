package com.marcablanca.platform.usuarios.infrastructure.web;

public record LoginRequest(String correo, String contrasena, String identificadorEmpresa) {
}
