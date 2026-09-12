import { Injectable, signal } from '@angular/core';

/**
 * Puente entre "Mi marca" y el Shell para que el sidebar/header REAL de la
 * app cambie de color al instante mientras el usuario prueba colores (antes
 * de guardar) -- no solo la "Vista previa" aislada dentro de Mi marca. Mi
 * marca escribe aca en cada cambio de color; ShellComponent lo lee con
 * prioridad sobre el color ya guardado en el backend, y vuelve al guardado
 * en cuanto Mi marca se destruye (el usuario navega a otra pantalla sin
 * haber guardado -- el menu no debe quedarse con un color que nunca se
 * confirmo).
 */
@Injectable({ providedIn: 'root' })
export class VistaPreviaMarcaService {
  private readonly _colorPrimario = signal<string | null>(null);
  private readonly _colorSecundario = signal<string | null>(null);

  readonly colorPrimario = this._colorPrimario.asReadonly();
  readonly colorSecundario = this._colorSecundario.asReadonly();

  fijar(colorPrimario: string | null, colorSecundario: string | null): void {
    this._colorPrimario.set(colorPrimario);
    this._colorSecundario.set(colorSecundario);
  }

  limpiar(): void {
    this._colorPrimario.set(null);
    this._colorSecundario.set(null);
  }
}
