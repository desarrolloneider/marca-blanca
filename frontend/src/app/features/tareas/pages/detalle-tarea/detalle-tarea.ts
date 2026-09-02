import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TareaService } from '../../data/tarea.service';
import { Tarea } from '../../models/tarea.model';

@Component({
  imports: [],
  selector: 'app-detalle-tarea',
  styleUrl: './detalle-tarea.scss',
  templateUrl: './detalle-tarea.html',
})
export class DetalleTarea {
  private route = inject(ActivatedRoute);
  private tareaService = inject(TareaService);

  tarea = signal<Tarea | null>(null);
  cargando = signal(true);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tareaService.obtenerPorId(id).subscribe((datos) => {
        this.tarea.set(datos);
        this.cargando.set(false);
      });
    }
  }
}