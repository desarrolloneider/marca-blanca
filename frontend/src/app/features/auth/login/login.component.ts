import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { MarcaService } from '../../../core/identidad-visual/marca.service';
import { MarcaDeEmpresa } from '../../../core/identidad-visual/models';
import { BrandMarkComponent } from '../../../shared/brand/brand-mark.component';

type TemaVisual = 'lateral' | 'centrado' | 'fondo';

const CORREO_RECORDADO_KEY = 'login.correoRecordado';

// Cada empresa vive en su propio subdominio (<identificador>.localhost en
// dev, <identificador>.marca-blanca.com en prod) -- de ahi se saca a que
// empresa preguntarle el logo/colores/variante antes de que haya sesion.
// En el dominio raiz (sin subdominio, ej. la landing) no hay ninguna
// empresa que preguntar.
function identificadorDesdeSubdominio(): string | null {
  const { hostname } = globalThis.location;
  // *.onrender.com (ambiente de pruebas sin dominio propio, ver render.yaml)
  // no da subdominios por tenant -- el primer segmento ahi es el NOMBRE DEL
  // SERVICIO ("marca-blanca-frontend"), no una empresa. Tratarlo como tal
  // manda identificadorEmpresa="marca-blanca-frontend" al backend, que
  // revienta con una excepcion sin manejar (no existe esa empresa).
  if (hostname.endsWith('.onrender.com')) {
    return null;
  }
  const partes = hostname.split('.');
  return partes.length > 1 ? partes[0] : null;
}

