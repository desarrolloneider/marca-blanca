import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsolaAuthService } from '../../../core/consola/consola-auth.service';

/**
 * Login de la consola de operacion de GuajiraNet. NO se tematiza por empresa: es
 * la herramienta interna, no una pantalla de cliente. Solo pide correo y
 * contrasena -- el operador no pertenece a ninguna empresa.
 */
@Component({
  selector: 'app-consola-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="pagina">
      <div class="glow g1"></div>
      <div class="glow g2"></div>

      <div class="tarjeta">
        <a routerLink="/" class="volver">
          <mat-icon>arrow_back</mat-icon>
          Volver al inicio
        </a>

        <div class="marca">
          <div class="marca-icono"><mat-icon>shield_person</mat-icon></div>
          <div>
            <strong>Consola de operación</strong>
            <span>Portal GuajiraNet</span>
          </div>
        </div>

        <div class="restringido"><mat-icon>lock</mat-icon>Acceso restringido</div>
        <h1>Acceso de operador</h1>
        <p class="sub">Solo personal de la plataforma. El acceso queda registrado.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="ancho">
            <mat-label>Correo</mat-label>
            <input matInput type="email" formControlName="correo" autocomplete="username" />
            <mat-icon matPrefix>mail_outline</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="ancho">
            <mat-label>Contraseña</mat-label>
            <input
              matInput
              [type]="verClave() ? 'text' : 'password'"
              formControlName="contrasena"
              autocomplete="current-password"
            />
            <mat-icon matPrefix>lock_outline</mat-icon>
            <button
              mat-icon-button
              matSuffix
              type="button"
              [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              (click)="verClave.set(!verClave())"
            >
              <mat-icon>{{ verClave() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          @if (error()) {
            <p class="error"><mat-icon>error_outline</mat-icon>{{ error() }}</p>
          }

          <button
            mat-flat-button
            color="primary"
            class="ancho enviar"
            type="submit"
            [disabled]="form.invalid || cargando()"
          >
            @if (cargando()) {
              <mat-spinner diameter="20" />
            } @else {
              Entrar
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .pagina {
        position: relative;
        overflow: hidden;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: radial-gradient(circle at 20% 20%, #0e2a3d 0%, transparent 45%),
          radial-gradient(circle at 85% 80%, #0e3a4a 0%, transparent 50%),
          #0a1220;
      }

      .glow {
        position: absolute;
        border-radius: 50%;
        filter: blur(70px);
        opacity: .3;
        pointer-events: none;
        animation: flotar 9s ease-in-out infinite;
      }
      .glow.g1 { width: 380px; height: 380px; top: -120px; left: -120px; background: #0e7490; }
      .glow.g2 { width: 340px; height: 340px; bottom: -140px; right: -100px; background: #0369a1; animation-delay: -4.5s; }

      @keyframes flotar {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-18px); }
      }

      @keyframes entrada {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .tarjeta {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 380px;
        background: #fff;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 24px 60px rgba(2, 6, 23, 0.45);
        padding: 36px 32px;
        animation: entrada .55s cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .marca {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .marca-icono {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #0e7490, #0369a1);
        flex-shrink: 0;
      }

      .marca-icono mat-icon {
        color: #fff;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .marca strong {
        display: block;
        font-size: 0.95rem;
        color: #0f172a;
        letter-spacing: 0.2px;
      }

      .marca span {
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .restringido {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 999px;
        background: #f0fdfa;
        color: #0e7490;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
        margin-bottom: 14px;
      }

      .restringido mat-icon {
        font-size: 13px;
        width: 13px;
        height: 13px;
      }

      h1 {
        font-size: 1.4rem;
        font-weight: 700;
        margin: 0 0 4px;
        color: #0f172a;
      }

      .sub {
        margin: 0 0 24px;
        font-size: 0.9rem;
        color: #64748b;
      }

      .ancho {
        width: 100%;
      }

      .enviar {
        height: 44px;
        margin-top: 4px;
        background-color: #0e7490 !important;
      }

      .error {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #b3261e;
        font-size: 13px;
        margin: 0 0 14px;
      }

      .volver {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 20px;
        font-size: 0.85rem;
        color: #64748b;
        text-decoration: none;
      }

      .volver:hover {
        color: #0e7490;
      }

      .volver:focus-visible {
        outline: 2px solid #0e7490;
        outline-offset: 2px;
        border-radius: 4px;
      }

      .volver mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .error mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      @media (prefers-reduced-motion: reduce) {
        .glow { animation: none; }
        .tarjeta { animation: none; }
      }
    `,
  ],
})
export class ConsolaLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly consolaAuth = inject(ConsolaAuthService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(false);
  protected readonly verClave = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    this.consolaAuth.login(this.form.getRawValue()).subscribe({
      next: (res) =>
        this.router.navigateByUrl(res.debeCambiarContrasena ? '/consola/cambiar-contrasena' : '/consola'),
      error: (e: HttpErrorResponse) => {
        this.error.set(this.mensaje(e));
        this.cargando.set(false);
      },
      complete: () => this.cargando.set(false),
    });
  }

  private mensaje(e: HttpErrorResponse): string {
    if (e.status === 0) {
      return 'No hay conexión con el servidor.';
    }
    if (e.status === 403) {
      return 'La cuenta de operador está inactiva.';
    }
    const backend = (e.error as { mensaje?: string } | null)?.mensaje;
    return backend || 'Correo o contraseña incorrectos.';
  }
}
