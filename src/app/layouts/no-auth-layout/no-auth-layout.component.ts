import { Component,  ElementRef, HostListener, ViewChild } from '@angular/core';
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
  @ViewChild('tipWrap', { static: false }) tipWrap?: ElementRef<HTMLElement>;
  showTip = false;
  private tipTimer: any = null;
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
  
  toggleTip(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    this.showTip = !this.showTip;

    // autocerrar en 4s cuando se abra
    if (this.showTip) {
      clearTimeout(this.tipTimer);
      this.tipTimer = setTimeout(() => this.closeTip(), 4000);
    }
  }

  closeTip() {
    this.showTip = false;
    clearTimeout(this.tipTimer);
  }

  // cerrar con Escape
  @HostListener('document:keydown.escape')
  onEsc() { this.closeTip(); }

  // cerrar al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const wrap = this.tipWrap?.nativeElement;
    if (wrap && !wrap.contains(e.target as Node)) this.closeTip();
  }
}
