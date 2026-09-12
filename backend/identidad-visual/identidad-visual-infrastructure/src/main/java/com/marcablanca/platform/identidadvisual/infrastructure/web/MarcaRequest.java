package com.marcablanca.platform.identidadvisual.infrastructure.web;

public record MarcaRequest(
        String urlLogo,
        String colorPrimario,
        String colorSecundario,
        String dominioPropio,
        Integer tipoLogin,
        Integer tipoPantallaPrincipal,
        Integer ajusteLogo) {
}
