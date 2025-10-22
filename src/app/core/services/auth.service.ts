// src/app/core/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  message: string;
  usuario: string;   // username que te devuelve el backend
  token: string;     // JWT
}

export type AppRole = 'admin' | 'director' | 'coordinador';

export interface AuthUser {
  id: number | string;
  username?: string;
  role: AppRole;
  name?: string;
  email?: string;
  // payload crudo por si necesitas algo puntual
  raw?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8888/api/auth';

  /** Usuario actual decodificado del token (o null) */
  private userSig = signal<AuthUser | null>(null);

  constructor(private http: HttpClient) {
    // hidrata estado desde localStorage al cargar la app
    const token = this.getToken();
    if (token) {
      const u = this.decodeUserFromToken(token);
      // si el token está vencido, limpiamos
      if (u && !this.isExpired(token)) {
        this.userSig.set(u);
      } else {
        this.clearStorage();
      }
    }
  }

  // =============== AUTH API ===============

  login(usuario: string, password: string): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append('usuario', usuario);
    formData.append('password', password);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, formData).pipe(
      tap((response) => {
        // compat: mantenemos las mismas keys
        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', response.usuario);

        // hidrata user desde el token
        const u = this.decodeUserFromToken(response.token);
        this.userSig.set(u);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearStorage();
        this.userSig.set(null);
      })
    );
  }

  // =============== PUBLIC API ===============

  /** Devuelve el JWT almacenado (o null) */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /** ¿Hay token y no está vencido? */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.isExpired(token)) {
      this.clearStorage();
      this.userSig.set(null);
      return false;
    }
    return true;
  }

  /** Usuario actual (decodificado del token) */
  currentUser(): AuthUser | null {
    // si aún no hay user en signal pero hay token, intentar decodificar
    const cached = this.userSig();
    if (cached) return cached;

    const token = this.getToken();
    if (!token || this.isExpired(token)) return null;

    const u = this.decodeUserFromToken(token);
    this.userSig.set(u);
    return u;
  }

  /** ¿El usuario actual tiene alguno de estos roles? */
// auth.service.ts
  hasAnyRole(rs: string[]): boolean {
    if (!rs?.length) return true;
    const me = this.currentUser();
    if (!me?.role) return false;
    const req = rs.map(r => String(r).toLowerCase());
    const my = String(me.role).toLowerCase();
    console.log(req)
    console.log(my)
    return req.includes(my);
  }


  // =============== HELPERS ===============

  /** Limpia almacenamiento local (token/usuario) */
  private clearStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  /** Decodifica el JWT y genera AuthUser tolerante a nombres de claims */
  private decodeUserFromToken(token: string): AuthUser | null {
    try {
      const payload = this.parseJwt(token);

      // ID del usuario (usa el claim disponible)
      const id = payload.sub ?? payload.user_id ?? payload.id ?? 0;

      // username (opcionales)
      const username = payload.preferred_username ?? payload.username ?? payload.usuario ?? undefined;

      // nombre y correo (opcionales)
      const name = payload.name ?? payload.nombre ?? undefined;
      const email = payload.email ?? payload.correo ?? undefined;

      // Rol (acepta varias convenciones)
      // - role / rol: string
      // - roles: string[] (toma el primero permitido)
      // - scope: "admin director" (space-separated)
      let role: AppRole | undefined =
        payload.role ?? payload.rol ?? undefined;

      if (!role && Array.isArray(payload.roles)) {
        role = (payload.roles as string[]).find(r => ['admin','director','coordinador'].includes(r)) as AppRole | undefined;
      }
      if (!role && typeof payload.scope === 'string') {
        role = (payload.scope.split(' ').find((r: string) => ['admin','director','coordinador'].includes(r)) as AppRole | undefined);
      }
      // por defecto si no viene, asumimos el rol base más restringido
      if (!role) role = 'coordinador';

      return { id, username, role, name, email, raw: payload };
    } catch {
      return null;
    }
  }

  /** Valida expiración del JWT usando el claim `exp` (segundos UNIX) */
  private isExpired(token: string): boolean {
    try {
      const payload = this.parseJwt(token);
      if (!payload?.exp) return false; // si no hay exp, no expiramos por aquí
      const nowSec = Math.floor(Date.now() / 1000);
      return nowSec >= Number(payload.exp);
    } catch {
      return true; // token inválido: trátalo como expirado
    }
  }

  /** Decodificador Base64URL → JSON */
  private parseJwt(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('JWT malformado');

    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  }
}
