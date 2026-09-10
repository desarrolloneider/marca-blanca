import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  template: `
    <div class="landing">
      <header class="header">
        <a routerLink="/" class="brand">
          <span class="brand-mark"><mat-icon>hub</mat-icon></span>
          <span><strong>Marca Blanca</strong><small>Business platform</small></span>
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
        <!-- Hero oscuro: titular + los 3 modulos, todo en una sola seccion
             (antes eran 2 secciones separadas -- una hero clara y una franja
             blanca de soluciones debajo). -->
        <section id="soluciones" class="hero-dark">
          <div class="hero-dark-pattern"></div>

          <div class="hero-dark-inner">
            <div class="hero-dark-top">
              <div class="hero-dark-left">
                <h1>Las herramientas para que tu empresa avance.</h1>
                <div class="eyebrow light"><span></span>UN ECOSISTEMA, UNA VISIÓN</div>
                <a mat-flat-button routerLink="/registro" class="primary">Comenzar ahora</a>
              </div>

              <div class="hero-dark-right">
                <p>
                  Activa solo lo que necesitas hoy y amplía tus capacidades cuando tu
                  operación lo requiera.
                </p>
                <div class="network-icon">
                  <mat-icon>hub</mat-icon>
                </div>
              </div>
            </div>

            <div class="solution-grid-dark">
              <a routerLink="/modulos/omnicanal" class="solution-card-dark violet">
                <div class="icon-box"><mat-icon>insights</mat-icon></div>
                <h3>Liwa: analítica<br />con IA</h3>
                <span>Conocer solución <mat-icon>arrow_forward</mat-icon></span>
              </a>
              <a routerLink="/modulos/pbx-3cx" class="solution-card-dark blue">
                <div class="icon-box"><mat-icon>call</mat-icon></div>
                <h3>Telefonía<br />empresarial</h3>
                <span>Conocer solución <mat-icon>arrow_forward</mat-icon></span>
              </a>
              <div class="solution-card-dark green">
                <div class="icon-box"><mat-icon>admin_panel_settings</mat-icon></div>
                <h3>Gobierno<br />y acceso</h3>
                <span>Incluido <mat-icon>check</mat-icon></span>
              </div>
            </div>
          </div>
        </section>

        <section id="metodo" class="method">
          <div class="method-inner">
            <div class="method-left">
              <div class="eyebrow light"><span></span>IMPLEMENTACIÓN SIMPLE</div>
              <h2>De la idea a la operación en <strong>cinco pasos simples.</strong></h2>

              <div class="steps-row">
                @for (paso of pasos; track paso.titulo; let ultimo = $last) {
                  <div class="step">
                    <div class="step-icon" [style.background]="paso.color">
                      <mat-icon>{{ paso.icono }}</mat-icon>
                    </div>
                    <strong>{{ paso.titulo }}</strong>
                    <div class="step-bar"><i></i></div>
                  </div>
                  @if (!ultimo) {
                    <mat-icon class="step-arrow">arrow_forward</mat-icon>
                  }
                }
              </div>

              <div class="trust">
                <div class="trust-avatars">
                  <span>AM</span><span>LC</span><span>RV</span><span>+</span>
                </div>
                <div>
                  <strong>Diseñada para equipos que escalan</strong>
                  <small>Arquitectura segura y preparada para crecer</small>
                </div>
              </div>
            </div>

            <div class="method-right">
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

        <section id="seguridad" class="final-cta">
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
          <span class="brand-mark"><mat-icon>hub</mat-icon></span>
          <span><strong>Marca Blanca</strong><small>Business platform</small></span>
        </a>
        <span>© 2026 Marca Blanca. Plataforma empresarial.</span>
        <a routerLink="/consola/login" class="admin-link">Acceso administrativo</a>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .landing { background: #f7f9fc; color: #172033; }

    /* ---------- Header ---------- */
    .header { height: 76px; display: flex; align-items: center; justify-content: space-between; max-width: 1240px; margin: auto; padding: 0 28px; background: #f7f9fc; }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #172033; }
    .brand-mark { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; color: #fff; background: #2468d9; }
    .brand-mark mat-icon { font-size: 20px; }
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

    /* ---------- Hero oscuro + modulos ---------- */
    .hero-dark {
      position: relative;
      overflow: hidden;
      background: linear-gradient(160deg, #0b1c3d 0%, #142b57 55%, #0b1c3d 100%);
      color: #fff;
      padding: 80px 28px 60px;
    }

    .hero-dark-pattern {
      position: absolute;
      inset: 0;
      opacity: .5;
      background-image:
        linear-gradient(115deg, transparent 48%, rgba(255,255,255,.05) 49%, rgba(255,255,255,.05) 51%, transparent 52%),
        linear-gradient(25deg, transparent 48%, rgba(255,255,255,.04) 49%, rgba(255,255,255,.04) 51%, transparent 52%);
      background-size: 90px 90px;
    }

    .hero-dark-inner { position: relative; max-width: 1240px; margin: auto; }

    .hero-dark-top { display: grid; grid-template-columns: 1.2fr 1fr; gap: 60px; align-items: center; margin-bottom: 56px; }

    .hero-dark-left h1 { font-size: clamp(32px, 3.6vw, 44px); line-height: 1.18; letter-spacing: -.03em; margin: 0 0 16px; max-width: 480px; }
    .hero-dark-left .eyebrow.light { margin-bottom: 18px; }
    .hero-dark-left .primary { height: 42px; padding: 0 22px; font-size: 13px; margin-top: 10px; }

    .hero-dark-right p { color: #aebbd6; font-size: 14px; line-height: 1.7; max-width: 340px; margin: 0 0 18px; }
    .hero-dark-right { display: flex; flex-direction: column; align-items: flex-end; text-align: right; }

    .network-icon {
      width: 84px; height: 84px; border-radius: 20px;
      display: grid; place-items: center;
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.12);
    }
    .network-icon mat-icon { font-size: 40px; width: 40px; height: 40px; color: #86b4ff; }

    .solution-grid-dark { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

    .solution-card-dark {
      position: relative;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      backdrop-filter: blur(6px);
      border-radius: 16px;
      padding: 22px;
      text-decoration: none;
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: transform .2s ease, background .2s ease;
    }
    .solution-card-dark:hover { transform: translateY(-4px); background: rgba(255,255,255,.09); }

    .solution-card-dark .icon-box { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; }
    .solution-card-dark.violet .icon-box { background: linear-gradient(135deg, #a855f7, #7c3aed); }
    .solution-card-dark.blue .icon-box { background: linear-gradient(135deg, #38bdf8, #2563eb); }
    .solution-card-dark.green .icon-box { background: linear-gradient(135deg, #34d399, #059669); }

    .solution-card-dark h3 { font-size: 17px; font-weight: 700; line-height: 1.3; margin: 0; }
    .solution-card-dark span { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #93c5fd; }
    .solution-card-dark.green span { color: #6ee7b7; }
    .solution-card-dark span mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* ---------- Metodo (5 pasos + dashboard) ---------- */
    .method { background: #101a2d; color: #fff; padding: 95px max(28px, calc((100% - 1184px) / 2)); }
    .method-inner { display: grid; grid-template-columns: 1.05fr .95fr; gap: 60px; align-items: center; }
    .method h2 { font-size: 34px; line-height: 1.2; letter-spacing: -.03em; margin: 16px 0 40px; max-width: 520px; }
    .method h2 strong { color: #86b4ff; font-weight: 800; }

    .steps-row { display: flex; align-items: flex-start; gap: 6px; flex-wrap: wrap; }
    .step { display: flex; flex-direction: column; align-items: center; text-align: center; width: 84px; }
    .step-icon { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; margin-bottom: 10px; }
    .step-icon mat-icon { color: #fff; font-size: 22px; width: 22px; height: 22px; }
    .step strong { font-size: 11px; font-weight: 700; margin-bottom: 8px; }
    .step-bar { width: 100%; height: 4px; border-radius: 2px; background: #263145; overflow: hidden; }
    .step-bar i { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #38bdf8, #2563eb); }
    .step-arrow { color: #3d5170; font-size: 16px; margin-top: 14px; }

    .trust { display: flex; align-items: center; gap: 12px; margin-top: 44px; }
    .trust-avatars { display: flex; }
    .trust-avatars span { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: #dfeaff; color: #2468d9; font-size: 9px; font-weight: 800; border: 2px solid #101a2d; margin-left: -5px; }
    .trust-avatars span:first-child { margin-left: 0; }
    .trust-avatars span:nth-child(2) { background: #e6f3e9; color: #27824b; }
    .trust-avatars span:nth-child(3) { background: #f5e8dd; color: #ae6338; }
    .trust-avatars span:last-child { background: #fff; color: #101a2d; }
    .trust strong, .trust small { display: block; }
    .trust strong { font-size: 12px; }
    .trust small { color: #8a96a9; font-size: 11px; margin-top: 3px; }

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
      .hero-dark-top { grid-template-columns: 1fr; }
      .hero-dark-right { align-items: flex-start; text-align: left; }
      .solution-grid-dark { grid-template-columns: 1fr; }
      .method-inner { grid-template-columns: 1fr; }
      .dashboard-card { margin: 0 auto; }
      .steps-row { justify-content: center; }
      .step-arrow { display: none; }
      .final-cta { display: block; }
      .final-cta .primary { margin-top: 30px; }
      footer { display: block; }
      footer > span { display: block; margin-top: 18px; }
      footer .admin-link { display: block; margin-top: 8px; }
    }
  `],
})
export class HomeComponent {
  protected readonly pasos = [
    { icono: 'description', titulo: 'Planeación', color: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
    { icono: 'settings', titulo: 'Configuración', color: 'linear-gradient(135deg, #38bdf8, #2563eb)' },
    { icono: 'device_hub', titulo: 'Integración', color: 'linear-gradient(135deg, #38bdf8, #2563eb)' },
    { icono: 'fact_check', titulo: 'Pruebas', color: 'linear-gradient(135deg, #34d399, #059669)' },
    { icono: 'autorenew', titulo: 'Operación', color: 'linear-gradient(135deg, #34d399, #059669)' },
  ];
}