function temaVisualDesdeCodigo(codigo: number | null | undefined): TemaVisual {
  if (codigo === 2) {
    return 'centrado';
  }
  if (codigo === 3) {
    return 'fondo';
  }
  return 'lateral';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BrandMarkComponent,
  ],
  template: `
    <!-- El formulario es idéntico en los 3 diseños; solo cambia el layout
         que lo rodea. Se define una sola vez y se reutiliza con
         ngTemplateOutlet para no triplicar los bindings del form. -->
    <ng-template #formularioTpl>
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (sinSubdominio()) {
          <!-- Solo aparece cuando no hay subdominio (ej. probando en un
               dominio sin wildcard configurado todavia, como *.onrender.com)
               -- ahi el correo solo no alcanza para saber la empresa si el
               mismo correo se uso para registrar varias (ver resolver por
               correo en submit(), que falla si es ambiguo). -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Identificador de tu empresa (opcional)</mat-label>
            <input matInput type="text" formControlName="identificadorEmpresa" autocomplete="off" />
            <mat-icon matPrefix>business</mat-icon>
            <mat-hint>Solo hace falta si tu correo se uso para mas de una empresa de prueba.</mat-hint>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Correo electrónico</mat-label>
          <input matInput type="email" formControlName="correo" autocomplete="email" />
          <mat-icon matPrefix>mail_outline</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contraseña</mat-label>
          <input
            matInput
            [type]="hidePassword() ? 'password' : 'text'"
            formControlName="contrasena"
            autocomplete="current-password"
          />
          <mat-icon matPrefix>lock_outline</mat-icon>
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hidePassword.set(!hidePassword())"
            [attr.aria-label]="'Mostrar contraseña'"
          >
            <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
        </mat-form-field>

        <label class="recordarme">
          <input type="checkbox" formControlName="recordarme" />
          Recordar mi correo
        </label>

        @if (errorMessage()) {
          <p class="error">
            <mat-icon>error_outline</mat-icon>
            {{ errorMessage() }}
          </p>
        }

        <button
          mat-flat-button
          color="primary"
          class="full-width submit-btn"
          type="submit"
          [disabled]="form.invalid || loading()"
        >
          @if (loading()) {
            <mat-spinner diameter="20" />
          } @else {
            Entrar
          }
        </button>

        @if (!marcaPublica()?.nombreEmpresa) {
          <!-- Solo tiene sentido ofrecer registro cuando NO hay una empresa
               identificada por el subdominio -- si ya es el login de una
               empresa existente, sus usuarios no necesitan "registrarla". -->
          <p class="registro-link">
            ¿Tu empresa aún no tiene cuenta?
            <a routerLink="/registro">Regístrala aquí</a>
          </p>
        }
      </form>
    </ng-template>

    <!-- El logo real de la empresa (si lo configuro) reemplaza el icono
         generico -- ver MarcaPublicaController (backend) y marcaPublica()
         aca abajo. -->
    <ng-template #logoTpl let-variante="variante">
      @if (marcaPublica()?.urlLogo; as logo) {
        <img [src]="logo" alt="" class="brand-logo-img" />
      } @else {
        <app-brand-mark class="brand-logo-icon" [variante]="variante || 'blanco'" />
      }
    </ng-template>

    @switch (temaVisual()) {
      @case ('centrado') {
        <div
          class="login-page tema-centrado"
          [style.--brand-light]="colorPrimario()"
          [style.--brand-dark]="colorSecundario()"
        >
          <div class="tarjeta-centrada">
            <div class="logo-centrado">
              <ng-container [ngTemplateOutlet]="logoTpl" [ngTemplateOutletContext]="{ variante: 'negro' }"></ng-container>
            </div>
            <h2>{{ nombreEmpresa() }}</h2>
            <p class="form-subtitle">Iniciar sesión</p>
            <ng-container [ngTemplateOutlet]="formularioTpl"></ng-container>
          </div>
        </div>
      }
      @case ('fondo') {
        <div
          class="login-page tema-fondo"
          [style.--brand-light]="colorPrimario()"
          [style.--brand-dark]="colorSecundario()"
        >
          <div class="fondo-overlay"></div>
          <div class="tarjeta-flotante">
            <div class="logo-centrado">
              <ng-container [ngTemplateOutlet]="logoTpl"></ng-container>
            </div>
            <h2>{{ nombreEmpresa() }}</h2>
            <p class="form-subtitle">Iniciar sesión</p>

            <div class="avatar-saludo">
              <span class="avatar-circulo">
                <mat-icon>person</mat-icon>
                <span class="avatar-badge">1</span>
              </span>
              <p class="saludo">Hola de nuevo,</p>
            </div>

            <ng-container [ngTemplateOutlet]="formularioTpl"></ng-container>
          </div>
        </div>
      }
      @default {
        <div
          class="login-page tema-lateral"
          [style.--brand-light]="colorPrimario()"
          [style.--brand-dark]="colorSecundario()"
        >
          <section class="brand-panel">
            <div class="brand-shape shape-a"></div>
            <div class="brand-shape shape-b"></div>

            @if (marcaPublica()?.nombreEmpresa; as nombre) {
              <!-- Empresa identificada por el subdominio: el panel es de
                   ELLA, no un aviso publicitario de la plataforma. -->
              <div class="brand-content brand-content-empresa">
                <div class="brand-logo-grande">
                  <ng-container [ngTemplateOutlet]="logoTpl"></ng-container>
                </div>
                <h1>{{ nombre }}</h1>
                <p class="brand-tagline">Inicia sesión para entrar a tu plataforma</p>
              </div>
            } @else {
              <div class="brand-content">
                <div class="brand-logo">
                  <ng-container [ngTemplateOutlet]="logoTpl"></ng-container>
                  <span>LINELCA</span>
                </div>

                <h1>Gestiona tu empresa desde un solo lugar</h1>
                <p class="brand-tagline">
                  Usuarios, módulos y comunicación omnicanal en una sola plataforma.
                </p>

                <ul class="brand-highlights">
                  <li>
                    <mat-icon>verified_user</mat-icon>
                    <span>Autenticación segura con JWT</span>
                  </li>
                  <li>
                    <mat-icon>apartment</mat-icon>
                    <span>Multi-empresa, multi-tenant</span>
                  </li>
                  <li>
                    <mat-icon>bolt</mat-icon>
                    <span>Arquitectura lista para escalar</span>
                  </li>
                </ul>
              </div>
            }
          </section>

          <section class="form-panel">
            <div class="form-wrapper">
              <a routerLink="/" class="back-link">
                <mat-icon>arrow_back</mat-icon>
                Volver al inicio
              </a>

              <h2>Iniciar sesión</h2>
              <p class="form-subtitle">Ingresa tus credenciales para continuar</p>

              <ng-container [ngTemplateOutlet]="formularioTpl"></ng-container>
            </div>
          </section>
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        --brand-dark: #1e3a5f;
        --brand-light: #2563eb;
        display: block;
      }

      .full-width {
        width: 100%;
      }

      .submit-btn {
        margin-top: 8px;
        height: 44px;
        font-size: 15px;
        background-color: var(--brand-light) !important;
      }

      .error {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #b3261e;
        font-size: 13px;
        margin: 4px 0 16px;
      }

      .error mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .registro-link {
        text-align: center;
        margin: 20px 0 0;
        font-size: 0.85rem;
        color: #64748b;
      }

      .registro-link a {
        color: var(--brand-light);
        font-weight: 600;
        text-decoration: none;
      }

      .registro-link a:hover {
        text-decoration: underline;
      }

      .recordarme {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #64748b;
        margin: 2px 0 18px;
        cursor: pointer;
        user-select: none;
      }

      .recordarme input {
        width: 16px;
        height: 16px;
        accent-color: var(--brand-light);
        cursor: pointer;
      }

      .form-subtitle {
        color: #64748b;
        margin: 0 0 32px;
        font-size: 0.95rem;
      }

      .brand-logo-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      /* ---------- Tema lateral (el original) ---------- */
      .tema-lateral {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 1.1fr 1fr;
      }

      .tema-lateral .brand-panel {
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 48px;
        background: linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-light) 100%);
        color: #fff;
      }

      .tema-lateral .brand-shape {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
      }

      .tema-lateral .shape-a {
        width: 420px;
        height: 420px;
        top: -120px;
        left: -140px;
      }

      .tema-lateral .shape-b {
        width: 300px;
        height: 300px;
        bottom: -100px;
        right: -80px;
        background: rgba(255, 255, 255, 0.06);
      }

      .tema-lateral .brand-content {
        position: relative;
        z-index: 1;
        max-width: 420px;
      }

      .tema-lateral .brand-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 48px;
        letter-spacing: 0.2px;
      }

      /* Panel personalizado cuando el subdominio identifica una empresa --
         centrado en su logo y su nombre, sin el discurso de venta generico
         de la plataforma. */
      .brand-content-empresa {
        text-align: center;
        max-width: 360px;
      }

      .brand-logo-grande {
        width: 160px;
        height: 160px;
        margin: 0 auto 28px;
        border-radius: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.14);
        overflow: hidden;
      }

      .brand-logo-grande .brand-logo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .brand-logo-grande mat-icon {
        font-size: 44px;
        width: 44px;
        height: 44px;
      }

      .brand-content-empresa h1 {
        font-size: 1.9rem;
        line-height: 1.25;
        font-weight: 800;
        margin: 0 0 10px;
      }

      .tema-lateral .brand-content h1 {
        font-size: 2.2rem;
        line-height: 1.25;
        font-weight: 700;
        margin: 0 0 16px;
      }

      .tema-lateral .brand-tagline {
        font-size: 1.05rem;
        line-height: 1.6;
        opacity: 0.9;
        margin: 0 0 40px;
      }

      .tema-lateral .brand-highlights {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .tema-lateral .brand-highlights li {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.95rem;
        opacity: 0.95;
      }

      .tema-lateral .form-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        background: #f8fafc;
      }

      .tema-lateral .form-wrapper {
        width: 100%;
        max-width: 380px;
      }

      .tema-lateral .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: #64748b;
        text-decoration: none;
        margin-bottom: 32px;
      }

      .tema-lateral .back-link:hover {
        color: var(--brand-light);
      }

      .tema-lateral .back-link mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .tema-lateral .form-wrapper h2 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 8px;
        color: #0f172a;
      }

      @media (max-width: 900px) {
        .tema-lateral {
          grid-template-columns: 1fr;
        }

        .tema-lateral .brand-panel {
          display: none;
        }

        .tema-lateral .form-panel {
          padding: 32px 20px;
        }
      }

      /* ---------- Tema centrado ---------- */
      .tema-centrado {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        padding: 24px;
      }

      .tarjeta-centrada {
        width: 100%;
        max-width: 400px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
        padding: 40px 36px;
      }

      .logo-centrado {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
      }

      .logo-centrado .brand-logo-img {
        max-height: 96px;
        max-width: 220px;
      }

      .logo-centrado .brand-logo-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--brand-dark);
      }

      .tarjeta-centrada h2 {
        text-align: center;
        font-size: 1.6rem;
        font-weight: 700;
        margin: 0 0 6px;
        color: #0f172a;
      }

      .tarjeta-centrada .form-subtitle {
        text-align: center;
      }

      /* ---------- Tema fondo -- tarjeta oscura tipo "glass" ---------- */
      .tema-fondo {
        position: relative;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: radial-gradient(circle at 15% 15%, #4c1d95 0%, transparent 45%),
          radial-gradient(circle at 85% 30%, #1d4ed8 0%, transparent 50%),
          linear-gradient(160deg, #05030f 0%, #0f0a24 55%, #1a1035 100%);
        overflow: hidden;
      }

      .fondo-overlay {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 20% 80%, rgba(124, 58, 237, 0.18), transparent 55%),
          radial-gradient(circle at 80% 15%, rgba(37, 99, 235, 0.18), transparent 50%);
      }

      .tarjeta-flotante {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 400px;
        background: rgba(30, 27, 60, 0.55);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
        padding: 40px 36px;
        color: #e2e8f0;
      }

      .tarjeta-flotante h2 {
        text-align: center;
        font-size: 1.6rem;
        font-weight: 700;
        margin: 0 0 2px;
        color: #f8fafc;
      }

      .tarjeta-flotante .form-subtitle {
        text-align: center;
        color: #94a3b8;
        margin: 0 0 24px;
      }

      .avatar-saludo {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
      }

      .avatar-circulo {
        position: relative;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #7c3aed, #2563eb);
        margin-bottom: 10px;
      }

      .avatar-circulo mat-icon {
        color: #fff;
        font-size: 26px;
        width: 26px;
        height: 26px;
      }

      .avatar-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ef4444;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #1e1b3c;
      }

      .tema-fondo .saludo {
        margin: 0;
        font-size: 0.95rem;
        color: #cbd5e1;
      }

      .tema-fondo .recordarme,
      .tema-fondo .registro-link {
        color: #94a3b8;
      }

      .tema-fondo .registro-link a {
        color: #93c5fd;
      }

      .tema-fondo .brand-logo-icon {
        color: #f8fafc;
      }

      /* Los form-field de Material renderizan su DOM interno fuera del
         encapsulamiento del componente -- ::ng-deep es la unica forma de
         oscurecerlos para que calcen con la tarjeta de vidrio. */
      .tema-fondo ::ng-deep .mat-mdc-text-field-wrapper {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 12px;
      }

      .tema-fondo ::ng-deep .mdc-notched-outline__leading,
      .tema-fondo ::ng-deep .mdc-notched-outline__notch,
      .tema-fondo ::ng-deep .mdc-notched-outline__trailing {
        border-color: rgba(255, 255, 255, 0.15) !important;
      }

      .tema-fondo ::ng-deep .mat-mdc-form-field-input-control,
      .tema-fondo ::ng-deep input {
        color: #f1f5f9 !important;
        caret-color: #f1f5f9;
      }

      .tema-fondo ::ng-deep .mat-mdc-form-field-icon-prefix mat-icon,
      .tema-fondo ::ng-deep .mat-mdc-form-field-icon-suffix mat-icon,
      .tema-fondo ::ng-deep mat-label {
        color: #94a3b8 !important;
      }

      .tema-fondo .submit-btn {
        background: linear-gradient(90deg, #7c3aed, #2563eb) !important;
        border-radius: 12px;
      }

      .brand-logo-img {
        max-height: 32px;
        max-width: 140px;
        object-fit: contain;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly marcaService = inject(MarcaService);

  protected readonly loading = signal(false);
  protected readonly hidePassword = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  // Logo/colores/variante reales de la empresa del subdominio -- lo que se
  // eligio en "Experiencia de acceso" ya con la empresa activa. Si no hay
  // subdominio (ej. dominio raiz) o la empresa no ha configurado nada
  // todavia, se ve el diseno generico de siempre.
  protected readonly marcaPublica = signal<MarcaDeEmpresa | null>(null);
  protected readonly temaVisual = computed(() => temaVisualDesdeCodigo(this.marcaPublica()?.tipoLogin));
  protected readonly colorPrimario = computed(() => this.marcaPublica()?.colorPrimario || undefined);
  protected readonly colorSecundario = computed(() => this.marcaPublica()?.colorSecundario || undefined);
  protected readonly nombreEmpresa = computed(() => this.marcaPublica()?.nombreEmpresa || 'LINELCA');

  protected readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required]],
    recordarme: [false],
    identificadorEmpresa: [''],
  });

  // true cuando no hay subdominio de empresa (ver identificadorDesdeSubdominio) --
  // ahi se muestra el campo manual de identificador, porque el resolver por
  // correo solo funciona si el correo pertenece a una unica empresa activa.
  protected readonly sinSubdominio = signal(identificadorDesdeSubdominio() === null);

  constructor() {
    const identificador = identificadorDesdeSubdominio();
    if (identificador) {
      this.marcaService.obtenerPublica(identificador).subscribe({
        next: (marca) => this.marcaPublica.set(marca),
        // Sin marca configurada (empresa nueva) o el identificador no existe
        // todavia -- se queda con el diseno generico, no es un error visible.
        error: () => this.marcaPublica.set(null),
      });
    }

    // No se guarda la contraseña en ningun lado -- solo el correo, para no
    // tener que volver a escribirlo cada vez. Guardar la contrasena en
    // localStorage seria un riesgo de seguridad real sin ganancia real de UX.
    const correoRecordado = localStorage.getItem(CORREO_RECORDADO_KEY);
    if (correoRecordado) {
      this.form.patchValue({ correo: correoRecordado, recordarme: true });
    }
  }

  // El usuario ya no escribe a que empresa pertenece. Si esta entrando desde
  // el subdominio de una empresa (el caso normal: cada empresa vive en el
  // suyo), esa es la empresa -- ni falta preguntarle al backend. Solo se usa
  // el resolver por correo (que puede fallar si el mismo correo existe en
  // mas de una empresa activa, caso ambiguo) cuando no hay subdominio, ej.
  // una pantalla de login generica en el dominio raiz.
  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const { correo, contrasena, recordarme, identificadorEmpresa } = this.form.getRawValue();
    const identificadorResuelto = identificadorDesdeSubdominio() || identificadorEmpresa.trim() || null;
    const identificadorEmpresa$ = identificadorResuelto
      ? of({ identificadorEmpresa: identificadorResuelto })
      : this.auth.resolverIdentificadorEmpresa(correo);

    identificadorEmpresa$
      .pipe(
        switchMap(({ identificadorEmpresa }) => this.auth.login({ correo, contrasena, identificadorEmpresa })),
      )
      .subscribe({
        next: () => {
          if (recordarme) {
            localStorage.setItem(CORREO_RECORDADO_KEY, correo);
          } else {
            localStorage.removeItem(CORREO_RECORDADO_KEY);
          }
          this.router.navigateByUrl(this.auth.debeCambiarContrasena() ? '/cambiar-contrasena' : '/mis-modulos');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.mensajeDeError(error));
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }

  // Antes se mostraba siempre el mismo texto generico sin importar la causa
  // real (contraseña incorrecta, cuenta bloqueada por intentos fallidos,
  // correo no encontrado...) -- eso hacia imposible diagnosticar un login
  // que falla sin abrir las herramientas de desarrollador. El backend ya
  // manda un mensaje especifico (ErrorResponse.mensaje); se muestra tal
  // cual cuando existe, y solo se cae al generico si de verdad no vino nada.
  private mensajeDeError(error: HttpErrorResponse): string {
    if (error.status === 404) {
      // El resolver correo->empresa solo mira empresas ACTIVAS y, por privacidad,
      // trata "no existe", "ambiguo" y "empresa suspendida" igual. El mensaje lo
      // refleja sin confirmar si la cuenta existe.
      return 'No encontramos una empresa activa para ese correo. Si tu empresa fue suspendida, escribe a soporte.';
    }
    const mensaje = (error.error as { mensaje?: string } | null)?.mensaje;
    return mensaje || 'Correo o contraseña incorrectos';
  }
}
