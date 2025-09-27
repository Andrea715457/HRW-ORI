import { Routes } from '@angular/router';
import { NoAuthLayoutComponent } from './layouts/no-auth-layout/no-auth-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

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
        children:[
            {
                path: 'dashboard',
                loadComponent: () => import('./modules/dashboard/dashboard.component')
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
                path: '**',
                redirectTo: 'auth'
            }
        ]    
    },
    {
        path: '**',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];
