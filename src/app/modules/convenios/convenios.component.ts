import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';

// Interfaces con tipado más claro
interface Institucion {
  id: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  representanteLegal?: string;
  correo?: string;
  telefono?: string;
  paisIso: string;
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

interface Convenio {
  id: number;
  codigo: string;
  nombre: string;
  tipoConvenio: string;
  fechaInicio: string;
  fechaFinalizacion: string;
  estado: 'activo' | 'inactivo' | 'pendiente';
  institucionId: number;
  tipos: { tipoCodigo: string }[];
}

@Component({
  selector: 'app-convenios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './convenios.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ConveniosComponent implements OnInit {
  view: 'convenio' | 'institucion' = 'convenio';
  // Catálogos
  instituciones: Institucion[] = [];
  tiposMovilidad: TipoMovilidad[] = [];
  paises: Pais[] = [];
  // Formularios
  convenioForm: FormGroup;
  institucionForm: FormGroup;
  // Lista de convenios (mock inicial, ajustado para institucionId numérico)
  convenios: Convenio[] = [
    {
      id: 1,
      codigo: 'CONV001',
      nombre: 'Convenio A',
      tipoConvenio: 'Marco',
      fechaInicio: '2024-01-01',
      fechaFinalizacion: '2025-01-01',
      estado: 'activo',
      institucionId: 1, // Ahora es ID numérico
      tipos: [
        { tipoCodigo: 'T1' },
        { tipoCodigo: 'T2' },
        { tipoCodigo: 'T3' }, // Más tipos para simular
      ],
    },
    {
      id: 2,
      codigo: 'CONV002',
      nombre: 'Convenio B',
      tipoConvenio: 'Específico',
      fechaInicio: '2023-05-01',
      fechaFinalizacion: '2024-05-01',
      estado: 'inactivo',
      institucionId: 2,
      tipos: [{ tipoCodigo: 'T2' }],
    },
  ];
  // Map para manejar filas expandidas (usamos Map para mejor tipado)
  private expandedMap = new Map<number, boolean>();

  constructor(private fb: FormBuilder) {
    // Inicialización de formularios con validaciones más estrictas
    this.convenioForm = this.fb.group({
      id: [null as number | null],
      codigo: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      nombre: ['', [Validators.required, Validators.maxLength(250)]],
      tipoConvenio: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFinalizacion: ['', Validators.required],
      estado: ['activo', Validators.required],
      institucionId: [null as number | null, Validators.required],
      tipos: this.fb.array([], Validators.minLength(1)),
    });

    this.institucionForm = this.fb.group({
      id: [null as number | null],
      codigo: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      nombre: ['', [Validators.required, Validators.maxLength(250)]],
      direccion: [''],
      representanteLegal: [''],
      correo: ['', [Validators.email]],
      telefono: [''],
      paisIso: [null as string | null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadCatalogos();
    if (this.tipos.length === 0) this.addTipo(null);
  }

  // Getter para el FormArray
  get tipos(): FormArray {
    return this.convenioForm.get('tipos') as FormArray;
  }

  // Crear control para un tipo de movilidad
  private createTipoControl(value: string | null = null): FormGroup {
    return this.fb.group({
      tipoCodigo: [value, Validators.required],
    });
  }

  // Añadir/eliminar tipos
  addTipo(value: string | null = null): void {
    this.tipos.push(this.createTipoControl(value));
  }

  removeTipo(index: number): void {
    if (this.tipos.length > 1) {
      this.tipos.removeAt(index); // Mantener al menos un tipo
    }
  }

  // Alternar vistas
  showConvenio(): void {
    this.view = 'convenio';
  }

  showInstitucion(): void {
    this.view = 'institucion';
  }

  // Cargar catálogos (simulado, preparado para API)
  private loadCatalogos(): void {
    this.paises = [
      { codigoISO: 'COL', nombre: 'Colombia' },
      { codigoISO: 'ESP', nombre: 'España' },
      { codigoISO: 'USA', nombre: 'Estados Unidos' },
    ];

    // Simulación de 20+ tipos de movilidad
    this.tiposMovilidad = [
      { codigo: 'T1', nombre: 'Entrante' },
      { codigo: 'T2', nombre: 'Saliente' },
      { codigo: 'T3', nombre: 'Virtual' },
      { codigo: 'T4', nombre: 'Doble Titulación' },
      { codigo: 'T5', nombre: 'Semillero' },
      { codigo: 'T6', nombre: 'Prácticas Profesionales' },
      ...Array.from({ length: 15 }, (_, i) => ({
        codigo: `T${i + 7}`,
        nombre: `Movilidad Tipo ${i + 7}`,
      })),
    ];

    // Aseguramos que las instituciones tengan todos los campos para la tabla
    this.instituciones = [
      {
        id: 1,
        codigo: 'INS001',
        nombre: 'Universidad A',
        direccion: 'Cra 10 #12-34',
        representanteLegal: 'Juan Pérez',
        correo: 'contacto@universidad-a.edu',
        telefono: '+57 123 456 7890',
        paisIso: 'COL',
      },
      {
        id: 2,
        codigo: 'INS002',
        nombre: 'Instituto B',
        direccion: 'Av. 45 #6-78',
        representanteLegal: 'María Gómez',
        correo: 'info@institutob.es',
        telefono: '+34 987 654 321',
        paisIso: 'ESP',
      },
    ];
  }

  // Nombre del país según institución
  nombrePaisDeInstitucion(institucionId: number | null | undefined): string {
    const ins = this.instituciones.find((i) => i.id === institucionId);
    if (!ins) return '—';
    return this.paises.find((p) => p.codigoISO === ins.paisIso)?.nombre ?? '—';
  }

  // Obtener nombre de institución
  getInstitucionNombre(institucionId: number | null | undefined): string {
    const ins = this.instituciones.find((i) => i.id === institucionId);
    return ins ? ins.nombre : '—';
  }

  // Obtener nombre legible del tipo de movilidad
  getTipoNombre(tipoCodigo: string): string | undefined {
    return this.tiposMovilidad.find((t) => t.codigo === tipoCodigo)?.nombre;
  }

  // Editar institución
  editInstitucion(ins: Institucion): void {
    this.institucionForm.patchValue({
      ...ins,
      id: ins.id ?? null,
      paisIso: ins.paisIso ?? null,
    });
    this.showInstitucion();
  }

  // Editar convenio
  editConvenio(conv: Convenio): void {
    this.convenioForm.patchValue({
      ...conv,
      id: conv.id ?? null,
      institucionId: conv.institucionId ?? null,
    });
    this.tipos.clear();
    (conv.tipos || []).forEach((t) => this.addTipo(t.tipoCodigo ?? null));
    if (this.tipos.length === 0) this.addTipo(null);
    this.showConvenio();
  }

  // Guardar institución
  saveInstitucion(): void {
    if (this.institucionForm.invalid) {
      this.institucionForm.markAllAsTouched();
      return;
    }
    const payload: Institucion = this.institucionForm.value;
    if (payload.id) {
      // Editar institución existente
      this.instituciones = this.instituciones.map((inst) =>
        inst.id === payload.id ? { ...payload, id: inst.id } : inst
      );
    } else {
      // Añadir nueva institución
      const newId = Math.max(0, ...this.instituciones.map((inst) => inst.id)) + 1;
      this.instituciones = [...this.instituciones, { ...payload, id: newId }];
    }
    console.log('Institución guardada:', payload);
    alert('Institución guardada (simulado). Integra tu servicio REST aquí.');
    this.institucionForm.reset();
  }

  // Guardar convenio
  saveConvenio(): void {
    if (this.convenioForm.invalid) {
      this.convenioForm.markAllAsTouched();
      return;
    }
    const payload = this.convenioForm.value;
    console.log('Guardar convenio:', payload);
    alert('Convenio guardado (simulado). Integra tu servicio REST aquí.');
    this.resetConvenioForm();
  }

  // Resetear formulario de convenio
  resetConvenioForm(): void {
    this.convenioForm.reset({ estado: 'activo' });
    this.tipos.clear();
    this.addTipo(null);
  }

  // Eliminar convenio
  removeConvenio(conv: Convenio): void {
    this.convenios = this.convenios.filter((x) => x.id !== conv.id);
  }

  // Eliminar institución (NUEVO)
  removeInstitucion(inst: Institucion): void {
    this.instituciones = this.instituciones.filter((x) => x.id !== inst.id);
  }

  // Manejo de tipos de movilidad en la tabla
  private TIPOS_VISIBLE = 2;

  allTipos(conv: Convenio): { tipoCodigo: string }[] {
    return conv.tipos || [];
  }

  displayedTipos(conv: Convenio): { tipoCodigo: string }[] {
    const list = this.allTipos(conv);
    if (this.isExpanded(conv)) return list;
    return list.slice(0, this.TIPOS_VISIBLE);
  }

  extraTiposCount(conv: Convenio): number {
    const list = this.allTipos(conv);
    return Math.max(0, list.length - this.TIPOS_VISIBLE);
  }

  isExpanded(conv: Convenio): boolean {
    return !!this.expandedMap.get(conv.id);
  }

  toggleExpand(conv: Convenio): void {
    const key = conv.id;
    this.expandedMap.set(key, !this.expandedMap.get(key));
  }
}
