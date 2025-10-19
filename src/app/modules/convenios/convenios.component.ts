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
import { ConveniosService } from '../../core/services/Convenios.service';

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
  setView(v: Vista) {
    this.view.set(v);
    localStorage.setItem('oriTab', v);        // 👈 persistimos pestaña
  }
  private editingCodigo = signal<string | null>(null);
  editingCodigoValue = () => this.editingCodigo();

  // catálogos
  paises: Pais[] = [];
  tiposMovilidad: TipoMovilidad[] = [];


  // tabla instituciones (paginadas)
  instituciones = signal<Institucion[]>([]);  // 👈 signal
  instTotal = signal(0);
  instPageIndex = signal(0);
  instPageSize = signal(25);

  // opciones para selects (mismo endpoint)
  institucionesOptions = signal<Institucion[]>([]); // 👈 signal

  // selección actual (para editar)
  private _selectedInstitucion = signal<Institucion|null>(null);
  selectedInstitucion = () => this._selectedInstitucion()

  private convSrv = inject(ConveniosService);

  // signals
  convenios = signal<Convenio[]>([]);
  convTotal = signal(0);
  convPageIndex = signal(0);
  convPageSize = signal(25);
    
  ngOnInit(): void {
     // Catálogos existentes
      this.utils.getPaises().pipe(take(1)).subscribe({ next: p => this.paises = p });
      this.utils.getTiposMovilidad().pipe(take(1)).subscribe({ next: t => this.tiposMovilidad = t });
    // pestaña persistida
      const saved = (localStorage.getItem('oriTab') as Vista) || 'convenio';
      this.view.set(saved);

      // cargar página tabla
      this.loadInstitucionesPage();
      this.loadConveniosPage();

      // cargar opciones select (lote grande)
      this.instSrv.getInstituciones({ skip: 0, limit: 1000 }).subscribe({
        next: (res) => this.institucionesOptions.set(res.items),
        error: (e) => console.error(e)
      });
  }


  // --- Instituciones (paginación tabla) ---
  loadInstitucionesPage() {
    const skip = this.instPageIndex() * this.instPageSize();
    this.instSrv.getInstituciones({ skip, limit: this.instPageSize() }).subscribe({
      next: (res) => {
        this.instituciones.set(res.items);     // 👈 nueva referencia
        this.instTotal.set(res.total);
      },
      error: (e) => console.error(e)
    });
  }

  onInstPageChange(e: { pageIndex: number; pageSize: number }) {
    this.instPageIndex.set(e.pageIndex);
    this.instPageSize.set(e.pageSize);
    this.loadInstitucionesPage();
  }

   // EDITAR (GET por código → llenar form)
    onEditInstitucion(row: Institucion) {
      this.instSrv.getInstitucionByCodigo(row.codigo).subscribe({
        next: (apiIns) => {
          if (!apiIns) { alert('Institución no encontrada'); return; }
          // setea el formulario con los datos del backend y
          // guarda el CÓDIGO que se está editando
          this._selectedInstitucion.set({ ...apiIns, id: row.id ?? 0 });
          this.editingCodigo.set(row.codigo);      // 👈 clave
          this.setView('institucion');
        },
        error: (e) => console.error(e)
      });
    }
  clearInstitucionSelection() {
    this._selectedInstitucion.set(null);
    this.editingCodigo.set(null);               
  }
  // GUARDAR (POST/PUT) con actualizaciones inmutables
   onSaveInstitucion(payload: any) {
      const codeForPut = this.editingCodigo();   
      if (codeForPut) {
        // EDITAR → PUT /instituciones/{codeForPut}
        this.instSrv.updateInstitucion(codeForPut, payload).subscribe({
          next: (upd) => {
            this.loadInstitucionesPage();
            this.institucionesOptions.update(list =>
              list.map(i => i.codigo === codeForPut ? upd : i)
            );
            this.clearInstitucionSelection();
          },
          error: (e) => console.error('PUT institucion', e),
        });
      } else {
        // CREAR → POST /instituciones
        this.instSrv.createInstitucion(payload).subscribe({
          next: (created) => {
            this.loadInstitucionesPage();
            this.institucionesOptions.update(list => [...list, created]);
            this.clearInstitucionSelection();
          },
          error: (e) => console.error('POST institucion', e),
        });
      }
    }
  // ELIMINAR
  onRemoveInstitucion(inst: Institucion) {
    if (!confirm(`¿Eliminar "${inst.nombre}" (${inst.codigo})?`)) return;
    this.instSrv.deleteInstitucion(inst.codigo).subscribe({
      next: () => {
        this.loadInstitucionesPage();
        this.institucionesOptions.update(list => list.filter(i => i.codigo !== inst.codigo));
        if (this.selectedInstitucion()?.codigo === inst.codigo) this.clearInstitucionSelection();
      },
      error: (e) => console.error(e),
    });
  }
  // CONVENIOS LOGICA
  // selección para editar
  // selección actual para editar
  private _selectedConvenio = signal<Convenio | null>(null);
  selectedConvenio = () => this._selectedConvenio();

  // editar (GET por código)
  onEditConvenio(row: Convenio) {
    this.convSrv.getConvenioByCodigo(row.codigo).subscribe({
      next: (apiConv) => {
        if (!apiConv) { alert('Convenio no encontrado'); return; }
        this._selectedConvenio.set(apiConv);
        this.editingCodigo.set(row.codigo);
        this.setView('convenio');
      },
      error: (e) => console.error('GET convenio', e),
    });
  }

// limpiar selección
  clearConvenioSelection() {
    this._selectedConvenio.set(null);
    this.editingCodigo.set(null);
  }

  // crear / editar (POST o PUT)
  onSaveConvenio(payload: any) {
    const codeForPut = this.editingCodigo();

    if (codeForPut) {
      this.convSrv.updateConvenio(codeForPut, payload).subscribe({
        next: () => { this.loadConveniosPage(); this.clearConvenioSelection(); },
        error: (e) => console.error('PUT convenio', e.error?.detail || e.message || e),
      });
    } else {
      this.convSrv.createConvenio(payload).subscribe({
        next: () => { this.loadConveniosPage(); this.clearConvenioSelection(); },
        error: (e) => console.error('POST convenio', e.error?.detail || e.message || e),
      });
    }
  }


  // eliminar
  onRemoveConvenio(conv: Convenio) {
    if (!confirm(`¿Eliminar "${conv.nombre}" (${conv.codigo})?`)) return;
    this.convSrv.deleteConvenio(conv.codigo).subscribe({
      next: () => {
        this.loadConveniosPage();
        this.convenios.update(list => list.filter(c => c.codigo !== conv.codigo));
        if (this.selectedConvenio()?.codigo === conv.codigo) this.clearConvenioSelection();
      },
      error: (e) => console.error('DELETE convenio', e),
    });
  }

  loadConveniosPage() {
  const skip = this.convPageIndex() * this.convPageSize();
  this.convSrv.getConvenios({ skip, limit: this.convPageSize() }).subscribe({
    next: (res) => {
      this.convenios.set(res.data);
      this.convTotal.set(res.total);
    },
    error: (e) => console.error('Error al cargar convenios', e)
    });
  }
  onConvPageChange(e: { pageIndex: number; pageSize: number }) {
    this.convPageIndex.set(e.pageIndex);
    this.convPageSize.set(e.pageSize);
    this.loadConveniosPage();
  }

}