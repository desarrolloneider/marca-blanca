import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type ColorModulo = 'violeta' | 'azul' | 'verde';

export interface HighlightModulo {
  icono: string;
  texto: string;
}

export interface CaracteristicaModulo {
  icono: string;
  color: ColorModulo;
  titulo: string;
  descripcion: string;
}

export interface DatoModuloDetalle {
  /** Va en el queryParam ?modulo=... hacia /registro. */
  codigo: string;
  eyebrow: string;
  nombre: string;
  descripcion: string;
  icono: string;
  colorPrincipal: ColorModulo;
  highlights: HighlightModulo[];
  caracteristicas: CaracteristicaModulo[];
  ctaTitulo: string;
  ctaDescripcion: string;
}

/**
 * Pagina de "conocer la solucion" de un modulo (landing publica, antes de
 * comprar/loguearse) -- un solo componente data-driven en vez de una copia
 * por modulo. Antes cada modulo (omnicanal, 3cx) tenia su propio archivo con
 * el mismo HTML/CSS calcado; rediseñar uno y olvidar el otro (como paso con
 * el rediseño oscuro de 3CX) era el sintoma de tener la plantilla duplicada.
 * Agregar un modulo nuevo ahora es una pagina wrapper de ~10 lineas con sus
 * datos, no otra copia de este archivo.
 */
