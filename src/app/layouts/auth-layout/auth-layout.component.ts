import { AfterViewInit, OnInit, Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-auth-layout',
  imports: [SidebarComponent, NavbarComponent, RouterOutlet],
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent implements OnInit, AfterViewInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Establecer el estado inicial basado en la ruta actual
    this.updateBackgroundDisplay(this.router.url);
  }

  ngAfterViewInit() {
    // Suscribirse a los eventos de navegación
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateBackgroundDisplay(event.urlAfterRedirects);
      });
  }

  private updateBackgroundDisplay(url: string) {
    const bg = document.getElementById('startBg');
    if (bg) {
      bg.style.display = url === '/auth' ? 'flex' : 'none';
    }
  }
}
