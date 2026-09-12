import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConsolaEmpresasService } from '../../../core/consola/consola-empresas.service';
import { EmpresaDetalle, ModuloDetalle, OmnicanalDetalle } from '../../../core/consola/empresa-detalle.models';

const TIPOS_LOGIN = [
  { valor: 1, etiqueta: 'Lateral' },
  { valor: 2, etiqueta: 'Centrado' },
  { valor: 3, etiqueta: 'Fondo' },
];
const TIPOS_PANTALLA = [
  { valor: 1, etiqueta: 'Opción 1' },
  { valor: 2, etiqueta: 'Opción 2' },
  { valor: 3, etiqueta: 'Opción 3' },
];

/**
 * Detalle / edición de una empresa desde la consola (Fase 3). Tres secciones que
 * guardan por separado: Datos, Marca, Módulos. identificador y dominio son solo
 * lectura (nombran la base física).
 */
@Component({
  selector: 'app-consola-empresa-detalle',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="marco">
      <a routerLink="/consola" class="volver"><mat-icon>arrow_back</mat-icon> Empresas</a>

      @if (cargando()) {
        <mat-progress-bar mode="indeterminate" />
      }
      @if (errorCarga()) {
        <p class="error"><mat-icon>error_outline</mat-icon>{{ errorCarga() }}</p>
      }

      @if (empresa(); as e) {
        <header>
          <div class="avatar-header">{{ e.nombreLegal.charAt(0) }}</div>
          <div>
            <h1>{{ e.nombreLegal }}</h1>
            <p class="ident">
              {{ e.identificador }} · {{ e.dominio }} ·
              <span class="chip" [attr.data-estado]="e.estado">{{ e.estado }}</span>
            </p>
          </div>
        </header>

        <div class="columnas">
          <div class="columna">
            <!-- DATOS -->
            <section class="tarjeta">
              <h2><span class="h2-icono azul"><mat-icon>badge</mat-icon></span>Datos de contacto</h2>
              <p class="hint">
                El correo de acá es el de contacto (facturación y avisos de la plataforma). No cambia el
                correo con el que inician sesión los usuarios de la empresa.
              </p>
              <form [formGroup]="datosForm" (ngSubmit)="guardarDatos()">
                <div class="grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Nombre legal</mat-label>
                    <input matInput formControlName="nombreLegal" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Representante legal</mat-label>
                    <input matInput formControlName="representanteLegal" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Correo de contacto</mat-label>
                    <input matInput type="email" formControlName="correo" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Teléfono</mat-label>
                    <input matInput formControlName="telefono" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="ancho">
                    <mat-label>Sitio web</mat-label>
                    <input matInput formControlName="sitioWeb" />
                  </mat-form-field>
                </div>
                <button mat-flat-button color="primary" type="submit" [disabled]="datosForm.invalid || guardando() === 'datos'">
                  Guardar datos
                </button>
              </form>
            </section>

            <!-- MÓDULOS -->
            <section class="tarjeta">
              <h2><span class="h2-icono verde"><mat-icon>extension</mat-icon></span>Módulos</h2>
              @if (modulos().length === 0) {
                <p class="vacio">No hay módulos en el catálogo.</p>
              }
              <ul class="modulos">
                @for (m of modulos(); track m.codigo) {
                  <li [class.activo]="m.activo">
                    <div class="modulo-icono" [class.activo]="m.activo"><mat-icon>{{ m.activo ? 'check' : 'power_settings_new' }}</mat-icon></div>
                    <div>
                      <span class="nombre">{{ m.nombre }}</span>
                      <span class="codigo">{{ m.codigo }}</span>
                    </div>
                    <mat-slide-toggle
                      [checked]="m.activo"
                      [disabled]="moduloOcupado() === m.codigo"
                      (change)="alternarModulo(m, $event.checked)"
                    />
                  </li>
                }
              </ul>
            </section>
          </div>

          <div class="columna">
            <!-- MARCA -->
            <section class="tarjeta">
              <h2><span class="h2-icono violeta"><mat-icon>palette</mat-icon></span>Marca</h2>
              <form [formGroup]="marcaForm" (ngSubmit)="guardarMarca()">
                <div class="grid">
                  <label class="color">
                    Color primario
                    <input type="color" formControlName="colorPrimario" />
                  </label>
                  <label class="color">
                    Color secundario
                    <input type="color" formControlName="colorSecundario" />
                  </label>
                  <mat-form-field appearance="outline" class="ancho">
                    <mat-label>URL del logo</mat-label>
                    <input matInput formControlName="urlLogo" placeholder="https://…" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Tipo de login</mat-label>
                    <mat-select formControlName="tipoLogin">
                      @for (t of tiposLogin; track t.valor) {
                        <mat-option [value]="t.valor">{{ t.etiqueta }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Pantalla principal</mat-label>
                    <mat-select formControlName="tipoPantallaPrincipal">
                      @for (t of tiposPantalla; track t.valor) {
                        <mat-option [value]="t.valor">{{ t.etiqueta }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
                <button mat-flat-button color="primary" type="submit" [disabled]="guardando() === 'marca'">
                  Guardar marca
                </button>
              </form>
            </section>

            <!-- OMNICANAL (LIWA) -- solo el super admin ve/toca esto. El tenant
                 ni siquiera tiene el toggle de IA en su propia pantalla de
                 configuracion (se le oculto: viene con default de plataforma). -->
            <section class="tarjeta tarjeta-sensible">
              <h2><span class="h2-icono ambar"><mat-icon>admin_panel_settings</mat-icon></span>Omnicanal (Liwa)</h2>
              @if (cargandoOmnicanal()) {
                <p class="hint">Cargando…</p>
              } @else if (omnicanal(); as o) {
                <p class="hint">
                  El analisis con IA y el secreto del webhook son de control exclusivo del super admin -- la
                  empresa no puede cambiarlos desde su propia pantalla de configuracion.
                </p>
                <div class="fila-ia">
                  <mat-slide-toggle [checked]="o.iaHabilitada" [disabled]="guardandoIa()" (change)="alternarIa($event.checked)">
                    Analizar conversaciones con IA
                  </mat-slide-toggle>
                </div>
                <div class="grid">
                  <mat-form-field appearance="outline" class="ancho">
                    <mat-label>URL del webhook</mat-label>
                    <input matInput [value]="o.webhookUrl" readonly />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="ancho">
                    <mat-label>Secreto del webhook</mat-label>
                    <input matInput [value]="o.webhookSecret ?? '••••••••  (rota para verlo)'" readonly />
                  </mat-form-field>
                </div>
                <button mat-stroked-button type="button" [disabled]="rotandoSecreto()" (click)="rotarSecreto()">
                  <mat-icon>autorenew</mat-icon>
                  Rotar secreto del webhook
                </button>
                <p class="hint aviso">Rotar el secreto invalida el anterior de inmediato -- hay que actualizarlo en Liwa.</p>
              }
            </section>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; min-height: 100vh; background: #f1f5f9; }
      .marco { max-width: 1280px; margin: 0 auto; padding: 24px; }

      .columnas {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: start;
        margin-top: 16px;
      }
      .columna {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .columna .tarjeta { margin-top: 0; }

      .volver {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: #475569;
        text-decoration: none;
        margin-bottom: 16px;
      }
      .volver mat-icon { font-size: 18px; width: 18px; height: 18px; }

      header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
      .avatar-header {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        background: linear-gradient(135deg, #22d3ee, #0e7490);
        color: #fff;
        font-weight: 800;
        font-size: 1.3rem;
        text-transform: uppercase;
      }
      h1 { font-size: 1.35rem; font-weight: 700; margin: 0; color: #0f172a; }
      .ident { margin: 4px 0 0; font-size: 0.82rem; color: #64748b; }
      .chip {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        padding: 2px 9px;
        border-radius: 999px;
        background: #e2e8f0;
        color: #334155;
      }
      .chip[data-estado='activa'] { background: #dcfce7; color: #166534; }
      .chip[data-estado='suspendida'] { background: #fee2e2; color: #991b1b; }
      .chip[data-estado='pendiente_aprovisionamiento'] { background: #fef9c3; color: #854d0e; }
      .chip[data-estado='borrador'] { background: #e0e7ff; color: #3730a3; }

      .tarjeta {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 20px 22px;
        margin-top: 16px;
        box-shadow: 0 6px 18px rgba(15, 23, 42, .03);
      }
      .tarjeta-sensible {
        border-color: #fde68a;
        background: linear-gradient(180deg, #fffbeb 0%, #fff 90px);
      }
      h2 { display: flex; align-items: center; gap: 10px; font-size: 1.05rem; font-weight: 700; margin: 0 0 14px; color: #0f172a; }
      .h2-icono {
        width: 30px;
        height: 30px;
        border-radius: 9px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }
      .h2-icono mat-icon { color: #fff; font-size: 17px; width: 17px; height: 17px; }
      .h2-icono.azul { background: linear-gradient(135deg, #38bdf8, #2563eb); }
      .h2-icono.violeta { background: linear-gradient(135deg, #a855f7, #7c3aed); }
      .h2-icono.verde { background: linear-gradient(135deg, #34d399, #059669); }
      .h2-icono.ambar { background: linear-gradient(135deg, #fbbf24, #d97706); }
      .hint { margin: -6px 0 16px; font-size: 0.82rem; color: #64748b; line-height: 1.5; }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px 16px;
      }
      .ancho { grid-column: 1 / -1; }
      mat-form-field { width: 100%; }

      .color {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.78rem;
        color: #475569;
        padding: 4px 0 12px;
      }
      .color input[type='color'] {
        width: 100%;
        height: 40px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: none;
        cursor: pointer;
      }

      .modulos { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
      .modulos li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        transition: border-color .15s ease, background .15s ease;
      }
      .modulos li.activo { border-color: #bbf7d0; background: #f0fdf4; }
      .modulos li > div { flex: 1; }
      .modulo-icono {
        width: 32px;
        height: 32px;
        border-radius: 9px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        background: #e2e8f0;
        color: #64748b;
      }
      .modulo-icono.activo { background: linear-gradient(135deg, #34d399, #059669); color: #fff; }
      .modulo-icono mat-icon { font-size: 17px; width: 17px; height: 17px; }
      .modulos .nombre { display: block; font-weight: 600; color: #0f172a; }
      .modulos .codigo { display: block; font-size: 0.75rem; color: #94a3b8; }

      .vacio { color: #64748b; font-size: 0.88rem; }
      .fila-ia { margin-bottom: 14px; }
      .hint.aviso { color: #b45309; margin: 10px 0 0; }
      .error {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #b3261e;
        font-size: 13px;
        margin: 12px 0;
      }
      .error mat-icon { font-size: 18px; width: 18px; height: 18px; }

      @media (max-width: 900px) {
        .columnas { grid-template-columns: 1fr; }
      }

      @media (max-width: 620px) {
        .grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class ConsolaEmpresaDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly empresasService = inject(ConsolaEmpresasService);
  private readonly snack = inject(MatSnackBar);

  protected readonly tiposLogin = TIPOS_LOGIN;
  protected readonly tiposPantalla = TIPOS_PANTALLA;

  private readonly empresaId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly empresa = signal<EmpresaDetalle | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly guardando = signal<'datos' | 'marca' | null>(null);
  protected readonly moduloOcupado = signal<string | null>(null);
  protected readonly modulos = computed(() => this.empresa()?.modulos ?? []);

  protected readonly omnicanal = signal<OmnicanalDetalle | null>(null);
  protected readonly cargandoOmnicanal = signal(true);
  protected readonly guardandoIa = signal(false);
  protected readonly rotandoSecreto = signal(false);

  protected readonly datosForm = this.fb.nonNullable.group({
    nombreLegal: ['', [Validators.required]],
    representanteLegal: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required]],
    sitioWeb: ['', [Validators.required]],
  });

  protected readonly marcaForm = this.fb.nonNullable.group({
    colorPrimario: ['#2563eb'],
    colorSecundario: ['#1e3a5f'],
    urlLogo: [''],
    tipoLogin: [1],
    tipoPantallaPrincipal: [1],
  });

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.empresasService.detalle(this.empresaId).subscribe({
      next: (e) => {
        this.empresa.set(e);
        this.datosForm.patchValue({
          nombreLegal: e.nombreLegal,
          representanteLegal: e.representanteLegal,
          correo: e.correo,
          telefono: e.telefono,
          sitioWeb: e.sitioWeb,
        });
        this.marcaForm.patchValue({
          colorPrimario: e.colorPrimario ?? '#2563eb',
          colorSecundario: e.colorSecundario ?? '#1e3a5f',
          urlLogo: e.urlLogo ?? '',
          tipoLogin: e.tipoLogin,
          tipoPantallaPrincipal: e.tipoPantallaPrincipal,
        });
      },
      error: (err: HttpErrorResponse) => this.errorCarga.set(this.mensaje(err)),
      complete: () => this.cargando.set(false),
    });

    this.cargandoOmnicanal.set(true);
    this.empresasService.verOmnicanal(this.empresaId).subscribe({
      next: (o) => this.omnicanal.set(o),
      error: () => this.omnicanal.set(null),
      complete: () => this.cargandoOmnicanal.set(false),
    });
  }

  alternarIa(habilitada: boolean): void {
    this.guardandoIa.set(true);
    this.empresasService.establecerIaOmnicanal(this.empresaId, habilitada).subscribe({
      next: () => {
        const actual = this.omnicanal();
        if (actual) {
          this.omnicanal.set({ ...actual, iaHabilitada: habilitada });
        }
        this.snack.open(habilitada ? 'IA habilitada' : 'IA deshabilitada', 'OK', { duration: 2000 });
      },
      error: (err: HttpErrorResponse) => this.snack.open(this.mensaje(err), 'Cerrar', { duration: 4000 }),
      complete: () => this.guardandoIa.set(false),
    });
  }

  rotarSecreto(): void {
    if (!confirm('¿Rotar el secreto del webhook de esta empresa? El anterior deja de funcionar de inmediato.')) {
      return;
    }
    this.rotandoSecreto.set(true);
    this.empresasService.rotarWebhookSecretOmnicanal(this.empresaId).subscribe({
      next: (o) => {
        this.omnicanal.set(o);
        this.snack.open('Secreto rotado -- actualízalo también en Liwa.', 'OK', { duration: 3000 });
      },
      error: (err: HttpErrorResponse) => this.snack.open(this.mensaje(err), 'Cerrar', { duration: 4000 }),
      complete: () => this.rotandoSecreto.set(false),
    });
  }

  guardarDatos(): void {
    if (this.datosForm.invalid) {
      return;
    }
    this.guardando.set('datos');
    this.empresasService.guardarDatos(this.empresaId, this.datosForm.getRawValue()).subscribe({
      next: () => this.snack.open('Datos guardados', 'OK', { duration: 2500 }),
      error: (err: HttpErrorResponse) => this.snack.open(this.mensaje(err), 'Cerrar', { duration: 4000 }),
      complete: () => this.guardando.set(null),
    });
  }

  guardarMarca(): void {
    this.guardando.set('marca');
    const v = this.marcaForm.getRawValue();
    this.empresasService
      .guardarMarca(this.empresaId, {
        colorPrimario: v.colorPrimario || null,
        colorSecundario: v.colorSecundario || null,
        urlLogo: v.urlLogo.trim() || null,
        tipoLogin: v.tipoLogin,
        tipoPantallaPrincipal: v.tipoPantallaPrincipal,
      })
      .subscribe({
        next: () => this.snack.open('Marca guardada', 'OK', { duration: 2500 }),
        error: (err: HttpErrorResponse) => this.snack.open(this.mensaje(err), 'Cerrar', { duration: 4000 }),
        complete: () => this.guardando.set(null),
      });
  }

  alternarModulo(modulo: ModuloDetalle, activar: boolean): void {
    this.moduloOcupado.set(modulo.codigo);
    const accion$ = activar
      ? this.empresasService.activarModulo(this.empresaId, modulo.codigo)
      : this.empresasService.desactivarModulo(this.empresaId, modulo.codigo);

    accion$.subscribe({
      next: () => {
        this.actualizarModuloLocal(modulo.codigo, activar);
        this.snack.open(activar ? 'Módulo activado' : 'Módulo desactivado', 'OK', { duration: 2000 });
      },
      error: (err: HttpErrorResponse) => {
        // el toggle ya se movió visualmente; recargamos para volver al estado real
        this.snack.open(this.mensaje(err), 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      complete: () => this.moduloOcupado.set(null),
    });
  }

  private actualizarModuloLocal(codigo: string, activo: boolean): void {
    const e = this.empresa();
    if (!e) {
      return;
    }
    this.empresa.set({
      ...e,
      modulos: e.modulos.map((m) => (m.codigo === codigo ? { ...m, activo } : m)),
    });
  }

  private mensaje(e: HttpErrorResponse): string {
    if (e.status === 0) {
      return 'No hay conexión con el servidor.';
    }
    if (e.status === 409) {
      return (e.error as { mensaje?: string } | null)?.mensaje ?? 'La empresa no admite esta edición ahora.';
    }
    if (e.status === 404) {
      return 'La empresa no existe.';
    }
    const backend = (e.error as { mensaje?: string } | null)?.mensaje;
    return backend || 'No se pudo completar la operación.';
  }
}
