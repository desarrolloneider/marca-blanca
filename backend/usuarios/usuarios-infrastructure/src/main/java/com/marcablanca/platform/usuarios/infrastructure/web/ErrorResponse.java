package com.marcablanca.platform.usuarios.infrastructure.web;

import java.time.Instant;

public record ErrorResponse(int codigo, String mensaje, Instant marcaDeTiempo, String ruta) {
}
