package com.marcablanca.platform.usuarios.domain;

import com.marcablanca.platform.usuarios.domain.port.out.CifradorDeContrasenas;

import java.util.UUID;

public class Usuario {

    private final UUID id;
    private final Correo correo;
    private HashContrasena hashContrasena;
    private EstadoUsuario estado;

    public Usuario(UUID id, Correo correo, HashContrasena hashContrasena, EstadoUsuario estado) {
        this.id = id;
        this.correo = correo;
        this.hashContrasena = hashContrasena;
        this.estado = estado;
    }

    /** Regla de negocio central del login: valida estado y credenciales, o lanza la excepcion que corresponda. */
    public void verificarCredenciales(Contrasena contrasenaCandidata, CifradorDeContrasenas cifrador) {
        if (estado != EstadoUsuario.ACTIVO) {
            throw new UsuarioNoDisponibleException(estado);
        }
        if (!cifrador.verificar(contrasenaCandidata, hashContrasena)) {
            throw new CredencialesInvalidasException();
        }
    }

    public UUID getId() {
        return id;
    }

    public Correo getCorreo() {
        return correo;
    }

    public EstadoUsuario getEstado() {
        return estado;
    }
}
