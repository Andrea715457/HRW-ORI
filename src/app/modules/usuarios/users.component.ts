import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../core/services/user.service';
import { Usuario } from '../../core/models/usuario.model';
import UserFormComponent from './user-form/user-form.component';
import UserTableComponent from './user-table/user-table.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, UserFormComponent, UserTableComponent],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersComponent {
  private usersSrv = inject(UsersService);

  users = signal<Usuario[]>([]);
  total = signal(0);
  pageIndex = signal(0);
  pageSize = signal(25);

  private _selected = signal<Usuario | null>(null);
  selected = () => this._selected();

  ngOnInit() { this.load(); }

  load() {
    const skip = this.pageIndex() * this.pageSize();
    this.usersSrv.list({ skip, limit: this.pageSize() }).subscribe({
      next: res => { this.users.set(res.items); this.total.set(res.total); },
      error: e => console.error(e)
    });
  }

  onPageChange(e: { pageIndex: number; pageSize: number }) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  onCreate(u: any) {
    this.usersSrv.create(u).subscribe({
      next: _ => { this.load(); this._selected.set(null); },
      error: e => alert(e?.error?.detail || 'Error creando usuario'),
    });
  }

  onUpdate(u: any) {
    this.usersSrv.update(u.id, u).subscribe({
      next: _ => { this.load(); this._selected.set(null); },
      error: e => alert(e?.error?.detail || 'Error actualizando usuario'),
    });
  }

  onEdit(row: Usuario) {
    this.usersSrv.get(row.id).subscribe({
      next: apiUser => this._selected.set(apiUser),
      error: e => alert(e?.error?.detail || 'Usuario no encontrado'),
    });
  }

  onCancel() { this._selected.set(null); }

  onDeactivate(u: Usuario) {
    if (!confirm(`Desactivar a ${u.usuario}?`)) return;
    this.usersSrv.deactivate(u.id).subscribe({
      next: _ => this.load(),
      error: e => alert(e?.error?.detail || 'Error desactivando'),
    });
  }

  onActivate(u: Usuario) {
    this.usersSrv.activate(u.id).subscribe({
      next: _ => this.load(),
      error: e => alert(e?.error?.detail || 'Error activando'),
    });
  }
  startCreate() {
    const blank: Usuario = {
      id: 0,
      usuario: '',
      nombre: '',
      correo: '',
      rol: 'coordinador',
      estado: 'Activo',
    };
    this._selected.set(blank);
  }
  onSendReset(u: Usuario) {
    if (!u.correo) { alert('Este usuario no tiene correo.'); return; }
    this.usersSrv.forgotPassword(u.correo).subscribe({
      next: _ => alert('Se envió el enlace de restablecimiento (si el correo existe).'),
      error: _ => alert('No se pudo enviar el enlace.'),
    });
  }
}
