// multi-select.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, forwardRef, signal, computed, ElementRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export interface OptionKV { codigo: string; nombre: string; }

@Component({
  selector: 'app-multi-select',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './multi-select.component.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiSelectComponent), multi: true }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectComponent implements ControlValueAccessor {
  @Input() options: OptionKV[] = [];
  @Input() placeholder = 'Agregar…';

  value = signal<string[]>([]);
  disabled = signal(false);
  open = signal(false);
  query = signal('');

  constructor(private elRef: ElementRef<HTMLElement>) {}

  // 👉 CLICK FUERA: cierra el panel
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const isInside = this.elRef.nativeElement.contains(ev.target as Node);
    if (!isInside && this.open()) {
      this.closePanel();
    }
  }

  // 👉 ESCAPE: cierra el panel
  @HostListener('document:keydown.escape')
  onEsc() { if (this.open()) this.closePanel(); }

  onChange: (v: string[]) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: string[] | null): void { this.value.set(Array.isArray(v) ? [...v] : []); }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }

  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const selected = new Set(this.value());
    return this.options
      .filter(o => !selected.has(o.codigo) &&
                   (!q || o.nombre.toLowerCase().includes(q) || o.codigo.toLowerCase().includes(q)))
      .slice(0, 8);
  });

  displayName(code: string) { return this.options.find(o => o.codigo === code)?.nombre ?? code; }

  addByOption(opt: OptionKV) {
    if (this.disabled()) return;
    if (!this.value().includes(opt.codigo)) {
      const next = [...this.value(), opt.codigo];
      this.value.set(next);
      this.onChange(next);
    }
    this.query.set('');
    this.open.set(false);
  }

  removeAt(i: number) {
    if (this.disabled()) return;
    const next = [...this.value()];
    next.splice(i, 1);
    this.value.set(next);
    this.onChange(next);
    // no cerramos aquí; el cierre lo hace click-fuera / blur / Esc
  }

  // ✅ Ajuste: deja que TAB salga del campo y sólo “confirma” con Enter o coma.
  handleKeydown(e: KeyboardEvent) {
    if (this.disabled()) return;

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const first = this.filtered()[0];
      if (first) this.addByOption(first);
      return;
    }

    if (e.key === 'Tab') {
      // no preventDefault → deja salir con Tab y cerramos el panel
      this.open.set(false);
      return;
    }

    if (e.key === 'Backspace' && !this.query()) {
      if (this.value().length) this.removeAt(this.value().length - 1);
    } else if (e.key === 'ArrowDown') {
      this.open.set(true);
    }
  }

  focusInput(el: HTMLInputElement) {
    if (!this.disabled()) el.focus();
    this.open.set(true);
  }

  // 👇 util para cerrar de forma consistente
  closePanel() {
    this.open.set(false);
    this.onTouched();
  }

  // cierra al perder foco (por Shift+Tab, clic en otro control, etc.)
  onBlurDeferred() {
    // esperamos un microtick por si el usuario hace click en una opción (tenemos mousedown preventDefault)
    setTimeout(() => {
      // si nada reabrió el panel, cerramos
      if (!this.elRef.nativeElement.contains(document.activeElement)) {
        this.closePanel();
      }
    }, 0);
  }
}
