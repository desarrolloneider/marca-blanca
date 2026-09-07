package com.marcablanca.platform.aprovisionamiento.infrastructure.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

/** Entrada de POST /api/v1/admin/empresas. Validacion de forma en el borde (doc 01 §3). */
public record RegistrarEmpresaRequest(

        @NotBlank
        @Size(min = 3, max = 40)
        @Pattern(
                regexp = "^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$",
                message = "solo minusculas, digitos y guion bajo, empezando por letra, "
                        + "sin guiones bajos al inicio, al final ni repetidos")
        String identificador,

        @NotBlank
        @Size(max = 200)
        String nombreLegal,

        @Size(max = 200)
        String nombreComercial,

        @NotBlank
        @Size(max = 191)
        String dominio,

        @NotBlank
        @Size(min = 8, max = 100)
        String contrasenaMaestra,

        Set<@NotBlank String> modulosSolicitados
) {
}