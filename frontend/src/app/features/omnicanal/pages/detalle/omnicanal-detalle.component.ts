import { Component } from '@angular/core';
import { ModuloDetalleComponent, DatoModuloDetalle } from '../../../../shared/components/modulo-detalle/modulo-detalle.component';

const DATO: DatoModuloDetalle = {
  codigo: 'omnicanal',
  eyebrow: 'ANALÍTICA DE CONVERSACIONES CON IA',
  nombre: 'Liwa',
  descripcion:
    'Convierte cada chat de WhatsApp en datos accionables. En vez de que un supervisor lea conversación por conversación, la IA analiza automáticamente cada caso archivado y extrae motivo de contacto, sentimiento, resolución, abandono y oportunidades de venta.',
  icono: 'insights',
  colorPrincipal: 'violeta',
  highlights: [
    { icono: 'auto_awesome', texto: 'Análisis automático con IA' },
    { icono: 'leaderboard', texto: 'Ranking objetivo por asesor' },
    { icono: 'campaign', texto: 'ROI de tus anuncios de Meta' },
  ],
  caracteristicas: [
    {
      icono: 'visibility',
      color: 'violeta',
      titulo: 'Visibilidad total del servicio',
      descripcion: 'Sabe en tiempo real cuántas conversaciones hay, cómo van y dónde están los cuellos de botella, sin auditar manualmente.',
    },
    {
      icono: 'leaderboard',
      color: 'azul',
      titulo: 'Desempeño por asesor',
      descripcion: 'Ranking objetivo de quién resuelve bien, quién genera abandono y quién convierte oportunidades de venta.',
    },
    {
      icono: 'troubleshoot',
      color: 'verde',
      titulo: 'Causa raíz del abandono',
      descripcion: 'No solo cuánta gente se va sin resolver, sino si fue porque el cliente se cansó o porque el asesor lo dejó colgado.',
    },
    {
      icono: 'campaign',
      color: 'violeta',
      titulo: 'ROI de pauta publicitaria',
      descripcion: 'Separa las conversaciones que vinieron de Meta Ads del resto y muestra qué tan bien se atienden esos leads.',
    },
    {
      icono: 'support_agent',
      color: 'azul',
      titulo: 'Indicadores tipo call center',
      descripcion: 'FCR, esfuerzo del cliente y sentimiento aplicados a WhatsApp, con dashboards en vivo sin refrescar.',
    },
  ],
  ctaTitulo: 'El historial de WhatsApp, convertido en panel de control gerencial.',
  ctaDescripcion: 'Con inteligencia artificial incluida — actívalo desde el wizard de registro o desde "Mis módulos" si tu empresa ya tiene una cuenta.',
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
