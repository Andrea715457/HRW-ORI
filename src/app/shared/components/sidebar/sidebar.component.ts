import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    const openButton = document.getElementById('open-sidebar');
    const closeButton = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const menuLinks = document.querySelectorAll('#sidebar a');

    if (openButton && closeButton && sidebar) {
      openButton.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
      });

      closeButton.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
      });

      menuLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 1280) {
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
          }
        });
      });

      // Cerrar el sidebar al cambiar de ruta en pantallas pequeñas
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          if (window.innerWidth < 1280) {
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
          }
        });
    }
  }
}
