package com.marcablanca.platform.autenticacion.infrastructure.seguridad;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.http.HttpStatus;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final List<String> origenesPermitidos;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                           @Value("${app.cors.origenes-permitidos:http://localhost:4200,http://*.localhost:4200}")
                           List<String> origenesPermitidos) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.origenesPermitidos = origenesPermitidos;
    }

    @Bean
    public SecurityFilterChain filterChain(org.springframework.security.config.annotation.web.builders.HttpSecurity http) {
        try {
            http
                    .csrf(csrf -> csrf.disable())
                    .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    // Sin esto, Spring Security cae a su entry point por defecto
                    // (Http403ForbiddenEntryPoint) para CUALQUIER request sin
                    // autenticacion valida -- incluida una con un JWT simplemente
                    // EXPIRADO, que es el caso normal de uso (el access token dura
                    // solo 15 min). El interceptor de refresh del frontend
                    // (refresh-token.interceptor.ts) solo dispara con 401, asi que
                    // con 403 nunca intentaba renovar y el usuario terminaba
                    // deslogueado a mitad de una sesion valida. 401 = "no estas
                    // autenticado" (renovable); 403 sigue siendo el status para
                    // "si estas autenticado pero esto no te esta permitido" (ver
                    // JwtAuthFilter, caso de contrasena temporal pendiente).
                    .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers("/api/v1/auth/**").permitAll()
                            .requestMatchers("/api/v1/registro/**").permitAll()
                            // /api/v1/admin/** NO usa JWT -- se protege con clave compartida
                            // (ClaveAdminInterceptor, modulo empresas). Ver ADR del modulo de
                            // modulos-por-empresa para el porque de esta decision interina.
                            .requestMatchers("/api/v1/admin/**").permitAll()
                            // El webhook de LIWA no tiene sesion humana -- el secreto en el
                            // header ES el mecanismo de autenticacion/identificacion de tenant
                            // (ver ResolverEmpresaPorWebhookSecreto, modulo omnicanal).
                            .requestMatchers("/api/v1/omnicanal/webhook/**").permitAll()
                            // El handshake de /ws se autentica con su propio
                            // interceptor (JWT por query param, ver
                            // AutenticacionHandshakeInterceptor en bootstrap) --
                            // no llega Authorization header, asi que este filtro
                            // JWT normal no aplica aca.
                            .requestMatchers("/ws/**").permitAll()
                            // Logo/colores/variante de UI de una empresa por su identificador --
                            // la pantalla de login los necesita ANTES de autenticarse (ver
                            // MarcaPublicaController, modulo identidad-visual). Solo GET, no
                            // sensible: nunca expone nada mas alla de esos 5 campos.
                            .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/empresas/*/marca")
                                    .permitAll()
                            .anyRequest().authenticated()
                    )
                    .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
            return http.build();
        } catch (Exception e) {
            throw new IllegalStateException("Error al construir la cadena de filtros de seguridad", e);
        }
    }

    /**
     * Sin esto, un navegador bloquea la lectura de la respuesta cuando el
     * frontend (localhost:4200 en desarrollo) y el backend (localhost:8080)
     * son origenes distintos -- aunque el backend responda 200 igual, el
     * navegador nunca deja que el JS lea el cuerpo. No aparece nunca
     * probando con curl/Postman, porque CORS es una regla exclusiva de
     * navegadores, no del servidor en si.
     *
     * Cada empresa vive en su propio subdominio (<identificador>.localhost
     * en dev, <identificador>.marca-blanca.com en prod), asi que el origen
     * real del navegador cambia por empresa -- un match exacto tipo
     * "http://localhost:4200" rechaza a todas menos esa. Por eso se usan
     * ORIGIN PATTERNS (setAllowedOriginPatterns admite "*" como comodin,
     * a diferencia de setAllowedOrigins) en vez de una lista de origenes
     * exactos; sigue siendo compatible con allowCredentials(true) porque
     * cada patron se resuelve contra el Origin real de cada request, nunca
     * se responde con un "*" literal.
     */
    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuracion = new CorsConfiguration();
        configuracion.setAllowedOriginPatterns(origenesPermitidos);
        configuracion.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuracion.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Admin-Key"));
        configuracion.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource fuente = new UrlBasedCorsConfigurationSource();
        fuente.registerCorsConfiguration("/**", configuracion);
        return fuente;
    }
}
