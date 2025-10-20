export type RolUsuario = 'admin' | 'director' | 'coordinador';
export type EstadoUsuario = 'Activo' | 'Inactivo';

export interface Usuario {
  id: number;
  usuario: string;
  nombre?: string;
  correo?: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  ultimo_acceso?: string;   // ISO
  creado_en?: string;       // ISO
  actualizado_en?: string;  // ISO
}
