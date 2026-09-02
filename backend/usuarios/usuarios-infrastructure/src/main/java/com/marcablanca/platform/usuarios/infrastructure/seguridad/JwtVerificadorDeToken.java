package com.marcablanca.platform.usuarios.infrastructure.seguridad;

import com.marcablanca.platform.usuarios.application.port.out.VerificadorDeToken;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtVerificadorDeToken implements VerificadorDeToken {

    private final SecretKey claveFirma;

    public JwtVerificadorDeToken(@Value("${app.jwt.secret}") String secreto) {
        this.claveFirma = Keys.hmacShaKeyFor(secreto.getBytes());
    }

    @Override
    public Optional<UUID> verificar(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(claveFirma)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(UUID.fromString(claims.getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            // Firma invalida, token vencido, o formato incorrecto - todos tratados igual: no autenticado.
            return Optional.empty();
        }
    }
}
