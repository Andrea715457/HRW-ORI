import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Convenio, Institucion, Pais, TipoMovilidad } from './models/ori.model';
import { ConvenioFormComponent } from './components/convenio/convenio-form/convenio-form.component';
import ConvenioTableComponent from './components/convenio/convenio-table/convenio-table.component';
import InstitucionFormComponent from './components/institucion/institucion-form/institucion-form.component';
import InstitucionTableComponent from './components/institucion/institucion-table/institucion-table.component';
import { UtilsService } from '../../core/services/utils.service';
import { take } from 'rxjs/operators';
import { InstitucionesService } from '../../core/services/instituciones.service';

type Vista = 'convenio'|'institucion';

@Component({
  selector: 'app-convenios',
  standalone: true,
  imports: [CommonModule, ConvenioFormComponent, ConvenioTableComponent, InstitucionFormComponent, InstitucionTableComponent],
  templateUrl: './convenios.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ConveniosComponent {
  private utils = inject(UtilsService);
  private instSrv = inject(InstitucionesService);

  view = signal<Vista>('convenio');
  setView(v: Vista){ this.view.set(v); }

  // catálogos
  paises: Pais[] = [];
  tiposMovilidad: TipoMovilidad[] = [];

  // Instituciones para TABLA (paginadas)
  instituciones: Institucion[] = [];
  instTotal = 0;
  instPageIndex = 0;
  instPageSize = 25;

  // Instituciones para SELECT de Convenio (traemos varias de una)
  institucionesOptions: Institucion[] = [];

  convenios: Convenio[] = [
    { id:1, codigo:'CONV001', nombre:'Convenio A', tipoConvenio:'Marco', fechaInicio:'2024-01-01', fechaFinalizacion:'2025-01-01', estado:'activo', institucionId:1, tipos:[{tipoCodigo:'T1'},{tipoCodigo:'T2'},{tipoCodigo:'T3'}]},
    { id:2, codigo:'CONV002', nombre:'Convenio B', tipoConvenio:'Específico', fechaInicio:'2023-05-01', fechaFinalizacion:'2024-05-01', estado:'inactivo', institucionId:2, tipos:[{tipoCodigo:'T2'}]},
  ];
  
  ngOnInit(): void {
    // Catálogos existentes
    this.utils.getPaises().pipe(take(1)).subscribe({ next: p => this.paises = p });
    this.utils.getTiposMovilidad().pipe(take(1)).subscribe({ next: t => this.tiposMovilidad = t });

    // 1) Página para la TABLA
    this.loadInstitucionesPage();

    // 2) Opciones para el SELECT (mismo endpoint, pero con gran límite)
    this.instSrv.getInstituciones({ skip: 0, limit: 1000 }).pipe(take(1)).subscribe({
      next: res => this.institucionesOptions = res.items,
      error: e => console.error('Error cargando instituciones (select):', e),
    });
  }


  // --- Instituciones (paginación tabla) ---
  loadInstitucionesPage() {
    const skip = this.instPageIndex * this.instPageSize;
    this.instSrv.getInstituciones({ skip, limit: this.instPageSize }).pipe(take(1)).subscribe({
      next: (res) => { this.instituciones = res.items; this.instTotal = res.total; },
      error: (e) => console.error('Error cargando instituciones (tabla):', e),
    });
  }
  onInstPageChange(e: { pageIndex: number; pageSize: number }) {
    this.instPageIndex = e.pageIndex;
    this.instPageSize = e.pageSize;
    this.loadInstitucionesPage();
  }

  // selección para editar
  private _selectedInstitucion = signal<Institucion|null>(null);
  selectedInstitucion = () => this._selectedInstitucion();
  private _selectedConvenio = signal<Convenio|null>(null);
  selectedConvenio = () => this._selectedConvenio();

  onEditConvenio(c: Convenio){ this._selectedConvenio.set(c); this.setView('convenio'); }
  clearConvenioSelection(){ this._selectedConvenio.set(null); }
  onSaveConvenio(payload: Omit<Convenio,'id'> & {id?: number|null}) {
    if (payload.id) {
      this.convenios = this.convenios.map(c => c.id === payload.id! ? { ...(payload as Convenio), id: payload.id! } : c);
    } else {
      const newId = Math.max(0, ...this.convenios.map(c=>c.id)) + 1;
      this.convenios = [...this.convenios, { ...(payload as Convenio), id: newId }];
    }
    this.clearConvenioSelection();
  }

  onEditInstitucion(i: Institucion){ this._selectedInstitucion.set(i); this.setView('institucion'); }
  clearInstitucionSelection(){ this._selectedInstitucion.set(null); }
  onSaveInstitucion(payload: Omit<Institucion,'id'> & {id?: number|null}) {
    if (payload.id) {
      this.instituciones = this.instituciones.map(x => x.id === payload.id! ? { ...(payload as Institucion), id: payload.id! } : x);
    } else {
      const newId = Math.max(0, ...this.instituciones.map(i=>i.id)) + 1;
      this.instituciones = [...this.instituciones, { ...(payload as Institucion), id: newId }];
    }
    this.clearInstitucionSelection();
  }
}