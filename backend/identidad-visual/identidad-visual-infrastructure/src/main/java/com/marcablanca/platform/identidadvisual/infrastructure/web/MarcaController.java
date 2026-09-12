package com.marcablanca.platform.identidadvisual.infrastructure.web;

import com.marcablanca.platform.identidadvisual.application.port.in.ActualizarMarcaDeEmpresa;
import com.marcablanca.platform.identidadvisual.application.port.in.ObtenerMarcaDeEmpresa;
import com.marcablanca.platform.identidadvisual.domain.ColorHex;
import com.marcablanca.platform.identidadvisual.domain.MarcaDeEmpresa;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Self-service -- protegido por el JWT normal (no la clave admin). La
 * empresa se saca del TOKEN YA VERIFICADO (atributo que deja JwtAuthFilter),
 * nunca de un parametro que mande el cliente -- asi ningun usuario puede
 * tocar la marca de una empresa que no es la suya, sin importar que le
 * pida al servidor. No hace falta permitAll ni ajuste de SecurityConfig:
 * esta ruta ya cae bajo ".anyRequest().authenticated()" por defecto.
 */
@RestController
@RequestMapping("/api/v1/mi-empresa/marca")
public class MarcaController {

    private static final String ATRIBUTO_EMPRESA = "identificadorEmpresa";

    private final ObtenerMarcaDeEmpresa obtenerMarcaDeEmpresa;
    private final ActualizarMarcaDeEmpresa actualizarMarcaDeEmpresa;

    public MarcaController(ObtenerMarcaDeEmpresa obtenerMarcaDeEmpresa,
                            ActualizarMarcaDeEmpresa actualizarMarcaDeEmpresa) {
        this.obtenerMarcaDeEmpresa = obtenerMarcaDeEmpresa;
        this.actualizarMarcaDeEmpresa = actualizarMarcaDeEmpresa;
    }

    @GetMapping
    public MarcaResponse obtener(HttpServletRequest request) {
        MarcaDeEmpresa marca = obtenerMarcaDeEmpresa.ejecutar(empresaDelToken(request));
        return aResponse(marca);
    }

    @PutMapping
    public ResponseEntity<Void> actualizar(HttpServletRequest request, @RequestBody MarcaRequest body) {
        MarcaDeEmpresa marca = new MarcaDeEmpresa(
                body.urlLogo(),
                body.colorPrimario() != null ? new ColorHex(body.colorPrimario()) : null,
                body.colorSecundario() != null ? new ColorHex(body.colorSecundario()) : null,
                body.dominioPropio(),
                body.tipoLogin(),
                body.tipoPantallaPrincipal(),
                body.ajusteLogo()
        );
        actualizarMarcaDeEmpresa.ejecutar(empresaDelToken(request), marca);
        return ResponseEntity.noContent().build();
    }

    private String empresaDelToken(HttpServletRequest request) {
        String identificadorEmpresa = (String) request.getAttribute(ATRIBUTO_EMPRESA);
        if (identificadorEmpresa == null) {
            throw new IllegalStateException(
                    "No hay empresa en el token -- endpoint mal protegido o JWT sin el claim 'empresa'.");
        }
        return identificadorEmpresa;
    }

    private MarcaResponse aResponse(MarcaDeEmpresa marca) {
        return new MarcaResponse(
                marca.urlLogo(),
                marca.colorPrimario() != null ? marca.colorPrimario().valor() : null,
                marca.colorSecundario() != null ? marca.colorSecundario().valor() : null,
                marca.dominioPropio(),
                marca.tipoLogin(),
                marca.tipoPantallaPrincipal(),
                marca.ajusteLogo(),
                null
        );
    }
}
