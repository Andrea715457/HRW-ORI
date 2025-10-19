import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Convenio } from '../../modules/convenios/models/ori.model';

@Injectable({ providedIn: 'root' })
export class ConveniosService {
  private http = inject(HttpClient);
  private baseUrl = 'http://127.0.0.1:8888/api/convenios';

  // === GET /convenios/movilidades ===
getConvenios(params?: { skip?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.limit) query.set('limit', String(params.limit));

  return this.http
    .get<{ total: number; data: any[] }>(`${this.baseUrl}/movilidades?${query.toString()}`)
    .pipe(
      map(res => ({
        total: res.total,
        data: (res.data || []).map((c: any) => ({
          id: 0,
          codigo: c.codigo,
          nombre: c.nombre_convenio ?? c.nombre,
          tipoConvenio: c.tipo,
          fechaInicio: String(c.fecha_inicio ?? '').substring(0, 10),
          fechaFinalizacion: String(c.fecha_finalizacion ?? '').substring(0, 10),
          estado: (c.estado || '').toLowerCase(),
          institucionCodigo: c.codigo_institucion ?? '',  // puede no venir en el listado
          nombreInstitucion: c.nombre_institucion ?? '',  // 👈 USAR PARA LA TABLA
          tipos: ((c['Movilidades del convenio'] || c.tipos_movilidad || []) as string[])
                  .map(x => ({ tipoCodigo: x })),         // en listado suelen venir NOMBRES; se muestran igual
        })),
      }))
    );
}


  // === CRUD ===
getConvenioByCodigo(codigo: string) {
  const asDateInput = (d: string | null) => (d ? String(d).substring(0, 10) : '');

  return this.http.get<{ data: any }>(`${this.baseUrl}/${encodeURIComponent(codigo)}`).pipe(
    map(res => {
      const x = res.data;
      return {
        id: 0,
        codigo: x.codigo,
        nombre: x.nombre,
        tipoConvenio: x.tipo,
        fechaInicio: asDateInput(x.fecha_inicio),
        fechaFinalizacion: asDateInput(x.fecha_finalizacion),
        estado: (x.estado || 'activo').toLowerCase(),
        institucionCodigo: x.codigo_institucion,         // 👈
        tipos: (x.tipos_movilidad || []).map((cod: string) => ({ tipoCodigo: cod })), // chips
      } as Convenio;
    })
  );
}

createConvenio(body: any) {
  const tipos = (body.tipos ?? []).map((x: any) => typeof x === 'string' ? x : x?.tipoCodigo);
  const payload = {
    codigo: body.codigo,
    nombre: body.nombre,
    tipo: body.tipoConvenio,
    fecha_inicio: body.fechaInicio,
    fecha_finalizacion: body.fechaFinalizacion,
    estado: body.estado,
    codigo_institucion: body.institucionCodigo,  // 👈
    tipos_movilidad: tipos,                      // 👈 string[]
  };
  return this.http.post(`${this.baseUrl}/`, payload).pipe(map((r: any) => r?.data ?? r));
}

updateConvenio(codigo: string, body: any) {
  const tipos = (body.tipos ?? []).map((x: any) => typeof x === 'string' ? x : x?.tipoCodigo);
  const payload = {
    nombre: body.nombre,
    tipo: body.tipoConvenio,
    fecha_inicio: body.fechaInicio,
    fecha_finalizacion: body.fechaFinalizacion,
    estado: body.estado,
    codigo_institucion: body.institucionCodigo, // 👈
    tipos_movilidad: tipos,                      // 👈
  };
  return this.http.put(`${this.baseUrl}/${encodeURIComponent(codigo)}`, payload)
    .pipe(map((r: any) => r?.data ?? r));
}


  deleteConvenio(codigo: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${codigo}`);
  }
}
