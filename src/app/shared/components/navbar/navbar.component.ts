import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  NotificacionesService,
  NotificacionConvenio
} from '../../../core/services/notificaciones.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  usuarioActual: string | null = '';
  isModalOpen = false;

  notifs$!: Observable<NotificacionConvenio[]>;
  unreadCount$!: Observable<number>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notifs: NotificacionesService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = localStorage.getItem('usuario');

    // Streams para el template
    this.notifs$ = this.notifs.notifs$;
    this.unreadCount$ = this.notifs.unreadCount$;
    this.loading$ = this.notifs.loading$;
    this.error$ = this.notifs.error$;

    // Primer fetch
    this.notifs.refreshFromServer({ max_days: 90, min_days: 1, solo_activos: true });
  }

  openNotifications(): void {
    this.isModalOpen = true;
    this.notifs.markAllSeen(); // marcar como leídas al abrir
  }
  closeNotifications(): void {
    this.isModalOpen = false;
  }

  manualRefresh(): void {
    this.notifs.refreshFromServer({ max_days: 90, min_days: 1, solo_activos: true });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
        this.authService.logout().subscribe();
        this.router.navigate(['/login']);
      }
    });
  }
}
