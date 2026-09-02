package com.marcablanca.platform.usuarios.infrastructure.seguridad;

import com.marcablanca.platform.usuarios.application.port.out.VerificadorDeToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Corre en cada request. Si hay un Bearer token valido, marca al usuario como autenticado. */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String PREFIJO_BEARER = "Bearer ";

    private final VerificadorDeToken verificadorDeToken;

    public JwtAuthFilter(VerificadorDeToken verificadorDeToken) {
        this.verificadorDeToken = verificadorDeToken;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String encabezado = request.getHeader("Authorization");

        if (encabezado != null && encabezado.startsWith(PREFIJO_BEARER)) {
            String token = encabezado.substring(PREFIJO_BEARER.length());
            Optional<UUID> usuarioId = verificadorDeToken.verificar(token);

            usuarioId.ifPresent(id -> {
                var autenticacion = new UsernamePasswordAuthenticationToken(id, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(autenticacion);
            });
        }

        filterChain.doFilter(request, response);
    }
}
