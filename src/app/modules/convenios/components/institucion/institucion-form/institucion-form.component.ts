import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Institucion, Pais } from '../../../../../core/models/ori.model';

@Component({
  selector: 'app-institucion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './institucion-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InstitucionFormComponent implements OnChanges {
  @Input() paises: Pais[] = [];
  @Input() initial: (Institucion|null) = null;
 @Input() editingCodigo: string | null = null;
  @Output() submitted = new EventEmitter<Omit<Institucion,'id'> & {id?: number|null}>();
  @Output() canceled = new EventEmitter<void>();

  form: FormGroup;
  constructor(private fb: FormBuilder){
    this.form = this.fb.group({
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

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['initial']) {
      const v = this.initial;
      if (v) this.form.patchValue({ ...v, id: v.id ?? null });
      else this.form.reset({ id:null, paisIso: null });
    }
  }

  onCancel(){ this.form.reset({ id:null, paisIso: null }); this.canceled.emit(); }
  onSubmit(){
    if (this.form.invalid){ this.form.markAllAsTouched(); return; }
    this.submitted.emit(this.form.value);
    this.form.reset({ id:null, paisIso: null });
  }
}
