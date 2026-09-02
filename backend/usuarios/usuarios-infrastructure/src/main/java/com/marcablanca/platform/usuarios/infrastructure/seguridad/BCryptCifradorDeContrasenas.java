package com.marcablanca.platform.usuarios.infrastructure.seguridad;

import com.marcablanca.platform.usuarios.domain.Contrasena;
import com.marcablanca.platform.usuarios.domain.HashContrasena;
import com.marcablanca.platform.usuarios.domain.port.out.CifradorDeContrasenas;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BCryptCifradorDeContrasenas implements CifradorDeContrasenas {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public HashContrasena cifrar(Contrasena contrasena) {
        return new HashContrasena(encoder.encode(contrasena.valorPlano()));
    }

    @Override
    public boolean verificar(Contrasena contrasenaCandidata, HashContrasena hashAlmacenado) {
        return encoder.matches(contrasenaCandidata.valorPlano(), hashAlmacenado.valor());
    }
}
