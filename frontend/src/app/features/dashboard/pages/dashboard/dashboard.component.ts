// v2 — Dashboard renovado 2026-08-11
import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { PdfGeneratorService } from '../../../../core/services/pdf-generator.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, MatIconModule],
  template: `
    <div class="dash" #dashboardContainer>

      <!-- ── HEADER ────────────────────────────────────────────── -->
      <div class="dash-header">
        <div class="header-left">
          <div class="header-icon"><mat-icon>shield</mat-icon></div>
          <div>
            <h1 class="header-title">Dashboard Ejecutivo</h1>
            <p class="header-sub">
              <mat-icon>calendar_today</mat-icon>
              {{ currentDate | date:"EEEE, d 'de' MMMM yyyy" : '' : 'es' }}
            </p>
          </div>
        </div>
        <button class="btn-export" (click)="exportReport()">
          <mat-icon>file_download</mat-icon> Exportar PDF
        </button>
      </div>

      <!-- ── KPI CARDS ─────────────────────────────────────────── -->
      <div class="kpi-grid">

        <div class="kpi-card kpi-blue">
          <div class="kpi-top">
            <div class="kpi-texts">
              <span class="kpi-label">Total Incidentes</span>
              <span class="kpi-value">{{ kpis().totalIncidentes }}</span>
            </div>
            <div class="kpi-ico"><mat-icon>folder_open</mat-icon></div>
          </div>
          <div class="kpi-bar">
            <div class="kpi-tag tag-blue">
              <mat-icon>bar_chart</mat-icon> Histórico acumulado
            </div>
          </div>
        </div>

        <div class="kpi-card kpi-amber">
          <div class="kpi-top">
            <div class="kpi-texts">
              <span class="kpi-label">Abiertos</span>
              <span class="kpi-value">{{ kpis().abiertos }}</span>
            </div>
            <div class="kpi-ico"><mat-icon>pending_actions</mat-icon></div>
          </div>
          <div class="kpi-bar">
            <div class="kpi-tag tag-amber">
              <mat-icon>schedule</mat-icon> Requieren atención
            </div>
          </div>
        </div>

        <div class="kpi-card kpi-red">
          <div class="kpi-top">
            <div class="kpi-texts">
              <span class="kpi-label">Críticos</span>
              <span class="kpi-value">{{ kpis().criticos }}</span>
            </div>
            <div class="kpi-ico"><mat-icon>warning_amber</mat-icon></div>
          </div>
          <div class="kpi-bar">
            <div class="kpi-tag tag-red">
              <span class="pulse-dot"></span> Acción Inmediata
            </div>
          </div>
        </div>

        <div class="kpi-card kpi-green">
          <div class="kpi-top">
            <div class="kpi-texts">
              <span class="kpi-label">Resueltos (Mes)</span>
              <span class="kpi-value">{{ kpis().resueltos }}</span>
            </div>
            <div class="kpi-ico"><mat-icon>check_circle</mat-icon></div>
          </div>
          <div class="kpi-bar">
            <div class="kpi-tag tag-green">
              <mat-icon>timer</mat-icon>
              MTTR: {{ kpis().mttr > 0 ? (kpis().mttr | number:'1.1-1') + ' hrs' : 'N/A' }}
            </div>
          </div>
        </div>

      </div>

      <!-- ── FILA 1: Categorías + Severidad ────────────────────── -->
      <div class="row-2col">

        <!-- Categorías — barras horizontales -->
        <div class="card">
          <div class="card-head">
            <div class="card-title">
              <div class="card-ico ico-purple"><mat-icon>bar_chart</mat-icon></div>
              Incidentes por Categoría
            </div>
          </div>
          <div class="card-body no-pad">
            <apx-chart *ngIf="barChartOptions"
              [series]="barChartOptions.series!"
              [chart]="barChartOptions.chart!"
              [dataLabels]="barChartOptions.dataLabels!"
              [plotOptions]="barChartOptions.plotOptions!"
              [xaxis]="barChartOptions.xaxis!"
              [yaxis]="barChartOptions.yaxis!"
              [colors]="barChartOptions.colors!"
              [grid]="barChartOptions.grid!"
              [tooltip]="barChartOptions.tooltip!">
            </apx-chart>
            <div *ngIf="!barChartOptions" class="empty-chart">
              <mat-icon>bar_chart</mat-icon><span>Sin datos de categorías</span>
            </div>
          </div>
        </div>

        <!-- Severidad — donut -->
        <div class="card">
          <div class="card-head">
            <div class="card-title">
              <div class="card-ico ico-purple"><mat-icon>donut_large</mat-icon></div>
              Severidad Global
            </div>
            <span class="total-badge">{{ donutTotal }} total</span>
          </div>
          <div class="card-body donut-body">
            <apx-chart *ngIf="donutChartOptions"
              [series]="donutChartOptions.series!"
              [chart]="donutChartOptions.chart!"
              [labels]="donutChartOptions.labels!"
              [colors]="donutChartOptions.colors!"
              [plotOptions]="donutChartOptions.plotOptions!"
              [stroke]="donutChartOptions.stroke!"
              [legend]="donutChartOptions.legend!"
              [dataLabels]="donutChartOptions.dataLabels!"
              [tooltip]="donutChartOptions.tooltip!">
            </apx-chart>
            <!-- Leyenda custom debajo del donut -->
            <div class="sev-legend" *ngIf="donutTotal > 0">
              <div class="sev-item" *ngFor="let sev of sevBreakdown">
                <span class="sev-dot" [style.background]="sev.color"></span>
                <span class="sev-name">{{ sev.label }}</span>
                <span class="sev-count">{{ sev.value }}</span>
                <span class="sev-pct">{{ ((sev.value / donutTotal) * 100) | number:'1.0-0' }}%</span>
              </div>
            </div>
            <div *ngIf="donutTotal === 0" class="empty-chart">
              <mat-icon>donut_large</mat-icon><span>Sin incidentes registrados</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ── FILA 2: Tendencia Anual ────────────────────────────── -->
      <div class="card mb-6">
        <div class="card-head">
          <div class="card-title">
            <div class="card-ico ico-purple"><mat-icon>timeline</mat-icon></div>
            Tendencia Anual {{ currentYear }} — Incidentes y Eventos
          </div>
          <div class="trend-legend">
            <span class="leg-dot" style="background:#4f46e5"></span><span class="leg-lbl">Incidentes</span>
            <span class="leg-dot" style="background:#10b981"></span><span class="leg-lbl">Eventos</span>
          </div>
        </div>
        <div class="card-body no-pad">
          <apx-chart *ngIf="lineChartOptions"
            [series]="lineChartOptions.series!"
            [chart]="lineChartOptions.chart!"
            [xaxis]="lineChartOptions.xaxis!"
            [yaxis]="lineChartOptions.yaxis!"
            [stroke]="lineChartOptions.stroke!"
            [colors]="lineChartOptions.colors!"
            [fill]="lineChartOptions.fill!"
            [grid]="lineChartOptions.grid!"
            [dataLabels]="lineChartOptions.dataLabels!"
            [markers]="lineChartOptions.markers!"
            [tooltip]="lineChartOptions.tooltip!">
          </apx-chart>
        </div>
      </div>

      <!-- ── FILA 3: Centro de Operaciones ─────────────────────── -->
      <div class="card">
        <div class="card-head">
          <div class="card-title">
            <div class="card-ico ico-purple"><mat-icon>monitor_heart</mat-icon></div>
            Centro de Operaciones
            <span class="ops-badge">Últimos 10 incidentes</span>
          </div>
        </div>
        <div class="card-body no-pad">

          <!-- Tabla con scroll fijo -->
          <div class="ops-scroll" *ngIf="recentActivity().length > 0">
            <table class="ops-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th class="text-center">Nivel</th>
                  <th>Estado</th>
                  <th>Registrado por</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inc of recentActivity()">
                  <td class="td-ticket">{{ inc.codigo }}</td>
                  <td class="td-desc" [title]="inc.titulo">{{ inc.titulo }}</td>
                  <td class="td-cat">{{ inc.categoria | titlecase }}</td>
                  <td class="td-sev text-center">
                    <span class="sev-pill" [attr.data-sev]="inc.severidad">{{ inc.severidad }}</span>
                  </td>
                  <td>
                    <span class="status-pill" [attr.data-st]="inc.estado">{{ inc.estado }}</span>
                  </td>
                  <td class="td-user">
                    <span class="user-chip">
                      <mat-icon>person</mat-icon>{{ inc.creadoPor }}
                    </span>
                  </td>
                  <td class="td-date">{{ inc.fechaRegistro | date:'dd/MM/yy HH:mm' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="recentActivity().length === 0" class="empty-ops">
            <mat-icon>shield</mat-icon>
            <p class="empty-t">Sin incidentes registrados</p>
            <p class="empty-s">El sistema opera con normalidad</p>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .dash {
      padding: 28px 32px;
      background: #f0f2f8;
      min-height: 100vh;
      font-family: 'Montserrat', sans-serif;
      box-sizing: border-box;
    }

    /* ── HEADER ── */
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, #272257 0%, #4f46e5 100%);
      display: flex; align-items: center; justify-content: center;
      color: white; box-shadow: 0 8px 20px rgba(39,34,87,.35);
    }
    .header-icon mat-icon { font-size: 26px; width: 26px; height: 26px; }
    .header-title {
      font-family: 'Bebas Neue', sans-serif; font-size: 32px;
      letter-spacing: 1.5px; color: #1e293b; margin: 0;
    }
    .header-sub {
      font-size: 13px; color: #64748b; margin: 3px 0 0;
      display: flex; align-items: center; gap: 6px; font-weight: 500;
    }
    .header-sub mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .btn-export {
      display: flex; align-items: center; gap: 8px;
      background: white; border: 1px solid #e2e8f0; color: #475569;
      padding: 10px 18px; border-radius: 10px; font-size: 13px;
      font-weight: 700; cursor: pointer; font-family: 'Montserrat', sans-serif;
      transition: all .2s; box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }
    .btn-export:hover { background: #272257; color: white; border-color: #272257; }
    .btn-export mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ── KPI GRID ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }
    @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px)  { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi-card {
      border-radius: 16px; padding: 22px 24px 18px;
      display: flex; flex-direction: column; gap: 16px;
      box-shadow: 0 4px 14px rgba(0,0,0,.06);
      transition: transform .25s, box-shadow .25s;
      position: relative; overflow: hidden;
    }
    .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 10px 28px rgba(0,0,0,.12); }

    .kpi-blue  { background: #fff; border-top: 4px solid #4f46e5; }
    .kpi-amber { background: #fff; border-top: 4px solid #f59e0b; }
    .kpi-red   { background: linear-gradient(135deg,#dc2626 0%,#be123c 100%); border-top: none; }
    .kpi-green { background: #fff; border-top: 4px solid #10b981; }

    .kpi-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .kpi-texts { display: flex; flex-direction: column; gap: 4px; }
    .kpi-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; }
    .kpi-red .kpi-label { color: rgba(255,255,255,.75); }
    .kpi-value { font-size: 42px; font-weight: 900; color: #1e293b; line-height: 1; }
    .kpi-red .kpi-value { color: white; }

    .kpi-ico {
      width: 46px; height: 46px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-blue  .kpi-ico { background: #eef2ff; color: #4f46e5; }
    .kpi-amber .kpi-ico { background: #fffbeb; color: #f59e0b; }
    .kpi-red   .kpi-ico { background: rgba(255,255,255,.2); color: white; backdrop-filter: blur(6px); }
    .kpi-green .kpi-ico { background: #ecfdf5; color: #10b981; }
    .kpi-ico mat-icon { font-size: 22px; width: 22px; height: 22px; }

    .kpi-bar { display: flex; }
    .kpi-tag {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 700; padding: 5px 10px;
      border-radius: 7px;
    }
    .kpi-tag mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .tag-blue  { background: #eef2ff; color: #4338ca; }
    .tag-amber { background: #fffbeb; color: #b45309; }
    .tag-red   { background: rgba(0,0,0,.2); color: white; backdrop-filter: blur(4px); }
    .tag-green { background: #ecfdf5; color: #047857; }

    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%; background: white;
      display: inline-block;
      animation: pulseDot 1.6s ease-in-out infinite;
    }
    @keyframes pulseDot {
      0%,100% { opacity:1; transform:scale(1); }
      50% { opacity:.5; transform:scale(.7); }
    }

    /* ── LAYOUT ROWS ── */
    .row-2col {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    @media (max-width: 960px) { .row-2col { grid-template-columns: 1fr; } }

    .mb-6 { margin-bottom: 24px; }

    /* ── CARD BASE ── */
    .card {
      background: white; border-radius: 16px;
      box-shadow: 0 4px 14px rgba(0,0,0,.05);
      border: 1px solid #f1f5f9;
      overflow: hidden;
      transition: box-shadow .25s;
    }
    .card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.09); }

    .card-head {
      padding: 18px 24px; border-bottom: 1px solid #f1f5f9;
      display: flex; justify-content: space-between; align-items: center;
      background: white;
    }
    .card-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 15px; font-weight: 700; color: #1e293b;
    }
    .card-ico {
      width: 30px; height: 30px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .ico-purple { background: #eef2ff; color: #4f46e5; }
    .card-ico mat-icon { font-size: 17px; width: 17px; height: 17px; }

    .card-body { flex: 1; }
    .card-body.no-pad { padding: 0; }
    .card-body.donut-body { padding: 16px 24px 20px; }

    /* ── CHARTS ── */
    .empty-chart {
      height: 200px; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #94a3b8; gap: 8px;
    }
    .empty-chart mat-icon { font-size: 36px; width: 36px; height: 36px; opacity: .4; }

    .total-badge {
      font-size: 12px; font-weight: 700; color: #64748b;
      background: #f8fafc; border: 1px solid #e2e8f0;
      padding: 4px 12px; border-radius: 20px;
    }

    /* Donut legend */
    .sev-legend {
      display: flex; flex-direction: column; gap: 8px;
      margin-top: 12px;
    }
    .sev-item {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 600;
    }
    .sev-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .sev-name { flex: 1; color: #475569; }
    .sev-count { font-weight: 800; color: #1e293b; min-width: 24px; text-align: right; }
    .sev-pct { color: #94a3b8; font-size: 11px; min-width: 36px; text-align: right; }

    /* Trend legend */
    .trend-legend { display: flex; align-items: center; gap: 12px; }
    .leg-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .leg-lbl { font-size: 12px; font-weight: 600; color: #64748b; }

    /* ── CENTRO DE OPERACIONES TABLE ── */
    .ops-badge {
      font-size: 11px; font-weight: 700; color: #4f46e5;
      background: #eef2ff; border: 1px solid #c7d2fe;
      padding: 3px 10px; border-radius: 20px; margin-left: 8px;
    }

    .ops-scroll {
      max-height: 360px;
      overflow-y: auto;
      overflow-x: auto;
    }
    .ops-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
    .ops-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
    .ops-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    .ops-table {
      width: 100%; border-collapse: collapse; text-align: left;
      font-size: 13px;
    }
    .ops-table thead { position: sticky; top: 0; z-index: 2; }
    .ops-table th {
      padding: 12px 16px;
      background: #f8fafc; color: #64748b;
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 1px;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }
    .ops-table td {
      padding: 12px 16px; border-bottom: 1px solid #f1f5f9;
      background: white; color: #334155;
      transition: background .15s;
    }
    .ops-table tbody tr:hover td { background: #fafbff; }
    .ops-table tbody tr:last-child td { border-bottom: none; }

    .td-ticket {
      font-family: 'Roboto Mono', monospace;
      font-size: 12px; font-weight: 700; color: #4f46e5;
      white-space: nowrap;
    }
    .td-desc {
      max-width: 220px; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
      font-weight: 500; color: #1e293b;
    }
    .td-cat { color: #64748b; font-size: 12px; white-space: nowrap; }
    .td-sev { white-space: nowrap; }
    .td-user { white-space: nowrap; }
    .td-date { white-space: nowrap; color: #94a3b8; font-size: 11px; }

    .text-center { text-align: center; }

    /* Severity pill */
    .sev-pill {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .5px;
    }
    .sev-pill[data-sev="BAJA"]   { background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; }
    .sev-pill[data-sev="MEDIA"]  { background:#fffbeb; color:#b45309; border:1px solid #fde68a; }
    .sev-pill[data-sev="ALTA"]   { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
    .sev-pill[data-sev="CRITICA"]{ background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }

    /* Status pill */
    .status-pill {
      display: inline-block; padding: 4px 10px; border-radius: 20px;
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .5px; white-space: nowrap;
    }
    .status-pill[data-st="ABIERTO"]      { background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; }
    .status-pill[data-st="EN_PROGRESO"]  { background:#fffbeb; color:#b45309; border:1px solid #fde68a; }
    .status-pill[data-st="CERRADO"]      { background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; }
    .status-pill[data-st="FALSO_POSITIVO"]{ background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; }

    /* User chip */
    .user-chip {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 12px; color: #475569; font-weight: 600;
    }
    .user-chip mat-icon { font-size: 14px; width: 14px; height: 14px; color: #94a3b8; }

    /* Empty state */
    .empty-ops {
      padding: 56px 24px; display: flex; flex-direction: column;
      align-items: center; justify-content: center; color: #94a3b8;
    }
    .empty-ops mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .3; margin-bottom: 12px; }
    .empty-t { font-size: 15px; font-weight: 700; color: #64748b; margin: 0; }
    .empty-s { font-size: 13px; margin: 6px 0 0; }

    /* ── MODO EXPORTACIÓN PDF ── */
    :host ::ng-deep .pdf-export-mode .ops-scroll {
      max-height: none !important;
      overflow: visible !important;
    }
    :host ::ng-deep .pdf-export-mode .card {
      overflow: visible !important;
      height: auto !important;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private pdfGenerator = inject(PdfGeneratorService);

  @ViewChild('dashboardContainer', { static: false }) dashboardContainer!: ElementRef;

  currentDate = new Date();
  currentYear = new Date().getFullYear();

  kpis = signal({ totalIncidentes: 0, abiertos: 0, criticos: 0, resueltos: 0, mttr: 0 });
  recentActivity = signal<any[]>([]);

  barChartOptions: any = null;
  donutChartOptions: any = null;
  lineChartOptions: any = null;
  donutTotal: number = 0;
  sevBreakdown: { label: string; value: number; color: string }[] = [];

  ngOnInit() { this.loadData(); }

  async exportReport() {
    if (this.dashboardContainer) {
      const el = this.dashboardContainer.nativeElement as HTMLElement;
      
      // Aplicar una clase CSS temporal para forzar la expansión de todos los contenedores
      el.classList.add('pdf-export-mode');
      
      // Pausa más larga (300ms) para que el navegador recalcule el layout completo
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        await this.pdfGenerator.generateDashboardPdf(el);
      } finally {
        // Remover la clase para volver a la vista normal con scroll
        el.classList.remove('pdf-export-mode');
      }
    }
  }

  loadData() {
    this.dashboardService.getKpis().subscribe({
      next: (data) => {
        if (data) {
          this.kpis.set({
            totalIncidentes: data.totalIncidentes || 0,
            abiertos:        data.incidentesAbiertos || 0,
            criticos:        data.incidentesCriticos || 0,
            resueltos:       data.incidentesCerradosMes || 0,
            mttr:            data.tiempoPromedioResolucion || 0,
          });
        }
      },
      error: (err) => console.error(err)
    });

    this.dashboardService.getRecentActivity().subscribe({
      next: (data: any[]) => this.recentActivity.set(data || []),
      error: (err) => console.error(err)
    });

    this.dashboardService.getCharts().subscribe({
      next: (data) => this.initCharts(data),
      error: (err) => { console.error(err); this.initCharts(); }
    });
  }

  initCharts(data?: any) {
    const COLORS = {
      primary:  '#272257',
      indigo:   '#4f46e5',
      green:    '#10b981',
      amber:    '#f59e0b',
      orange:   '#f97316',
      red:      '#ef4444',
      crimson:  '#b91c1c',
      gray:     '#64748b',
      grayLt:   '#f1f5f9',
    };

    // ── Categorías ── barras horizontales
    const catData: { name: string; value: number }[] = (data?.categoria || [])
      .map((c: any) => ({ name: c.name || 'Sin Categoría', value: parseInt(c.value, 10) }))
      .sort((a: any, b: any) => b.value - a.value);

    if (catData.length > 0) {
      this.barChartOptions = {
        series: [{ name: 'Incidentes', data: catData.map(c => c.value) }],
        chart: { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'Montserrat, sans-serif' },
        colors: [COLORS.indigo],
        plotOptions: {
          bar: { borderRadius: 6, horizontal: true, barHeight: '55%',
                 dataLabels: { position: 'right' } }
        },
        dataLabels: {
          enabled: true,
          textAnchor: 'start',
          offsetX: 8,
          style: { fontSize: '13px', colors: ['#1e293b'], fontWeight: 700, fontFamily: 'Montserrat, sans-serif' },
          formatter: (val: number) => val > 0 ? val.toString() : ''
        },
        grid: { borderColor: COLORS.grayLt, strokeDashArray: 4, xaxis: { lines: { show: true } } },
        xaxis: {
          categories: catData.map(c => c.name),
          labels: { style: { colors: COLORS.gray, fontWeight: 600, fontSize: '11px' } },
          axisBorder: { show: false }, axisTicks: { show: false },
          tickAmount: Math.max(...catData.map(c => c.value)) <= 5 ? Math.max(...catData.map(c => c.value)) : undefined
        },
        yaxis: { labels: { style: { colors: COLORS.gray, fontSize: '12px', fontWeight: 600 }, maxWidth: 160 } },
        tooltip: { theme: 'light', y: { formatter: (v: number) => v + ' incidentes' } }
      };
    }

    // ── Severidad ── donut limpio
    const sevData: { name: string; value: number }[] = (data?.severidad || [])
      .map((s: any) => ({ name: s.name, value: parseInt(s.value, 10) }));

    this.donutTotal = sevData.reduce((a, b) => a + b.value, 0);
    const sevColorMap: Record<string, string> = {
      BAJA: COLORS.green, MEDIA: COLORS.amber, ALTA: COLORS.orange, CRITICA: COLORS.crimson
    };
    const sevLabelMap: Record<string, string> = {
      BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', CRITICA: 'Crítica'
    };

    this.sevBreakdown = sevData.map(s => ({
      label: sevLabelMap[s.name] || s.name,
      value: s.value,
      color: sevColorMap[s.name] || COLORS.gray
    }));

    if (sevData.length > 0) {
      this.donutChartOptions = {
        series: sevData.map(s => s.value),
        chart: { type: 'donut', height: 220, fontFamily: 'Montserrat, sans-serif', sparkline: { enabled: false } },
        labels: sevData.map(s => sevLabelMap[s.name] || s.name),
        colors: sevData.map(s => sevColorMap[s.name] || COLORS.gray),
        plotOptions: {
          pie: {
            donut: {
              size: '72%',
              labels: {
                show: true,
                total: { show: true, label: 'Total', fontSize: '13px', fontWeight: 700, color: '#64748b',
                          formatter: () => String(this.donutTotal) },
                value: { fontSize: '24px', fontWeight: 900, color: '#1e293b', offsetY: 4 }
              }
            }
          }
        },
        stroke: { width: 3, colors: ['#ffffff'] },
        dataLabels: { enabled: false },
        legend: { show: false },
        tooltip: { theme: 'light', y: { formatter: (v: number) => v + ' incidentes' } }
      };
    }

    // ── Tendencia Anual ── area con 12 meses
    const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const incTrend = (data?.tendencia?.incidentes || []).map((m: any) => m.count ?? 0);
    const evTrend  = (data?.tendencia?.eventos    || []).map((m: any) => m.count ?? 0);

    // Rellenar a 12 si viene incompleto
    while (incTrend.length < 12) incTrend.push(0);
    while (evTrend.length  < 12) evTrend.push(0);

    this.lineChartOptions = {
      series: [
        { name: 'Incidentes', data: incTrend.slice(0, 12) },
        { name: 'Eventos',    data: evTrend.slice(0, 12) }
      ],
      chart: { type: 'area', height: 260, toolbar: { show: false }, fontFamily: 'Montserrat, sans-serif', animations: { enabled: true } },
      colors: [COLORS.indigo, COLORS.green],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 90, 100] } },
      stroke: { curve: 'smooth', width: [3, 3] },
      dataLabels: { enabled: false },
      markers: { size: 4, strokeWidth: 2, strokeColors: '#fff', hover: { size: 6 } },
      grid: {
        borderColor: COLORS.grayLt, strokeDashArray: 4,
        xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } },
        padding: { left: 16, right: 16 }
      },
      xaxis: {
        categories: MONTH_LABELS,
        labels: { style: { colors: COLORS.gray, fontWeight: 600, fontSize: '11px' } },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis: {
        min: 0,
        labels: { style: { colors: COLORS.gray, fontSize: '11px' }, formatter: (v: number) => Math.floor(v).toString() }
      },
      tooltip: { theme: 'light', shared: true, intersect: false,
                 y: { formatter: (v: number) => v + ' registros' } },
      legend: { show: false }
    };
  }
}
