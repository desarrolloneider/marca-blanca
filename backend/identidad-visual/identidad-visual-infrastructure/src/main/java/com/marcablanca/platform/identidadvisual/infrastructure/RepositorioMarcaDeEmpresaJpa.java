package com.marcablanca.platform.identidadvisual.infrastructure;

import com.marcablanca.platform.identidadvisual.application.port.out.RepositorioMarcaDeEmpresa;
import com.marcablanca.platform.identidadvisual.domain.ColorHex;
import com.marcablanca.platform.identidadvisual.domain.EmpresaNoEncontradaException;
import com.marcablanca.platform.identidadvisual.domain.MarcaDeEmpresa;
import org.springframework.stereotype.Component;

@Component
class RepositorioMarcaDeEmpresaJpa implements RepositorioMarcaDeEmpresa {

    private final EmpresaMarcaJpaRepository empresaMarcaJpaRepository;

    RepositorioMarcaDeEmpresaJpa(EmpresaMarcaJpaRepository empresaMarcaJpaRepository) {
        this.empresaMarcaJpaRepository = empresaMarcaJpaRepository;
    }

    @Override
    public MarcaDeEmpresa obtener(String identificadorEmpresa) {
        Long empresaIdInterno = resolverEmpresaIdInterno(identificadorEmpresa);

        return empresaMarcaJpaRepository.findByEmpresaId(empresaIdInterno)
                .map(this::aDominio)
                .orElse(new MarcaDeEmpresa(null, null, null, null, 1, 1, 1));
    }

    @Override
    public void guardar(String identificadorEmpresa, MarcaDeEmpresa marca) {
        Long empresaIdInterno = resolverEmpresaIdInterno(identificadorEmpresa);
        String colorPrimario = marca.colorPrimario() != null ? marca.colorPrimario().valor() : null;
        String colorSecundario = marca.colorSecundario() != null ? marca.colorSecundario().valor() : null;

        empresaMarcaJpaRepository.findByEmpresaId(empresaIdInterno)
                .ifPresentOrElse(
                        existente -> {
                            existente.actualizar(marca.urlLogo(), colorPrimario, colorSecundario, marca.dominioPropio(),
                                    marca.tipoLogin(), marca.tipoPantallaPrincipal(), marca.ajusteLogo());
                            empresaMarcaJpaRepository.save(existente);
                        },
                        () -> empresaMarcaJpaRepository.save(new EmpresaMarcaEntity(
                                empresaIdInterno, marca.urlLogo(), colorPrimario, colorSecundario, marca.dominioPropio(),
                                marca.tipoLogin(), marca.tipoPantallaPrincipal(), marca.ajusteLogo()))
                );
    }

    private Long resolverEmpresaIdInterno(String identificadorEmpresa) {
        return empresaMarcaJpaRepository.buscarEmpresaIdInternoPorIdentificador(identificadorEmpresa)
                .orElseThrow(() -> new EmpresaNoEncontradaException(identificadorEmpresa));
    }

    private MarcaDeEmpresa aDominio(EmpresaMarcaEntity entity) {
        return new MarcaDeEmpresa(
                entity.getUrlLogo(),
                entity.getColorPrimario() != null ? new ColorHex(entity.getColorPrimario()) : null,
                entity.getColorSecundario() != null ? new ColorHex(entity.getColorSecundario()) : null,
                entity.getDominioPropio(),
                entity.getTipoLogin(),
                entity.getTipoPantallaPrincipal(),
                entity.getAjusteLogo()
        );
    }
}
