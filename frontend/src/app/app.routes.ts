import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ListaTareas } from './features/tareas/pages/lista-tareas/lista-tareas';
import { DetalleTarea } from './features/tareas/pages/detalle-tarea/detalle-tarea';
import { Login } from './features/auth/pages/login/login';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'tareas',
    component: ListaTareas,
    canActivate: [authGuard],
  },
  {
    path: 'tareas/:id',
    component: DetalleTarea,
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'tareas',
    pathMatch: 'full',
  },
];