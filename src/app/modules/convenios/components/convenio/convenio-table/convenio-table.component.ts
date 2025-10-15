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
  @Output() edit = new EventEmitter<Convenio>();

  expanded: Record<number, boolean> = {};
  private VISIBLE = 2;

  toggle(c: Convenio){ this.expanded[c.id] = !this.expanded[c.id]; }
  displayedTipos(c: Convenio){ return this.expanded[c.id] ? c.tipos : (c.tipos || []).slice(0, this.VISIBLE); }
  extraTiposCount(c: Convenio){ return Math.max(0, (c.tipos?.length||0) - this.VISIBLE); }

  institucionNombre(id: number){ return this.instituciones.find(i=>i.id===id)?.nombre ?? '—'; }
  tipoNombre(codigo: string){ return this.tiposMovilidad.find(t=>t.codigo===codigo)?.nombre; }
}
