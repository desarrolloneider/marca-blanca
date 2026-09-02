package com.marcablanca.platform.usuarios.application;

import com.marcablanca.platform.usuarios.application.port.in.AutenticarUsuario;
import com.marcablanca.platform.usuarios.application.port.out.GeneradorDeToken;
import com.marcablanca.platform.usuarios.domain.Contrasena;
import com.marcablanca.platform.usuarios.domain.Correo;
import com.marcablanca.platform.usuarios.domain.CredencialesInvalidasException;
import com.marcablanca.platform.usuarios.domain.Usuario;
import com.marcablanca.platform.usuarios.domain.port.out.CifradorDeContrasenas;
import com.marcablanca.platform.usuarios.domain.port.out.RepositorioUsuarios;

/** Orquesta el login. No decide reglas de negocio: eso vive en Usuario.verificarCredenciales(). */
public class AutenticarUsuarioService implements AutenticarUsuario {

    private final RepositorioUsuarios repositorioUsuarios;
    private final CifradorDeContrasenas cifradorDeContrasenas;
    private final GeneradorDeToken generadorDeToken;

    public AutenticarUsuarioService(RepositorioUsuarios repositorioUsuarios,
                                     CifradorDeContrasenas cifradorDeContrasenas,
                                     GeneradorDeToken generadorDeToken) {
        this.repositorioUsuarios = repositorioUsuarios;
        this.cifradorDeContrasenas = cifradorDeContrasenas;
        this.generadorDeToken = generadorDeToken;
    }

    @Override
    public ResultadoAutenticacion ejecutar(String correoTexto, String contrasenaPlano) {
        Correo correo = new Correo(correoTexto);
        Contrasena contrasena = new Contrasena(contrasenaPlano);

        Usuario usuario = repositorioUsuarios.buscarPorCorreo(correo)
                .orElseThrow(CredencialesInvalidasException::new);

        usuario.verificarCredenciales(contrasena, cifradorDeContrasenas);

        String token = generadorDeToken.generarPara(usuario);

        return new ResultadoAutenticacion(usuario.getId(), token);
    }
}
