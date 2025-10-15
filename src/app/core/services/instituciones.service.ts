import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Institucion } from '../../modules/convenios/models/ori.model';

const BASE = 'http://127.0.0.1:8888/api';

type InstitucionApi = {
  id?: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  representante_legal?: string;
  correo?: string;
  telefono?: string;
  codigo_pais?: string;
  estado: 'Activo' | 'Inactivo';
  nombre_pais?: string;
};

// ---------- helpers ----------
function extractItems(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.results)) return res.results;
  return [];
}
function extractTotal(res: any, fb: number): number {
  return (res?.total ?? res?.count ?? res?.totalCount ?? fb) as number;
}
/** API (snake) -> UI (camel) */
function mapToInstitucion(x: InstitucionApi): Institucion {
  return {
    id: (x as any).id ?? 0,
    codigo: x.codigo,
    nombre: x.nombre,
    direccion: x.direccion,
    representanteLegal: x.representante_legal,   // << snake -> camel
    correo: x.correo,
    telefono: x.telefono,
    paisIso: x.codigo_pais ?? '',                // << snake -> camel
    estado: x.estado,
    nombre_pais: x.nombre_pais,

  };
}
/** limpia undefined para PUT parcial */
function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as any;
}

// ---------- service ----------
@Injectable({ providedIn: 'root' })
export class InstitucionesService {
  private http = inject(HttpClient);

  /** GET paginado */
  getInstituciones(opts: { skip?: number; limit?: number } = {}):
    Observable<{ items: Institucion[]; total: number }> {
    const params = new HttpParams()
      .set('skip', String(opts.skip ?? 0))
      .set('limit', String(opts.limit ?? 25));
    return this.http.get(`${BASE}/instituciones/`, { params }).pipe(
      map((res: any) => {
        const raw = extractItems(res);
        const total = extractTotal(res, raw.length);
        return { items: raw.map(mapToInstitucion), total };
      })
    );
  }

  /** GET por código (tu router devuelve { data: {...} } ) */
  getInstitucionByCodigo(codigo: string): Observable<Institucion | null> {
    return this.http.get(`${BASE}/instituciones/${encodeURIComponent(codigo)}`).pipe(
      map((res: any) => {
        const data = res?.data ?? null;
        return data ? mapToInstitucion(data as InstitucionApi) : null;
      })
    );
  }

  /** POST (snake_case exacto como la BD) */
  createInstitucion(body: Omit<Institucion, 'id'>): Observable<Institucion> {
    const payload = {
      codigo: body.codigo,
      nombre: body.nombre,
      direccion: body.direccion ?? null,
      representante_legal: body.representanteLegal ?? null, // << snake
      correo: body.correo ?? null,
      telefono: body.telefono ?? null,
      codigo_pais: body.paisIso,                             // << snake
      // estado lo define el backend por defecto
    };
    return this.http.post(`${BASE}/instituciones/`, payload).pipe(
      map((res: any) => mapToInstitucion((res?.data ?? res) as InstitucionApi))
    );
  }

  /** PUT por código (snake_case; parcial) */
  updateInstitucion(codigo: string, updates: Partial<Institucion>): Observable<Institucion> {
    const payload = clean({
      nombre: updates.nombre,
      direccion: updates.direccion,
      representante_legal: updates.representanteLegal, // << snake
      correo: updates.correo,
      telefono: updates.telefono,
      codigo_pais: updates.paisIso,                    // << snake
      // estado: updates.estado, // si algún día quieres permitir cambiarlo
    });
    return this.http.put(`${BASE}/instituciones/${encodeURIComponent(codigo)}`, payload).pipe(
      map((res: any) => mapToInstitucion((res?.data ?? res) as InstitucionApi))
    );
  }

  /** DELETE (lógico: estado='Inactivo') */
  deleteInstitucion(codigo: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/instituciones/${encodeURIComponent(codigo)}`);
  }
}
