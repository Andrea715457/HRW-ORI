import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, of, tap } from 'rxjs';

export interface NotificacionConvenio {
  id: string;
  convenioCodigo: string;
  titulo: string;
  mensaje: string;
  diasRestantes: number;
  severidad: 'warn' | 'danger';
  /** Solo cliente: no viene del backend, se mantiene en memoria */
  visto?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private _list$ = new BehaviorSubject<NotificacionConvenio[]>([]);
  notifs$ = this._list$.asObservable();
  private base = 'http://127.0.0.1:8888/api';

  private _loading$ = new BehaviorSubject<boolean>(false);
  loading$ = this._loading$.asObservable();

  private _error$ = new BehaviorSubject<string | null>(null);
  error$ = this._error$.asObservable();

  unreadCount$: Observable<number> = this.notifs$.pipe(
    map(list => list.filter(n => !n.visto).length)
  );

  /** Estado local de 'visto' para preservarlo entre refrescos */
  private seenIds = new Set<string>();

  constructor(private http: HttpClient) {}

  /**
   * Carga desde el backend /notificaciones/convenios/proximos-vencer
   * @param opts filtros opcionales (mismo naming que el backend)
   */
  refreshFromServer(opts?: {
    max_days?: number;
    min_days?: number;
    solo_activos?: boolean;
    limit?: number;
    offset?: number;
  }): void {
    this._loading$.next(true);
    this._error$.next(null);

    const q = {
      max_days: 90,
      min_days: 1,
      solo_activos: true,
      limit: 100,
      offset: 0,
      ...(opts || {})
    };

    let params = new HttpParams()
      .set('max_days', q.max_days)
      .set('min_days', q.min_days)
      .set('solo_activos', String(q.solo_activos))
      .set('limit', q.limit)
      .set('offset', q.offset);

    this.http
      .get<NotificacionConvenio[]>(
        `${this.base}/notificaciones/convenios/proximos-vencer`,
        { params }
      )
      .pipe(
        tap(list => {
          // Ordenar por urgencia y preservar 'visto'
          const merged = (list || [])
            .sort((a, b) => a.diasRestantes - b.diasRestantes)
            .map(n => ({ ...n, visto: this.seenIds.has(n.id) }));

          this._list$.next(merged);
        }),
        catchError(err => {
          const msg =
            err?.error?.detail ||
            err?.error?.message ||
            'No se pudieron obtener notificaciones.';
          this._error$.next(msg);
          this._list$.next([]);
          return of([]);
        }),
        finalize(() => this._loading$.next(false))
      )
      .subscribe();
  }

  /** Marca todas como leídas (solo cliente). */
  markAllSeen(): void {
    const updated = this._list$.value.map(n => {
      this.seenIds.add(n.id);
      return { ...n, visto: true };
    });
    this._list$.next(updated);
  }
}
