import { Injectable, signal } from '@angular/core';

export type TemaPagina = 'clasico' | 'derecha' | 'encabezado';

const CLAVE_STORAGE = 'mp_tema_pagina';
const TEMA_POR_DEFECTO: TemaPagina = 'clasico';

/**
 * Selector de layout de las paginas generales (fuera del login) -- lo lee
 * ShellComponent para elegir donde va la barra de navegacion: a la
 * izquierda ('clasico'), a la derecha ('derecha', mismo sidebar solo que
 * invertido) o arriba en horizontal, sin sidebar ('encabezado').
 */
@Injectable({ providedIn: 'root' })
export class TemaPaginaService {
  private readonly _tema = signal<TemaPagina>(this.leerDeStorage());

  readonly tema = this._tema.asReadonly();

  elegir(tema: TemaPagina): void {
    this._tema.set(tema);
    try {
      localStorage.setItem(CLAVE_STORAGE, tema);
    } catch {
      // preferencia puramente visual; no es critico si no se puede guardar.
    }
  }

  private leerDeStorage(): TemaPagina {
    try {
      const valor = localStorage.getItem(CLAVE_STORAGE);
      if (valor === 'clasico' || valor === 'derecha' || valor === 'encabezado') {
        return valor;
      }
    } catch {
      // ignorar y usar el valor por defecto
    }
    return TEMA_POR_DEFECTO;
  }
}
