import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { ConsolaEmpresasService } from '../../../core/consola/consola-empresas.service';
import { EmpresaConsola } from '../../../core/consola/empresas.models';
import { ConsolaNavComponent } from '../nav/consola-nav.component';

/**
 * Fase 2: listado de TODAS las empresas de la plataforma + suspender / reactivar.
 * Las transiciones se auditan en el backend (tbl_auditoria_consola).
 */
@Component({
  selector: 'app-consola-empresas',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    RouterLink,
    ConsolaNavComponent,
  ],
  template: `
    <div class="marco">
      <app-consola-nav />

      <div class="stats">
        <div class="stat-card total">
          <div class="stat-icono"><mat-icon>apartment</mat-icon></div>
          <div><strong>{{ empresas().length }}</strong><span>Total empresas</span></div>
        </div>
        <div class="stat-card activas">
          <div class="stat-icono"><mat-icon>check_circle</mat-icon></div>
          <div><strong>{{ conteoPorEstado('activa') }}</strong><span>Activas</span></div>
        </div>
        <div class="stat-card pendientes">
          <div class="stat-icono"><mat-icon>hourglass_top</mat-icon></div>
          <div><strong>{{ conteoPorEstado('pendiente_aprovisionamiento') }}</strong><span>Pendientes</span></div>
        </div>
        <div class="stat-card suspendidas">
          <div class="stat-icono"><mat-icon>block</mat-icon></div>
          <div><strong>{{ conteoPorEstado('suspendida') }}</strong><span>Suspendidas</span></div>
        </div>
      </div>

      <section class="panel">
        <div class="panel-cabecera">
          <h1><mat-icon>apartment</mat-icon>Empresas <span class="conteo">{{ empresas().length }}</span></h1>
          <button mat-stroked-button type="button" (click)="cargar()" [disabled]="cargando()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>

        @if (cargando()) {
          <mat-progress-bar mode="indeterminate" />
        }
        @if (error()) {
          <p class="error"><mat-icon>error_outline</mat-icon>{{ error() }}</p>
        }

        @if (!cargando() && empresas().length === 0 && !error()) {
          <p class="vacio">Todavía no hay empresas registradas.</p>
        } @else {
          <div class="tabla-scroll">
            <table mat-table [dataSource]="empresas()">
              <ng-container matColumnDef="empresa">
                <th mat-header-cell *matHeaderCellDef>Empresa</th>
                <td mat-cell *matCellDef="let e">
                  <div class="celda-empresa">
                    <span class="avatar">{{ e.nombreLegal.charAt(0) }}</span>
                    <div>
                      <span class="nombre">{{ e.nombreLegal }}</span>
                      <span class="ident">{{ e.identificador }} · {{ e.dominio }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="correo">
                <th mat-header-cell *matHeaderCellDef>Contacto</th>
                <td mat-cell *matCellDef="let e">{{ e.correo }}</td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let e">
                  <span class="chip" [attr.data-estado]="e.estado">{{ etiquetaEstado(e.estado) }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="pipeline">
                <th mat-header-cell *matHeaderCellDef>Aprovisionamiento</th>
                <td mat-cell *matCellDef="let e">
                  {{ e.pasoAprovisionamiento ? (e.pasoAprovisionamiento + ' / ' + e.estadoTarea) : '—' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="creada">
                <th mat-header-cell *matHeaderCellDef>Registrada</th>
                <td mat-cell *matCellDef="let e">{{ e.creadaEn | date: 'dd/MM/yyyy' }}</td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let e">
                  <a
                    mat-button
                    [routerLink]="['/consola/empresas', e.id]"
                    class="ver-editar"
                  >
                    Ver / editar
                  </a>
                  @if (e.estado === 'activa') {
                    <button
                      mat-stroked-button
                      color="warn"
                      type="button"
                      [disabled]="ocupada() === e.id"
                      (click)="suspender(e)"
                    >
                      Suspender
                    </button>
                  } @else if (e.estado === 'suspendida') {
                    <button
                      mat-stroked-button
                      color="primary"
                      type="button"
                      [disabled]="ocupada() === e.id"
                      (click)="reactivar(e)"
                    >
                      Reactivar
                    </button>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnas"></tr>
              <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f1f5f9;
      }

      .marco {
        max-width: 1180px;
        margin: 0 auto;
        padding: 24px;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 20px;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 14px;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 18px 20px;
        box-shadow: 0 6px 18px rgba(15, 23, 42, .04);
      }

      .stat-icono {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .stat-icono mat-icon {
        color: #fff;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .stat-card.total .stat-icono { background: linear-gradient(135deg, #64748b, #334155); }
      .stat-card.activas .stat-icono { background: linear-gradient(135deg, #34d399, #059669); }
      .stat-card.pendientes .stat-icono { background: linear-gradient(135deg, #fbbf24, #d97706); }
      .stat-card.suspendidas .stat-icono { background: linear-gradient(135deg, #f87171, #dc2626); }

      .stat-card strong {
        display: block;
        font-size: 1.4rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.2;
      }

      .stat-card span {
        font-size: 0.78rem;
        color: #64748b;
      }

      .panel {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 20px 22px 8px;
      }

      .panel-cabecera {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      h1 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0;
        color: #0f172a;
      }

      h1 mat-icon {
        color: #0e7490;
      }

      .conteo {
        display: inline-block;
        margin-left: 4px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #0e7490;
        background: #ecfeff;
        border-radius: 999px;
        padding: 2px 9px;
      }

      .error {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #b3261e;
        font-size: 13px;
        margin: 10px 0;
      }

      .error mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .vacio {
        color: #64748b;
        font-size: 0.9rem;
        padding: 24px 0;
      }

      .tabla-scroll {
        overflow-x: auto;
      }

      table {
        width: 100%;
      }

      tr.mat-mdc-row:hover {
        background: #f8fafc;
      }

      .celda-empresa {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        background: linear-gradient(135deg, #22d3ee, #0e7490);
        color: #fff;
        font-weight: 800;
        font-size: 0.85rem;
        text-transform: uppercase;
      }

      .celda-empresa > div {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nombre {
        font-weight: 600;
        color: #0f172a;
      }

      .ident {
        font-size: 0.78rem;
        color: #64748b;
      }

      .chip {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 4px 10px;
        border-radius: 999px;
        background: #e2e8f0;
        color: #334155;
      }

      .chip[data-estado='activa'] {
        background: #dcfce7;
        color: #166534;
      }

      .chip[data-estado='suspendida'] {
        background: #fee2e2;
        color: #991b1b;
      }

      .chip[data-estado='pendiente_aprovisionamiento'] {
        background: #fef9c3;
        color: #854d0e;
      }

      .chip[data-estado='borrador'] {
        background: #e0e7ff;
        color: #3730a3;
      }

      @media (max-width: 900px) {
        .stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class ConsolaEmpresasComponent {
  private readonly empresasService = inject(ConsolaEmpresasService);
  private readonly snack = inject(MatSnackBar);

  protected readonly columnas = ['empresa', 'correo', 'estado', 'pipeline', 'creada', 'acciones'];

  protected readonly empresas = signal<EmpresaConsola[]>([]);
  protected readonly cargando = signal(false);
  protected readonly ocupada = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly hayEmpresas = computed(() => this.empresas().length > 0);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.empresasService.listar().subscribe({
      next: (lista) => this.empresas.set(lista),
      error: (e: HttpErrorResponse) => this.error.set(this.mensaje(e)),
      complete: () => this.cargando.set(false),
    });
  }

  suspender(e: EmpresaConsola): void {
    if (!confirm(`¿Suspender a "${e.nombreLegal}"? Se le corta el acceso hasta reactivarla.`)) {
      return;
    }
    this.mutar(e.id, this.empresasService.suspender(e.id), 'Empresa suspendida');
  }

  reactivar(e: EmpresaConsola): void {
    this.mutar(e.id, this.empresasService.reactivar(e.id), 'Empresa reactivada');
  }

  protected etiquetaEstado(estado: string): string {
    return estado.replaceAll('_', ' ');
  }

  protected conteoPorEstado(estado: string): number {
    return this.empresas().filter((e) => e.estado === estado).length;
  }

  private mutar(id: string, accion$: ReturnType<ConsolaEmpresasService['suspender']>, ok: string): void {
    this.ocupada.set(id);
    accion$.subscribe({
      next: () => {
        this.snack.open(ok, 'OK', { duration: 2500 });
        this.cargar();
      },
      error: (e: HttpErrorResponse) => {
        this.snack.open(this.mensaje(e), 'Cerrar', { duration: 4000 });
        this.ocupada.set(null);
      },
      complete: () => this.ocupada.set(null),
    });
  }

  private mensaje(e: HttpErrorResponse): string {
    if (e.status === 0) {
      return 'No hay conexión con el servidor.';
    }
    if (e.status === 401 || e.status === 403) {
      return 'Tu sesión de operador expiró o no tiene permiso.';
    }
    const backend = (e.error as { mensaje?: string } | null)?.mensaje;
    return backend || 'No se pudo completar la operación.';
  }
}
