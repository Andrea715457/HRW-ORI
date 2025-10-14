import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-no-auth-layout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './no-auth-layout.component.html',
  styleUrl: './no-auth-layout.component.css'
})
export class NoAuthLayoutComponent {
  usuario = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    if (!this.usuario || !this.password) {
      this.errorMessage = 'Por favor, ingresa tus credenciales.';
      return;
    }

    this.authService.login(this.usuario, this.password).subscribe({
      next: () => {
        this.errorMessage = '';
        this.router.navigate(['/auth/dashboard']); 
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Credenciales inválidas';
      }
    });
  }
}
