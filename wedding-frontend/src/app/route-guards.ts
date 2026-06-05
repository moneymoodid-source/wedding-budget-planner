import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

function getPostLoginUrl(authService: AuthService): string {
  const user = authService.currentUser();

  if (!user) {
    return '/login';
  }

  return user.role === 'admin' ? '/admin' : '/wedding-planner';
}

export const guestOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()) {
    return router.createUrlTree([getPostLoginUrl(authService)]);
  }

  return true;
};

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.currentUser()) {
    return router.createUrlTree(['/login']);
  }

  return true;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (user.role !== 'admin') {
    return router.createUrlTree(['/wedding-planner']);
  }

  return true;
};

export const plannerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (user.role === 'admin') {
    return router.createUrlTree(['/admin']);
  }

  return true;
};
