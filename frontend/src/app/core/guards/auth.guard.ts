import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from '../services/session.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(Session);
  const router = inject(Router);

  if (session.estaAutenticado()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};