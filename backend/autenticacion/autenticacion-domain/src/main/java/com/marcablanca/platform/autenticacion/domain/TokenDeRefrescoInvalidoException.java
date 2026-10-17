package com.marcablanca.platform.autenticacion.domain;

public class TokenDeRefrescoInvalidoException extends RuntimeException {

    public TokenDeRefrescoInvalidoException() {
        super("El token de refresco no es valido o ya expiro.");
    }

        
}
