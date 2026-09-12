package com.marcablanca.platform.identidadvisual.infrastructure.web;

import com.marcablanca.platform.empresas.application.port.in.ObtenerNombreDeEmpresa;
import com.marcablanca.platform.identidadvisual.application.port.in.ObtenerMarcaDeEmpresa;
import com.marcablanca.platform.identidadvisual.domain.MarcaDeEmpresa;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Publico (permitAll en SecurityConfig) -- la pantalla de login todavia no
 * tiene JWT cuando necesita pintar el logo/colores/variante/nombre de la
 * empresa a la que pertenece el subdominio. No expone nada sensible (logo,
 * 2 colores, 2 codigos de variante de UI, nombre legal), solo lo necesario
 * para pintar esa pantalla antes de autenticarse.
 */
@RestController
@RequestMapping("/api/v1/empresas/{identificadorEmpresa}/marca")
public class MarcaPublicaController {

    private final ObtenerMarcaDeEmpresa obtenerMarcaDeEmpresa;
    private final ObtenerNombreDeEmpresa obtenerNombreDeEmpresa;

    public MarcaPublicaController(ObtenerMarcaDeEmpresa obtenerMarcaDeEmpresa,
                                   ObtenerNombreDeEmpresa obtenerNombreDeEmpresa) {
        this.obtenerMarcaDeEmpresa = obtenerMarcaDeEmpresa;
        this.obtenerNombreDeEmpresa = obtenerNombreDeEmpresa;
    }

    @GetMapping
    public MarcaResponse obtener(@PathVariable String identificadorEmpresa) {
        MarcaDeEmpresa marca = obtenerMarcaDeEmpresa.ejecutar(identificadorEmpresa);
        String nombreEmpresa = obtenerNombreDeEmpresa.ejecutar(identificadorEmpresa).orElse(null);
        return new MarcaResponse(
                marca.urlLogo(),
                marca.colorPrimario() != null ? marca.colorPrimario().valor() : null,
                marca.colorSecundario() != null ? marca.colorSecundario().valor() : null,
                marca.dominioPropio(),
                marca.tipoLogin(),
                marca.tipoPantallaPrincipal(),
                marca.ajusteLogo(),
                nombreEmpresa
        );
    }
}
