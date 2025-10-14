import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  message: string;
  usuario: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
private apiUrl = 'http://127.0.0.1:8888/api/auth'; // tu backend FastAPI

  constructor(private http: HttpClient) {}

  login(usuario: string, password: string): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append('usuario', usuario);
    formData.append('password', password);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, formData).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', response.usuario);
      })
    );
  }

  logout(): Observable<any> {
    // Llama al endpoint del backend para limpiar cookies (si existieran)
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
