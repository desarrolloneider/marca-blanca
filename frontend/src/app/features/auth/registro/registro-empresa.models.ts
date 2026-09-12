// Coincide con backend: aprovisionamiento-infrastructure/web/*.java, wizard
// publico de 4 pasos bajo /api/v1/registro/empresas/** (sin JWT).

// Paso 1 -- POST /api/v1/registro/empresas
export interface RegistrarEmpresaRequest {
  nombreEmpresa: string;
  representanteLegal: string;
  correo: string;
  telefono: string;
  sitioWeb: string;
}

export interface RegistrarEmpresaResponse {
  empresaId: string;
  identificador: string;
  dominio: string;
  estado: string;
}

// Pasos 3-5 -- PUT /api/v1/registro/empresas/{empresaId}/personalizacion
// (reemplazo total: se manda todo lo acumulado en cada llamada). tipoLogin y
// tipoPantallaPrincipal son codigos 1..3: coinciden con el orden de las
// opciones mostradas en el wizard (lateral/clasico=1, centrado/derecha=2,
// fondo/encabezado=3).
export interface PersonalizacionRequest {
  colorPrimario: string | null;
  colorSecundario: string | null;
  urlLogo: string | null;
  tipoLogin: number | null;
  tipoPantallaPrincipal: number | null;
}

// Paso 6 -- POST /api/v1/registro/empresas/{empresaId}/finalizar
export interface FinalizarRegistroResponse {
  empresaId: string;
  estado: string;
  url: string;
}
