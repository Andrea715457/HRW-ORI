import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Convenio, Institucion, TipoMovilidad } from '../../../models/ori.model';

@Component({
  selector: 'app-convenio-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './convenio-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ConvenioTableComponent {
  @Input({ required: true }) convenios: Convenio[] = [];
  @Input({ required: true }) instituciones: Institucion[] = [];
  @Input({ required: true }) tiposMovilidad: TipoMovilidad[] = [];

  @Input() pageIndex = 0;
  @Input() pageSize = 25;
  @Input() total = 0;

  @Output() edit = new EventEmitter<Convenio>();
  @Output() remove = new EventEmitter<Convenio>();
  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();

  expanded: Record<string, boolean> = {}; // key por código (único)

  toggle(c: Convenio){ this.expanded[c.codigo] = !this.expanded[c.codigo]; }
  displayedTipos(c: Convenio){ return this.expanded[c.codigo] ? c.tipos : (c.tipos || []).slice(0, 2); }
  extraTiposCount(c: Convenio){ return Math.max(0, (c.tipos?.length||0) - 2); }

  institucionLabel(c: Convenio) {
    // usa nombre que viene del listado si existe; si no, resuelve por código o id
    return (
      (c as any).nombreInstitucion ||
      this.instituciones.find(i => i.codigo === c.institucionCodigo)?.nombre ||
      (c.institucionId ? this.instituciones.find(i => i.id === c.institucionId)?.nombre : undefined) ||
      '—'
    );
  }

  tipoNombre(codigo: string){
    return this.tiposMovilidad.find(t => t.codigo === codigo)?.nombre;
  }

  // paginación (igual que Instituciones)
  prev() {
    if (this.pageIndex > 0) this.pageChange.emit({ pageIndex: this.pageIndex - 1, pageSize: this.pageSize });
  }
  next() {
    const maxIndex = Math.max(0, Math.ceil(this.total / this.pageSize) - 1);
    if (this.pageIndex < maxIndex) this.pageChange.emit({ pageIndex: this.pageIndex + 1, pageSize: this.pageSize });
  }
  start() { return this.total === 0 ? 0 : this.pageIndex * this.pageSize + 1; }
  end() { return Math.min(this.total, (this.pageIndex + 1) * this.pageSize); }
  // convenio-table.component.ts (añade dentro de la clase)
private parseIsoLocal(d: string | undefined): Date | null {
  if (!d) return null;
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day); // fecha local sin hora
}

private todayStart(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

/** Días restantes hasta la fechaFinalizacion (hoy cuenta como 0 si es el día de fin) */
daysRemaining(c: Convenio): number | null {
  const end = this.parseIsoLocal(c.fechaFinalizacion);
  if (!end) return null;
  const start = this.todayStart();
  const diffMs = end.getTime() - start.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  // ceil para que si queda una fracción de día, cuente como 1
  return Math.ceil(diffMs / oneDay);
}

vigenciaLabel(c: Convenio): string {
  const d = this.daysRemaining(c);
  if (d === null) return '—';
  if (d <= 0) return 'Convenio Vencido';
  return `${d} días`;
}

vigenciaClass(c: Convenio): Record<string, boolean> {
  const d = this.daysRemaining(c);
  // estilos base
  const base = {
    'bg-gray-100 text-gray-800': false,
    'bg-red-100 text-red-800': false,
    'bg-red-200 text-red-900': false,
    'bg-green-100 text-green-800': false,
  };

  if (d === null) return { ...base, 'bg-gray-100 text-gray-800': true };

  if (d <= 0) {
    // vencido
    return { ...base, 'bg-red-200 text-red-900': true };
  }
  if (d <= 90) {
    // urgencia
    return { ...base, 'bg-red-100 text-red-800': true };
  }
  // opcional: “ok”
  return { ...base, 'bg-green-100 text-green-800': true };
}

}
