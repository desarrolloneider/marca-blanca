import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MarcaService } from '../../../../core/identidad-visual/marca.service';
import { MarcaDeEmpresa } from '../../../../core/identidad-visual/models';
import { TemaPaginaService, TemaPagina } from '../../../../core/temas/tema-pagina.service';

const FORMATO_HEX = /^#[0-9A-Fa-f]{6}$/;
// El backend todavia no tiene subida real de logos -- solo guarda una URL
// (columna VARCHAR(500)). Un data: URL (lo que sale de "elegir archivo" en
// el navegador) facilmente pasa de varios KB, rompe esa columna, y ademas
// no es lo que este campo espera semanticamente (una URL, no el archivo).
function noEsDataUrlValidator(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string | null;
  return valor?.trim().toLowerCase().startsWith('data:') ? { esDataUrl: true } : null;
}

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
  { codigo: 'clasico', numero: 1, nombre: 'Clásico', descripcion: 'El espaciado y densidad actuales de la plataforma.' },
  { codigo: 'compacto', numero: 2, nombre: 'Compacto', descripcion: 'Menos espacio entre elementos, más contenido visible.' },
  { codigo: 'amplio', numero: 3, nombre: 'Amplio', descripcion: 'Más aire entre secciones, tipografía más grande.' },
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
              <mat-form-field appearance="outline">
                <mat-label>URL del logo</mat-label>
                <input matInput formControlName="urlLogo" placeholder="https://mi-empresa.com/logo.png" />
                <mat-icon matPrefix>image</mat-icon>
              </mat-form-field>
              @if (form.get('urlLogo')?.hasError('esDataUrl')) {
                <p class="field-error">
                  Todavía no soportamos subir el archivo directamente: pega la URL de una imagen ya
                  publicada en internet (ej. la que te da tu servicio de hosting de imágenes), no el
                  archivo en sí.
                </p>
              }

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

              <mat-form-field appearance="outline">
                <mat-label>Dominio propio</mat-label>
                <input matInput formControlName="dominioPropio" placeholder="app.mi-empresa.com" />
                <mat-icon matPrefix>public</mat-icon>
              </mat-form-field>

              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || guardando()">
                @if (guardando()) {
                  <mat-spinner diameter="18"></mat-spinner>
                } @else {
                  <span>Guardar cambios</span>
                }
              </button>
            </form>

            <aside class="marca-preview" [style.--color-primario]="previewPrimario()" [style.--color-secundario]="previewSecundario()">
              <p class="preview-label">Vista previa</p>
              <div class="preview-card">
                <div class="preview-header">
                  @if (form.value.urlLogo) {
                    <img [src]="form.value.urlLogo" alt="Logo de la empresa" (error)="logoConError.set(true)" />
                  } @else {
                    <mat-icon>image</mat-icon>
                  }
                </div>
                <button class="preview-btn" type="button">Botón de ejemplo</button>
                <p class="preview-domain">
                  <mat-icon inline>public</mat-icon>
                  {{ form.value.dominioPropio || 'app.tu-empresa.com' }}
                </p>
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

        <!-- DENSIDAD DE PÁGINAS -->
        <section class="tarjeta">
          <h2><span class="h2-icono verde"><mat-icon>view_agenda</mat-icon></span>Densidad de las páginas</h2>
          <p class="hint">Cuánto espacio dejar entre elementos en el resto de la plataforma (menú, listados, etc.).</p>

          <div class="temas-grid" [style.--acento]="previewPrimario()" [style.--acento-oscuro]="previewSecundario()">
            @for (opcion of opcionesPagina; track opcion.codigo) {
              <div class="tema-card" [class.tema-card-activa]="codigoPaginaActivo() === opcion.codigo">
                <div class="preview preview-pagina" [class]="'preview-pagina-' + opcion.codigo">
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
                    Usar esta densidad
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

    .field-error {
      margin: -8px 0 8px;
      font-size: 12px;
      color: #dc2626;
    }

    button[type='submit'] {
      align-self: flex-start;
      margin-top: 12px;
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
      background: linear-gradient(135deg, var(--color-secundario, #1e3a5f), var(--color-primario, #2563eb));
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      color: #fff;
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
      color: var(--color-primario, #2563eb);
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-weight: 600;
      cursor: default;
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

    /* Densidad simulada variando el gap/tamano de las filas -- mismo criterio
       visual que aplicaria TemaPaginaService si algun dia se conecta de
       verdad al resto del layout (ver el comentario en ese servicio). */
    .preview-pagina-compacto .preview-pagina-contenido { gap: 6px; }
    .preview-pagina-compacto .preview-pagina-card { height: 22px; }
    .preview-pagina-amplio .preview-pagina-contenido { gap: 18px; padding: 20px; }
    .preview-pagina-amplio .preview-pagina-card { height: 38px; }
    .preview-pagina-amplio .preview-pagina-barra.grande { height: 15px; }
  `],
})
export class MiMarcaComponent implements OnInit {
  private readonly marcaService = inject(MarcaService);
  private readonly temaPaginaService = inject(TemaPaginaService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly opcionesLogin = OPCIONES_LOGIN;
  protected readonly opcionesPagina = OPCIONES_PAGINA;

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly guardandoLogin = signal(false);
  protected readonly guardandoPagina = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly logoConError = signal(false);

  protected readonly codigoLoginActivo = signal<CodigoTemaLogin>('lateral');
  protected readonly codigoPaginaActivo = signal<TemaPagina>('clasico');

  private marcaActual: MarcaDeEmpresa | null = null;

  protected readonly form = this.fb.nonNullable.group({
    urlLogo: ['', [noEsDataUrlValidator]],
    colorPrimario: ['', [Validators.pattern(FORMATO_HEX)]],
    colorSecundario: ['', [Validators.pattern(FORMATO_HEX)]],
    dominioPropio: [''],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.marcaService.obtener().subscribe({
      next: (marca: MarcaDeEmpresa) => {
        this.marcaActual = marca;
        this.form.patchValue({
          urlLogo: marca.urlLogo ?? '',
          colorPrimario: marca.colorPrimario ?? '',
          colorSecundario: marca.colorSecundario ?? '',
          dominioPropio: marca.dominioPropio ?? '',
        });
        const opcionLogin = OPCIONES_LOGIN.find((o) => o.numero === marca.tipoLogin);
        this.codigoLoginActivo.set(opcionLogin?.codigo ?? 'lateral');
        const opcionPagina = OPCIONES_PAGINA.find((o) => o.numero === marca.tipoPantallaPrincipal);
        this.codigoPaginaActivo.set(opcionPagina?.codigo ?? 'clasico');
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set('No pudimos cargar tu marca. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
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
        this.snackBar.open(`Densidad "${opcion.nombre}" activada`, 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.guardandoPagina.set(false);
        this.snackBar.open('No se pudo guardar la densidad. Intenta de nuevo.', 'Cerrar', { duration: 4000 });
      },
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
}
