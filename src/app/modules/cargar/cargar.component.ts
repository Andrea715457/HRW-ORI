import { ChangeDetectionStrategy, Component, ElementRef, AfterViewInit, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-cargar',
  imports: [],
  templateUrl: './cargar.component.html',
  styleUrls: ['./cargar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CargarComponent implements AfterViewInit {
  @ViewChild('fileTemplate', { static: true }) fileTempl!: ElementRef<HTMLTemplateElement>;
  @ViewChild('imageTemplate', { static: true }) imageTempl!: ElementRef<HTMLTemplateElement>;
  @ViewChild('gallery', { static: true }) galleryRef!: ElementRef<HTMLUListElement>;
  @ViewChild('overlay', { static: true }) overlayRef!: ElementRef<HTMLElement>;
  @ViewChild('hiddenInput', { static: true }) hiddenInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('empty', { static: true }) emptyRef!: ElementRef<HTMLLIElement>;

  // Guardamos los archivos con la key = objectURL
  FILES: { [objectURL: string]: File } = {};
  private dragCounter = 0;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    // Delegación de clicks en la galería para botones "delete"
    this.renderer.listen(this.galleryRef.nativeElement, 'click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // buscamos el botón que tenga atributo data-delete o la clase .delete
      const deleteBtn = target.closest('[data-delete], .delete') as HTMLElement | null;
      if (deleteBtn) {
        // el dataset.target lo ponemos en el clone al crear (ver addFile)
        const ou = deleteBtn.getAttribute('data-target');
        if (ou) {
          const el = this.galleryRef.nativeElement.querySelector(`#${CSS.escape(ou)}`) as HTMLElement | null;
          if (el) el.remove();
          // si ya no quedan elementos mostramos el empty
          if (this.galleryRef.nativeElement.children.length === 1) {
            this.emptyRef.nativeElement.classList.remove('hidden');
          }
          delete this.FILES[ou];
        }
      }
    });
  }

  openFileExplorer() {
    this.hiddenInputRef.nativeElement.click();
  }

  onHiddenInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (const file of Array.from(input.files)) {
      this.addFile(file);
    }
    // limpiar el input para permitir seleccionar el mismo archivo otra vez si se desea
    input.value = '';
  }

  private addFile(file: File) {
    const isImage = !!file.type.match('image.*');
    const objectURL = URL.createObjectURL(file);

    // clonamos el template correcto
    const templateRef = isImage ? this.imageTempl.nativeElement : this.fileTempl.nativeElement;
    const clone = (templateRef.content.cloneNode(true) as DocumentFragment);

    // rellenar datos en el clone
    const li = clone.querySelector('li') as HTMLElement;
    const h1 = clone.querySelector('h1') as HTMLElement;
    const sizeEl = clone.querySelector('.size') as HTMLElement;
    const img = clone.querySelector('img') as HTMLImageElement | null;
    const deleteBtn = clone.querySelector('[data-delete], .delete') as HTMLElement | null;

    if (li) {
      // asignamos un id único (objectURL puede contener caracteres no válidos para id, usamos encodeURIComponent)
      const safeId = encodeURIComponent(objectURL);
      li.id = safeId;
      // seteamos dataset en el botón de borrar para poder eliminar después
      if (deleteBtn) {
        deleteBtn.setAttribute('data-target', safeId);
      }
    }

    if (h1) h1.textContent = file.name;
    if (sizeEl) {
      const sizeText =
        file.size > 1024 ? (file.size > 1048576 ? Math.round(file.size / 1048576) + 'mb' : Math.round(file.size / 1024) + 'kb') : file.size + 'b';
      sizeEl.textContent = sizeText;
    }

    if (isImage && img) {
      img.src = objectURL;
      img.alt = file.name;
      // quitar la clase hidden para la previsualización
      img.classList.remove('hidden');
    }

    // ocultar el mensaje "No hay archivos seleccionados"
    this.emptyRef.nativeElement.classList.add('hidden');

    // prepend al gallery
    this.galleryRef.nativeElement.prepend(clone);

    // almacenar el archivo usando la key safeId
    const safeId = encodeURIComponent(objectURL);
    this.FILES[safeId] = file;
  }

  /* Drag & Drop helpers */
  private hasFiles(event: DragEvent) {
    const types = event.dataTransfer?.types ?? [];
    return Array.from(types).indexOf('Files') > -1;
  }

  dropHandler(ev: DragEvent) {
    ev.preventDefault();
    const files = ev.dataTransfer?.files;
    if (!files) return;
    for (const f of Array.from(files)) {
      this.addFile(f);
    }
    this.overlayRef.nativeElement.classList.remove('draggedover');
    this.dragCounter = 0;
  }

  dragEnterHandler(e: DragEvent) {
    e.preventDefault();
    if (!this.hasFiles(e)) return;
    ++this.dragCounter && this.overlayRef.nativeElement.classList.add('draggedover');
  }

  dragLeaveHandler(e: DragEvent) {
    if (this.dragCounter > 0) {
      this.dragCounter--;
    }
    if (this.dragCounter <= 0) {
      this.overlayRef.nativeElement.classList.remove('draggedover');
      this.dragCounter = 0;
    }
  }

  dragOverHandler(e: DragEvent) {
    if (this.hasFiles(e)) {
      e.preventDefault();
    }
  }

  /* Submit y Cancel */
  submit() {
    // Aquí puedes enviar 'this.FILES' a tu backend.
    // Por ahora solo mostramos el resumen:
    alert(`Submitted Files:\n${JSON.stringify(Object.keys(this.FILES))}`);
    console.log(this.FILES);
  }

  cancel() {
    // remover todos los hijos del gallery
    while (this.galleryRef.nativeElement.firstChild) {
      this.galleryRef.nativeElement.removeChild(this.galleryRef.nativeElement.firstChild);
    }
    // restaurar el empty
    this.FILES = {};
    this.emptyRef.nativeElement.classList.remove('hidden');
    this.galleryRef.nativeElement.appendChild(this.emptyRef.nativeElement);
  }
}
