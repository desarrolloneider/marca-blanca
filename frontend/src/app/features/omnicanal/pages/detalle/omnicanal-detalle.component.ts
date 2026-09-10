import { Component } from '@angular/core';
import { ModuloDetalleComponent, DatoModuloDetalle } from '../../../../shared/components/modulo-detalle/modulo-detalle.component';

const DATO: DatoModuloDetalle = {
  codigo: 'omnicanal',
  eyebrow: 'MÓDULO DE COMUNICACIÓN',
  nombre: 'Omnicanal',
  descripcion: 'Gestiona la comunicación con tus clientes desde todos los canales, en un solo lugar.',
  icono: 'support_agent',
  colorPrincipal: 'violeta',
  highlights: [
    { icono: 'inbox', texto: 'Una sola bandeja de entrada' },
    { icono: 'chat', texto: 'WhatsApp, chat web y correo' },
    { icono: 'history', texto: 'Historial por cliente' },
  ],
  caracteristicas: [
    {
      icono: 'forum',
      color: 'violeta',
      titulo: 'Atención unificada',
      descripcion: 'Todas las conversaciones de tus clientes centralizadas en una sola bandeja de entrada.',
    },
    {
      icono: 'hub',
      color: 'azul',
      titulo: 'Múltiples canales',
      descripcion: 'WhatsApp, chat web, correo y más, conectados a un mismo flujo de atención.',
    },
    {
      icono: 'history',
      color: 'verde',
      titulo: 'Historial centralizado',
      descripcion: 'El historial completo de cada cliente disponible para todo tu equipo de atención.',
    },
  ],
  ctaTitulo: 'Centraliza la atención a tus clientes hoy mismo.',
  ctaDescripcion: 'Actívalo desde el wizard de registro o desde "Mis módulos" si tu empresa ya tiene una cuenta.',
};

@Component({
  selector: 'app-omnicanal-detalle',
  standalone: true,
  imports: [ModuloDetalleComponent],
  template: `<app-modulo-detalle [dato]="dato" />`,
})
export class OmnicanalDetalleComponent {
  protected readonly dato = DATO;
}
