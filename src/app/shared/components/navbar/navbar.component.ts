import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  usuarioActual: string | null = '';

  constructor(private authService: AuthService, private router: Router) {}
  ngOnInit(): void {
    // Obtiene el nombre de usuario desde localStorage al cargar el componente
    this.usuarioActual = localStorage.getItem('usuario');
  }
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
        // Incluso si el backend falla, forzamos logout local
        this.authService.logout().subscribe(); 
        this.router.navigate(['/login']);
      }
    });
  }
}
