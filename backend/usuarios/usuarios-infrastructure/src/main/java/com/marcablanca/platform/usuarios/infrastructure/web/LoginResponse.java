package com.marcablanca.platform.usuarios.infrastructure.web;

import java.util.UUID;

public record LoginResponse(UUID usuarioId, String token) {
}
