import { ChangeDetectionStrategy, Component, ElementRef, AfterViewInit, Renderer2, ViewChild, ChangeDetectorRef } from '@angular/core';
import { UploadService } from '../../core/services/upload.service';
import { HttpErrorResponse } from '@angular/common/http';

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
  isUploading = false;
  uploadMessage = '';

  constructor(private renderer: Renderer2, private uploadService: UploadService,  private cdr: ChangeDetectorRef ) {}

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

  // Si ya hay un archivo cargado, bloquear
  if (Object.keys(this.FILES).length > 0) {
    alert('Ya tienes un archivo cargado. Elimina el actual antes de seleccionar uno nuevo.');
    input.value = '';
    return;
  }

  const file = input.files[0];
  if (file) this.addFile(file);

  // limpiar input para permitir reintentos con el mismo archivo
  input.value = '';
}


  private addFile(file: File) {
    
    if (Object.keys(this.FILES).length > 0) {
      alert('Ya tienes un archivo cargado. Elimina el archivo actual antes de subir uno nuevo.');
      return;
    }
    
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];
    const allowedExtensions = ['.xls', '.xlsx', '.csv'];

    // Verificar tipo MIME y extensión
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(ext);

    if (!isValid) {
      alert(`El archivo "${file.name}" no es un archivo Excel válido (.xls, .xlsx o .csv).`);
      return;
    }

    // --- Si pasa la validación, continúa ---
    const isImage = !!file.type.match('image.*');
    const objectURL = URL.createObjectURL(file);

    const templateRef = isImage ? this.imageTempl.nativeElement : this.fileTempl.nativeElement;
    const clone = (templateRef.content.cloneNode(true) as DocumentFragment);

    const li = clone.querySelector('li') as HTMLElement;
    const h1 = clone.querySelector('h1') as HTMLElement;
    const sizeEl = clone.querySelector('.size') as HTMLElement;
    const img = clone.querySelector('img') as HTMLImageElement | null;
    const deleteBtn = clone.querySelector('[data-delete], .delete') as HTMLElement | null;

    if (li) {
      const safeId = encodeURIComponent(objectURL);
      li.id = safeId;
      if (deleteBtn) deleteBtn.setAttribute('data-target', safeId);
    }

    if (h1) h1.textContent = file.name;
    if (sizeEl) {
      const sizeText = file.size > 1024
        ? (file.size > 1048576
            ? Math.round(file.size / 1048576) + 'mb'
            : Math.round(file.size / 1024) + 'kb')
        : file.size + 'b';
      sizeEl.textContent = sizeText;
    }

    if (isImage && img) {
      img.src = objectURL;
      img.alt = file.name;
      img.classList.remove('hidden');
    }

    this.emptyRef.nativeElement.classList.add('hidden');
    this.galleryRef.nativeElement.prepend(clone);

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

  // 🔹 Si ya hay un archivo cargado, bloquear
  if (Object.keys(this.FILES).length > 0) {
    alert('Ya tienes un archivo cargado. Elimina el actual antes de subir otro.');
    this.overlayRef.nativeElement.classList.remove('draggedover');
    this.dragCounter = 0;
    return;
  }

  const files = ev.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ];
  const allowedExtensions = ['.xls', '.xlsx', '.csv'];

  const file = files[0];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(ext);

  if (!isValid) {
    alert(`El archivo "${file.name}" no es válido. Solo se permiten Excel (.xls, .xlsx, .csv).`);
  } else {
    this.addFile(file);
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

 submit() {
    const fileEntries = Object.entries(this.FILES);
    if (fileEntries.length === 0) {
      alert('Por favor, selecciona un archivo antes de subir.');
      return;
    }

    const file = fileEntries[0][1];
    this.isUploading = true;
    this.uploadMessage = 'Subiendo archivo...';
    this.cdr.detectChanges(); //  Forzar actualización visual inmediata

    this.uploadService.uploadExcel(file).subscribe({
      next: (response) => {
        console.log('Respuesta del backend:', response);
        this.uploadMessage = 'Archivo subido correctamente.';
        this.isUploading = false;

        // Refrescar el estado del componente visualmente
        this.cdr.detectChanges();

        // Opcional: limpiar archivo tras confirmación
        setTimeout(() => {
          this.cancel(); // limpia galería
          this.uploadMessage = '';
          this.cdr.detectChanges();
        }, 2500);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al subir:', error);
        this.uploadMessage = ` Error al subir el archivo: ${error.message}`;
        this.isUploading = false;
        this.cdr.detectChanges();
      },
    });
  }

  cancel() {
    while (this.galleryRef.nativeElement.firstChild) {
      this.galleryRef.nativeElement.removeChild(this.galleryRef.nativeElement.firstChild);
    }
    this.FILES = {};
    this.emptyRef.nativeElement.classList.remove('hidden');
    this.galleryRef.nativeElement.appendChild(this.emptyRef.nativeElement);
    this.uploadMessage = '';
  }
}
