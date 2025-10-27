import { ChangeDetectionStrategy, Component, AfterViewInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { CommonModule } from '@angular/common';
import { forkJoin, Subscription, of } from 'rxjs';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';

Chart.register(...registerables);
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  kpis: any = {};
  periodo = { anio: 2024, semestre: 1 };
  periodoKpis: any = { total: 0, entrantes: 0, salientes: 0, topPais: null };

  // Tablas: top & bottom para origen y destino
  topPaisesOrigen: any[] = [];
  topPaisesDestino: any[] = [];
  bottomPaisesOrigen: any[] = [];
  bottomPaisesDestino: any[] = [];

  // Chart control
  private chartMap: Record<string, Chart> = {};
  private subs: Subscription[] = [];

  // Paleta fija: azul, naranja, rojo, verde (cyclical)
  private PALETTE = ['#1f77b4', '#ff7f0e', '#d62728', '#2ca02c'];
  private NEUTRAL_COLOR = '#9CA3AF'; // Color neutral para gráficas de 1 distinción (Bug 3 FIX)

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit() {
    // Llamada inicial
    this.loadAll();
  }

  ngOnDestroy() {
    Object.values(this.chartMap).forEach(c => c.destroy());
    this.subs.forEach(s => s.unsubscribe());
  }

  // ---------------- Orquestador ----------------
  loadAll() {
    // Carga inmediata de datos (KPIs y Tablas)
    this.loadKPIs();
    this.loadPeriodoKPIs(this.periodo.anio, this.periodo.semestre);
    this.loadTables();

    // Retraso corto para asegurar que los <canvas> están en el DOM antes de crear charts
    setTimeout(() => {
      this.loadCharts();
    }, 200);
  }

  // ---------------- Helpers ----------------
  private safeFirst(res: any) {
    if (!res) return null;
    const d = res.data ?? res;
    if (Array.isArray(d)) return d.length ? d[0] : null;
    return d;
  }

  private parseNumber(v: any) {
    if (v == null) return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  private destroyChartIfExists(id: string) {
    const existing = this.chartMap[id];
    if (existing) {
      existing.destroy();
      delete this.chartMap[id];
    }
  }

  /**
   * Genera un array de colores cíclicos, usando un color neutro si solo hay una distinción.
   */
  private colorsFor(n: number): string[] {
    if (n === 1) return [this.NEUTRAL_COLOR];
    const arr: string[] = [];
    for (let i = 0; i < n; i++) arr.push(this.PALETTE[i % this.PALETTE.length]);
    return arr;
  }

  // Tooltip: show raw value
  private tooltipCallbacks() {
    return {
      callbacks: {
        label: (context: any) => {
          const dataset = context.dataset;
          const value = context.parsed?.y ?? context.parsed ?? 0;
          const label = context.label || dataset.label || '';
          return `${label}: ${value}`;
        }
      }
    };
  }

  // ---------------- KPIs ----------------
  loadKPIs() {
    const sub = forkJoin({
      semestre: this.dashboardService.getSemestreTop().pipe(catchError(() => of(null))),
      programa: this.dashboardService.getProgramaTop().pipe(catchError(() => of(null))),
      tipo: this.dashboardService.getTipoTop().pipe(catchError(() => of(null))),
      convenio: this.dashboardService.getConvenioTop().pipe(catchError(() => of(null))),
    }).subscribe({
      next: (res) => {
        // Ejecutamos en zona Angular por si algo vino desde fuera de zone
        this.ngZone.run(() => {
          const semestre = this.safeFirst(res.semestre) || {};
          const programa = this.safeFirst(res.programa) || {};
          const tipo = this.safeFirst(res.tipo) || {};
          const convenio = this.safeFirst(res.convenio) || {};

          // Reasignamos la referencia (inmutabilidad ligera) para que OnPush detecte el cambio
          this.kpis = { ...this.kpis, semestre, programa, tipo, convenio };

          // Debug rápido: (puedes comentar luego)
          console.log('KPIS loaded:', this.kpis);

          if (semestre?.anio) {
            this.periodo = { ...this.periodo, anio: semestre.anio || this.periodo.anio, semestre: semestre.semestre || this.periodo.semestre };
            // recargar KPIs de periodo con valores reales
            this.loadPeriodoKPIs(this.periodo.anio, this.periodo.semestre);
          }

          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error cargando KPIs (subscribe):', err);
      }
    });
    this.subs.push(sub);
  }

  loadPeriodoKPIs(anio: number, semestre: number) {
    this.periodo = { ...this.periodo, anio, semestre };

    const sub = forkJoin({
      total: this.dashboardService.getTotalPeriodo(anio, semestre).pipe(catchError(() => of(null))),
      entrantes: this.dashboardService.getEntrantesPeriodo(anio, semestre).pipe(catchError(() => of(null))),
      salientes: this.dashboardService.getSalientesPeriodo(anio, semestre).pipe(catchError(() => of(null))),
      topPais: this.dashboardService.getTopPaisPeriodo(anio, semestre).pipe(catchError(() => of(null)))
    }).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.periodoKpis = {
            total: this.parseNumber(this.safeFirst(res.total)?.total_movilidades ?? 0),
            entrantes: this.parseNumber(this.safeFirst(res.entrantes)?.total_entrantes ?? 0),
            salientes: this.parseNumber(this.safeFirst(res.salientes)?.total_salientes ?? 0),
            topPais: (() => {
              const topp = res.topPais?.data ?? res.topPais ?? null;
              return (Array.isArray(topp) ? (topp[0] ?? null) : topp) ?? null;
            })()
          };

          // Debug rápido
          console.log('Periodo KPIs:', this.periodoKpis);

          // Recargamos charts (si cambió periodo)
          setTimeout(() => {
            this.loadCharts();
          }, 200);

          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error KPIs periodo (subscribe):', err);
      }
    });

    this.subs.push(sub);
  }

  // ---------------- Charts ----------------
  loadCharts() {
    // destruye charts viejos si existen (seguro)
    Object.keys(this.chartMap).forEach(k => this.destroyChartIfExists(k));

    this.chartMovilidadesTiempo();
    this.chartPaises();
    this.chartProgramas();
    this.chartConvenios();
    this.chartInstituciones();
    this.chartGeneros();
    this.chartDirecciones();
    this.chartTipos();
    this.chartModalidades();
  }

  // 1) Movilidades: barras comparativas (Sem1 vs Sem2), etiquetas DENTRO mostrando valor
  private chartMovilidadesTiempo() {
    const sub = this.dashboardService.getMovilidadesPorTiempo().pipe(catchError(() => of([]))).subscribe(data => {
      const years = Array.from(new Set(data.map((d:any) => d.anio))).sort((a:any,b:any)=>a-b);
      const sem1 = years.map((y:any) => (data.find((d:any) => d.anio === y && d.semestre === 1)?.total_movilidades ?? 0));
      const sem2 = years.map((y:any) => (data.find((d:any) => d.anio === y && d.semestre === 2)?.total_movilidades ?? 0));

      const id = 'movilidadesCanvas';
      this.destroyChartIfExists(id);
      const ctx = (document.getElementById(id) as HTMLCanvasElement)?.getContext('2d');
      if (!ctx) return;

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: years.map(String),
          datasets: [
            { label: 'Semestre 1', data: sem1, backgroundColor: this.PALETTE[0] },
            { label: 'Semestre 2', data: sem2, backgroundColor: this.PALETTE[1] }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Movilidades por Año (Sem1 vs Sem2)' },
            tooltip: this.tooltipCallbacks(),
            datalabels: {
              color: '#fff',
              anchor: 'center',
              align: 'center',
              formatter: (value: any, ctx: any) => {
                const index = ctx.dataIndex;
                const v1 = sem1[index] ?? 0;
                const v2 = sem2[index] ?? 0;
                return ctx.datasetIndex === 0 ? v1 : v2;
              }
            }
          },
          scales: { y: { beginAtZero: true } }
        }
      });
      this.chartMap[id] = chart;
    }, err => console.error('err movilidades tiempo', err));
    this.subs.push(sub);
  }

  // 2) Paises: dos gráficas verticales (Colombia → otros / otros → Colombia)
  private chartPaises() {
    const sub = this.dashboardService.getMovilidadesPorPais().pipe(catchError(() => of([]))).subscribe(data => {
      const origenCol = data.filter((d:any) => d.paisorigen === 'Colombia' && d.paisdestino !== 'Colombia').slice(0,12);
      const destinoCol = data.filter((d:any) => d.paisdestino === 'Colombia' && d.paisorigen !== 'Colombia').slice(0,12);

      this.renderBarWithLabelsInside('paisesOrigenCanvas', origenCol.map((d:any) => d.paisdestino), origenCol.map((d:any) => d.total_movilidades), 'Colombia → País Saliente');
      this.renderBarWithLabelsInside('paisesDestinoCanvas', destinoCol.map((d:any) => d.paisorigen), destinoCol.map((d:any) => d.total_movilidades), 'País Entrante → Colombia');
    }, err => console.error('err paises', err));
    this.subs.push(sub);
  }

  // 3) Programas
  private chartProgramas() {
    const sub = this.dashboardService.getMovilidadesPorPrograma().pipe(catchError(() => of([]))).subscribe(data => {
      const labels = data.map((d:any) => d.nombreprograma);
      const values = data.map((d:any) => d.total_movilidades);
      const colors = labels.map((l: any, i: number) => this.PALETTE[i % this.PALETTE.length]);
      this.renderHorizontalBarWithLabelsInside('programasCanvas', labels, values, 'Programas', colors);
    }, err => console.error('err programas', err));
    this.subs.push(sub);
  }

  // 4) Convenios
  private chartConvenios() {
    const sub = this.dashboardService.getMovilidadesPorConvenio().pipe(catchError(() => of([]))).subscribe(data => {
      this.renderBarWithLabelsInside('conveniosCanvas', data.map((d:any) => d.codigo), data.map((d:any) => d.total_movilidades), 'Convenios');
    }, err => console.error('err convenios', err));
    this.subs.push(sub);
  }

  // 5) Instituciones
  private chartInstituciones() {
    const sub = this.dashboardService.getMovilidadesPorInstitucion().pipe(catchError(() => of([]))).subscribe(data => {
      const entrantes = data.filter((d:any) => d.instituciondestino === 'Universidad de Investigacion y Desarrollo (UDI)' && d.institucionorigen !== 'Universidad de Investigacion y Desarrollo (UDI)').slice(0,12);
      const salientes = data.filter((d:any) => d.institucionorigen === 'Universidad de Investigacion y Desarrollo (UDI)' && d.instituciondestino !== 'Universidad de Investigacion y Desarrollo (UDI)').slice(0,12);
      this.renderHorizontalBarWithLabelsInside('institucionesEntrantesCanvas', entrantes.map((d:any) => d.institucionorigen), entrantes.map((d:any) => d.total_movilidades), 'Instituciones → ORI');
      this.renderHorizontalBarWithLabelsInside('institucionesSalientesCanvas', salientes.map((d:any) => d.instituciondestino), salientes.map((d:any) => d.total_movilidades), 'ORI → Instituciones');
    }, err => console.error('err instituciones', err));
    this.subs.push(sub);
  }

  // 6) Generos
  private chartGeneros() {
    const sub = this.dashboardService.getMovilidadesPorGenero().pipe(catchError(() => of([]))).subscribe(data => {
      this.renderPieWithPercentInside('generosCanvas', data.map((d:any) => d.genero), data.map((d:any) => d.total_movilidades), 'Género');
    }, err => console.error('err generos', err));
    this.subs.push(sub);
  }

  // 7) Direcciones
  private chartDirecciones() {
    const sub = this.dashboardService.getMovilidadesPorDireccion().pipe(catchError(() => of([]))).subscribe(data => {
      this.renderBarWithLabelsInside('direccionesCanvas', data.map((d:any) => d.direccion), data.map((d:any) => d.total_movilidades), 'Dirección');
    }, err => console.error('err direcciones', err));
    this.subs.push(sub);
  }

  // 8) Tipos
  private chartTipos() {
    const sub = this.dashboardService.getMovilidadesPorTipo().pipe(catchError(() => of([]))).subscribe(data => {
      this.renderPieWithPercentInside('tiposCanvas', data.map((d:any) => d.tipo), data.map((d:any) => d.total_movilidades), 'Tipo');
    }, err => console.error('err tipos', err));
    this.subs.push(sub);
  }

  // 9) Modalidades
  private chartModalidades() {
    const sub = this.dashboardService.getMovilidadesPorModalidad().pipe(catchError(() => of([]))).subscribe(data => {
      this.renderPieWithPercentInside('modalidadesCanvas', data.map((d:any) => d.modalidad), data.map((d:any) => d.total_movilidades), 'Modalidad');
    }, err => console.error('err modalidades', err));
    this.subs.push(sub);
  }

  // ---------------- Tables (TOP / BOTTOM) ----------------
  loadTables() {
    const sub = forkJoin({
      top: this.dashboardService.getTopPaises().pipe(catchError(() => of([]))),
      bottom: this.dashboardService.getBottomPaises().pipe(catchError(() => of([])))
    }).subscribe({
      next: res => {
        this.ngZone.run(() => {
          const top: any[] = res.top ?? [];
          const bottom: any[] = res.bottom ?? [];

          // Reasignar arrays (inmutabilidad ligera)
          this.topPaisesOrigen = top.filter((p:any) => p.paisorigen !== 'Colombia');
          this.topPaisesDestino = top.filter((p:any) => p.paisdestino !== 'Colombia');
          this.bottomPaisesOrigen = bottom.filter((p:any) => p.paisorigen !== 'Colombia');
          this.bottomPaisesDestino = bottom.filter((p:any) => p.paisdestino !== 'Colombia');

          console.log('Tables loaded, topPaisesOrigen:', this.topPaisesOrigen);

          this.cdr.detectChanges();
        });
      },
      error: err => {
        console.error('err tables (subscribe):', err);
      }
    });
    this.subs.push(sub);
  }

  // ---------------- Render helpers (con valor absoluto dentro) ----------------

  private renderBarWithLabelsInside(id: string, labels: string[], values: number[], title: string) {
    this.destroyChartIfExists(id);
    const ctx = (document.getElementById(id) as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;
    const colors = this.colorsFor(labels.length);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: title, data: values, backgroundColor: colors }] },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: title },
          tooltip: this.tooltipCallbacks(),
          datalabels: {
            color: '#fff',
            anchor: 'center',
            align: 'center',
            formatter: (value: any) => value
          }
        },
        scales: { y: { beginAtZero: true } }
      }
    });
    this.chartMap[id] = chart;
  }

  private renderHorizontalBarWithLabelsInside(id: string, labels: string[], values: number[], title: string, colors?: string[]) {
    this.destroyChartIfExists(id);
    const ctx = (document.getElementById(id) as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;
    const palette = colors ?? this.colorsFor(labels.length);

    const chart = new Chart(ctx, {
      type: 'bar' as ChartConfiguration['type'],
      data: { labels, datasets: [{ label: title, data: values, backgroundColor: palette }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: { display: true, text: title },
          tooltip: this.tooltipCallbacks(),
          datalabels: {
            color: '#fff',
            anchor: 'center',
            align: 'center',
            formatter: (value: any) => value
          }
        },
        scales: { x: { beginAtZero: true } }
      }
    });
    this.chartMap[id] = chart;
  }

  private renderPieWithPercentInside(id: string, labels: string[], values: number[], title: string) {
    this.destroyChartIfExists(id);
    const ctx = (document.getElementById(id) as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;
    const colors = this.colorsFor(labels.length);

    const chart = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ label: title, data: values, backgroundColor: colors }] },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: title },
          tooltip: this.tooltipCallbacks(),
          datalabels: {
            color: '#fff',
            formatter: (value: any) => value
          }
        }
      }
    });
    this.chartMap[id] = chart;
  }
}
