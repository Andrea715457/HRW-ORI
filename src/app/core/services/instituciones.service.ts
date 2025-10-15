import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Institucion } from '../../modules/convenios/models/ori.model';

const BASE = 'http://127.0.0.1:8888/api';

type InstitucionApi = {
  id: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  representanteLegal?: string;
  representante_legal?: string;
  correo?: string;
  telefono?: string;
  paisIso?: string;
  pais_iso?: string;
  nombre_pais?: string;
};

// Soportar array directo o envoltorios comunes: {items,total}, {data,total}, {results,count}, etc.
function extractItems(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.results)) return res.results;
  return [];
}
function extractTotal(res: any, fallback: number): number {
  return (res?.total ?? res?.count ?? res?.totalCount ?? fallback) as number;
}
function mapToInstitucion(x: InstitucionApi): Institucion {
  return {
    id: x.id,
    codigo: x.codigo,
    nombre: x.nombre,
    direccion: x.direccion,
    representanteLegal: x.representanteLegal ?? x.representante_legal,
    correo: x.correo,
    telefono: x.telefono,
    paisIso: x.paisIso ?? x.pais_iso ?? '',
    nombre_pais: x.nombre_pais,
  };
}

@Injectable({ providedIn: 'root' })
export class InstitucionesService {
  private http = inject(HttpClient);

  getInstituciones(opts: { skip?: number; limit?: number } = {}): Observable<{ items: Institucion[]; total: number }> {
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
}
