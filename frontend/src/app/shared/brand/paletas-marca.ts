export interface PaletaPredefinida {
  nombre: string;
  primario: string;
  secundario: string;
}

// Paletas de dos colores tipo "swatch" (inspirado en selectores de marca como
// el de Odoo) para elegir rapido; el usuario igual puede afinar con los
// selectores de color de al lado. Compartida entre el wizard de registro
// (registro-empresa.component.ts) y "Marca y diseño" (mi-marca.component.ts)
// para que ambas pantallas ofrezcan siempre las mismas opciones.
export const PALETAS_PREDEFINIDAS: PaletaPredefinida[] = [
  { nombre: 'Coast', primario: '#2563eb', secundario: '#facc95' },
  { nombre: 'Candy', primario: '#3b82f6', secundario: '#fbcfe8' },
  { nombre: 'Mint', primario: '#a78bfa', secundario: '#86efac' },
  { nombre: 'Cobalt', primario: '#1d4ed8', secundario: '#d6c9a8' },
  { nombre: 'Coral', primario: '#f87171', secundario: '#fde68a' },
  { nombre: 'Slate', primario: '#f87171', secundario: '#334155' },
  { nombre: 'Esmeralda', primario: '#10b981', secundario: '#134e4a' },
  { nombre: 'Forest', primario: '#166534', secundario: '#a3a380' },
  { nombre: 'Violeta', primario: '#7c3aed', secundario: '#c2410c' },
  { nombre: 'Burgundy', primario: '#9f1239', secundario: '#1e3a5f' },
  { nombre: 'Ember', primario: '#ea580c', secundario: '#bae6fd' },
  { nombre: 'Midnight', primario: '#0f172a', secundario: '#7dd3fc' },
];
