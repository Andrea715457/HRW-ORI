import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";

@Component({
  selector: 'app-auth-layout',
  imports: [SidebarComponent, NavbarComponent, RouterOutlet],
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent { }
