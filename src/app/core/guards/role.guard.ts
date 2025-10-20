import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard  {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const required = (route.data?.['roles'] as string[]) || [];
    const has = this.auth.hasAnyRole(required); // implementa en tu AuthService
    if (!has) this.router.navigateByUrl('/');
    return has;
  };
}
