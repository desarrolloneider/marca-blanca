/**
 * El usuario elige "color primario" y "color secundario" sin que ninguno de
 * los 2 este atado a ser "el oscuro" o "el claro" -- una paleta como Coast
 * (primario #2563eb, secundario #facc95, un tan claro) termina con el color
 * CLARO de fondo y el OSCURO como acento si simplemente se usan en el orden
 * en que se guardaron, lo que se ve mal (poco contraste, nada "de marca").
 * Esta funcion los reordena por luminancia real para que el mas oscuro
 * siempre quede de fondo y el mas claro siempre quede como acento/resalte,
 * sin importar cual haya elegido el usuario como "primario" o "secundario".
 */
function luminanciaRelativa(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) {
    return 0;
  }
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface ParClaroOscuro {
  oscuro: string | undefined;
  claro: string | undefined;
}

export function ordenarClaroOscuro(
  colorA: string | null | undefined,
  colorB: string | null | undefined,
): ParClaroOscuro {
  if (!colorA || !colorB) {
    return { oscuro: colorA ?? undefined, claro: colorB ?? undefined };
  }
  return luminanciaRelativa(colorA) <= luminanciaRelativa(colorB)
    ? { oscuro: colorA, claro: colorB }
    : { oscuro: colorB, claro: colorA };
}
