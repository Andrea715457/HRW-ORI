import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Institucion, Pais } from '../../../models/ori.model';

@Component({
  selector: 'app-institucion-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './institucion-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InstitucionTableComponent {
  @Input({ required: true }) instituciones: Institucion[] = [];
  @Input({ required: true }) paises: Pais[] = [];
  @Input() pageIndex = 0;
  @Input() pageSize = 25;
  @Input() total = 0;

  @Output() edit = new EventEmitter<Institucion>();
  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();
  @Output() remove = new EventEmitter<Institucion>();

  paisNombre(iso: string){ return this.paises.find(p=>p.codigoISO===iso)?.nombre ?? '—'; }

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
