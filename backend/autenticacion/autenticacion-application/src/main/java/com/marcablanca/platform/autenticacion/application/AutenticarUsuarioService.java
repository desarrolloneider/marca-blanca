package com.marcablanca.platform.autenticacion.application;

import com.marcablanca.platform.autenticacion.application.port.in.AutenticarUsuario;
import com.marcablanca.platform.autenticacion.application.port.out.AlmacenDeTokensDeRefresco;
import com.marcablanca.platform.autenticacion.application.port.out.ConsultarPermisosDeUsuario;
import com.marcablanca.platform.autenticacion.application.port.out.DatosDeUsuario;
import com.marcablanca.platform.autenticacion.application.port.out.GeneradorDeToken;
import com.marcablanca.platform.autenticacion.application.port.out.VerificadorDeUsuarios;
import com.marcablanca.platform.empresas.application.ContextoEmpresaActual;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Set;

/**
 * Orquesta el login. La validacion de credenciales vive del otro lado de
 * VerificadorDeUsuarios (implementada por AdaptadorVerificadorDeUsuarios,
 * en infrastructure) -- este servicio ya no conoce Usuario/Correo/Contrasena.
 * Lee ContextoEmpresaActual (ya establecido por AuthController antes de
 * llamar aca) para saber que empresa embeber en el token nuevo.
 */
public class AutenticarUsuarioService implements AutenticarUsuario {

    private static final long REFRESCO_DIAS_VALIDEZ = 7;

    private final VerificadorDeUsuarios verificadorDeUsuarios;
    private final GeneradorDeToken generadorDeToken;
    private final AlmacenDeTokensDeRefresco almacenDeTokensDeRefresco;
    private final ConsultarPermisosDeUsuario consultarPermisosDeUsuario;

    public AutenticarUsuarioService(VerificadorDeUsuarios verificadorDeUsuarios,
                                     GeneradorDeToken generadorDeToken,
                                     AlmacenDeTokensDeRefresco almacenDeTokensDeRefresco,
                                     ConsultarPermisosDeUsuario consultarPermisosDeUsuario) {
        this.verificadorDeUsuarios = verificadorDeUsuarios;
        this.generadorDeToken = generadorDeToken;
        this.almacenDeTokensDeRefresco = almacenDeTokensDeRefresco;
        this.consultarPermisosDeUsuario = consultarPermisosDeUsuario;
    }

    @Override
    public ResultadoAutenticacion ejecutar(String correoTexto, String contrasenaPlano) {
        DatosDeUsuario usuario = verificadorDeUsuarios.verificarCredenciales(correoTexto, contrasenaPlano);

        String identificadorEmpresa = ContextoEmpresaActual.obtener()
                .orElseThrow(() -> new IllegalStateException("No hay empresa activa en la peticion                                                           "));

        Set<String> permisos = consultarPermisosDeUsuario.permisosDe(usuario.id());
        String token = generadorDeToken.generarPara(usuario, permisos, identificadorEmpresa);

        String refrescoValor = GeneradorTokenDeRefresco.generarValor();
        String refrescoHash = GeneradorTokenDeRefresco.hashear(refrescoValor);
        OffsetDateTime expiraEn = OffsetDateTime.now(ZoneOffset.UTC).plusDays(REFRESCO_DIAS_VALIDEZ);
        almacenDeTokensDeRefresco.guardar(usuario.id(), refrescoHash, expiraEn, null);

        return new ResultadoAutenticacion(usuario.id(), token, refrescoValor, usuario.debeCambiarContrasena());
    }
}
