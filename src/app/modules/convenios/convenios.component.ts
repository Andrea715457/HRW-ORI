import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';

interface Institucion {
  id?: number | null;
  codigo: string;
  nombre: string;
  direccion?: string;
  representanteLegal?: string;
  correo?: string;
  telefono?: string;
  paisIso?: string | null;
}

interface TipoMovilidad {
  codigo: string;
  nombre: string;
}

interface Pais {
  codigoISO: string;
  nombre: string;
  codigoISO2?: string;
}

@Component({
  selector: 'app-convenios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './convenios.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ConveniosComponent implements OnInit {
  // Vista actual
  view: 'convenio' | 'institucion' = 'convenio';

  // Catálogos
  instituciones: Institucion[] = [];
  tiposMovilidad: TipoMovilidad[] = [];
  paises: Pais[] = [];

  // Formularios
  convenioForm: FormGroup;
  institucionForm: FormGroup;

  convenios: any[] = [
    {
      id: 1,
      codigo: 'CONV001',
      nombre: 'Convenio A',
      tipoConvenio: 'Marco',
      fechaInicio: '2024-01-01',
      fechaFinalizacion: '2025-01-01',
      estado: 'activo',
      institucionId: "Universidad A",
      tipos: [{ tipoCodigo: 'T1' }]
    },
    {
      id: 2,
      codigo: 'CONV002',
      nombre: 'Convenio B',
      tipoConvenio: 'Específico',
      fechaInicio: '2023-05-01',
      fechaFinalizacion: '2024-05-01',
      estado: 'inactivo',
      institucionId: "Universidad B",
      tipos: [{ tipoCodigo: 'T2' }]
    }
  ];

  institucionesGuardadas: Institucion[] = [
    { id: 1, codigo: 'INS001', nombre: 'Universidad A', direccion: 'Cra 10 #12-34', paisIso: 'COL' },
    { id: 2, codigo: 'INS002', nombre: 'Instituto B', direccion: 'Av. 45 #6-78', paisIso: 'ESP' }
  ];

  removeConvenio(c: any) {
  this.convenios = this.convenios.filter(x => x.id !== c.id);
  }


  constructor(private fb: FormBuilder) {
    // Inicialización de formularios dentro del constructor (fb ya inyectado)
    this.convenioForm = this.fb.group({
      id: [null as number | null],
      codigo: [''],
      nombre: ['', [Validators.required, Validators.maxLength(250)]],
      tipo: [''],
      fechaInicio: ['', Validators.required],
      fechaFinalizacion: ['', Validators.required],
      estado: ['activo', Validators.required],
      institucionId: [null as number | null, Validators.required],
      tipos: this.fb.array([], Validators.required),
      tipoConvenio: ['']
    });

    this.institucionForm = this.fb.group({
      id: [null as number | null],
      codigo: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(250)]],
      direccion: [''],
      representanteLegal: [''],
      correo: ['', Validators.email],
      telefono: [''],
      paisIso: [null as string | null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCatalogos();
    if (this.tipos.length === 0) this.addTipo(null);
  }

  // Getter para el FormArray usado en la plantilla
  get tipos(): FormArray {
    return this.convenioForm.get('tipos') as FormArray;
  }

  // Crear control para un tipo de movilidad
  private createTipoControl(value: string | null = null) {
    return this.fb.group({
      tipoCodigo: [value, Validators.required]
    });
  }

  // Añadir / eliminar tipos
  addTipo(value: string | null = null) {
    this.tipos.push(this.createTipoControl(value));
  }

  removeTipo(index: number) {
    this.tipos.removeAt(index);
  }

  // Alternar vistas
  showConvenio() { this.view = 'convenio'; }
  showInstitucion() { this.view = 'institucion'; }

  // Cargar catálogos (stub — reemplaza por HttpClient)
  private loadCatalogos() {
    this.paises = [
      { codigoISO: 'COL', nombre: 'Colombia' },
      { codigoISO: 'ESP', nombre: 'España' },
      { codigoISO: 'USA', nombre: 'Estados Unidos' }
    ];

    this.tiposMovilidad = [
      { codigo: 'T1', nombre: 'Entrante' },
      { codigo: 'T2', nombre: 'Saliente' },
      { codigo: 'T3', nombre: 'Virtual' }
    ];

    this.instituciones = [
      { id: 1, codigo: 'INS001', nombre: 'Universidad A', paisIso: 'COL' },
      { id: 2, codigo: 'INS002', nombre: 'Instituto B', paisIso: 'ESP' }
    ];
  }

  // Nombre del país según la institución seleccionada (usado en el template)
  nombrePaisDeInstitucion(institucionId: number | null | undefined): string {
    const ins = this.instituciones.find(i => i.id === institucionId);
    if (!ins) return '—';
    return this.paises.find(p => p.codigoISO === ins.paisIso)?.nombre ?? '—';
  }

  // Edición / poblado de formularios
  editInstitucion(ins: Institucion) {
    const clean = {
      ...ins,
      id: ins.id ?? null,
      paisIso: ins.paisIso ?? null
    };
    this.institucionForm.patchValue(clean as any);
    this.showInstitucion();
  }

  editConvenio(conv: any) {
    const payload = {
      ...conv,
      id: conv.id ?? null,
      institucionId: conv.institucionId ?? null
    };
    this.convenioForm.patchValue(payload as any);

    // poblar FormArray de tipos
    this.tipos.clear();
    (conv.tipos || []).forEach((t: any) => this.addTipo(t.tipoCodigo ?? null));
    if (this.tipos.length === 0) this.addTipo(null);

    this.showConvenio();
  }

  // Guardar (stubs — reemplazar por llamadas HTTP)
  saveInstitucion() {
    if (this.institucionForm.invalid) {
      this.institucionForm.markAllAsTouched();
      return;
    }
    const payload = this.institucionForm.value;
    console.log('Guardar institución (payload):', payload);
    alert('Institución guardada (simulado). Integra tu servicio REST aquí.');
    this.institucionForm.reset();
  }

  saveConvenio() {
    if (this.convenioForm.invalid) {
      this.convenioForm.markAllAsTouched();
      return;
    }
    const payload = this.convenioForm.value;
    console.log('Guardar convenio (payload):', payload);
    alert('Convenio guardado (simulado). Integra tu servicio REST aquí.');
    this.resetConvenioForm();
  }

  resetConvenioForm() {
    this.convenioForm.reset({ estado: 'activo' });
    this.tipos.clear();
    this.addTipo(null);
  }
}
