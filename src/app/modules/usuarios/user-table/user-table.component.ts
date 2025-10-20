import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UserTableComponent {
  @Input({ required: true }) usuarios: Usuario[] = [];

  @Input() pageIndex = 0;
  @Input() pageSize = 25;
  @Input() total = 0;

  @Output() edit = new EventEmitter<Usuario>();
  @Output() deactivate = new EventEmitter<Usuario>();
  @Output() activate = new EventEmitter<Usuario>();
  @Output() resetPass = new EventEmitter<Usuario>();
  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();

  prev() {
    if (this.pageIndex > 0) this.pageChange.emit({ pageIndex: this.pageIndex - 1, pageSize: this.pageSize });
  }
  next() {
    const maxIndex = Math.max(0, Math.ceil(this.total / this.pageSize) - 1);
    if (this.pageIndex < maxIndex) this.pageChange.emit({ pageIndex: this.pageIndex + 1, pageSize: this.pageSize });
  }
  start() { return this.total === 0 ? 0 : this.pageIndex * this.pageSize + 1; }
  end() { return Math.min(this.total, (this.pageIndex + 1) * this.pageSize); }
}
