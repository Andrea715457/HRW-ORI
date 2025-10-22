import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstadoUsuario, RolUsuario, Usuario } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UserFormComponent {
  @Input() initial: Usuario | null = null;
  @Output() submitted = new EventEmitter<any>();
  @Output() canceled = new EventEmitter<void>();

  form: FormGroup;

  roles: RolUsuario[] = ['admin','director','coordinador'];
  estados: EstadoUsuario[] = ['Activo','Inactivo'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      id: [null],
      usuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      nombre: [''],
      correo: ['', [Validators.email, Validators.maxLength(255)]],
      rol: ['coordinador', Validators.required],
      estado: ['Activo', Validators.required],
      password: [''], // requerido solo al crear
    });
  }

  ngOnChanges(): void {
    if (this.initial) {
      this.form.reset({
        id: this.initial.id,
        usuario: this.initial.usuario,
        nombre: this.initial.nombre ?? '',
        correo: this.initial.correo ?? '',
        rol: this.initial.rol ?? 'coordinador',
        estado: this.initial.estado ?? 'Activo',
        password: '', // vacío al editar
      });
    } else {
      this.form.reset({
        id: null,
        usuario: '',
        nombre: '',
        correo: '',
        rol: 'coordinador',
        estado: 'Activo',
        password: '',
      });
    }
    // password requerido solo si es creación
    const isCreate = !this.initial || !this.initial.id;
    const pwdCtrl = this.form.get('password');
    pwdCtrl?.clearValidators();
    if (isCreate) pwdCtrl?.addValidators([Validators.required, Validators.minLength(8)]);
    pwdCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  onCancel(){ this.canceled.emit(); }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const raw = this.form.value;
    const payload: any = {
      usuario: raw.usuario,
      nombre: raw.nombre || undefined,
      correo: raw.correo || undefined,
      rol: raw.rol,
      estado: raw.estado,
    };
    if (!this.initial?.id) payload.password = raw.password; // crear
    else if (raw.password) payload.password = raw.password; // cambio opcional en edición

    if (this.initial?.id) payload.id = this.initial.id;
    this.submitted.emit(payload);
  }
}
