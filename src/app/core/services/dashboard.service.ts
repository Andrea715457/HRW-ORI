import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

/** -------------------------
 * Tipos / Interfaces
 * ------------------------- */
interface ApiResponse<T> {
  total: number;
  usuario?: number;
  data: T[] | T | null;
}

export interface Tiempo { anio: number; semestre: number; total_movilidades: number; }
export interface Pais { paisorigen: string; paisdestino: string; total_movilidades: number; }
export interface Programa { nombreprograma: string; facultad?: string; total_movilidades: number; }
export interface Convenio { codigo: string; total_movilidades: number; }
export interface Institucion { institucionorigen: string; instituciondestino: string; total_movilidades: number; }
export interface Genero { genero: string; total_movilidades: number; }
export interface Direccion { direccion: string; total_movilidades: number; }
export interface Tipo { tipo: string; total_movilidades: number; }
export interface Modalidad { modalidad: string; total_movilidades: number; }

export interface TopPais { paisorigen: string; paisdestino: string; total_movilidades: number; }

/** -------------------------
 * Servicio
 * ------------------------- */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = 'http://127.0.0.1:8888/api/dashboard';

   private asArray<T>(res: ApiResponse<T>): T[] {
    if (!res) return [];
    if (Array.isArray(res.data)) return res.data as T[];
    if (res.data == null) return [];
    return [res.data as T];
  }

  // ---------------- Generic getters ----------------

  getMovilidadesPorTiempo(): Observable<Tiempo[]> {
    return this.http.get<ApiResponse<Tiempo>>(`${this.baseUrl}/movilidades`).pipe(map(r => this.asArray(r)));
  }

  getMovilidadesPorPais(): Observable<Pais[]> {
    return this.http.get<ApiResponse<Pais>>(`${this.baseUrl}/paises`).pipe(map(r => this.asArray(r)));
  }

  getMovilidadesPorPrograma(): Observable<Programa[]> {
    return this.http.get<ApiResponse<Programa>>(`${this.baseUrl}/programas`).pipe(map(r => this.asArray(r)));
  }

  getMovilidadesPorConvenio(): Observable<Convenio[]> {
    return this.http.get<ApiResponse<Convenio>>(`${this.baseUrl}/convenios`).pipe(map(r => this.asArray(r)));
  }

  getMovilidadesPorInstitucion(): Observable<Institucion[]> {
    return this.http.get<ApiResponse<Institucion>>(`${this.baseUrl}/instituciones`).pipe(map(r => this.asArray(r)));
  }

  getMovilidadesPorGenero(): Observable<Genero[]> {
    return this.http.get<ApiResponse<Genero>>(`${this.baseUrl}/generos`).pipe(map(r => this.asArray(r)));
  }

  getMovilidadesPorDireccion(): Observable<Direccion[]> {
    return this.http.get<ApiResponse<Direccion>>(`${this.baseUrl}/direcciones`).pipe(map(r => this.asArray(r)));
  }

  getMovilidadesPorTipo(): Observable<Tipo[]> {
    return this.http.get<ApiResponse<Tipo>>(`${this.baseUrl}/tipos`).pipe(map(r => this.asArray(r)));
  }

  getMovilidadesPorModalidad(): Observable<Modalidad[]> {
    return this.http.get<ApiResponse<Modalidad>>(`${this.baseUrl}/modalidades`).pipe(map(r => this.asArray(r)));
  }

  // ---------------- Top / Bottom / KPIs ----------------

  getSemestreTop(): Observable<ApiResponse<Tiempo>> {
    return this.http.get<ApiResponse<Tiempo>>(`${this.baseUrl}/top/semestre`);
  }

  getTopPaises(): Observable<TopPais[]> {
    return this.http.get<ApiResponse<TopPais>>(`${this.baseUrl}/top/paises`).pipe(map(r => this.asArray(r)));
  }

  getBottomPaises(): Observable<TopPais[]> {
    return this.http.get<ApiResponse<TopPais>>(`${this.baseUrl}/bottom/paises`).pipe(map(r => this.asArray(r)));
  }

  getProgramaTop(): Observable<ApiResponse<Programa>> {
    return this.http.get<ApiResponse<Programa>>(`${this.baseUrl}/top/programa`);
  }

  getTipoTop(): Observable<ApiResponse<Tipo>> {
    return this.http.get<ApiResponse<Tipo>>(`${this.baseUrl}/top/tipo`);
  }

  getConvenioTop(): Observable<ApiResponse<Convenio>> {
    return this.http.get<ApiResponse<Convenio>>(`${this.baseUrl}/top/convenio`);
  }

  // ---------------- Funciones por periodo (receiven params) ----------------

  /**
   * Devuelve { anio, semestre, total_movilidades }
   */
  getTotalPeriodo(anio: number, semestre: number): Observable<{ anio: number; semestre: number; total_movilidades: number }> {
    return this.http.get<{ anio: number; semestre: number; total_movilidades: number }>(
      `${this.baseUrl}/periodo/total?anio=${anio}&semestre=${semestre}`
    );
  }

  getEntrantesPeriodo(anio: number, semestre: number): Observable<{ anio: number; semestre: number; total_entrantes: number }> {
    return this.http.get<{ anio: number; semestre: number; total_entrantes: number }>(
      `${this.baseUrl}/periodo/entrantes?anio=${anio}&semestre=${semestre}`
    );
  }

  getSalientesPeriodo(anio: number, semestre: number): Observable<{ anio: number; semestre: number; total_salientes: number }> {
    return this.http.get<{ anio: number; semestre: number; total_salientes: number }>(
      `${this.baseUrl}/periodo/salientes?anio=${anio}&semestre=${semestre}`
    );
  }

  /**
   * Devuelve { anio, semestre, data: { paisorigen, total_movilidades } }
   */
  getTopPaisPeriodo(anio: number, semestre: number): Observable<{ anio:number; semestre:number; data: { paisorigen: string; total_movilidades: number } | null }> {
    return this.http.get<{ anio:number; semestre:number; data: any }>(
      `${this.baseUrl}/periodo/top_pais?anio=${anio}&semestre=${semestre}`
    );
  }

  // ---------------- Helpers administrativos ----------------

  // Refrescar MV si has creado el endpoint POST /movilidades/refresh
  refreshMovilidades() {
    return this.http.post(`${this.baseUrl}/movilidades/refresh`, {});
  }
}
