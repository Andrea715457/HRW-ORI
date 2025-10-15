import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Pais, TipoMovilidad } from '../../modules/convenios/models/ori.model';

// Ajusta si usas environments
const BASE = 'http://127.0.0.1:8888/api';

type PaisApi = { codigoISO?: string; codigo_iso?: string; nombre: string; codigoISO2?: string; codigo_iso2?: string };
type TipoMovilidadApi = { codigo: string; nombre: string };

// El backend puede responder { data: [...] } o directamente [...]
function unwrap<T>(res: any): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && Array.isArray(res.data)) return res.data as T[];
  return [];
}

@Injectable({ providedIn: 'root' })
export class UtilsService {
  private http = inject(HttpClient);

  getPaises(): Observable<Pais[]> {
    return this.http.get(`${BASE}/utils/pais`).pipe(
      map((raw) => unwrap<PaisApi>(raw)),
      map((list) =>
        list.map((p) => ({
          codigoISO: p.codigoISO ?? p.codigo_iso ?? '',
          nombre: p.nombre,
          codigoISO2: p.codigoISO2 ?? p.codigo_iso2,
        }))
      ),
      map((arr) => arr.sort((a, b) => a.nombre.localeCompare(b.nombre)))
    );
  }

  getTiposMovilidad(): Observable<TipoMovilidad[]> {
    return this.http.get(`${BASE}/utils/tipo_movilidad`).pipe(
      map((raw) => unwrap<TipoMovilidadApi>(raw)),
      map((list) =>
        list.map((t) => ({
          codigo: t.codigo,
          nombre: t.nombre,
        }))
      ),
      map((arr) => arr.sort((a, b) => a.nombre.localeCompare(b.nombre)))
    );
  }
}
