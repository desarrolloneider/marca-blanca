package com.marcablanca.platform.usuarios.domain.port.out;

import com.marcablanca.platform.usuarios.domain.Correo;
import com.marcablanca.platform.usuarios.domain.Usuario;

import java.util.Optional;

public interface RepositorioUsuarios {
    Optional<Usuario> buscarPorCorreo(Correo correo);
}
