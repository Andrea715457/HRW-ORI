import { Routes } from '@angular/router';
import { NoAuthLayoutComponent } from './layouts/no-auth-layout/no-auth-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: NoAuthLayoutComponent
    },
    {
        path: 'auth',
        component: AuthLayoutComponent,
        canActivate: [authGuard],
        children:[
            {
                path: 'dashboard',
                loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'convenios',
                loadComponent: () => import('./modules/convenios/convenios.component')
            },
            {
                path: 'snies',
                loadComponent: () => import('./modules/snies/snies.component')
            },
            {
                path: 'cargar-excel',
                loadComponent: () => import('./modules/cargar/cargar.component')
            },
                  {
        path: 'admin/usuarios',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./modules/usuarios/users.component').then(m => m.default)
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' } 
    ]
    },
    {
        path: '**',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];
