package com.marcablanca.platform.aprovisionamiento.application;

import com.marcablanca.platform.aprovisionamiento.application.port.in.ListarEmpresas;
import com.marcablanca.platform.aprovisionamiento.application.port.out.ConsultaDeEmpresas;

import java.util.List;

public class ListarEmpresasService implements ListarEmpresas {

    private final ConsultaDeEmpresas consultaDeEmpresas;

    public ListarEmpresasService(ConsultaDeEmpresas consultaDeEmpresas) {
        this.consultaDeEmpresas = consultaDeEmpresas;
    }

    @Override
    public List<ResumenDeEmpresa> ejecutar() {
        return consultaDeEmpresas.listarTodas();
    }
}
 




    
,