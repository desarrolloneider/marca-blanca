import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ScrollRevealDirective } from '../../../../shared/animations/scroll-reveal.directive';

@Component({
  selector: 'app-omnicanal-detalle',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, ScrollRevealDirective],
  template: `
    <div class="module-detail">
      <section class="module-hero">
        <div class="hero-glow g1"></div>
        <div class="hero-glow g2"></div>
        <div class="hero-pattern"></div>
        <div class="hero-inner">
          <a routerLink="/" class="back-link">
            <mat-icon>arrow_back</mat-icon>
            Volver al inicio
          </a>

          <div class="module-icon-lg" appScrollReveal>
            <mat-icon>support_agent</mat-icon>
          </div>
          <div class="eyebrow" appScrollReveal [appScrollRevealDelay]="0.05"><span></span>COMUNICACIÓN OMNICANAL</div>
          <h1 appScrollReveal [appScrollRevealDelay]="0.1">
            Todas tus <span class="highlight">conversaciones</span>, un solo lugar.
          </h1>
          <p appScrollReveal [appScrollRevealDelay]="0.15">
            Gestiona la comunicación con tus clientes desde todos los canales, sin perder
            contexto ni saltar entre aplicaciones.
          </p>

          <div class="hero-highlights" appScrollReveal [appScrollRevealDelay]="0.2">
            <span><mat-icon>forum</mat-icon> Bandeja unificada</span>
            <span><mat-icon>hub</mat-icon> WhatsApp, chat y correo</span>
            <span><mat-icon>history</mat-icon> Historial por cliente</span>
          </div>
        </div>
      </section>

      <section class="module-body">
        <div class="section-heading" appScrollReveal>
          <div class="eyebrow dark"><span></span>¿QUÉ INCLUYE?</div>
          <h2>Todo lo que tu equipo de atención necesita.</h2>
        </div>

        <div class="feature-grid">
          <div class="feature-card" appScrollReveal [appScrollRevealDelay]="0.05" (mousemove)="onSpotlight($event)">
            <div class="card-glow"></div>
            <div class="feature-icon violet"><mat-icon>inbox</mat-icon></div>
            <h3>Atención unificada</h3>
            <p>Todas las conversaciones de tus clientes centralizadas en una sola bandeja de entrada.</p>
          </div>
          <div class="feature-card" appScrollReveal [appScrollRevealDelay]="0.12" (mousemove)="onSpotlight($event)">
            <div class="card-glow"></div>
            <div class="feature-icon blue"><mat-icon>hub</mat-icon></div>
            <h3>Múltiples canales</h3>
            <p>WhatsApp, chat web, correo y más, conectados a un mismo flujo de atención.</p>
          </div>
          <div class="feature-card" appScrollReveal [appScrollRevealDelay]="0.19" (mousemove)="onSpotlight($event)">
            <div class="card-glow"></div>
            <div class="feature-icon green"><mat-icon>history</mat-icon></div>
            <h3>Historial centralizado</h3>
            <p>El historial completo de cada cliente disponible para todo tu equipo de atención.</p>
          </div>
        </div>

        <div class="cta-panel" appScrollReveal>
          <div>
            <h3>Listo para centralizar tu comunicación.</h3>
            <p>Actívalo desde el wizard de registro o desde "Mis módulos" si tu empresa ya tiene una cuenta.</p>
          </div>
          <a mat-flat-button color="primary" routerLink="/registro" [queryParams]="{ modulo: 'omnicanal' }" class="cta-btn">
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
      color: #c4b5fd;
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
      color: #7c3aed;
    }

    /* ---------- Hero oscuro ---------- */
    .module-hero {
      position: relative;
      overflow: hidden;
      background: linear-gradient(160deg, #0b1c3d 0%, #142b57 55%, #0b1c3d 100%);
      color: #fff;
      padding: 40px 24px 64px;
    }

    .hero-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: .35;
      pointer-events: none;
      animation: flotar 9s ease-in-out infinite;
    }
    .hero-glow.g1 { width: 360px; height: 360px; top: -120px; left: -100px; background: #7c3aed; }
    .hero-glow.g2 { width: 320px; height: 320px; bottom: -140px; right: -80px; background: #2468d9; animation-delay: -4.5s; }

    @keyframes flotar {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-18px); }
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
      z-index: 1;
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
      background: linear-gradient(135deg, #a855f7, #7c3aed);
      box-shadow: 0 14px 30px rgba(124, 58, 237, .35);
      clear: both;
    }

    .module-icon-lg mat-icon {
      font-size: 38px;
      width: 38px;
      height: 38px;
      color: #fff;
    }

    .hero-inner .eyebrow {
      justify-content: center;
    }

    .module-hero h1 {
      font-size: 2.4rem;
      font-weight: 800;
      margin: 0 0 14px;
      letter-spacing: -.02em;
    }

    .module-hero h1 .highlight {
      background: linear-gradient(90deg, #c4b5fd, #86b4ff);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
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
      color: #c4b5fd;
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
      position: relative;
      overflow: hidden;
      background: #fff;
      border: 1px solid #e8edf4;
      border-radius: 16px;
      padding: 26px 22px;
      box-shadow: 0 8px 25px rgba(30, 55, 90, .04);
      transition: transform .2s ease, box-shadow .2s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px rgba(30, 55, 90, .08);
    }

    .card-glow {
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity .3s ease;
      pointer-events: none;
      background: radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), rgba(124, 58, 237, .08), transparent 60%);
    }

    .feature-card:hover .card-glow {
      opacity: 1;
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

    .feature-icon.violet { background: linear-gradient(135deg, #a855f7, #7c3aed); }
    .feature-icon.blue { background: linear-gradient(135deg, #38bdf8, #2563eb); }
    .feature-icon.green { background: linear-gradient(135deg, #34d399, #059669); }

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

    @media (prefers-reduced-motion: reduce) {
      .hero-glow { animation: none; }
    }
  `],
})
export class OmnicanalDetalleComponent {
  // Spotlight que sigue el mouse dentro de cada tarjeta -- mismo patron
  // usado en el hero del home (ver home.component.ts) para mantener
  // consistencia visual entre la landing y las paginas de modulo.
  protected onSpotlight(evento: MouseEvent): void {
    const tarjeta = evento.currentTarget as HTMLElement;
    const rect = tarjeta.getBoundingClientRect();
    tarjeta.style.setProperty('--x', `${evento.clientX - rect.left}px`);
    tarjeta.style.setProperty('--y', `${evento.clientY - rect.top}px`);
  }
}
