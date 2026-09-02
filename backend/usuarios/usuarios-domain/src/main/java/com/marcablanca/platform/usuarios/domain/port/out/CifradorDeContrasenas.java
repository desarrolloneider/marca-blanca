package com.marcablanca.platform.usuarios.domain.port.out;

import com.marcablanca.platform.usuarios.domain.Contrasena;
import com.marcablanca.platform.usuarios.domain.HashContrasena;

/** Puerto usado directamente por Usuario.verificarCredenciales() - por eso vive en domain, no en application. */
public interface CifradorDeContrasenas {
    HashContrasena cifrar(Contrasena contrasena);
    boolean verificar(Contrasena contrasenaCandidata, HashContrasena hashAlmacenado);
}
