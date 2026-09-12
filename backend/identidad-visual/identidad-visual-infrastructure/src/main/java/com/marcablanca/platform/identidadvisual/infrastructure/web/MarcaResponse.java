package com.marcablanca.platform.identidadvisual.infrastructure.web;

public record MarcaResponse(
        String urlLogo,
        String colorPrimario,
        String colorSecundario,
        String dominioPropio,
        Integer tipoLogin,
        Integer tipoPantallaPrincipal,
        Integer ajusteLogo,
        // Solo lo llena MarcaPublicaController (el login publico lo necesita
        // para mostrar el nombre real de la empresa, no solo su logo). El
        // self-service (MarcaController) manda null -- ya hay sesion, el
        // nombre no hace falta ahi.
        String nombreEmpresa) {
}
