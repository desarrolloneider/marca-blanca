import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';

function contrasenasCoincidenValidator(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('contrasenaNueva')?.value;
  const confirmacion = control.get('confirmacion')?.value;
  return nueva && confirmacion && nueva !== confirmacion ? { noCoinciden: true } : null;
}

// Checklist de requisitos que se muestra en vivo mientras el usuario escribe
// (en vez de solo rechazar el submit con un mensaje generico) -- cada regla
// se evalua por separado para poder pintar cual falta todavia.
interface ReglaContrasena {
  clave: string;
  etiqueta: string;
  cumple: (valor: string) => boolean;
}
const REGLAS_CONTRASENA: ReglaContrasena[] = [
  { clave: 'longitud', etiqueta: 'Al menos 8 caracteres', cumple: (v) => v.length >= 8 },
  { clave: 'mayuscula', etiqueta: 'Una letra mayúscula', cumple: (v) => /[A-Z]/.test(v) },
  { clave: 'minuscula', etiqueta: 'Una letra minúscula', cumple: (v) => /[a-z]/.test(v) },
  { clave: 'numero', etiqueta: 'Un número', cumple: (v) => /[0-9]/.test(v) },
  { clave: 'especial', etiqueta: 'Un carácter especial (!@#$...)', cumple: (v) => /[^A-Za-z0-9]/.test(v) },
];

function requisitosContrasenaValidator(control: AbstractControl): ValidationErrors | null {
  const valor = (control.value as string) ?? '';
  const faltantes = REGLAS_CONTRASENA.filter((r) => !r.cumple(valor)).map((r) => r.clave);
  return faltantes.length > 0 ? { requisitos: faltantes } : null;
}

// Pantalla obligatoria despues del primer login con la contraseña temporal
// enviada por correo (backend: LoginResponse.debeCambiarContrasena). Mientras
// no se llame POST /auth/cambiar-contrasena, JwtAuthFilter bloquea cualquier
// otra ruta protegida -- por eso el guard (cambiar-contrasena.guard.ts) manda
// aqui antes que a cualquier otra pantalla.
@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="pagina">
      <div class="tarjeta">
        <mat-icon class="icono">lock_reset</mat-icon>
        <h1>Crea tu contraseña definitiva</h1>
        <p class="subtitulo">
          Iniciaste sesión con la contraseña temporal que te enviamos por correo. Por seguridad,
          antes de continuar debes reemplazarla por una propia.
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contraseña temporal</mat-label>
            <input matInput type="password" formControlName="contrasenaActual" autocomplete="current-password" />
            <mat-icon matPrefix>lock_outline</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contraseña nueva</mat-label>
            <input matInput type="password" formControlName="contrasenaNueva" autocomplete="new-password" />
            <mat-icon matPrefix>lock</mat-icon>
          </mat-form-field>
          <ul class="checklist-contrasena">
            @for (regla of reglasContrasena; track regla.clave) {
              <li [class.cumplida]="cumpleRegla(regla)">
                <mat-icon inline>{{ cumpleRegla(regla) ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                {{ regla.etiqueta }}
              </li>
            }
          </ul>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirmar contraseña nueva</mat-label>
            <input matInput type="password" formControlName="confirmacion" autocomplete="new-password" />
            <mat-icon matPrefix>lock</mat-icon>
          </mat-form-field>

          @if (form.errors?.['noCoinciden'] && form.controls.confirmacion.touched) {
            <p class="error-texto">Las contraseñas no coinciden.</p>
          }
          @if (errorMensaje()) {
            <p class="error-texto">{{ errorMensaje() }}</p>
          }

          <button
            mat-flat-button
            color="primary"
            class="full-width submit-btn"
            type="submit"
            [disabled]="form.invalid || enviando()"
          >
            @if (enviando()) {
              <mat-spinner diameter="20" />
            } @else {
              Guardar y continuar
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
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: radial-gradient(circle at 20% -10%, #1e293b 0%, #0f172a 55%, #0b1120 100%);
      }

      .tarjeta {
        width: 100%;
        max-width: 420px;
        padding: 32px 36px 40px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 24px 60px rgba(0, 0, 0, 0.45);
        text-align: center;
      }

      .icono {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #2563eb;
        margin-bottom: 8px;
      }

      h1 {
        font-size: 1.4rem;
        font-weight: 700;
        margin: 0 0 8px;
        color: #0f172a;
      }

      .subtitulo {
        color: #64748b;
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0 0 24px;
        text-align: left;
      }

      form {
        text-align: left;
      }

      .full-width {
        width: 100%;
      }

      .campo-hint {
        margin: -12px 0 12px;
        font-size: 0.78rem;
        color: #94a3b8;
      }

      .checklist-contrasena {
        list-style: none;
        margin: -10px 0 14px;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .checklist-contrasena li {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.78rem;
        color: #94a3b8;
      }

      .checklist-contrasena li.cumplida {
        color: #16a34a;
      }

      .checklist-contrasena mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }

      .error-texto {
        margin: 0 0 12px;
        font-size: 0.82rem;
        color: #dc2626;
      }

      .submit-btn {
        margin-top: 8px;
        height: 44px;
        font-size: 15px;
      }
    `,
  ],
})
export class CambiarContrasenaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly enviando = signal(false);
  protected readonly errorMensaje = signal<string | null>(null);
  protected readonly reglasContrasena = REGLAS_CONTRASENA;

  protected cumpleRegla(regla: ReglaContrasena): boolean {
    return regla.cumple(this.form.controls.contrasenaNueva.value);
  }

  protected readonly form = this.fb.nonNullable.group(
    {
      contrasenaActual: ['', [Validators.required]],
      contrasenaNueva: ['', [Validators.required, requisitosContrasenaValidator]],
      confirmacion: ['', [Validators.required]],
    },
    { validators: contrasenasCoincidenValidator },
  );

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.enviando.set(true);
    this.errorMensaje.set(null);

    const { contrasenaActual, contrasenaNueva } = this.form.getRawValue();
    this.auth
      .cambiarContrasena({ contrasenaActual, contrasenaNueva })
      // El token actual ya quedo firmado con pwd_temp=true -- eso no cambia
      // solo porque el backend acepto la contraseña nueva. Sin renovar aca,
      // un refresh de pagina volvia a leer ese claim viejo del token
      // guardado y mandaba otra vez a esta misma pantalla en bucle.
      .pipe(switchMap(() => this.auth.refresh()))
      .subscribe({
        next: () => this.router.navigateByUrl('/mis-modulos'),
        error: (error: HttpErrorResponse) => {
          this.enviando.set(false);
          this.errorMensaje.set(
            error.status === 401 || error.status === 400
              ? 'La contraseña temporal no es correcta.'
              : 'No se pudo cambiar la contraseña. Intenta de nuevo.',
          );
      },
    });
  }
}
