package com.marcablanca.platform.usuarios.application.port.out;

import java.util.Optional;
import java.util.UUID;

/** Puerto de salida. Solo lo usa infraestructura (el filtro), nunca el dominio - mismo criterio que GeneradorDeToken. */
public interface VerificadorDeToken {
    Optional<UUID> verificar(String token);
}
