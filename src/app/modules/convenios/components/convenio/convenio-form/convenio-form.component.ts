import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators,
  AbstractControl, ValidationErrors, ValidatorFn, FormControl
} from '@angular/forms';import { Convenio, Institucion, TipoMovilidad } from '../../../../../core/models/ori.model';
import MultiSelectComponent from '../../../../../shared/components/multi-select/multi-select.component';
@Component({
  selector: 'app-convenio-form',
  imports: [CommonModule, ReactiveFormsModule, MultiSelectComponent],
  templateUrl: './convenio-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvenioFormComponent  implements OnChanges {
  @Input() instituciones: Institucion[] = [];
  @Input() initial: (Convenio | null) = null;
  @Input({required: true}) tiposMovilidad: TipoMovilidad[] = [];

  @Output() submitted = new EventEmitter<Omit<Convenio,'id'> & {id?: number|null}>();
  @Output() canceled = new EventEmitter<void>();

  form: FormGroup;
  get tipos(): FormArray { return this.form.get('tipos') as FormArray; }
  get fechaInicioCtrl(): FormControl { return this.form.get('fechaInicio') as FormControl; }
  get fechaFinCtrl(): FormControl { return this.form.get('fechaFinalizacion') as FormControl; }

  constructor(private fb: FormBuilder){
    this.form = this.fb.group({
      id: [null as number | null],
      codigo: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.maxLength(250)]],
      tipoConvenio: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFinalizacion: ['', Validators.required],
      estado: ['activo', Validators.required],
      institucionCodigo: [null as string | null, Validators.required],
      tipos: [[] as string[], [Validators.minLength(1)]],
    }, { validators: this.dateOrderValidator() }); // 👈 validador cruzado
  }
 /** Valida que fechaInicio <= fechaFinalizacion (si ambas existen) */
  private dateOrderValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const start = group.get('fechaInicio')?.value as string | null;
      const end   = group.get('fechaFinalizacion')?.value as string | null;
      if (!start || !end) return null; // no evalúa hasta tener ambas

      // ambos vienen como 'YYYY-MM-DD', comparar string funciona; opcional: convertir a Date.
      if (start <= end) return null;

      // señaliza en el grupo; los mensajes se muestran en cada campo
      return { dateOrder: true, startAfterEnd: true, endBeforeStart: true };
    };
  }

  /** límites dinámicos para los date inputs */
  minForEnd(): string { return this.fechaInicioCtrl.value || ''; }  // end.min = inicio
  maxForStart(): string { return this.fechaFinCtrl.value || ''; }   // start.max = fin

ngOnChanges(ch: SimpleChanges): void {
    if ('initial' in ch) {
      const conv = this.initial;
      if (conv) {
        const asDate = (d?: string) => (d ? d.substring(0, 10) : '');
        this.form.patchValue({
          id: conv.id ?? null,
          codigo: conv.codigo ?? '',
          nombre: conv.nombre ?? '',
          tipoConvenio: conv.tipoConvenio ?? '',
          fechaInicio: asDate(conv.fechaInicio),
          fechaFinalizacion: asDate(conv.fechaFinalizacion),
          estado: conv.estado ?? 'activo',
          institucionCodigo: conv.institucionCodigo ?? null,
          tipos: (conv.tipos ?? []).map(t => t.tipoCodigo),
        }, { emitEvent: false });

        this.form.markAsPristine();
        this.form.markAsUntouched();
      } else {
        this.reset();
      }
    }
  }
  
  private createTipo(value: string | null){ return this.fb.group({ tipoCodigo: [value, Validators.required] }); }
  addTipo(value: string | null = null){ this.tipos.push(this.createTipo(value)); }
  removeTipo(i: number){ if (this.tipos.length>1) this.tipos.removeAt(i); }

  onCancel(){ this.reset(); this.canceled.emit(); }
onSubmit(){
    if (this.form.invalid){ this.form.markAllAsTouched(); return; }
    const raw = this.form.value;
    // transformamos a [{ tipoCodigo }]
    const tiposPayload = (raw.tipos as string[]).map(c => ({ tipoCodigo: c }));
    const payload = { ...raw, tipos: tiposPayload };
    this.submitted.emit(payload as any);
    this.reset();
  }

  private reset(){
    this.form.reset({
      id: null,
      estado:'activo',
      tipos: [] as string[],
    });
  }
}