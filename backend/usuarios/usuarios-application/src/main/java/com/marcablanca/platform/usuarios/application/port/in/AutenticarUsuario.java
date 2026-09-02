package com.marcablanca.platform.usuarios.application.port.in;

import com.marcablanca.platform.usuarios.application.ResultadoAutenticacion;

/** Puerto de entrada. La infraestructura (controller REST) depende solo de esta interfaz. */
public interface AutenticarUsuario {
    ResultadoAutenticacion ejecutar(String correo, String contrasenaPlano);
}
