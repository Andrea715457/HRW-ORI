import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Convenio, Institucion, TipoMovilidad } from '../../../models/ori.model';
@Component({
  selector: 'app-convenio-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './convenio-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvenioFormComponent  implements OnChanges {
  @Input() instituciones: Institucion[] = [];
  @Input() tiposMovilidad: TipoMovilidad[] = [];
  @Input() initial: (Convenio | null) = null;

  @Output() submitted = new EventEmitter<Omit<Convenio,'id'> & {id?: number|null}>();
  @Output() canceled = new EventEmitter<void>();

  form: FormGroup;
  get tipos(): FormArray { return this.form.get('tipos') as FormArray; }

  constructor(private fb: FormBuilder){
    this.form = this.fb.group({
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
    if (this.tipos.length === 0) this.addTipo(null);
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['initial']) {
      const conv = this.initial;
      if (conv) {
        this.form.patchValue({ ...conv, id: conv.id ?? null });
        this.tipos.clear();
        (conv.tipos || []).forEach(t => this.addTipo(t.tipoCodigo));
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
    this.submitted.emit(this.form.value);
    this.reset();
  }
  private reset(){
    this.form.reset({ estado:'activo', id: null });
    this.tipos.clear();
    this.addTipo(null);
  }
}