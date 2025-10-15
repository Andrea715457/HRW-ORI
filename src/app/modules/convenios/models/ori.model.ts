export interface Institucion {
  id: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  representanteLegal?: string;
  correo?: string;
  telefono?: string;
  paisIso: string;
  nombre_pais?: string;
}

export interface TipoMovilidad {
  codigo: string;
  nombre: string;
}

export interface Pais {
  codigoISO: string;
  nombre: string;
  codigoISO2?: string;
}

export type EstadoConvenio = 'activo' | 'inactivo' | 'pendiente';

export interface ConvenioTipo { tipoCodigo: string; }

export interface Convenio {
  id: number;
  codigo: string;
  nombre: string;
  tipoConvenio: string;
  fechaInicio: string;        // ISO yyyy-MM-dd
  fechaFinalizacion: string;  // ISO yyyy-MM-dd
  estado: EstadoConvenio;
  institucionId: number;
  tipos: ConvenioTipo[];
}
