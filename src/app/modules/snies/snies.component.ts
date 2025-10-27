import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { SniesService } from '../../core/services/snies.service';

type Row = { id: string; label: string; period?: string; loading?: boolean };

@Component({
  selector: 'app-snies',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './snies.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SniesComponent {
  periods = ['2024-2','2025-1', '2025-2'];

  rows: Row[] = [
    { id: 'sem-1', label: 'Movilidad de estudiante hacia el exterior' },
    { id: 'sem-2', label: 'Movilidad de personal administrativo del exterior hacia Colombia' },
    { id: 'sem-3', label: 'Movilidad de docentes del exterior hacia Colombia' },
    { id: 'sem-4', label: 'Movilidad de personal administrativo hacia el exterior' },
    { id: 'sem-5', label: 'Movilidad de docentes hacia el exterior' },
    { id: 'sem-6', label: 'Movilidad de estudiantes del exterior hacia Colombia' },
  ];

  constructor(private api: SniesService, private cdr: ChangeDetectorRef) {}

  onDownload(row: Row) {
    if (!row.period) return;

    this.setRowLoading(row.id, true);

    const name = `${row.label} ${row.period}`;
    this.api
      .downloadByName(name) // el servicio ya mete anti-cache
      .pipe(finalize(() => this.setRowLoading(row.id, false)))
      .subscribe({
        next: (res) => {
          const blob = res.body!;
          const disp = res.headers.get('content-disposition') ?? '';
          const fileName =
            this.extractFileName(disp) || this.safeFileName(`${row.label} ${row.period}.xlsx`);
          this.saveBlob(blob, fileName);
        },
        error: (err) => {
          console.error(err);
          alert(err?.error?.detail || 'No se pudo descargar el archivo');
        },
      });
  }

  /** Inmutable: reemplaza el objeto en el array y marca para chequeo */
  private setRowLoading(id: string, loading: boolean) {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const updated = { ...this.rows[idx], loading };
    this.rows = [
      ...this.rows.slice(0, idx),
      updated,
      ...this.rows.slice(idx + 1),
    ];
    this.cdr.markForCheck();
  }

  private extractFileName(disposition: string): string | null {
    const m = /filename\*?=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(disposition || '');
    return decodeURIComponent(m?.[1] || m?.[2] || '');
  }

  private safeFileName(s: string) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.\- ]+/g, '_');
  }

  private saveBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a); // Safari/Firefox
    a.href = url;
    a.download = fileName;
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
