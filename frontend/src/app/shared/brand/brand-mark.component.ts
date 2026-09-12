import { Component, Input } from '@angular/core';

// Isotipo de LINELCA -- reemplaza el generico <mat-icon>hub</mat-icon> que se
// usaba como logo por defecto en el sidebar, la landing, el login y el wizard
// de registro. Usa los archivos de logo reales entregados por el usuario
// (frontend/public/logo-marca-blanca-{blanco,negro}.png), no una recreacion
// vectorial: "blanco" para fondos oscuros/de color, "negro" para fondos claros.
//
// Se dimensiona igual que un mat-icon: `height` en 1em (ancho automatico segun
// la proporcion real del logo), así que cualquier CSS existente que fijaba
// `font-size` sobre el selector viejo seguía funcionando -- solo hubo que
// cambiar los selectores de tag (`mat-icon`) por `app-brand-mark` donde
// aplicaba (ver shell.component.ts / home.component.ts).
@Component({
  selector: 'app-brand-mark',
  standalone: true,
  template: `<img [src]="'logo-marca-blanca-' + variante + '.png'" alt="LINELCA" />`,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
    img { height: 1em; width: auto; display: block; }
  `],
})
export class BrandMarkComponent {
  @Input() variante: 'blanco' | 'negro' = 'blanco';
}
