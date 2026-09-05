import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { RefreshResponse } from '../auth/models';

/**
 * Interceptor que maneja automáticamente la renovación de tokens cuando expiran.
 * Si una petición falla con 401, intenta renovar el token y reintentar la petición original.
 *
 * El refresh token rota en cada uso (el backend invalida el anterior de
 * inmediato al emitir uno nuevo), asi que si dos o mas peticiones expiran
 * casi al mismo tiempo y cada una dispara su propio refresh(), la segunda
 * llega con el token ya invalidado por la primera y el backend la rechaza
 * con 401 -- eso terminaba en un logout() injusto en medio de una sesion
 * valida. refreshInProgress$ evita esto: mientras hay un refresh en curso,
 * cualquier otra peticion que también reciba 401 se suscribe al MISMO
 * Observable en vez de llamar authService.refresh() de nuevo.
 */
let refreshInProgress$: Observable<RefreshResponse> | null = null;

export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      // Solo manejamos errores HTTP 401 (Unauthorized)
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // No intentamos renovar si la petición ya es de login o refresh
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
      if (isAuthEndpoint) {
        return throwError(() => error);
      }

      // Si ya hay un refresh en curso (disparado por otra petición que
      // también recibió 401), nos sumamos a ese en vez de duplicarlo.
      if (!refreshInProgress$) {
        refreshInProgress$ = authService.refresh().pipe(
          shareReplay(1),
          finalize(() => {
            refreshInProgress$ = null;
          })
        );
      }

      return refreshInProgress$.pipe(
        switchMap(() => {
          // Token renovado exitosamente, reintentar la petición original
          const token = authService.getToken();
          if (!token) {
            authService.logout();
            return throwError(() => error);
          }

          // Clonar la petición con el nuevo token
          const clonedReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          });
          return next(clonedReq);
        }),
        catchError((refreshError) => {
          // Si falla la renovación, hacer logout
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
