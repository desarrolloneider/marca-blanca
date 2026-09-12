// Coincide con backend MarcaRequest/MarcaResponse
// (mismos campos para leer y escribir).
export interface MarcaDeEmpresa {
  urlLogo: string | null;
  colorPrimario: string | null;
  colorSecundario: string | null;
  dominioPropio: string | null;
  // 1..3 -- que panel de login (lateral/centrado/fondo) y que diseño de
  // pagina (clasico/compacto/encabezado) usa esta empresa.
  tipoLogin: number | null;
  tipoPantallaPrincipal: number | null;
  // Solo lo llena el endpoint publico (login) -- ver MarcaPublicaController.
  nombreEmpresa?: string | null;
}
