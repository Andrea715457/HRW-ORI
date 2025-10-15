import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
declare var Chart: any; // Declarar Chart para usar Chart.js desde CDN
declare const google: any;

@Component({
  selector: 'app-dashboard',
  // imports: [], // no need aquí
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  // KPI values (mock)
  totalConvenios = 55;
  convenios = 2;
  pctUsados = 0.67;
  pctActivos = 0.6;

  // Canvas refs (donuts)
  @ViewChild('studentInCanvas') studentInCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('studentOutCanvas') studentOutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('teacherInCanvas') teacherInCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('teacherOutCanvas') teacherOutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('adminInCanvas') adminInCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('adminOutCanvas') adminOutCanvas!: ElementRef<HTMLCanvasElement>;

  // Program bar canvas
  @ViewChild('programCanvas') programCanvas!: ElementRef<HTMLCanvasElement>;

  // stacked bar canvas
  @ViewChild('stackedCanvas') stackedCanvas!: ElementRef<HTMLCanvasElement>;

  // pies (inferior)
  @ViewChild('pieStudentOut') pieStudentOut!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieStudentIn') pieStudentIn!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieTeacherOut') pieTeacherOut!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieTeacherIn') pieTeacherIn!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieAdminIn') pieAdminIn!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieAdminOut') pieAdminOut!: ElementRef<HTMLCanvasElement>;

  // registry of charts to resize/destroy
  private charts: any[] = [];

  // program chart (kept for convenience)
  private programChart: any;
  private stackedChart: any;

  // Datos de ejemplo (usar nombres consistentes)
  programs = ['Sistemas', 'Civil', 'Derecho', 'Administración de empresas', 'Electrónica'];
  presencialCounts = [9, 7, 7, 2, 0];
  virtualCounts = [2, 5, 7, 6, 2];

  convenioLabels = ['CON-AK31','CON-AK27','CON-AK24','CON-AK30','CON-AK29','CON-AK22','CON-AK32','CON-AK21','CON-AK25','CON-AK28'];
  // usa nombres descriptivos y consistentes
  virtualData =        [10,  11,  9,   8,   7,   5,   6,   7,   6,   5];
  presencialData =     [15,  14,  12,  10,  12,  9,   8,   9,   11,  9];

  ngAfterViewInit(): void {
    // Esperar un poco para que Tailwind aplique clases y DOM esté listo
    setTimeout(() => {
      this.initDonuts();
      this.createProgramBar();
      this.drawGeoMap();
      this.createAllPies();
      this.createStackedBar(); // <-- importante: ahora sí lo llamamos
    }, 50);

    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    // limpiar listeners y charts una sola vez
    window.removeEventListener('resize', this.onResize);
    this.destroyCharts();
  }

  // onResize único y simple
  private onResize = () => {
    this.charts.forEach(c => c?.resize?.());
  }

  // ---------------- DONUTS SUPERIORES ----------------
  private initDonuts() {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js no está disponible. Asegúrate de agregar el CDN en index.html');
      return;
    }

    const makeDonut = (el: ElementRef<HTMLCanvasElement>, data: number[], labels = ['Presencial','Virtual']) => {
      const ctx = el?.nativeElement?.getContext('2d');
      if (!ctx) { console.error('Context 2D no disponible para canvas', el); return null; }

      const c = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: ['#3b82f6', '#f59e0b'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: { display: true, position: 'bottom', labels: { boxWidth: 10, padding: 6 } },
            tooltip: { enabled: true }
          }
        }
      });
      this.charts.push(c);
      return c;
    };

    makeDonut(this.studentInCanvas, [66.7, 33.3]);
    makeDonut(this.studentOutCanvas, [38.5, 61.5]);
    makeDonut(this.teacherInCanvas, [66.7, 33.3]);
    makeDonut(this.teacherOutCanvas, [100, 0]);
    makeDonut(this.adminInCanvas, [66.7, 33.3]);
    makeDonut(this.adminOutCanvas, [71.4, 28.6]);
  }

  private destroyCharts() {
    this.charts.forEach(c => {
      try { c?.destroy?.(); } catch (e) { /* ignore */ }
    });
    this.charts = [];
    this.programChart = null;
    this.stackedChart = null;
  }

  // ---------------- PROGRAM BAR ----------------
  private createProgramBar() {
    if (typeof Chart === 'undefined') { console.error('Chart.js no está cargado'); return; }
    const ctx = this.programCanvas.nativeElement.getContext('2d');
    if (!ctx) { console.error('No se obtuvo contexto 2D para programCanvas'); return; }

    // destruir anterior si existiera
    this.programChart?.destroy?.();
    // Re-crear
    this.programChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.programs,
        datasets: [
          { label: 'Presencial', data: this.presencialCounts, backgroundColor: '#3b82f6', barThickness: 'flex' },
          { label: 'Virtual',     data: this.virtualCounts,    backgroundColor: '#f59e0b', barThickness: 'flex' }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { beginAtZero: true, ticks:{ stepSize: 1 } }, y: { ticks:{ autoSkip: false } } },
        plugins: { legend: { position: 'bottom' }, tooltip: { mode: 'index', intersect: false } }
      }
    });

    // asegurarnos de gestionar resize/destrucción centralizada
    this.charts.push(this.programChart);
  }

  // ---------- MAPA (Google GeoChart) ----------
  private drawGeoMap() {
    const geoData = [
      ['Country', 'Movilidades'],
      ['Colombia', 9],
      ['Argentina', 5],
      ['México', 2],
      ['España', 1]
    ];

    try {
      google.charts.load('current', { packages: ['geochart'] });
      google.charts.setOnLoadCallback(() => {
        const data = google.visualization.arrayToDataTable(geoData);
        const options = {
          region: 'world',
          displayMode: 'regions',
          colorAxis: { colors: ['#d1fae5', '#ec4899', '#3b82f6'] },
          backgroundColor: '#f8fafc',
          datalessRegionColor: '#e5e7eb',
          legend: 'none'
        };
        const chart = new google.visualization.GeoChart(document.getElementById('geoMap'));
        chart.draw(data, options);
      });
    } catch (err) {
      console.error('Error cargando Google Charts:', err);
      const el = document.getElementById('geoMap');
      if (el) el.innerHTML = '<div class="h-full flex items-center justify-center text-gray-500">Mapa no disponible</div>';
    }
  }

  // ---------------- Stacked Horizontal Bar ----------------
  private createStackedBar() {
    if (typeof Chart === 'undefined') { console.error('Chart.js no está cargado'); return; }
    const ctx = this.stackedCanvas.nativeElement.getContext('2d');
    if (!ctx) { console.error('No se obtuvo contexto 2D para stackedCanvas'); return; }

    // destruir si existiera (evitar duplicados)
    const existing = this.charts.find(c => c?.canvas === this.stackedCanvas.nativeElement);
    if (existing) { existing.destroy(); this.charts = this.charts.filter(c => c !== existing); }

    this.stackedChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.convenioLabels,
        datasets: [
          { label: 'Virtual', data: this.virtualData, backgroundColor: '#3b82f6' },
          { label: 'Presencial', data: this.presencialData, backgroundColor: '#f59e0b' }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 2,
        scales: { x: { stacked: true, beginAtZero: true, ticks:{ stepSize: 1 } }, y: { stacked: true } },
        plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } }
      }
    });

    this.charts.push(this.stackedChart);
  }

  // ---------------- Multiple pies (inferior) ----------------
  private createPie(elRef: ElementRef<HTMLCanvasElement>, data: number[], labels: string[]) {
    if (typeof Chart === 'undefined') { console.error('Chart.js no está cargado'); return null; }
    const ctx = elRef.nativeElement.getContext('2d');
    if (!ctx) { console.error('No se obtuvo contexto 2D para pie'); return null; }

    const existing = this.charts.find(c => c?.canvas === elRef.nativeElement);
    if (existing) { existing.destroy(); this.charts = this.charts.filter(c => c !== existing); }

    const c = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: this.generatePalette(data.length), borderWidth: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10 } },
          tooltip: { callbacks: {
            label: (ctx: any) => {
              const v = ctx.raw;
              const total = ctx.dataset.data.reduce((a: number,b:number)=>a+b,0);
              const pct = total ? ((v/total)*100).toFixed(1) + '%' : '';
              return `${ctx.label}: ${v} (${pct})`;
            }
          }}
        }
      }
    });

    this.charts.push(c);
    return c;
  }

  private createAllPies() {
    this.createPie(this.pieStudentOut, [17,13,13,11,10,9,9,7,6,4],
      ['Rotacion medica','Semestre intercambio','Pasantía','Misión','Curso','Pasantía2','Evento','Doctorado','PostDoc','Asistencia']);
    this.createPie(this.pieStudentIn, [28,25,19,16,6,6], ['Rotacion','Mision','Pasantia','Curso','Evento','Asistencia']);
    this.createPie(this.pieTeacherOut, [15,13,13,13,10,8,8,6,6,8],
      ['PostDoctorado','Doctorado','Misión','Evento','Curso','Asistencia','Gestión','Otro','Otro2','Otro3']);
    this.createPie(this.pieTeacherIn, [16,14,14,14,10,8,7,5,5,7],
      ['PostDoctorado','Doctorado','Misión','Evento','Curso','Asistencia','Gestión','Otro','Otro2','Otro3']);
    this.createPie(this.pieAdminIn, [27,9,9,9,9,9,9], ['Gestión','Curso corto','Evento','Asistencia','Otro1','Otro2','Otro3']);
    this.createPie(this.pieAdminOut, [22,17,14,14,11,8,6,8],
      ['Gestión','Asistencia','Curso corto','Evento','Misión','Otro1','Otro2','Otro3']);
  }

  // Utility: palette
  private generatePalette(n: number) {
    const base = ['#3b82f6','#f97316','#10b981','#8b5cf6','#ef4444','#06b6d4','#f59e0b','#84cc16','#ec4899','#0ea5a4','#a78bfa','#fb7185','#60a5fa','#34d399'];
    const palette: string[] = [];
    for (let i = 0; i < n; i++) palette.push(base[i % base.length]);
    return palette;
  }

  // helper: descargar imagen de cualquier chart
  downloadChartImage(chartIndexOrCanvas: number | HTMLCanvasElement, filename = 'chart.png') {
    let canvasEl: HTMLCanvasElement | null = null;
    if (typeof chartIndexOrCanvas === 'number') {
      const c = this.charts[chartIndexOrCanvas];
      canvasEl = c?.canvas || null;
    } else {
      canvasEl = chartIndexOrCanvas;
    }
    if (!canvasEl) return;
    const link = document.createElement('a');
    link.href = canvasEl.toDataURL('image/png');
    link.download = filename;
    link.click();
  }
}
