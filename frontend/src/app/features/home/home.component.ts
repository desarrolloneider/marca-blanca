import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import gsap from 'gsap';
import { BrandMarkComponent } from '../../shared/brand/brand-mark.component';
import { ScrollRevealDirective } from '../../shared/animations/scroll-reveal.directive';

// Clave en sessionStorage para no repetir la intro en cada visita a "/"
// dentro de la misma pestaña/sesion (solo la primera vez que se entra).
const INTRO_YA_VISTA = 'mb_intro_vista';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, BrandMarkComponent, ScrollRevealDirective],
  template: `
    <!-- Intro de entrada (inspirada en el wipe/reveal de sitios tipo huyml.co):
         pantalla oscura de marca -> aparece el nombre -> se desliza hacia
         arriba descubriendo la landing real debajo. Solo la primera vez por
         sesion (ver ngAfterViewInit) y se salta si el usuario prefiere menos
         movimiento. -->
    <div class="intro-loader" #introLoader *ngIf="mostrarIntro">
      <div class="intro-brand" #introBrand>
        <span class="brand-mark"><app-brand-mark /></span>
        <strong>LINELCA</strong>
      </div>
    </div>

    <div class="landing">
      <header class="header">
        <a routerLink="/" class="brand">
          <span class="brand-mark"><app-brand-mark /></span>
          <span><strong>LINELCA</strong><small>Business platform</small></span>
        </a>
        <nav>
          <a href="#soluciones">Soluciones</a>
          <a href="#metodo">Cómo funciona</a>
          <a href="#seguridad">Seguridad</a>
        </nav>
        <a mat-flat-button routerLink="/login" class="login-button">
          Acceder a la plataforma<mat-icon>arrow_forward</mat-icon>
        </a>
      </header>

      <main>
        <!-- Hero centrado: titular grande, CTA doble y debajo un "bento" de
             modulos con efecto spotlight al pasar el mouse (mismo patron que
             el sidebar del shell). Reemplaza el layout anterior de 2 columnas
             con el texto a la izquierda y las tarjetas aparte. -->
        <section id="soluciones" class="hero">
          <div class="hero-glow g1"></div>
          <div class="hero-glow g2"></div>

          <div class="hero-inner">
            <div class="eyebrow-pill" appScrollReveal>
              <span class="dot"></span>Un ecosistema, una visión
            </div>

            <h1 appScrollReveal [appScrollRevealDelay]="0.05">
              Las herramientas para que <span class="highlight">tu empresa avance</span>.
            </h1>

            <p class="hero-subtitle" appScrollReveal [appScrollRevealDelay]="0.1">
              Activa solo lo que necesitas hoy y amplía tus capacidades cuando tu operación lo
              requiera. Todo desde un mismo lugar.
            </p>

            <div class="hero-actions" appScrollReveal [appScrollRevealDelay]="0.15">
              <a mat-flat-button routerLink="/registro" class="primary">
                Comenzar ahora <mat-icon>arrow_forward</mat-icon>
              </a>
              <a href="#metodo" class="ghost">
                <mat-icon>play_circle</mat-icon>Ver cómo funciona
              </a>
            </div>

            <div class="solution-grid">
              <a
                routerLink="/modulos/omnicanal"
                class="solution-card violet"
                appScrollReveal
                [appScrollRevealDelay]="0.22"
                (mousemove)="onSpotlight($event)"
              >
                <div class="card-glow"></div>
                <div class="icon-box"><mat-icon>support_agent</mat-icon></div>
                <h3>Comunicación omnicanal</h3>
                <p>WhatsApp, redes y correo en una sola bandeja de casos.</p>
                <span>Conocer solución <mat-icon>arrow_forward</mat-icon></span>
              </a>

              <a
                routerLink="/modulos/pbx-3cx"
                class="solution-card blue"
                appScrollReveal
                [appScrollRevealDelay]="0.3"
                (mousemove)="onSpotlight($event)"
              >
                <div class="card-glow"></div>
                <div class="icon-box"><mat-icon>call</mat-icon></div>
                <h3>Telefonía empresarial</h3>
                <p>Extensiones, colas y reportes de llamadas integrados.</p>
                <span>Conocer solución <mat-icon>arrow_forward</mat-icon></span>
              </a>

              <div
                class="solution-card green"
                appScrollReveal
                [appScrollRevealDelay]="0.38"
                (mousemove)="onSpotlight($event)"
              >
                <div class="card-glow"></div>
                <div class="icon-box"><mat-icon>admin_panel_settings</mat-icon></div>
                <h3>Gobierno y acceso</h3>
                <p>Usuarios, roles y auditoría, listos desde el primer día.</p>
                <span>Incluido <mat-icon>check</mat-icon></span>
              </div>
            </div>
          </div>
        </section>

        <section id="metodo" class="method">
          <div class="method-inner">
            <div class="method-left">
              <div class="eyebrow light" appScrollReveal><span></span>IMPLEMENTACIÓN SIMPLE</div>
              <h2 appScrollReveal [appScrollRevealDelay]="0.05">
                De la idea a la operación en <strong>cinco pasos simples.</strong>
              </h2>

              <ol class="timeline">
                @for (paso of pasos; track paso.titulo; let i = $index) {
                  <li appScrollReveal [appScrollRevealDelay]="0.08 * i">
                    <div class="timeline-icon" [style.background]="paso.color">
                      <mat-icon>{{ paso.icono }}</mat-icon>
                    </div>
                    <div class="timeline-text">
                      <strong>{{ paso.titulo }}</strong>
                      <small>{{ paso.detalle }}</small>
                    </div>
                  </li>
                }
              </ol>

              <div class="trust" appScrollReveal [appScrollRevealDelay]="0.4">
                <div class="trust-avatars">
                  <span>AM</span><span>LC</span><span>RV</span><span>+</span>
                </div>
                <div>
                  <strong>Diseñada para equipos que escalan</strong>
                  <small>Arquitectura segura y preparada para crecer</small>
                </div>
              </div>
            </div>

            <div class="method-right" appScrollReveal [appScrollRevealDelay]="0.15">
              <div class="dashboard-card">
                <div class="dash-top">
                  <span class="mini-brand"><mat-icon>hub</mat-icon> Workspace</span>
                  <span class="live"><i></i> En línea</span>
                </div>
                <div class="dash-title">
                  <div><small>RESUMEN DE OPERACIÓN</small><h3>Todo bajo control</h3></div>
                  <mat-icon>more_horiz</mat-icon>
                </div>
                <div class="metric-row">
                  <div class="metric">
                    <span>Módulos activos</span><strong>08</strong>
                    <small class="positive">↑ 12.4%</small>
                  </div>
                  <div class="metric">
                    <span>Usuarios</span><strong>124</strong>
                    <small class="positive">↑ 8.2%</small>
                  </div>
                </div>
                <div class="chart">
                  <div class="chart-label"><span>Actividad mensual</span><strong>78%</strong></div>
                  <div class="bars">
                    <i style="height:42%"></i><i style="height:58%"></i><i style="height:48%"></i>
                    <i style="height:72%"></i><i style="height:64%"></i><i style="height:89%"></i>
                    <i style="height:76%"></i><i style="height:100%"></i>
                  </div>
                </div>
                <div class="side-panels">
                  <div class="panel">
                    <span class="panel-label">Live chat</span>
                    <div class="panel-row">
                      <mat-icon>chat_bubble</mat-icon>
                      <small>12 min. atrás</small>
                    </div>
                  </div>
                  <div class="panel">
                    <span class="panel-label">Recomendaciones</span>
                    <div class="panel-row">
                      <span class="dot"></span>
                      <small>Tip: activa el resumen semanal</small>
                    </div>
                    <div class="panel-row">
                      <span class="dot"></span>
                      <small>Invita a tu equipo comercial</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="seguridad" class="final-cta" appScrollReveal>
          <div>
            <div class="eyebrow dark"><span></span>LISTOS PARA EL SIGUIENTE NIVEL</div>
            <h2>Una plataforma que trabaja al ritmo de tu empresa.</h2>
          </div>
          <a mat-flat-button routerLink="/registro" class="primary">
            Comenzar ahora <mat-icon>arrow_forward</mat-icon>
          </a>
        </section>
      </main>

      <footer>
        <a routerLink="/" class="brand">
          <span class="brand-mark"><app-brand-mark /></span>
          <span><strong>LINELCA</strong><small>Business platform</small></span>
        </a>
        <span>© 2026 LINELCA. Plataforma empresarial.</span>
        <a routerLink="/consola/login" class="admin-link">Acceso administrativo</a>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .landing { background: #f7f9fc; color: #172033; overflow-x: clip; }

    /* ---------- Intro de entrada ---------- */
    .intro-loader {
      position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(160deg, #0b1c3d 0%, #142b57 55%, #0b1c3d 100%);
    }
    .intro-brand { display: flex; align-items: center; gap: 12px; color: #fff; opacity: 0; transform: translateY(16px); }
    .intro-brand .brand-mark {
      width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; color: #fff;
      background: #2468d9; box-shadow: 0 10px 24px rgba(36,104,217,0.4); font-size: 24px;
    }
    .intro-brand strong { font-size: 24px; letter-spacing: -0.01em; }

    /* ---------- Header ---------- */
    .header { height: 76px; display: flex; align-items: center; justify-content: space-between; max-width: 1240px; margin: auto; padding: 0 28px; background: #f7f9fc; position: relative; z-index: 2; }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #172033; }
    .brand-mark { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; color: #fff; background: #2468d9; font-size: 20px; }
    .brand strong, .brand small { display: block; }
    .brand strong { font-size: 15px; }
    .brand small { font-size: 9px; color: #8a96a9; letter-spacing: .12em; text-transform: uppercase; margin-top: 2px; }
    .header nav { display: flex; gap: 32px; }
    .header nav a { color: #69768b; text-decoration: none; font-size: 13px; }
    .header nav a:hover { color: #2468d9; }
    .login-button { background: #172033 !important; color: #fff !important; font-size: 12px !important; }
    .login-button mat-icon { font-size: 17px; margin-left: 8px; }

    .eyebrow { display: flex; align-items: center; gap: 8px; color: #2468d9; font-size: 10px; font-weight: 800; letter-spacing: .15em; }
    .eyebrow span { width: 22px; height: 2px; background: #2468d9; }
    .eyebrow.dark { color: #2468d9; }
    .eyebrow.light { color: #86b4ff; }
    .eyebrow.light span { background: #86b4ff; }

    .primary { background: #2468d9 !important; color: #fff !important; }
    .primary mat-icon { font-size: 18px; margin-left: 9px; }

    /* ---------- Hero centrado ---------- */
    .hero {
      position: relative;
      overflow: hidden;
      background: linear-gradient(160deg, #0b1c3d 0%, #142b57 55%, #0b1c3d 100%);
      color: #fff;
      padding: 88px 28px 90px;
    }

    .hero-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: .35;
      pointer-events: none;
      animation: flotar 9s ease-in-out infinite;
    }
    .hero-glow.g1 { width: 420px; height: 420px; top: -140px; left: -100px; background: #7c3aed; }
    .hero-glow.g2 { width: 380px; height: 380px; bottom: -160px; right: -80px; background: #2468d9; animation-delay: -4.5s; }

    @keyframes flotar {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-22px); }
    }

    .hero-inner { position: relative; z-index: 1; max-width: 940px; margin: auto; text-align: center; }

    .eyebrow-pill {
      display: inline-flex; align-items: center; gap: 8px; margin: 0 auto 22px;
      padding: 7px 16px; border-radius: 999px;
      background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14);
      font-size: 11px; font-weight: 700; letter-spacing: .08em; color: #cfe0ff;
    }
    .eyebrow-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,.25); }

    .hero-inner h1 { font-size: clamp(34px, 5vw, 56px); line-height: 1.14; letter-spacing: -.03em; margin: 0 0 20px; }
    .hero-inner h1 .highlight { background: linear-gradient(90deg, #86b4ff, #c4b5fd); -webkit-background-clip: text; background-clip: text; color: transparent; }

    .hero-subtitle { color: #aebbd6; font-size: 16px; line-height: 1.7; max-width: 560px; margin: 0 auto 34px; }

    .hero-actions { display: flex; align-items: center; justify-content: center; gap: 18px; margin-bottom: 64px; }
    .hero-actions .primary { height: 46px; padding: 0 24px; font-size: 14px; }
    .hero-actions .ghost {
      display: inline-flex; align-items: center; gap: 8px;
      color: #fff; text-decoration: none; font-size: 14px; font-weight: 600;
      padding: 0 6px; height: 46px;
    }
    .hero-actions .ghost mat-icon { color: #86b4ff; }
    .hero-actions .ghost:hover { color: #cfe0ff; }

    .solution-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; text-align: left; }

    .solution-card {
      position: relative;
      overflow: hidden;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      backdrop-filter: blur(6px);
      border-radius: 18px;
      padding: 24px;
      text-decoration: none;
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: transform .25s ease, background .25s ease, border-color .25s ease;
    }
    .solution-card:hover { transform: translateY(-5px); background: rgba(255,255,255,.09); border-color: rgba(255,255,255,.2); }

    .card-glow {
      position: absolute; inset: 0; opacity: 0; transition: opacity .3s ease; pointer-events: none;
      background: radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,.16), transparent 60%);
    }
    .solution-card:hover .card-glow { opacity: 1; }

    .solution-card .icon-box { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; margin-bottom: 4px; }
    .solution-card.violet .icon-box { background: linear-gradient(135deg, #a855f7, #7c3aed); }
    .solution-card.blue .icon-box { background: linear-gradient(135deg, #38bdf8, #2563eb); }
    .solution-card.green .icon-box { background: linear-gradient(135deg, #34d399, #059669); }

    .solution-card h3 { font-size: 17px; font-weight: 700; line-height: 1.3; margin: 0; }
    .solution-card p { font-size: 12.5px; color: #aebbd6; line-height: 1.55; margin: 0; }
    .solution-card span { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #93c5fd; margin-top: 4px; }
    .solution-card.green span { color: #6ee7b7; }
    .solution-card span mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* ---------- Metodo: timeline vertical + dashboard ---------- */
    .method { background: #101a2d; color: #fff; padding: 95px max(28px, calc((100% - 1184px) / 2)); }
    .method-inner { display: grid; grid-template-columns: 1.05fr .95fr; gap: 60px; align-items: start; }
    .method h2 { font-size: 34px; line-height: 1.2; letter-spacing: -.03em; margin: 16px 0 40px; max-width: 520px; }
    .method h2 strong { color: #86b4ff; font-weight: 800; }

    .timeline { list-style: none; margin: 0 0 44px; padding: 0; position: relative; }
    .timeline::before {
      content: ''; position: absolute; left: 22px; top: 8px; bottom: 8px; width: 2px;
      background: linear-gradient(#263145, #263145 90%, transparent);
    }
    .timeline li { position: relative; display: flex; align-items: flex-start; gap: 16px; padding: 0 0 26px; }
    .timeline li:last-child { padding-bottom: 0; }
    .timeline-icon {
      position: relative; z-index: 1; flex-shrink: 0;
      width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center;
      box-shadow: 0 0 0 5px #101a2d;
    }
    .timeline-icon mat-icon { color: #fff; font-size: 22px; width: 22px; height: 22px; }
    .timeline-text { padding-top: 8px; }
    .timeline-text strong { display: block; font-size: 14px; margin-bottom: 3px; }
    .timeline-text small { display: block; font-size: 12px; color: #8a96a9; line-height: 1.5; max-width: 320px; }

    .trust { display: flex; align-items: center; gap: 12px; }
    .trust-avatars { display: flex; }
    .trust-avatars span { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: #dfeaff; color: #2468d9; font-size: 9px; font-weight: 800; border: 2px solid #101a2d; margin-left: -5px; }
    .trust-avatars span:first-child { margin-left: 0; }
    .trust-avatars span:nth-child(2) { background: #e6f3e9; color: #27824b; }
    .trust-avatars span:nth-child(3) { background: #f5e8dd; color: #ae6338; }
    .trust-avatars span:last-child { background: #fff; color: #101a2d; }
    .trust strong, .trust small { display: block; }
    .trust strong { font-size: 12px; }
    .trust small { color: #8a96a9; font-size: 11px; margin-top: 3px; }

    .method-right { position: sticky; top: 96px; }
    .dashboard-card { position: relative; width: min(100%, 410px); margin-left: auto; padding: 23px; background: rgba(255,255,255,.96); color: #172033; border-radius: 16px; box-shadow: 0 25px 60px rgba(0,0,0,.35); }
    .dash-top, .dash-title, .chart-label { display: flex; align-items: center; justify-content: space-between; }
    .mini-brand { font-size: 11px; color: #738198; }
    .mini-brand mat-icon { vertical-align: middle; font-size: 16px; color: #2468d9; }
    .live { font-size: 10px; color: #27824b; }
    .live i { display: inline-block; width: 6px; height: 6px; background: #4ade80; border-radius: 50%; margin-right: 4px; }
    .dash-title { margin: 22px 0 18px; }
    .dash-title small { font-size: 9px; color: #97a2b3; letter-spacing: .11em; }
    .dash-title h3 { margin: 4px 0 0; font-size: 20px; }
    .dash-title mat-icon { color: #9ca7b7; }
    .metric-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .metric { padding: 12px; background: #f7f9fc; border-radius: 10px; }
    .metric span, .metric small { display: block; font-size: 10px; color: #8995a8; }
    .metric strong { display: inline-block; font-size: 23px; margin: 6px 8px 0 0; }
    .metric .positive { color: #27824b; }
    .chart { margin-top: 16px; padding: 12px; background: #f7f9fc; border-radius: 10px; }
    .chart-label { font-size: 10px; color: #78869b; }
    .chart-label strong { color: #2468d9; }
    .bars { height: 76px; display: flex; align-items: flex-end; gap: 7px; padding-top: 12px; }
    .bars i { display: block; flex: 1; background: linear-gradient(#7cafef, #2468d9); border-radius: 4px 4px 0 0; }
    .bars i:nth-child(2n) { opacity: .45; }

    .side-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
    .panel { background: #f7f9fc; border-radius: 10px; padding: 10px 12px; }
    .panel-label { display: block; font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #97a2b3; margin-bottom: 8px; }
    .panel-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
    .panel-row:last-child { margin-bottom: 0; }
    .panel-row mat-icon { font-size: 14px; width: 14px; height: 14px; color: #2468d9; }
    .panel-row .dot { width: 5px; height: 5px; border-radius: 50%; background: #2468d9; flex-shrink: 0; }
    .panel-row small { font-size: 10px; color: #556076; line-height: 1.4; }

    /* ---------- CTA final ---------- */
    .final-cta { max-width: 1240px; margin: auto; padding: 95px 28px; display: flex; align-items: end; justify-content: space-between; gap: 40px; }
    .final-cta h2 { font-size: 42px; line-height: 1.12; letter-spacing: -.045em; margin: 17px 0 0; max-width: 650px; }
    .final-cta .primary { white-space: nowrap; height: 45px; padding: 0 22px; }

    /* ---------- Footer ---------- */
    footer { border-top: 1px solid #e5eaf2; max-width: 1184px; margin: auto; padding: 25px 28px; display: flex; justify-content: space-between; align-items: center; color: #8a96a9; font-size: 11px; }
    footer .brand { margin-right: 20px; }
    footer .admin-link { color: #b2bdcc; text-decoration: none; font-size: 11px; }
    footer .admin-link:hover { color: #69768b; text-decoration: underline; }

    @media (max-width: 900px) {
      .header nav { display: none; }
      .hero-actions { flex-direction: column; gap: 14px; }
      .solution-grid { grid-template-columns: 1fr; }
      .method-inner { grid-template-columns: 1fr; }
      .method-right { position: static; margin-top: 20px; }
      .dashboard-card { margin: 0 auto; }
      .final-cta { display: block; }
      .final-cta .primary { margin-top: 30px; }
      footer { display: block; }
      footer > span { display: block; margin-top: 18px; }
      footer .admin-link { display: block; margin-top: 8px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-glow { animation: none; }
    }
  `],
})
export class HomeComponent implements AfterViewInit {
  // Solo se pinta el overlay si es la primera vez en esta sesion de pestaña
  // -- entrar/salir de "/" repetidamente (o refrescar) no debe repetir la
  // intro cada vez, se volveria molesto.
  protected mostrarIntro = !sessionStorage.getItem(INTRO_YA_VISTA);

