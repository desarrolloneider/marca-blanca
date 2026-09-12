import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../core/auth/auth.service';
import { TemaPaginaService, TemaPagina } from '../core/temas/tema-pagina.service';
import { MarcaService } from '../core/identidad-visual/marca.service';
import { BrandMarkComponent } from '../shared/brand/brand-mark.component';

const CODIGO_A_TEMA_PAGINA: Record<number, TemaPagina> = { 1: 'clasico', 2: 'compacto', 3: 'encabezado' };

// Los items de navegacion son los mismos en los 2 layouts (sidebar lateral y
// header arriba) -- se definen una sola vez y cada template los recorre con
// @for, para no duplicar la lista de rutas en dos lugares que se desincronizarian.
interface ItemNav {
  ruta: string;
  icono: string;
  etiqueta: string;
  exacta?: boolean;
}
const ITEMS_NAV: ItemNav[] = [
  { ruta: '/mis-modulos', icono: 'apps', etiqueta: 'Mis módulos', exacta: true },
  { ruta: '/usuarios', icono: 'group', etiqueta: 'Usuarios y accesos' },
  { ruta: '/mi-marca', icono: 'palette', etiqueta: 'Marca y diseño' },
  { ruta: '/panel/omnicanal/liwa/config', icono: 'settings', etiqueta: 'Configuración de Liwa' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, BrandMarkComponent],
  template: `
    @if (temaPagina.tema() === 'encabezado') {
      <!-- Layout "Header arriba": barra de navegacion horizontal, sin sidebar
           lateral -- pensado para quien prefiere mas ancho para el contenido. -->
      <div class="app-shell tema-encabezado">
        <header class="topbar-full">
          <a routerLink="/mis-modulos" class="brand-mini">
            <span class="brand-mark"><app-brand-mark /></span>
            <span><strong>LINELCA</strong><small>{{ empresa() }}</small></span>
          </a>

          <nav class="topnav" aria-label="Navegación principal">
            @for (item of itemsNav; track item.ruta) {
              <a [routerLink]="item.ruta" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exacta }">
                <mat-icon>{{ item.icono }}</mat-icon>
                <span>{{ item.etiqueta }}</span>
              </a>
            }
          </nav>

          <div class="topbar-actions">
            <button mat-icon-button aria-label="Notificaciones"><mat-icon>notifications_none</mat-icon><span class="notification-dot"></span></button>
            <div class="profile"><div class="avatar">{{ initials() }}</div><div><strong>{{ userName() }}</strong><span>Administrador</span></div></div>
            <button mat-icon-button aria-label="Cerrar sesión" (click)="auth.logout()"><mat-icon>logout</mat-icon></button>
          </div>
        </header>

        <div class="breadcrumb-bar"><span>Workspace</span><mat-icon>chevron_right</mat-icon><strong>{{ title() }}</strong></div>
        <main class="page-content"><router-outlet /></main>
      </div>
    } @else {
      <!-- Layout clasico/compacto: sidebar lateral (el original). -->
      <div class="app-shell tema-{{ temaPagina.tema() }}">
        <aside class="sidebar">
          <div class="sidebar-brand">
            <div class="brand-mark"><app-brand-mark /></div>
            <div><strong>LINELCA</strong><span>Business platform</span></div>
          </div>
          <div class="workspace-card">
            <span class="workspace-label">ESPACIO DE TRABAJO</span>
            <div class="workspace-name"><span class="workspace-dot"></span>{{ empresa() }}</div>
            <span class="workspace-status"><mat-icon>verified</mat-icon> Cuenta activa</span>
          </div>
          <nav class="sidebar-nav" aria-label="Navegación principal">
            <span class="nav-section">OPERACIÓN</span>
            @for (item of itemsNav.slice(0, 2); track item.ruta) {
              <a [routerLink]="item.ruta" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exacta }" (mousemove)="onSpotlight($event)">
                <mat-icon>{{ item.icono }}</mat-icon><span>{{ item.etiqueta }}</span>
              </a>
            }
            <span class="nav-section">CONFIGURACIÓN</span>
            @for (item of itemsNav.slice(2); track item.ruta) {
              <a [routerLink]="item.ruta" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exacta }" (mousemove)="onSpotlight($event)">
                <mat-icon>{{ item.icono }}</mat-icon><span>{{ item.etiqueta }}</span>
              </a>
            }
          </nav>
          <div class="sidebar-help"><mat-icon>support</mat-icon><div><strong>¿Necesitas ayuda?</strong><span>Consulta con soporte</span></div></div>
          <button class="logout-button" type="button" (click)="auth.logout()"><mat-icon>logout</mat-icon><span>Cerrar sesión</span></button>
        </aside>
        <div class="main-shell">
          <header class="topbar">
            <div class="breadcrumb"><span>Workspace</span><mat-icon>chevron_right</mat-icon><strong>{{ title() }}</strong></div>
            <div class="topbar-actions">
              <button mat-icon-button aria-label="Notificaciones"><mat-icon>notifications_none</mat-icon><span class="notification-dot"></span></button>
              <div class="profile"><div class="avatar">{{ initials() }}</div><div><strong>{{ userName() }}</strong><span>Administrador</span></div><mat-icon>expand_more</mat-icon></div>
            </div>
          </header>
          <main class="page-content"><router-outlet /></main>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .app-shell { min-height: 100vh; display: flex; background: #f5f7fb; color: #172033; }
    .sidebar {
      width: 256px; flex: 0 0 256px; background: #101a2d; color: #d7deeb; padding: 24px 16px 18px; display: flex;
      flex-direction: column; box-sizing: border-box; height: 100vh; position: sticky; top: 0; overflow-y: auto;
      overflow-x: hidden;
    }
    .sidebar-brand { display: flex; align-items: center; gap: 11px; color: #fff; padding: 0 10px 28px; }
    .brand-mark { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: linear-gradient(135deg,#2f7cf6,#79b4ff); color: white; }
    .brand-mark app-brand-mark { font-size: 20px; }.sidebar-brand strong,.sidebar-brand span { display:block; }.sidebar-brand strong { font-size: 15px; letter-spacing: .1px; }.sidebar-brand span { color:#8492aa; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; margin-top: 3px; }
    .workspace-card { background: #18243b; border: 1px solid #263653; border-radius: 12px; padding: 13px; margin: 0 2px 26px; }.workspace-label,.nav-section { color:#7787a2; font-size:10px; font-weight:700; letter-spacing:.12em; }.workspace-name { display:flex; align-items:center; gap:8px; color:#fff; font-weight:600; font-size:13px; margin:9px 0 7px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.workspace-dot { width:8px; height:8px; border-radius:50%; background:#4ade80; box-shadow:0 0 0 3px rgba(74,222,128,.13); }.workspace-status { display:flex; align-items:center; gap:5px; color:#8fa0ba; font-size:11px; }.workspace-status mat-icon { width:14px; height:14px; font-size:14px; color:#4ade80; }
    .sidebar-nav { display:flex; flex-direction:column; gap:4px; }.nav-section { margin: 0 12px 7px; }.nav-section:not(:first-child) { margin-top: 22px; }
    .sidebar-nav a {
      position: relative; display:flex; align-items:center; gap:12px; color:#9daac0; text-decoration:none;
      border-radius:9px; padding:11px 12px; font-size:13px; overflow: hidden; isolation: isolate;
      transition: background .18s ease,color .18s ease,transform .18s ease;
    }
    .sidebar-nav a mat-icon { width:19px; height:19px; font-size:19px; }
    /* Spotlight que sigue al mouse (onSpotlight() actualiza --x/--y) -- mismo
       recurso visual que las tarjetas con "glow" de uiable.com, aplicado al
       link en vez de a toda la pagina. */
    .sidebar-nav a::before {
      content: ''; position: absolute; inset: 0; z-index: -1; opacity: 0; pointer-events: none;
      background: radial-gradient(180px circle at var(--x, 50%) var(--y, 50%), rgba(120,180,255,0.65), rgba(120,180,255,0.15) 45%, transparent 70%);
      transition: opacity .2s ease;
    }
    .sidebar-nav a:hover { background:#1b2b47; color:#fff; transform:translateX(2px); }
    .sidebar-nav a:hover::before { opacity: 1; }
    .sidebar-nav a.active { background:#2468d9; color:#fff; box-shadow:0 6px 16px rgba(36,104,217,.22); }
    .sidebar-nav a.active::before { display: none; }
    .sidebar-help { margin-top:auto; display:flex; gap:10px; align-items:center; border-top:1px solid #273650; padding:18px 8px; color:#9daac0; }.sidebar-help mat-icon { color:#6ea7ff; }.sidebar-help strong,.sidebar-help span { display:block; }.sidebar-help strong { color:#d7deeb; font-size:12px; }.sidebar-help span { font-size:11px; margin-top:3px; }.logout-button { display:flex; align-items:center; gap:11px; border:0; border-top:1px solid #273650; padding:15px 10px 0; margin:0; background:none; color:#9daac0; cursor:pointer; font:inherit; font-size:13px; text-align:left; }.logout-button:hover { color:#fff; }.logout-button mat-icon { font-size:19px; }
    .main-shell { flex:1; min-width:0; }.topbar { height:72px; box-sizing:border-box; background:#fff; border-bottom:1px solid #e6eaf1; display:flex; align-items:center; justify-content:space-between; padding:0 34px; }.breadcrumb { display:flex; align-items:center; gap:7px; color:#8b97aa; font-size:13px; }.breadcrumb mat-icon { width:17px; height:17px; font-size:17px; }.breadcrumb strong { color:#26334a; font-weight:600; }.topbar-actions { display:flex; align-items:center; gap:18px; }.topbar-actions button { position:relative; color:#66748a; }.notification-dot { position:absolute; top:8px; right:8px; width:6px; height:6px; border-radius:50%; background:#ef6b5f; border:2px solid white; }.profile { display:flex; align-items:center; gap:9px; }.avatar { width:34px; height:34px; border-radius:10px; background:#e6efff; color:#2468d9; display:grid; place-items:center; font-size:12px; font-weight:800; }.profile strong,.profile span { display:block; }.profile strong { font-size:12px; color:#27344a; }.profile span { font-size:11px; color:#8b97aa; margin-top:2px; }.profile > mat-icon { color:#8b97aa; font-size:18px; }.page-content { padding: 30px 34px 48px; max-width: 1500px; margin:0 auto; box-sizing:border-box; }
    .app-shell.tema-compacto .sidebar { width: 210px; flex-basis: 210px; padding: 16px 12px 14px; }
    .app-shell.tema-compacto .page-content { padding: 18px 22px 30px; }
    .app-shell.tema-compacto .topbar { height: 58px; padding: 0 22px; }
    .app-shell.tema-compacto .sidebar-nav a { padding: 8px 10px; font-size: 12.5px; }
    @media (max-width: 800px) { .sidebar { width:70px; flex-basis:70px; padding:20px 10px; }.sidebar-brand { padding:0 8px 28px; }.sidebar-brand > div:last-child,.workspace-card,.sidebar-nav span,.sidebar-help div,.logout-button span { display:none; }.sidebar-nav a { justify-content:center; padding:12px; }.sidebar-help { justify-content:center; padding:18px 0; }.logout-button { justify-content:center; padding-left:0; padding-right:0; }.topbar { padding:0 18px; }.breadcrumb span,.breadcrumb mat-icon { display:none; }.profile > div:last-of-type,.profile > mat-icon { display:none; }.page-content { padding:22px 16px 36px; } }

    /* ---------- Layout "Header arriba" (tema-encabezado) ---------- */
    .app-shell.tema-encabezado { flex-direction: column; }
    .topbar-full {
      height: 68px; box-sizing: border-box; background: #101a2d; color: #d7deeb;
      display: flex; align-items: center; gap: 32px; padding: 0 28px;
      position: sticky; top: 0; z-index: 10;
    }
    .brand-mini { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #fff; flex-shrink: 0; }
    .brand-mini .brand-mark { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; background: linear-gradient(135deg,#2f7cf6,#79b4ff); }
    .brand-mini .brand-mark app-brand-mark { font-size: 18px; }
    .brand-mini strong, .brand-mini small { display: block; }
    .brand-mini strong { font-size: 14px; }
    .brand-mini small { font-size: 10px; color: #8492aa; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .topnav { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; overflow-x: auto; }
    .topnav a {
      display: flex; align-items: center; gap: 8px; color: #9daac0; text-decoration: none;
      border-radius: 9px; padding: 9px 14px; font-size: 13px; white-space: nowrap;
      transition: background .18s ease, color .18s ease;
    }
    .topnav a mat-icon { width: 18px; height: 18px; font-size: 18px; }
    .topnav a:hover { background: #1b2b47; color: #fff; }
    .topnav a.active { background: #2468d9; color: #fff; }
    .topbar-full .topbar-actions { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
    .topbar-full .topbar-actions button { color: #9daac0; }
    .topbar-full .profile { display: flex; align-items: center; gap: 9px; }
    .topbar-full .profile strong, .topbar-full .profile span { display: block; color: #fff; }
    .topbar-full .profile strong { font-size: 12px; }
    .topbar-full .profile span { font-size: 10px; color: #8492aa; margin-top: 1px; }
    .breadcrumb-bar {
      display: flex; align-items: center; gap: 7px; color: #8b97aa; font-size: 13px;
      padding: 18px 34px 0; max-width: 1500px; margin: 0 auto; width: 100%; box-sizing: border-box;
    }
    .breadcrumb-bar mat-icon { width: 17px; height: 17px; font-size: 17px; }
    .breadcrumb-bar strong { color: #26334a; font-weight: 600; }
    .tema-encabezado .page-content { padding: 14px 34px 48px; max-width: 1500px; margin: 0 auto; box-sizing: border-box; }
    @media (max-width: 900px) {
      .topbar-full { flex-wrap: wrap; height: auto; padding: 12px 18px; gap: 12px; }
      .topnav { order: 3; width: 100%; }
      .breadcrumb-bar { padding: 14px 18px 0; }
      .tema-encabezado .page-content { padding: 14px 18px 36px; }
    }
  `],
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly temaPagina = inject(TemaPaginaService);
  protected readonly itemsNav = ITEMS_NAV;
  private readonly marcaService = inject(MarcaService);

  constructor() {
    // El tema de pagina se elige una vez en el wizard de registro y ahi
    // queda guardado en el backend -- pero TemaPaginaService por su cuenta
    // solo conoce lo ultimo que se guardo en localStorage DE ESTE
    // navegador. En cualquier otro navegador/dispositivo (o si se cambia
    // despues desde "Experiencia de acceso") se veia siempre el default.
    // Al entrar al shell, la fuente de verdad real (el backend) sincroniza
    // el valor correcto.
    this.marcaService.obtener().subscribe({
      next: (marca) => {
        const tema = marca.tipoPantallaPrincipal ? CODIGO_A_TEMA_PAGINA[marca.tipoPantallaPrincipal] : undefined;
        if (tema) {
          this.temaPagina.elegir(tema);
        }
      },
      error: () => {
        // Sin marca configurada todavia -- se queda con lo que ya habia en
        // localStorage (o el default), no es un error visible para el usuario.
      },
    });
  }

  // Actualiza la posicion del "spotlight" (--x/--y, en % del propio link)
  // que sigue al cursor sobre cada item del menu -- ver .sidebar-nav a::before.
  protected onSpotlight(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty('--y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  }

  protected empresa(): string {
    return localStorage.getItem('mp_identificador_empresa') || 'Mi empresa';
  }
  protected userName(): string {
    return this.auth.currentUser()?.correo || 'Administrador';
  }
  protected initials(): string {
    const correo = this.auth.currentUser()?.correo;
    if (!correo) {
      return 'AD';
    }
    // El correo es lo unico que tenemos del usuario (ver UserInfo) -- las
    // iniciales salen de la parte antes del "@", separada por puntos o
    // guiones (ej. "juan.perez@..." -> "JP"), no de un nombre real que no
    // llega del backend.
    const usuario = correo.split('@')[0];
    const partes = usuario.split(/[._-]+/).filter(Boolean);
    return partes
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase();
  }
  protected title(): string {
    const path = globalThis.location.pathname;
    if (path.includes('mi-marca') || path.includes('tema-login')) {
      return 'Marca y diseño';
    }
    if (path.includes('usuarios')) {
      return 'Usuarios y accesos';
    }
    if (path.includes('panel/omnicanal/liwa/config')) {
      return 'Configuración de Liwa';
    }
    if (path.includes('panel/omnicanal')) {
      return 'Omnicanal';
    }
    if (path.includes('panel/pbx-3cx')) {
      return 'PBX 3CX';
    }
    return 'Mis módulos';
  }
}