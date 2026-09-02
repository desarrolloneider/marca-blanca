import { Service, signal } from '@angular/core';

export interface SesionUsuario {
  id: string;
  nombreCompleto: string;
  rol: string;
}

@Service()
export class Session {
  private readonly _usuario = signal<SesionUsuario | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _autenticado = signal(false);

  // Signals de solo lectura, consultados por cualquier componente
  readonly usuario = this._usuario.asReadonly();
  readonly token = this._token.asReadonly();
  readonly estaAutenticado = this._autenticado.asReadonly();

  establecerSesion(usuario: SesionUsuario, token: string): void {
    this._usuario.set(usuario);
    this._token.set(token);
    this._autenticado.set(true);
  }

  cerrarSesion(): void {
    this._usuario.set(null);
    this._token.set(null);
    this._autenticado.set(false);
  }
}