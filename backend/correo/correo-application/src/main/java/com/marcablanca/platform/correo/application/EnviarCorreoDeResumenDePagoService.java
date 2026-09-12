package com.marcablanca.platform.correo.application;

import com.marcablanca.platform.correo.application.port.in.EnviarCorreoDeResumenDePago;
import com.marcablanca.platform.correo.application.port.out.ProveedorDeCorreo;
import com.marcablanca.platform.correo.application.port.out.RenderizadorDePlantillas;
import com.marcablanca.platform.correo.domain.DireccionCorreo;
import com.marcablanca.platform.correo.domain.MensajeDeCorreo;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

public class EnviarCorreoDeResumenDePagoService implements EnviarCorreoDeResumenDePago {

    private final ProveedorDeCorreo proveedorDeCorreo;
    private final RenderizadorDePlantillas renderizador;

    public EnviarCorreoDeResumenDePagoService(ProveedorDeCorreo proveedorDeCorreo, RenderizadorDePlantillas renderizador) {
        this.proveedorDeCorreo = proveedorDeCorreo;
        this.renderizador = renderizador;
    }

    @Override
    public void ejecutar(ComandoResumenDePago comando) {
        DireccionCorreo destinatario = new DireccionCorreo(comando.correoDestino());

        String filasHtml = comando.lineas().stream()
                .map(linea -> "<tr><td>" + escapar(linea.nombreModulo()) + "</td><td>$"
                        + linea.valorMensual() + "</td></tr>")
                .collect(Collectors.joining());

        Map<String, Object> datos = new LinkedHashMap<>();
        datos.put("nombreContacto", comando.nombreContacto());
        datos.put("nombreEmpresa", comando.nombreEmpresa());
        datos.put("numeroFactura", comando.numeroFactura());
        datos.put("filasLineas", filasHtml);
        datos.put("total", comando.total());

        String cuerpo = renderizador.renderizar("resumen-pago", datos);
        proveedorDeCorreo.enviar(new MensajeDeCorreo(destinatario, "Resumen de tu pago - LINELCA", cuerpo));
    }

    private String escapar(String texto) {
        return texto == null ? "" : texto.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
