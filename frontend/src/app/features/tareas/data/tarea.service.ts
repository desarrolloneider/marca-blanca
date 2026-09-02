import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tarea } from '../models/tarea.model';

type FiltrosTarea = Record<string, string>;

@Service()
export class TareaService {
  private http = inject(HttpClient);

  listar(filtros?: FiltrosTarea): Observable<Tarea[]> {
    return this.http.get<Tarea[]>('/api/v1/tareas', { params: filtros });
  }

  // AGREGADO (no está en el TO-BE): necesario para que detalle-tarea funcione.
  // El documento solo define listar() y cambiarEstado() — confirma con el equipo
  // de backend que /api/v1/tareas/:id existe con esta forma antes de dar por buena esta ruta.
  obtenerPorId(id: string): Observable<Tarea> {
    return this.http.get<Tarea>(`/api/v1/tareas/${id}`);
  }

  cambiarEstado(id: string, accion: 'iniciar' | 'pausar' | 'finalizar'): Observable<Tarea> {
    return this.http.put<Tarea>(`/api/v1/tareas/${id}/${accion}`, {});
  }
}