import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { EstadoUsuario, RolUsuario, Usuario } from '../models/usuario.model';

type ApiList<T> = { total: number; data: T[] };
type ApiItem<T> = { data: T };

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private BASE = 'http://127.0.0.1:8888/api/usuarios';

  list(opts: { skip?: number; limit?: number } = {}): Observable<{ items: Usuario[]; total: number }> {
    const params = new HttpParams()
      .set('skip', String(opts.skip ?? 0))
      .set('limit', String(opts.limit ?? 25));
    return this.http.get<ApiList<any>>(this.BASE, { params }).pipe(
      map(res => ({
        total: res.total ?? (res.data?.length ?? 0),
        items: (res.data ?? []).map(this.mapToUsuario),
      }))
    );
  }

  get(id: number): Observable<Usuario> {
    return this.http.get<ApiItem<any>>(`${this.BASE}/${id}`).pipe(map(r => this.mapToUsuario(r.data)));
  }

  create(body: {
    usuario: string; password: string; nombre?: string; correo?: string; rol?: RolUsuario; estado?: EstadoUsuario;
  }): Observable<Usuario> {
    return this.http.post<ApiItem<any>>(this.BASE, body).pipe(map(r => this.mapToUsuario(r.data)));
  }

  update(id: number, updates: Partial<Usuario> & { password?: string }): Observable<Usuario> {
    return this.http.put<ApiItem<any>>(`${this.BASE}/${id}`, updates).pipe(map(r => this.mapToUsuario(r.data)));
  }

  deactivate(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.BASE}/${id}/desactivar`, {});
  }

  // Activar reutilizando PUT
  activate(id: number): Observable<Usuario> {
    return this.update(id, { estado: 'Activo' });
  }

  // Flujos auth 
  forgotPassword(correo: string) {
    return this.http.post('http://127.0.0.1:8888/api/auth/forgot-password', { correo });
  }
  resetPassword(token: string, password: string) {
    return this.http.post('http://127.0.0.1:8888/api/auth/reset-password', { token, password });
  }

  // mapper
  private mapToUsuario = (x: any): Usuario => ({
    id: x.id,
    usuario: x.usuario,
    nombre: x.nombre ?? undefined,
    correo: x.correo ?? undefined,
    rol: x.rol as RolUsuario,
    estado: x.estado as EstadoUsuario,
    ultimo_acceso: x.ultimo_acceso ?? undefined,
    creado_en: x.creado_en ?? undefined,
    actualizado_en: x.actualizado_en ?? undefined,
  });
}
