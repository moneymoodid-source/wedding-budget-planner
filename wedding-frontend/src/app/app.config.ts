import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // <--- PENTING
import { provideLottieOptions } from 'ngx-lottie';

import { routes } from './app.routes';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideLottieOptions({
      player: () => import('lottie-web')
    }) // <--- Tambahkan ini agar AuthService bisa request ke Backend
  ]
};