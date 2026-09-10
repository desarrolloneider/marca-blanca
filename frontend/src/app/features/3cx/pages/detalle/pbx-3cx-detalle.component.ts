import { Component } from '@angular/core';
import { ModuloDetalleComponent, DatoModuloDetalle } from '../../../../shared/components/modulo-detalle/modulo-detalle.component';

const DATO: DatoModuloDetalle = {
  codigo: '3cx',
  eyebrow: 'MÓDULO DE TELEFONÍA',
  nombre: 'PBX 3CX',
  descripcion:
    'Integración telefónica para gestionar llamadas de tu empresa directamente desde la plataforma, sin duplicar infraestructura.',
  icono: 'call',
  colorPrincipal: 'azul',
  highlights: [
    { icono: 'bolt', texto: 'Conexión en minutos' },
    { icono: 'dns', texto: 'Usa tu central 3CX existente' },
    { icono: 'history', texto: 'Historial completo de llamadas' },
  ],
  caracteristicas: [
    {
      icono: 'dialpad',
      color: 'violeta',
      titulo: 'Extensiones y llamadas',
      descripcion: 'Administra las extensiones telefónicas de tu empresa y realiza/recibe llamadas desde la plataforma.',
    },
    {
      icono: 'sync_alt',
      color: 'azul',
      titulo: 'Integración con 3CX',
      descripcion: 'Conecta tu central telefónica 3CX existente sin duplicar infraestructura.',
    },
    {
      icono: 'history',
      color: 'verde',
      titulo: 'Registro de llamadas',
      descripcion: 'Historial completo de llamadas entrantes y salientes por usuario y por empresa.',
    },
  ],
  ctaTitulo: 'Listo para conectar tu central telefónica.',
  ctaDescripcion: 'Actívalo desde el wizard de registro o desde "Mis módulos" si tu empresa ya tiene una cuenta.',
};

@Component({
  selector: 'app-pbx-3cx-detalle',
  standalone: true,
  imports: [ModuloDetalleComponent],
  template: `<app-modulo-detalle [dato]="dato" />`,
})
export class Pbx3cxDetalleComponent {
  protected readonly dato = DATO;
}
