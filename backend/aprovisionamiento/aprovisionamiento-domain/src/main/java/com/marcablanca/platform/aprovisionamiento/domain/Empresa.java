package com.marcablanca.platform.aprovisionamiento.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Agregado raiz del contexto de aprovisionamiento: concentra las reglas del alta
 * y del ciclo de vida de una empresa cliente.
 *
 * La identidad estable es el uuid (exposicion externa); el id serial de la tabla
 * es un detalle de persistencia y no vive en este objeto.
 *
 * Nota: existe otra clase 'Empresa' en el modulo 'empresas' (un record de solo
 * lectura para el ruteo multi-tenant). Son bounded contexts distintos; no se
 * comparten ni se importan entre si.
 */
public class Empresa {

    private final UUID id;
    private final Identificador identificador;
    private String nombreLegal;
    private String nombreComercial;                      // opcional
    private String dominio;                              // opcional
    private HashContrasenaMaestra hashContrasenaMaestra; // opcional al registrar
    private EstadoEmpresa estado;

    private final List<EventoDeDominio> eventos = new ArrayList<>();

    /** Constructor de reconstruccion: lo usa el adaptador de persistencia al leer de la base. */
    public Empresa(UUID id, Identificador identificador, String nombreLegal, String nombreComercial,
                   String dominio, HashContrasenaMaestra hashContrasenaMaestra, EstadoEmpresa estado) {
        this.id = id;
        this.identificador = identificador;
        this.nombreLegal = nombreLegal;
        this.nombreComercial = nombreComercial;
        this.dominio = dominio;
        this.hashContrasenaMaestra = hashContrasenaMaestra;
        this.estado = estado;
    }

    /** Alta de una empresa nueva: queda PENDIENTE_APROVISIONAMIENTO y levanta EmpresaRegistrada. */
    public static Empresa registrar(Identificador identificador,
                                    String nombreLegal,
                                    String nombreComercial,
                                    String dominio,
                                    HashContrasenaMaestra hashContrasenaMaestra,
                                    Set<String> modulosSolicitados) {
        if (identificador == null) {
            throw new IllegalArgumentException("El identificador es obligatorio.");
        }
        if (nombreLegal == null || nombreLegal.isBlank()) {
            throw new IllegalArgumentException("El nombre legal es obligatorio.");
        }
        if (dominio == null || dominio.isBlank()) {
            throw new IllegalArgumentException("El dominio es obligatorio.");
        }

        Empresa empresa = new Empresa(
                UUID.randomUUID(),
                identificador,
                nombreLegal.trim(),
                normalizar(nombreComercial),
                normalizar(dominio),
                hashContrasenaMaestra,
                EstadoEmpresa.PENDIENTE_APROVISIONAMIENTO
        );

        empresa.eventos.add(new EmpresaRegistrada(
                empresa.id,
                identificador.valor(),
                empresa.nombreLegal,
                empresa.nombreComercial,
                empresa.dominio,
                modulosSolicitados == null ? Set.of() : Set.copyOf(modulosSolicitados),
                Instant.now()
        ));
        return empresa;
    }

    /** Paso 8 del aprovisionamiento: la base quedo lista y la empresa entra en operacion. */
    public void activar() {
        if (estado != EstadoEmpresa.PENDIENTE_APROVISIONAMIENTO) {
            throw new EmpresaNoActivableException(estado);
        }
        estado = EstadoEmpresa.ACTIVA;
    }

    public List<EventoDeDominio> eventosPendientes() {
        return List.copyOf(eventos);
    }

    public void limpiarEventos() {
        eventos.clear();
    }

    private static String normalizar(String texto) {
        if (texto == null) {
            return null;
        }
        String limpio = texto.trim();
        return limpio.isBlank() ? null : limpio;
    }

    public UUID getId() { return id; }
    public Identificador getIdentificador() { return identificador; }
    public String getNombreLegal() { return nombreLegal; }
    public String getNombreComercial() { return nombreComercial; }
    public String getDominio() { return dominio; }
    public HashContrasenaMaestra getHashContrasenaMaestra() { return hashContrasenaMaestra; }
    public EstadoEmpresa getEstado() { return estado; }
}