@Component({
  selector: 'app-modulo-detalle',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="module-detail">
      <section class="module-hero">
        <div class="hero-pattern"></div>
        <div class="hero-inner">
          <a routerLink="/" class="back-link">
            <mat-icon>arrow_back</mat-icon>
            Volver al inicio
          </a>

          <div class="module-icon-lg" [class]="dato.colorPrincipal">
            <mat-icon>{{ dato.icono }}</mat-icon>
          </div>
          <div class="eyebrow"><span></span>{{ dato.eyebrow }}</div>
          <h1>{{ dato.nombre }}</h1>
          <p>{{ dato.descripcion }}</p>

          <div class="hero-highlights">
            @for (h of dato.highlights; track h.texto) {
              <span><mat-icon>{{ h.icono }}</mat-icon> {{ h.texto }}</span>
            }
          </div>
        </div>
      </section>

      <section class="module-body">
        <div class="section-heading">
          <div class="eyebrow dark"><span></span>¿QUÉ INCLUYE?</div>
          <h2>Todo lo que tu equipo necesita.</h2>
        </div>

        <div class="feature-grid">
          @for (c of dato.caracteristicas; track c.titulo) {
            <div class="feature-card">
              <div class="feature-icon" [class]="c.color"><mat-icon>{{ c.icono }}</mat-icon></div>
              <h3>{{ c.titulo }}</h3>
              <p>{{ c.descripcion }}</p>
            </div>
          }
        </div>

        <div class="cta-panel">
          <div>
            <h3>{{ dato.ctaTitulo }}</h3>
            <p>{{ dato.ctaDescripcion }}</p>
          </div>
          <a mat-flat-button color="primary" routerLink="/registro" [queryParams]="{ modulo: dato.codigo }" class="cta-btn">
            Adquirir módulo
            <mat-icon>arrow_forward</mat-icon>
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .module-detail {
      background: #f7f9fc;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #93c5fd;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .15em;
      margin: 0 0 14px;
    }

    .eyebrow span {
      width: 22px;
      height: 2px;
      background: currentColor;
    }

    .eyebrow.dark {
      color: #2468d9;
    }

    /* ---------- Hero oscuro ---------- */
    .module-hero {
      position: relative;
      overflow: hidden;
      background: linear-gradient(160deg, #0b1c3d 0%, #142b57 55%, #0b1c3d 100%);
      color: #fff;
      padding: 40px 24px 64px;
    }

    .hero-pattern {
      position: absolute;
      inset: 0;
      opacity: .5;
      background-image:
        linear-gradient(115deg, transparent 48%, rgba(255,255,255,.05) 49%, rgba(255,255,255,.05) 51%, transparent 52%),
        linear-gradient(25deg, transparent 48%, rgba(255,255,255,.04) 49%, rgba(255,255,255,.04) 51%, transparent 52%);
      background-size: 90px 90px;
    }

    .hero-inner {
      position: relative;
      max-width: 720px;
      margin: 0 auto;
      text-align: center;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #aebbd6;
      text-decoration: none;
      margin-bottom: 32px;
      float: left;
    }

    .back-link:hover {
      color: #fff;
    }

    .back-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .module-icon-lg {
      width: 76px;
      height: 76px;
      margin: 0 auto 20px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      clear: both;
    }

    .module-icon-lg mat-icon {
      font-size: 38px;
      width: 38px;
      height: 38px;
      color: #fff;
    }

    .module-icon-lg.violeta, .feature-icon.violeta { background: linear-gradient(135deg, #a855f7, #7c3aed); }
    .module-icon-lg.azul, .feature-icon.azul { background: linear-gradient(135deg, #38bdf8, #2563eb); }
    .module-icon-lg.verde, .feature-icon.verde { background: linear-gradient(135deg, #34d399, #059669); }

    .hero-inner .eyebrow {
      justify-content: center;
    }

    .module-hero h1 {
      font-size: 2.4rem;
      font-weight: 800;
      margin: 0 0 14px;
      letter-spacing: -.02em;
    }

    .module-hero p {
      font-size: 1.05rem;
      color: #aebbd6;
      max-width: 520px;
      margin: 0 auto;
      line-height: 1.6;
    }

    .hero-highlights {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-top: 32px;
    }

    .hero-highlights span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, .08);
      border: 1px solid rgba(255, 255, 255, .12);
      border-radius: 999px;
      padding: 8px 16px;
      font-size: 0.82rem;
      color: #dbeafe;
    }

    .hero-highlights mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #93c5fd;
    }

    /* ---------- Cuerpo ---------- */
    .module-body {
      max-width: 920px;
      margin: 0 auto;
      padding: 64px 24px 88px;
    }

    .section-heading {
      text-align: center;
      max-width: 560px;
      margin: 0 auto 40px;
    }

    .section-heading .eyebrow {
      justify-content: center;
    }

    .section-heading h2 {
      font-size: 1.7rem;
      font-weight: 800;
      margin: 0;
      color: #0f172a;
      letter-spacing: -.02em;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 48px;
    }

    .feature-card {
      background: #fff;
      border: 1px solid #e8edf4;
      border-radius: 16px;
      padding: 26px 22px;
      box-shadow: 0 8px 25px rgba(30, 55, 90, .04);
    }

    .feature-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .feature-icon mat-icon {
      color: #fff;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .feature-card h3 {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0 0 8px;
      color: #0f172a;
    }

    .feature-card p {
      margin: 0;
      color: #64748b;
      line-height: 1.55;
      font-size: 0.92rem;
    }

    .cta-panel {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      background: linear-gradient(135deg, #0b1c3d, #142b57);
      border-radius: 20px;
      padding: 32px 36px;
      color: #fff;
      flex-wrap: wrap;
    }

    .cta-panel h3 {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0 0 6px;
    }

    .cta-panel p {
      margin: 0;
      color: #aebbd6;
      font-size: 0.9rem;
      max-width: 420px;
    }

    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 46px;
      padding: 0 28px !important;
      white-space: nowrap;
    }

    @media (max-width: 720px) {
      .feature-grid {
        grid-template-columns: 1fr;
      }

      .cta-panel {
        flex-direction: column;
        align-items: flex-start;
      }

      .back-link {
        float: none;
        display: flex;
      }
    }
  `],
})
export class ModuloDetalleComponent {
  @Input({ required: true }) dato!: DatoModuloDetalle;
}
