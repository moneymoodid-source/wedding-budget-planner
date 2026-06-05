import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { App as PlannerComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { adminGuard, guestOnlyGuard, plannerGuard } from './route-guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'landing'
  },
  {
    path: 'landing',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestOnlyGuard],
    data: { mode: 'login' }
  },
  {
    path: 'register',
    component: LoginComponent,
    canActivate: [guestOnlyGuard],
    data: { mode: 'register' }
  },
  {
    path: 'wedding-planner',
    component: PlannerComponent,
    canActivate: [plannerGuard]
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard]
  },
  {
    path: '**',
    redirectTo: 'landing'
  }
];