  @ViewChild('introLoader') private introLoader?: ElementRef<HTMLDivElement>;
  @ViewChild('introBrand') private introBrand?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    if (!this.mostrarIntro) {
      return;
    }
    sessionStorage.setItem(INTRO_YA_VISTA, '1');

    const overlay = this.introLoader?.nativeElement;
    const marca = this.introBrand?.nativeElement;
    if (!overlay || !marca) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      overlay.remove();
      return;
    }

    gsap.timeline({ onComplete: () => overlay.remove() })
      .to(marca, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.15)
      .to(marca, { opacity: 0, y: -16, duration: 0.35, ease: 'power2.in' }, '+=0.55')
      .to(overlay, { yPercent: -100, duration: 0.75, ease: 'power4.inOut' }, '-=0.1');
  }

  // Spotlight que sigue al mouse dentro de cada tarjeta de solucion (mismo
  // patron que el hover del sidebar en shell.component.ts) -- da la
  // sensacion de profundidad/interactividad sin depender de una libreria.
  protected onSpotlight(evento: MouseEvent): void {
    const tarjeta = evento.currentTarget as HTMLElement;
    const rect = tarjeta.getBoundingClientRect();
    tarjeta.style.setProperty('--x', `${evento.clientX - rect.left}px`);
    tarjeta.style.setProperty('--y', `${evento.clientY - rect.top}px`);
  }

  protected readonly pasos = [
    { icono: 'description', titulo: 'Planeación', detalle: 'Definimos módulos, roles y flujo de datos.', color: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
    { icono: 'settings', titulo: 'Configuración', detalle: 'Ajustamos la plataforma a tu operación.', color: 'linear-gradient(135deg, #38bdf8, #2563eb)' },
    { icono: 'device_hub', titulo: 'Integración', detalle: 'Conectamos tus canales y herramientas actuales.', color: 'linear-gradient(135deg, #38bdf8, #2563eb)' },
    { icono: 'fact_check', titulo: 'Pruebas', detalle: 'Validamos con tu equipo antes de salir en vivo.', color: 'linear-gradient(135deg, #34d399, #059669)' },
    { icono: 'autorenew', titulo: 'Operación', detalle: 'Tu equipo opera y escala sin fricción.', color: 'linear-gradient(135deg, #34d399, #059669)' },
  ];
}
