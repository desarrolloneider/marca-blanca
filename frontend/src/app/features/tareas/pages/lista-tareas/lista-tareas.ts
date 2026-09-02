import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TareaService } from '../../data/tarea.service';
import { Tarea } from '../../models/tarea.model';

@Component({
  imports: [RouterLink],
  selector: 'app-lista-tareas',
  styleUrl: './lista-tareas.scss',
  templateUrl: './lista-tareas.html',
})
export class ListaTareas {
  private tareaService = inject(TareaService);

  tareas = signal<Tarea[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.tareaService.listar().subscribe({
      next: (datos) => {
        this.tareas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las tareas.');
        this.cargando.set(false);
      },
    });
  }
}