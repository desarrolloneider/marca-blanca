import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MarcaService } from '../../../../core/identidad-visual/marca.service';
import { MarcaDeEmpresa } from '../../../../core/identidad-visual/models';
import { VistaPreviaMarcaService } from '../../../../core/identidad-visual/vista-previa-marca.service';
import { TemaPaginaService, TemaPagina } from '../../../../core/temas/tema-pagina.service';
import { PaletaPredefinida, PALETAS_PREDEFINIDAS } from '../../../../shared/brand/paletas-marca';

const FORMATO_HEX = /^#[0-9A-Fa-f]{6}$/;
const MAX_LOGO_BYTES = 500 * 1024;

// Barra de tono (hue 0-360) -- saturacion/luminosidad quedan fijas en valores
// vivos para que cualquier punto de la barra de un color usable de una vez,
// sin necesitar mas controles (el usuario igual puede afinar con el campo
// hex de al lado si quiere algo mas exacto).
const SATURACION_TONO = 70;
const LUMINOSIDAD_TONO = 50;

function tonoAHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const aHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${aHex(f(0))}${aHex(f(8))}${aHex(f(4))}`;
}

function hexATono(hex: string | null | undefined): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? '');
  if (!m) {
    return 0;
  }
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) {
    return 0;
  }
  let h: number;
  if (max === r) {
    h = ((g - b) / d) % 6;
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  h *= 60;
  return h < 0 ? Math.round(h + 360) : Math.round(h);
}

interface OpcionAjusteLogo {
  valor: number;
  nombre: string;
  css: 'contain' | 'cover' | 'fill';
}

const OPCIONES_AJUSTE: OpcionAjusteLogo[] = [
  { valor: 1, nombre: 'Contener', css: 'contain' },
  { valor: 2, nombre: 'Cubrir', css: 'cover' },
  { valor: 3, nombre: 'Estirar', css: 'fill' },
];

type CodigoTemaLogin = 'lateral' | 'centrado' | 'fondo';

interface OpcionTemaLogin {
  codigo: CodigoTemaLogin;
  numero: number;
  nombre: string;
  descripcion: string;
}

const OPCIONES_LOGIN: OpcionTemaLogin[] = [
  {
    codigo: 'lateral',
    numero: 1,
    nombre: 'Panel lateral',
    descripcion: 'Panel de marca a un lado y el formulario al otro. El diseño clásico.',
  },
  {
    codigo: 'centrado',
    numero: 2,
    nombre: 'Centrado',
    descripcion: 'Tarjeta centrada con el logo arriba, sin panel lateral. Minimalista.',
  },
  {
    codigo: 'fondo',
    numero: 3,
    nombre: 'Fondo completo',
    descripcion: 'Fondo degradado a pantalla completa con el formulario flotando en el centro.',
  },
];

interface OpcionPagina {
  codigo: TemaPagina;
  numero: number;
  nombre: string;
  descripcion: string;
}

const OPCIONES_PAGINA: OpcionPagina[] = [
  { codigo: 'clasico', numero: 1, nombre: 'Clásico', descripcion: 'Barra lateral a la izquierda con la navegación. El diseño actual.' },
  { codigo: 'derecha', numero: 2, nombre: 'Barra a la derecha', descripcion: 'La misma barra de navegación, pero ubicada a la derecha de la pantalla.' },
  { codigo: 'encabezado', numero: 3, nombre: 'Header arriba', descripcion: 'Sin barra lateral: la navegación va en una franja horizontal arriba, con más ancho para el contenido.' },
];

/**
 * Vista unificada de identidad + diseño ("Mi marca" + el antiguo
 * "Experiencia de acceso" en /tema-login, fusionados en una sola pantalla):
 * logo/colores/dominio, diseño del login y densidad de las páginas. Antes
 * vivian en 2 rutas separadas del sidebar -- se combinan porque las 3 cosas
 * son "como se ve mi empresa" y el usuario terminaba saltando entre ambas
 * para configurar su marca completa.
 */
@Component({
  selector: 'app-mi-marca',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="marca-page">
      <header class="marca-header">
        <h1>Marca y diseño</h1>
        <p>Personaliza el logo, los colores, el dominio y el diseño con los que tus clientes ven la plataforma.</p>
      </header>

      @if (cargando()) {
        <div class="state-container">
          <mat-spinner diameter="44"></mat-spinner>
          <p>Cargando tu marca...</p>
        </div>
      } @else if (errorCarga()) {
        <div class="state-container">
          <mat-icon color="warn">error_outline</mat-icon>
          <p>{{ errorCarga() }}</p>
          <button mat-stroked-button (click)="cargar()">Reintentar</button>
        </div>
      } @else {
        <!-- IDENTIDAD -->
        <section class="tarjeta">
          <h2><span class="h2-icono violeta"><mat-icon>palette</mat-icon></span>Identidad de marca</h2>
          <p class="hint">Logo, colores y dominio propio con los que tus clientes ven la plataforma.</p>

          <div class="marca-layout">
            <form class="marca-form" [formGroup]="form" (ngSubmit)="guardar()">
              <div class="logo-field">
                <span class="campo-label">Logo de tu empresa</span>
                <div class="logo-row">
                  @if (form.value.urlLogo) {
                    <img [src]="form.value.urlLogo" alt="Vista previa del logo" class="logo-preview" [style.object-fit]="ajusteCss()" />
                  } @else {
                    <div class="logo-preview logo-preview-vacio">
                      <mat-icon>image</mat-icon>
                    </div>
                  }
                  <div class="logo-acciones">
                    <input #inputLogo type="file" accept="image/*" hidden (change)="onLogoSeleccionado($event)" />
                    <button mat-stroked-button type="button" (click)="inputLogo.click()">
                      {{ form.value.urlLogo ? 'Cambiar logo' : 'Subir logo' }}
                    </button>
                    @if (form.value.urlLogo) {
                      <button mat-button type="button" (click)="quitarLogo()">Quitar</button>
                    }
                  </div>
                </div>
                @if (errorLogo()) {
                  <p class="field-error">{{ errorLogo() }}</p>
                } @else {
                  <p class="campo-hint">PNG o JPG, hasta 500 KB. También puedes pegar la URL de una imagen ya publicada.</p>
                }
              </div>

              <mat-form-field appearance="outline">
                <mat-label>...o pega la URL de una imagen</mat-label>
                <input matInput formControlName="urlLogo" placeholder="https://mi-empresa.com/logo.png" />
                <mat-icon matPrefix>link</mat-icon>
              </mat-form-field>

              @if (form.value.urlLogo) {
                <div class="ajuste-field">
                  <span class="campo-label">Forma del logo</span>
                  <div class="ajuste-opciones">
                    @for (opcion of opcionesAjuste; track opcion.valor) {
                      <button
                        type="button"
                        class="ajuste-boton"
                        [class.ajuste-boton-activo]="form.value.ajusteLogo === opcion.valor"
                        (click)="form.patchValue({ ajusteLogo: opcion.valor })"
                      >
                        {{ opcion.nombre }}
                      </button>
                    }
                  </div>
                </div>
              }

              <div class="paleta-field">
                <span class="campo-label">Paleta de colores</span>
                <div class="paleta-grid">
                  @for (paleta of paletasPredefinidas; track paleta.nombre) {
                    <button
                      type="button"
                      class="paleta-swatch"
                      [class.paleta-swatch-activa]="form.value.colorPrimario === paleta.primario && form.value.colorSecundario === paleta.secundario"
                      (click)="elegirPaleta(paleta)"
                    >
                      <span class="paleta-colores">
                        <span class="paleta-mitad" [style.background]="paleta.primario"></span>
                        <span class="paleta-mitad" [style.background]="paleta.secundario"></span>
                      </span>
                      <span class="paleta-nombre">{{ paleta.nombre }}</span>
                      @if (form.value.colorPrimario === paleta.primario && form.value.colorSecundario === paleta.secundario) {
                        <mat-icon class="paleta-check" inline>check_circle</mat-icon>
                      }
                    </button>
                  }
                </div>
              </div>

              <div class="color-field">
                <mat-form-field appearance="outline">
                  <mat-label>Color primario</mat-label>
                  <input matInput formControlName="colorPrimario" placeholder="#2563EB" />
                  <mat-icon matPrefix>palette</mat-icon>
                </mat-form-field>
                <span
                  class="swatch"
                  [style.background]="esHexValido(form.value.colorPrimario) ? form.value.colorPrimario : '#e2e8f0'"
                ></span>
              </div>
              @if (form.get('colorPrimario')?.invalid && form.get('colorPrimario')?.touched) {
                <p class="field-error">Formato inválido. Usa un hexadecimal de 6 dígitos, ej: #2563EB</p>
              }
              <input
                type="range"
                class="barra-tono"
                min="0"
                max="360"
                [value]="tonoPrimario()"
                (pointerdown)="iniciarArrastreTono()"
                (input)="onTonoPrimario($any($event.target).value)"
                (change)="animarCambioColor()"
              />

              <div class="color-field">
                <mat-form-field appearance="outline">
                  <mat-label>Color secundario</mat-label>
                  <input matInput formControlName="colorSecundario" placeholder="#1E3A5F" />
                  <mat-icon matPrefix>palette</mat-icon>
                </mat-form-field>
                <span
                  class="swatch"
                  [style.background]="esHexValido(form.value.colorSecundario) ? form.value.colorSecundario : '#e2e8f0'"
                ></span>
              </div>
              @if (form.get('colorSecundario')?.invalid && form.get('colorSecundario')?.touched) {
                <p class="field-error">Formato inválido. Usa un hexadecimal de 6 dígitos, ej: #1E3A5F</p>
              }
              <input
                type="range"
                class="barra-tono"
                min="0"
                max="360"
                [value]="tonoSecundario()"
                (pointerdown)="iniciarArrastreTono()"
                (input)="onTonoSecundario($any($event.target).value)"
                (change)="animarCambioColor()"
              />

              <mat-form-field appearance="outline">
                <mat-label>Dominio propio</mat-label>
                <input matInput formControlName="dominioPropio" placeholder="app.mi-empresa.com" />
                <mat-icon matPrefix>public</mat-icon>
              </mat-form-field>

              <div class="acciones-form">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || guardando()">
                  @if (guardando()) {
                    <mat-spinner diameter="18"></mat-spinner>
                  } @else {
                    <span>Guardar cambios</span>
                  }
                </button>
                <button mat-button type="button" (click)="restaurarColoresIniciales()">
                  Volver a los colores iniciales
                </button>
              </div>
            </form>

            <aside class="marca-preview">
              <p class="preview-label">Vista previa</p>
              <div class="preview-card">
                <div class="preview-capa" [style.background]="gradienteAnterior()"></div>
                <div
                  class="preview-capa preview-capa-nueva"
                  [class.revelada]="revelando()"
                  [class.sin-transicion]="sinTransicion()"
                  [style.background]="gradienteActual()"
                ></div>
                <div class="preview-contenido">
                  <div class="preview-header">
                    @if (form.value.urlLogo) {
                      <img [src]="form.value.urlLogo" alt="Logo de la empresa" [style.object-fit]="ajusteCss()" (error)="logoConError.set(true)" />
                    } @else {
                      <mat-icon>image</mat-icon>
                    }
                  </div>
                  <button class="preview-btn" type="button" [style.color]="previewPrimario()">Botón de ejemplo</button>
                  <p class="preview-domain">
                    <mat-icon inline>public</mat-icon>
                    {{ form.value.dominioPropio || 'app.tu-empresa.com' }}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <!-- DISEÑO DE LOGIN -->
        <section class="tarjeta">
          <h2><span class="h2-icono azul"><mat-icon>dashboard_customize</mat-icon></span>Diseño de inicio de sesión</h2>
          <p class="hint">
            Elige cómo se ve la pantalla de login de tu empresa. Todos los que inicien sesión lo van a ver así.
          </p>

          <div class="temas-grid" [style.--acento]="previewPrimario()" [style.--acento-oscuro]="previewSecundario()">
            @for (opcion of opcionesLogin; track opcion.codigo) {
              <div class="tema-card" [class.tema-card-activa]="codigoLoginActivo() === opcion.codigo">
                <div class="preview" [class]="'preview-' + opcion.codigo">
                  @switch (opcion.codigo) {
                    @case ('lateral') {
                      <div class="preview-lateral">
                        <div class="preview-panel">
                          <span class="preview-logo">
                            @if (form.value.urlLogo) {
                              <img [src]="form.value.urlLogo" alt="" />
                            } @else {
                              <mat-icon>hub</mat-icon>
                            }
                          </span>
                          <div class="preview-linea preview-linea-clara corta"></div>
                          <div class="preview-linea preview-linea-clara"></div>
                        </div>
                        <div class="preview-form">
                          <div class="preview-campo"></div>
                          <div class="preview-campo"></div>
                          <div class="preview-boton"></div>
                        </div>
                      </div>
                    }
                    @case ('centrado') {
                      <div class="preview-centrado">
                        <div class="preview-tarjeta">
                          <span class="preview-logo oscuro">
                            @if (form.value.urlLogo) {
                              <img [src]="form.value.urlLogo" alt="" />
                            } @else {
                              <mat-icon>hub</mat-icon>
                            }
                          </span>
                          <div class="preview-linea corta centrada"></div>
                          <div class="preview-campo"></div>
                          <div class="preview-campo"></div>
                          <div class="preview-boton"></div>
                        </div>
                      </div>
                    }
                    @case ('fondo') {
                      <div class="preview-fondo">
                        <div class="preview-tarjeta preview-tarjeta-flotante">
                          <span class="preview-logo oscuro">
                            @if (form.value.urlLogo) {
                              <img [src]="form.value.urlLogo" alt="" />
                            } @else {
                              <mat-icon>hub</mat-icon>
                            }
                          </span>
                          <div class="preview-linea corta centrada"></div>
                          <div class="preview-campo"></div>
                          <div class="preview-campo"></div>
                          <div class="preview-boton"></div>
                        </div>
                      </div>
                    }
                  }
                </div>

                <h3>{{ opcion.nombre }}</h3>
                <p class="tema-desc">{{ opcion.descripcion }}</p>

                @if (codigoLoginActivo() === opcion.codigo) {
                  <button mat-flat-button disabled class="btn-activo">
                    <mat-icon>check_circle</mat-icon>
                    En uso
                  </button>
                } @else {
                  <button mat-stroked-button [disabled]="guardandoLogin()" (click)="elegirLogin(opcion)">Usar este diseño</button>
                }
              </div>
            }
          </div>
          <p class="hint hint-preview">
            <mat-icon inline>info</mat-icon>
            Las 3 vistas usan tu logo y tus colores de "Identidad de marca" de arriba.
          </p>

          <a routerLink="/login" class="ver-login-link" target="_blank">
            <mat-icon inline>open_in_new</mat-icon>
            Ver el login en una pestaña nueva
          </a>
        </section>

        <!-- DISEÑO DE LAS PÁGINAS -->
        <section class="tarjeta">
          <h2><span class="h2-icono verde"><mat-icon>view_agenda</mat-icon></span>Diseño de las páginas</h2>
          <p class="hint">Cómo se organiza la navegación y el espacio en el resto de la plataforma (menú, listados, etc.).</p>

          <div class="temas-grid" [style.--acento]="previewPrimario()" [style.--acento-oscuro]="previewSecundario()">
            @for (opcion of opcionesPagina; track opcion.codigo) {
              <div class="tema-card" [class.tema-card-activa]="codigoPaginaActivo() === opcion.codigo">
                <div class="preview preview-pagina" [class]="'preview-pagina-' + opcion.codigo">
                  @if (opcion.codigo === 'encabezado') {
                    <div class="preview-pagina-header">
                      <span class="preview-logo chico">
                        @if (form.value.urlLogo) {
                          <img [src]="form.value.urlLogo" alt="" />
                        } @else {
                          <mat-icon>hub</mat-icon>
                        }
                      </span>
                      <div class="preview-nav-item activo horizontal"></div>
                      <div class="preview-nav-item horizontal"></div>
                      <div class="preview-nav-item horizontal"></div>
                    </div>
                    <div class="preview-pagina-contenido ancho">
                      <div class="preview-pagina-barra grande"></div>
                      @for (fila of [1, 2, 3]; track fila) {
                        <div class="preview-pagina-fila">
                          <div class="preview-pagina-card"></div>
                          <div class="preview-pagina-card"></div>
                          <div class="preview-pagina-card"></div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="preview-pagina-sidebar">
                      <span class="preview-logo chico">
                        @if (form.value.urlLogo) {
                          <img [src]="form.value.urlLogo" alt="" />
                        } @else {
                          <mat-icon>hub</mat-icon>
                        }
                      </span>
                      <div class="preview-nav-item activo"></div>
                      <div class="preview-nav-item"></div>
                      <div class="preview-nav-item"></div>
                    </div>
                    <div class="preview-pagina-contenido">
                      <div class="preview-pagina-barra grande"></div>
                      @for (fila of [1, 2, 3]; track fila) {
                        <div class="preview-pagina-fila">
                          <div class="preview-pagina-card"></div>
                          <div class="preview-pagina-card"></div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <h3>{{ opcion.nombre }}</h3>
                <p class="tema-desc">{{ opcion.descripcion }}</p>

                @if (codigoPaginaActivo() === opcion.codigo) {
                  <button mat-flat-button disabled class="btn-activo">
                    <mat-icon>check_circle</mat-icon>
                    En uso
                  </button>
                } @else {
                  <button mat-stroked-button [disabled]="guardandoPagina()" (click)="elegirPagina(opcion)">
                    Usar este diseño
                  </button>
                }
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .marca-page {
      min-height: 100%;
      padding: 40px 24px 64px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .marca-header h1 {
      margin: 0 0 6px;
      font-size: 28px;
      font-weight: 700;
      color: #1e3a5f;
    }

    .marca-header p {
      margin: 0 0 32px;
      color: #64748b;
    }

    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 64px 0;
      color: #64748b;
    }

    .tarjeta {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 26px 28px;
      margin-bottom: 24px;
      box-shadow: 0 6px 18px rgba(15, 23, 42, .03);
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0 0 6px;
      color: #0f172a;
    }

    .h2-icono {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .h2-icono mat-icon { color: #fff; font-size: 19px; width: 19px; height: 19px; }
    .h2-icono.azul { background: linear-gradient(135deg, #38bdf8, #2563eb); }
    .h2-icono.violeta { background: linear-gradient(135deg, #a855f7, #7c3aed); }
    .h2-icono.verde { background: linear-gradient(135deg, #34d399, #059669); }

    .hint {
      margin: 0 0 20px;
      color: #64748b;
      font-size: 0.88rem;
      line-height: 1.5;
    }

    /* ---------- Identidad de marca ---------- */
    .marca-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 28px;
      align-items: start;
    }

    @media (max-width: 720px) {
      .marca-layout {
        grid-template-columns: 1fr;
      }
    }

    .marca-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .marca-form mat-form-field {
      width: 100%;
    }

    .campo-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
    }

    .campo-hint {
      margin: 6px 0 16px;
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .logo-field {
      margin-bottom: 18px;
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-preview {
      width: 56px;
      height: 56px;
      border-radius: 10px;
      object-fit: contain;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .logo-preview-vacio {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
    }

    .logo-acciones {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ajuste-field {
      margin: -4px 0 18px;
    }

    .ajuste-opciones {
      display: flex;
      gap: 8px;
      margin-top: 6px;
    }

    .ajuste-boton {
      flex: 1;
      padding: 8px 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
    }

    .ajuste-boton:hover {
      border-color: #cbd5e1;
    }

    .ajuste-boton-activo {
      border-color: #2563eb;
      color: #2563eb;
      background: #eff6ff;
    }

    .paleta-field {
      margin-bottom: 18px;
    }

    .paleta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }

    .paleta-swatch {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px 6px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      cursor: pointer;
      transition: border-color 0.15s, transform 0.1s;
    }

    .paleta-swatch:hover {
      border-color: #cbd5e1;
    }

    .paleta-swatch-activa {
      border-color: #2563eb;
      box-shadow: 0 0 0 1px #2563eb;
    }

    .paleta-colores {
      display: flex;
      width: 100%;
      height: 24px;
      border-radius: 6px;
      overflow: hidden;
    }

    .paleta-mitad {
      flex: 1;
    }

    .paleta-nombre {
      font-size: 0.68rem;
      font-weight: 600;
      color: #475569;
    }

    .paleta-check {
      position: absolute;
      top: -6px;
      right: -6px;
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #2563eb;
      background: #fff;
      border-radius: 50%;
    }

    .color-field {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .color-field mat-form-field {
      flex: 1;
    }

    .swatch {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      flex-shrink: 0;
      margin-bottom: 20px;
    }

    /* Barra de tono -- selector libre de color ("a tu gusto"), no solo las
       paletas predefinidas. Un solo input[type=range] con el track pintado
       como espectro de matices (hue 0-360); el thumb elige el matiz y S/L
       quedan fijos en valores vivos para que siempre de un color usable. */
    .barra-tono {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 14px;
      border-radius: 999px;
      margin: -6px 0 16px;
      background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
      cursor: pointer;
    }
    .barra-tono::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      border: 3px solid #172033;
      box-shadow: 0 1px 4px rgba(0, 0, 0, .35);
      cursor: pointer;
    }
    .barra-tono::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      border: 3px solid #172033;
      box-shadow: 0 1px 4px rgba(0, 0, 0, .35);
      cursor: pointer;
    }

    .field-error {
      margin: -8px 0 8px;
      font-size: 12px;
      color: #dc2626;
    }

    .acciones-form {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
    }

    button[type='submit'] {
      min-width: 160px;
    }

    .marca-preview {
      position: sticky;
      top: 24px;
    }

    .preview-label {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .preview-card {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      color: #fff;
    }

    /* "Wipe" de abajo hacia arriba al cambiar de color: la capa vieja queda
       de fondo, la capa nueva entra con clip-path (de totalmente tapada por
       arriba a totalmente visible) -- como el clip tapa desde arriba, al
       encogerse el area visible crece desde ABAJO hacia arriba. */
    .preview-capa {
      position: absolute;
      inset: 0;
    }

    .preview-capa-nueva {
      clip-path: inset(100% 0 0 0);
      transition: clip-path 0.65s cubic-bezier(.65, 0, .35, 1);
    }

    .preview-capa-nueva.revelada {
      clip-path: inset(0 0 0 0);
    }

    .preview-capa-nueva.sin-transicion {
      transition: none;
    }

    .preview-contenido {
      position: relative;
      z-index: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .preview-header {
      height: 48px;
      display: flex;
      align-items: center;
    }

    .preview-header img {
      max-height: 48px;
      max-width: 160px;
      object-fit: contain;
    }

    .preview-btn {
      align-self: flex-start;
      background: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-weight: 600;
      cursor: default;
      transition: color 0.3s ease;
    }

    .preview-domain {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: 13px;
      opacity: 0.85;
    }

    /* ---------- Diseño de login / densidad de paginas (previews grandes,
       con el logo y los colores reales que el cliente eligio arriba) ---------- */
    .temas-grid {
      --acento: #2563eb;
      --acento-oscuro: #1e3a5f;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 22px;
      margin-bottom: 12px;
    }

    .tema-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px;
      display: flex;
      flex-direction: column;
    }

    .tema-card-activa {
      border-color: var(--acento);
      background: #fff;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--acento) 18%, transparent);
    }

    .preview {
      height: 230px;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 16px;
      background: #f1f5f9;
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, .06);
    }

    .preview-logo {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      background: rgba(255, 255, 255, .18);
      color: #fff;
    }
    .preview-logo.oscuro { background: color-mix(in srgb, var(--acento) 12%, white); color: var(--acento); }
    .preview-logo.chico { width: 26px; height: 26px; border-radius: 7px; }
    .preview-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: inherit; }
    .preview-logo mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .preview-lateral {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      height: 100%;
    }

    .preview-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 18px;
      background: linear-gradient(135deg, var(--acento-oscuro) 0%, var(--acento) 100%);
    }

    .preview-form {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
      padding: 20px;
      background: #fff;
    }

    .preview-centrado {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e2e8f0;
      padding: 16px;
    }

    .preview-fondo {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, #0f172a 0%, var(--acento-oscuro) 45%, var(--acento) 100%);
      padding: 16px;
    }

    .preview-tarjeta {
      width: 78%;
      background: white;
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 9px;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.14);
    }

    .preview-tarjeta-flotante {
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.4);
    }

    .preview-linea {
      height: 7px;
      border-radius: 3px;
      background: #cbd5e1;
      width: 100%;
    }

    .preview-linea-clara {
      background: rgba(255, 255, 255, .55);
    }

    .preview-linea.corta {
      width: 55%;
      height: 9px;
    }

    .preview-linea.centrada {
      align-self: center;
    }

    .preview-campo {
      height: 16px;
      width: 100%;
      border-radius: 5px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .preview-boton {
      height: 16px;
      width: 100%;
      border-radius: 5px;
      background: var(--acento);
      margin-top: 2px;
    }

    .tema-card h3 {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 4px;
      color: #0f172a;
    }

    .tema-desc {
      font-size: 0.84rem;
      color: #64748b;
      line-height: 1.4;
      margin: 0 0 16px;
      min-height: 40px;
    }

    .tema-card button {
      margin-top: auto;
    }

    .btn-activo {
      background: #f0fdf4 !important;
      color: #16a34a !important;
    }

    .hint-preview {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: 0.8rem;
    }
    .hint-preview mat-icon { font-size: 15px; width: 15px; height: 15px; color: #94a3b8; }

    .ver-login-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 14px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #2468d9;
      text-decoration: none;
    }

    .ver-login-link:hover {
      text-decoration: underline;
    }

    /* ---------- Densidad de páginas: mockup de sidebar + contenido ---------- */
    .preview-pagina {
      display: grid;
      grid-template-columns: 66px 1fr;
      background: #eef2f7;
    }

    .preview-pagina-sidebar {
      background: var(--acento-oscuro);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 14px 10px;
    }

    .preview-nav-item {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, .18);
    }
    .preview-nav-item.activo { background: var(--acento); }

    .preview-pagina-contenido {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .preview-pagina-barra {
      height: 10px;
      width: 45%;
      border-radius: 4px;
      background: #cbd5e1;
    }
    .preview-pagina-barra.grande { height: 12px; width: 55%; margin-bottom: 2px; }

    .preview-pagina-fila {
      display: flex;
      gap: 10px;
    }

    .preview-pagina-card {
      flex: 1;
      height: 30px;
      border-radius: 6px;
      background: #fff;
      box-shadow: 0 2px 6px rgba(15, 23, 42, .06);
    }

    /* "A la derecha": mismo grid, solo se invierte el orden de las columnas
       y de los hijos -- asi se ve igual que lo que hace ShellComponent
       (flex-direction: row-reverse) con el sidebar real. */
    .preview-pagina-derecha { grid-template-columns: 1fr 66px; }
    .preview-pagina-derecha .preview-pagina-sidebar { order: 2; }
    .preview-pagina-derecha .preview-pagina-contenido { order: 1; }

    /* "Header arriba": layout real distinto (columna, no grid de sidebar) --
       mismo que implementa ShellComponent cuando tipoPantallaPrincipal=3. */
    .preview-pagina-encabezado {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }
    .preview-pagina-header {
      background: var(--acento-oscuro);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
    }
    .preview-nav-item.horizontal { width: 34px; height: 8px; flex-shrink: 0; }
    .preview-pagina-contenido.ancho .preview-pagina-fila { gap: 8px; }
  `],
})
export class MiMarcaComponent implements OnInit, OnDestroy {
  private readonly marcaService = inject(MarcaService);
  private readonly temaPaginaService = inject(TemaPaginaService);
  private readonly vistaPreviaMarca = inject(VistaPreviaMarcaService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly opcionesLogin = OPCIONES_LOGIN;
  protected readonly opcionesPagina = OPCIONES_PAGINA;
  protected readonly paletasPredefinidas = PALETAS_PREDEFINIDAS;
  protected readonly opcionesAjuste = OPCIONES_AJUSTE;

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly guardandoLogin = signal(false);
  protected readonly guardandoPagina = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly logoConError = signal(false);
  protected readonly errorLogo = signal<string | null>(null);

  // Estado del "wipe" animado de la vista previa al cambiar de color -- ver
  // animarCambioColor(). revelando=true es el estado estable normal (capa
  // nueva completamente visible); se pone en false momentaneamente para
  // reproducir la entrada de abajo hacia arriba.
  protected readonly gradienteAnterior = signal('linear-gradient(135deg, #1e3a5f, #2563eb)');
  protected readonly revelando = signal(true);
  protected readonly sinTransicion = signal(false);

  protected readonly codigoLoginActivo = signal<CodigoTemaLogin>('lateral');
  protected readonly codigoPaginaActivo = signal<TemaPagina>('clasico');

  private marcaActual: MarcaDeEmpresa | null = null;

  protected readonly form = this.fb.nonNullable.group({
    urlLogo: [''],
    ajusteLogo: [1],
    colorPrimario: ['', [Validators.pattern(FORMATO_HEX)]],
    colorSecundario: ['', [Validators.pattern(FORMATO_HEX)]],
    dominioPropio: [''],
  });

  ngOnInit(): void {
    this.cargar();
    // El menu real (sidebar/header, ver ShellComponent) se pinta en vivo con
    // cualquier color que se pruebe aca, incluso antes de guardar -- asi el
    // usuario ve el efecto en toda la plataforma, no solo en la tarjeta de
    // "Vista previa" aislada.
    this.form.get('colorPrimario')!.valueChanges.subscribe(() => this.actualizarVistaPreviaMenu());
    this.form.get('colorSecundario')!.valueChanges.subscribe(() => this.actualizarVistaPreviaMenu());
  }

  ngOnDestroy(): void {
    // Si el usuario se va sin guardar, el menu real vuelve al color
    // realmente guardado -- no debe quedarse pintado con una prueba que
    // nunca se confirmo. Si ya guardo (form === marcaActual), se deja la
    // vista previa puesta: es identica a lo guardado y evita un parpadeo de
    // vuelta al color viejo mientras el Shell no vuelve a cargar desde el
    // backend.
    const v = this.form.getRawValue();
    const huboEdicionSinGuardar =
      (v.colorPrimario || null) !== (this.marcaActual?.colorPrimario ?? null) ||
      (v.colorSecundario || null) !== (this.marcaActual?.colorSecundario ?? null);
    if (huboEdicionSinGuardar) {
      this.vistaPreviaMarca.limpiar();
    }
  }

  private actualizarVistaPreviaMenu(): void {
    const v = this.form.getRawValue();
    this.vistaPreviaMarca.fijar(
      this.esHexValido(v.colorPrimario) ? v.colorPrimario : null,
      this.esHexValido(v.colorSecundario) ? v.colorSecundario : null,
    );
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.marcaService.obtener().subscribe({
      next: (marca: MarcaDeEmpresa) => {
        this.marcaActual = marca;
        this.form.patchValue({
          urlLogo: marca.urlLogo ?? '',
          ajusteLogo: marca.ajusteLogo ?? 1,
          colorPrimario: marca.colorPrimario ?? '',
          colorSecundario: marca.colorSecundario ?? '',
          dominioPropio: marca.dominioPropio ?? '',
        });
        const opcionLogin = OPCIONES_LOGIN.find((o) => o.numero === marca.tipoLogin);
        this.codigoLoginActivo.set(opcionLogin?.codigo ?? 'lateral');
        const opcionPagina = OPCIONES_PAGINA.find((o) => o.numero === marca.tipoPantallaPrincipal);
        this.codigoPaginaActivo.set(opcionPagina?.codigo ?? 'clasico');
        // Sincroniza la capa "anterior" del wipe con el color real recien
        // cargado -- sin esto, el primer cambio de color animaria desde el
        // azul de relleno en vez de desde el color que ya tenia la empresa.
        this.gradienteAnterior.set(this.gradienteActual());
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set('No pudimos cargar tu marca. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  onLogoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) {
      return;
    }
    if (archivo.size > MAX_LOGO_BYTES) {
      this.errorLogo.set('El logo pesa demasiado (máximo 500 KB).');
      input.value = '';
      return;
    }
    this.errorLogo.set(null);
    const lector = new FileReader();
    lector.onload = () => this.form.patchValue({ urlLogo: lector.result as string });
    lector.readAsDataURL(archivo);
  }

  quitarLogo(): void {
    this.form.patchValue({ urlLogo: '' });
    this.errorLogo.set(null);
  }

  protected ajusteCss(): 'contain' | 'cover' | 'fill' {
    const valor = this.form.value.ajusteLogo;
    return OPCIONES_AJUSTE.find((o) => o.valor === valor)?.css ?? 'contain';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const marca: MarcaDeEmpresa = {
      urlLogo: valores.urlLogo || null,
      colorPrimario: valores.colorPrimario || null,
      colorSecundario: valores.colorSecundario || null,
      dominioPropio: valores.dominioPropio || null,
      // null = "no tocar" (el backend conserva el valor que ya tenia guardado).
      tipoLogin: this.marcaActual?.tipoLogin ?? null,
      tipoPantallaPrincipal: this.marcaActual?.tipoPantallaPrincipal ?? null,
      ajusteLogo: valores.ajusteLogo || null,
    };

    this.guardando.set(true);
    this.marcaService.actualizar(marca).subscribe({
      next: () => {
        this.marcaActual = marca;
        this.guardando.set(false);
        this.snackBar.open('Marca actualizada', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.guardando.set(false);
        this.snackBar.open('No pudimos guardar los cambios. Intenta de nuevo.', 'Cerrar', { duration: 4000 });
      },
    });
  }

  elegirLogin(opcion: OpcionTemaLogin): void {
    this.guardandoLogin.set(true);
    const marca: MarcaDeEmpresa = {
      urlLogo: this.marcaActual?.urlLogo ?? null,
      colorPrimario: this.marcaActual?.colorPrimario ?? null,
      colorSecundario: this.marcaActual?.colorSecundario ?? null,
      dominioPropio: this.marcaActual?.dominioPropio ?? null,
      tipoLogin: opcion.numero,
      tipoPantallaPrincipal: this.marcaActual?.tipoPantallaPrincipal ?? null,
      ajusteLogo: this.marcaActual?.ajusteLogo ?? null,
    };
    this.marcaService.actualizar(marca).subscribe({
      next: () => {
        this.marcaActual = marca;
        this.codigoLoginActivo.set(opcion.codigo);
        this.guardandoLogin.set(false);
        this.snackBar.open(`Diseño "${opcion.nombre}" activado`, 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.guardandoLogin.set(false);
        this.snackBar.open('No se pudo guardar el diseño. Intenta de nuevo.', 'Cerrar', { duration: 4000 });
      },
    });
  }

  elegirPagina(opcion: OpcionPagina): void {
    this.guardandoPagina.set(true);
    const marca: MarcaDeEmpresa = {
      urlLogo: this.marcaActual?.urlLogo ?? null,
      colorPrimario: this.marcaActual?.colorPrimario ?? null,
      colorSecundario: this.marcaActual?.colorSecundario ?? null,
      dominioPropio: this.marcaActual?.dominioPropio ?? null,
      tipoLogin: this.marcaActual?.tipoLogin ?? null,
      tipoPantallaPrincipal: opcion.numero,
      ajusteLogo: this.marcaActual?.ajusteLogo ?? null,
    };
    this.marcaService.actualizar(marca).subscribe({
      next: () => {
        this.marcaActual = marca;
        this.codigoPaginaActivo.set(opcion.codigo);
        // Se aplica al instante en este mismo navegador (el shell, la
        // proxima vez que abra en cualquier otro, lo sincroniza desde el
        // backend -- ver ShellComponent).
        this.temaPaginaService.elegir(opcion.codigo);
        this.guardandoPagina.set(false);
        this.snackBar.open(`Diseño "${opcion.nombre}" activado`, 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.guardandoPagina.set(false);
        this.snackBar.open('No se pudo guardar el diseño. Intenta de nuevo.', 'Cerrar', { duration: 4000 });
      },
    });
  }

  elegirPaleta(paleta: PaletaPredefinida): void {
    this.gradienteAnterior.set(this.gradienteActual());
    this.form.patchValue({ colorPrimario: paleta.primario, colorSecundario: paleta.secundario });
    this.animarCambioColor();
  }

  // Se llama al soltar la barra de tono (pointerdown captura el color de
  // "antes" para que el wipe tenga de donde partir; mientras se arrastra,
  // el color cambia en vivo sin animacion -- reanimar en cada pixel se veria
  // entrecortado, no fluido).
  protected iniciarArrastreTono(): void {
    this.gradienteAnterior.set(this.gradienteActual());
  }

  protected tonoPrimario(): number {
    return hexATono(this.form.value.colorPrimario);
  }

  protected tonoSecundario(): number {
    return hexATono(this.form.value.colorSecundario);
  }

  protected onTonoPrimario(valor: string): void {
    this.form.patchValue({ colorPrimario: tonoAHex(Number(valor), SATURACION_TONO, LUMINOSIDAD_TONO) });
  }

  protected onTonoSecundario(valor: string): void {
    this.form.patchValue({ colorSecundario: tonoAHex(Number(valor), SATURACION_TONO, LUMINOSIDAD_TONO) });
  }

  // "Wipe" de abajo hacia arriba: oculta la capa nueva SIN transicion
  // (sinTransicion evita que el ocultamiento en si se anime), espera 2
  // frames para que el navegador confirme ese estado, y recien ahi reactiva
  // la transicion y revela -- de lo contrario el clip-path "rebota" en vez
  // de entrar limpio.
  protected animarCambioColor(): void {
    this.sinTransicion.set(true);
    this.revelando.set(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.sinTransicion.set(false);
        this.revelando.set(true);
      });
    });
  }

  protected esHexValido(valor: string | null | undefined): boolean {
    return !!valor && FORMATO_HEX.test(valor);
  }

  protected previewPrimario(): string {
    const valor = this.form.value.colorPrimario;
    return this.esHexValido(valor) ? (valor as string) : '#2563eb';
  }

  protected previewSecundario(): string {
    const valor = this.form.value.colorSecundario;
    return this.esHexValido(valor) ? (valor as string) : '#1e3a5f';
  }

  protected gradienteActual(): string {
    return `linear-gradient(135deg, ${this.previewSecundario()}, ${this.previewPrimario()})`;
  }

  // "Volver a los colores iniciales": deshace los cambios sin guardar de
  // esta visita a la pantalla, volviendo a lo que ya estaba guardado (no al
  // azul de la plataforma) -- con el mismo wipe animado que el resto de
  // cambios de color, para que se sienta consistente.
  protected restaurarColoresIniciales(): void {
    this.gradienteAnterior.set(this.gradienteActual());
    this.form.patchValue({
      colorPrimario: this.marcaActual?.colorPrimario ?? '',
      colorSecundario: this.marcaActual?.colorSecundario ?? '',
    });
    this.animarCambioColor();
  }
}
