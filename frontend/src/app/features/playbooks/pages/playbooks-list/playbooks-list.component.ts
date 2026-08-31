import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { PlaybooksService } from '../../../../core/services/playbooks.service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-playbooks-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="playbooks-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>menu_book</mat-icon>
          </div>
          <div>
            <h1 class="font-bebas">Repositorio de Playbooks</h1>
            <p class="header-subtitle">Procedimientos operativos de respuesta a incidentes de seguridad</p>
          </div>
        </div>
        <button mat-flat-button class="btn-upload" (click)="toggleUpload()">
          <mat-icon>{{ showUploadPanel() ? 'close' : 'upload_file' }}</mat-icon>
          {{ showUploadPanel() ? 'Cancelar' : 'Subir Playbook' }}
        </button>
      </div>

      <!-- Upload Panel -->
      <div class="upload-panel" *ngIf="showUploadPanel()" [@slideIn]>
        <div class="upload-panel-title">
          <mat-icon>upload_file</mat-icon>
          <span class="font-bebas">Subir nuevo Playbook (PDF)</span>
        </div>

        <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()">
          <!-- Drop zone -->
          <div class="drop-zone"
               [class.has-file]="selectedFile()"
               [class.drag-over]="isDragOver()"
               (click)="fileInput.click()"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)">
            <input #fileInput type="file" accept=".pdf" style="display:none;" (change)="onFileSelected($event)">

            <div *ngIf="!selectedFile()" class="drop-content">
              <div class="drop-icon-wrap">
                <mat-icon>picture_as_pdf</mat-icon>
              </div>
              <p class="drop-title">Arrastra tu PDF aquí</p>
              <p class="drop-sub">o haz clic para seleccionar archivo</p>
              <span class="drop-format">Solo archivos PDF</span>
            </div>

            <div *ngIf="selectedFile()" class="file-selected">
              <div class="file-icon-wrap">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="file-info">
                <p class="file-name">{{ selectedFile()?.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedFile()?.size || 0) }}</p>
              </div>
              <button type="button" mat-icon-button color="warn" (click)="clearFile($event)" matTooltip="Quitar archivo">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <!-- Form fields -->
          <div class="upload-fields">
            <div class="fields-row">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Nombre del Playbook *</mat-label>
                <mat-icon matPrefix>title</mat-icon>
                <input matInput formControlName="nombre" placeholder="Ej. Respuesta a Ransomware v2">
                <mat-error>Campo requerido</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Categoría *</mat-label>
                <mat-icon matPrefix>folder</mat-icon>
                <mat-select formControlName="categoria">
                  <mat-option value="Malware">🦠 Malware</mat-option>
                  <mat-option value="Phishing">🎣 Phishing</mat-option>
                  <mat-option value="Ransomware">🔒 Ransomware</mat-option>
                  <mat-option value="DDoS">⚡ DDoS</mat-option>
                  <mat-option value="Forense">🔍 Forense Digital</mat-option>
                  <mat-option value="Respuesta a Incidentes">🚨 Respuesta a Incidentes</mat-option>
                  <mat-option value="Continuidad">🔄 Continuidad del Negocio</mat-option>
                  <mat-option value="General">📋 General</mat-option>
                  <mat-option value="Otro">🗂️ Otro</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Versión</mat-label>
                <mat-icon matPrefix>tag</mat-icon>
                <input matInput formControlName="version" placeholder="Ej. 1.0">
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Descripción breve</mat-label>
              <mat-icon matPrefix>notes</mat-icon>
              <textarea matInput formControlName="descripcion" rows="2"
                placeholder="Resumen del procedimiento descrito en este playbook..."></textarea>
            </mat-form-field>

            <div class="upload-actions">
              <button type="button" mat-button (click)="toggleUpload()">Cancelar</button>
              <button mat-flat-button type="submit" class="btn-submit"
                      [disabled]="uploadForm.invalid || !selectedFile() || uploading()">
                <mat-spinner *ngIf="uploading()" diameter="18" style="display:inline-block;margin-right:8px;"></mat-spinner>
                <mat-icon *ngIf="!uploading()">cloud_upload</mat-icon>
                {{ uploading() ? 'Subiendo...' : 'Subir Playbook' }}
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Stats row -->
      <div class="stats-row" *ngIf="!loading()">
        <div class="stat-chip">
          <mat-icon>description</mat-icon>
          <span><strong>{{ playbooks().length }}</strong> playbooks</span>
        </div>
        <div class="stat-chip" *ngFor="let cat of topCategories()">
          <span>{{ cat.name }}: <strong>{{ cat.count }}</strong></span>
        </div>
      </div>

      <!-- Search + Filter bar -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar playbook...</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchControl" placeholder="Nombre o descripción">
          <button *ngIf="searchControl.value" mat-icon-button matSuffix (click)="searchControl.setValue('')">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>

        <mat-form-field appearance="outline" class="cat-filter">
          <mat-label>Categoría</mat-label>
          <mat-select [formControl]="filterCategoriaControl">
            <mat-option value="">Todas</mat-option>
            <mat-option value="Malware">Malware</mat-option>
            <mat-option value="Phishing">Phishing</mat-option>
            <mat-option value="Ransomware">Ransomware</mat-option>
            <mat-option value="DDoS">DDoS</mat-option>
            <mat-option value="Forense">Forense Digital</mat-option>
            <mat-option value="Respuesta a Incidentes">Respuesta a Incidentes</mat-option>
            <mat-option value="Continuidad">Continuidad del Negocio</mat-option>
            <mat-option value="General">General</mat-option>
            <mat-option value="Otro">Otro</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando repositorio de playbooks...</p>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading() && filteredPlaybooks().length === 0 && playbooks().length === 0" class="empty-state">
        <div class="empty-icon">
          <mat-icon>menu_book</mat-icon>
        </div>
        <h3>Repositorio vacío</h3>
        <p>No hay playbooks disponibles aún. Sube el primero haciendo clic en "Subir Playbook".</p>
        <button mat-flat-button class="btn-upload" (click)="toggleUpload()">
          <mat-icon>upload_file</mat-icon> Subir Playbook
        </button>
      </div>

      <!-- No results from filter -->
      <div *ngIf="!loading() && filteredPlaybooks().length === 0 && playbooks().length > 0" class="empty-state">
        <mat-icon style="font-size:48px; width:48px; height:48px; color:#94a3b8;">search_off</mat-icon>
        <h3>Sin resultados</h3>
        <p>Ningún playbook coincide con tu búsqueda. Intenta con otro término o categoría.</p>
      </div>

      <!-- Grid of playbooks -->
      <div *ngIf="!loading() && filteredPlaybooks().length > 0" class="playbooks-grid">
        <div class="pb-card" *ngFor="let pb of filteredPlaybooks()">

          <!-- Card header -->
          <div class="pb-card-header">
            <div class="pdf-icon-wrap">
              <mat-icon>picture_as_pdf</mat-icon>
            </div>
            <div class="pb-meta">
              <span class="pb-category-badge">{{ pb.categoria }}</span>
              <span class="pb-version">v{{ pb.version || '1.0' }}</span>
            </div>
          </div>

          <!-- Card body -->
          <div class="pb-card-body">
            <h3 class="pb-name" [title]="pb.nombre">{{ pb.nombre }}</h3>
            <p class="pb-desc" [title]="pb.descripcion">{{ pb.descripcion || 'Sin descripción disponible.' }}</p>
          </div>

          <!-- Card footer -->
          <div class="pb-card-footer">
            <div class="pb-info">
              <div class="pb-info-row">
                <mat-icon>person</mat-icon>
                <span>{{ pb.subidoPor || 'Admin' }}</span>
              </div>
              <div class="pb-info-row">
                <mat-icon>calendar_today</mat-icon>
                <span>{{ pb.fechaSubida | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="pb-info-row" *ngIf="pb.tamano">
                <mat-icon>data_usage</mat-icon>
                <span>{{ pb.tamano }}</span>
              </div>
            </div>

            <div class="pb-actions">
              <button mat-icon-button color="primary" matTooltip="Ver PDF en nueva pestaña" (click)="viewPdf(pb)">
                <mat-icon>open_in_new</mat-icon>
              </button>
              <button mat-flat-button class="btn-download" matTooltip="Descargar PDF" (click)="downloadPdf(pb)">
                <mat-icon>download</mat-icon>
                Descargar
              </button>
              <button mat-icon-button color="warn" matTooltip="Eliminar playbook" (click)="deletePlaybook(pb)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }

    .playbooks-page {
      padding: 24px;
      min-height: 100%;
      font-family: 'Montserrat', sans-serif;
      background: #f8fafc;
    }

    /* ─── Header ─── */
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      background: white; padding: 20px 24px; border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 20px;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #272257, #3b3a8c);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center; color: white;
    }
    .header-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }
    h1.font-bebas { margin: 0; font-size: 28px; color: #272257; }
    .header-subtitle { margin: 2px 0 0; font-size: 13px; color: #64748b; }
    .btn-upload {
      background: #272257 !important; color: white !important;
      border-radius: 8px; font-family: 'Montserrat', sans-serif; font-weight: 600;
    }

    /* ─── Upload Panel ─── */
    .upload-panel {
      background: white; border-radius: 12px;
      box-shadow: 0 4px 20px rgba(39,34,87,0.12);
      border: 1px solid #c7d2fe;
      padding: 24px; margin-bottom: 20px;
    }
    .upload-panel-title {
      display: flex; align-items: center; gap: 10px;
      font-family: 'Bebas Neue', sans-serif; font-size: 22px;
      color: #272257; letter-spacing: 1px; margin-bottom: 20px;
      border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;
    }
    .upload-panel-title mat-icon { color: #272257; }

    .drop-zone {
      border: 2px dashed #cbd5e1; border-radius: 12px;
      padding: 40px 24px; text-align: center;
      cursor: pointer; transition: all 0.2s ease;
      background: #f8fafc; margin-bottom: 20px;
    }
    .drop-zone:hover, .drop-zone.drag-over { border-color: #272257; background: #eef2ff; }
    .drop-zone.has-file { border-color: #16a34a; border-style: solid; background: #f0fdf4; cursor: default; }

    .drop-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #272257, #3b3a8c);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px; color: white;
    }
    .drop-icon-wrap mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .drop-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .drop-sub { font-size: 14px; color: #64748b; margin: 0 0 12px; }
    .drop-format { display: inline-block; background: #fee2e2; color: #991b1b; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }

    .file-selected {
      display: flex; align-items: center; gap: 16px; justify-content: center;
    }
    .file-icon-wrap {
      width: 52px; height: 52px; border-radius: 50%;
      background: #dcfce7;
      display: flex; align-items: center; justify-content: center;
    }
    .file-icon-wrap mat-icon { color: #16a34a; font-size: 28px; width: 28px; height: 28px; }
    .file-name { margin: 0; font-weight: 700; color: #1e293b; font-size: 15px; }
    .file-size { margin: 2px 0 0; font-size: 12px; color: #64748b; }

    .upload-fields { display: flex; flex-direction: column; gap: 12px; }
    .fields-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; }
    .w-full { width: 100%; }

    .upload-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; }
    .btn-submit { background: #272257 !important; color: white !important; font-family: 'Montserrat', sans-serif; font-weight: 600; }

    /* ─── Stats ─── */
    .stats-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .stat-chip {
      display: flex; align-items: center; gap: 6px;
      background: white; border: 1px solid #e2e8f0;
      border-radius: 20px; padding: 6px 14px;
      font-size: 12px; color: #475569;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .stat-chip mat-icon { font-size: 16px; width: 16px; height: 16px; color: #272257; }

    /* ─── Filter bar ─── */
    .filter-bar {
      display: flex; gap: 12px; align-items: center;
      background: white; padding: 16px 20px; border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 20px;
    }
    .search-field { flex: 1; }
    .cat-filter { width: 240px; }

    /* ─── Loading ─── */
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 80px; gap: 20px; color: #64748b; }

    /* ─── Empty state ─── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 80px 24px; text-align: center; gap: 12px;
      background: white; border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .empty-icon {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
    }
    .empty-icon mat-icon { font-size: 40px; width: 40px; height: 40px; color: #94a3b8; }
    .empty-state h3 { margin: 0; font-size: 22px; font-weight: 700; color: #334155; }
    .empty-state p { margin: 0; color: #64748b; max-width: 400px; line-height: 1.6; }

    /* ─── Playbooks grid ─── */
    .playbooks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .pb-card {
      background: white; border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      display: flex; flex-direction: column;
      transition: all 0.25s ease; overflow: hidden;
    }
    .pb-card:hover {
      box-shadow: 0 8px 24px rgba(39,34,87,0.14);
      transform: translateY(-4px);
      border-color: #c7d2fe;
    }

    .pb-card-header {
      background: linear-gradient(135deg, #272257, #3b3a8c);
      padding: 20px 20px 16px;
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .pdf-icon-wrap {
      width: 48px; height: 48px; border-radius: 10px;
      background: rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .pdf-icon-wrap mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .pb-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
    .pb-category-badge {
      background: rgba(255,255,255,0.2); color: white;
      padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
      max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .pb-version {
      background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8);
      padding: 2px 8px; border-radius: 20px; font-size: 10px;
    }

    .pb-card-body { padding: 16px 20px; flex: 1; }
    .pb-name {
      margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #1e293b;
      line-height: 1.3;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .pb-desc {
      margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }

    .pb-card-footer {
      padding: 12px 20px 16px;
      border-top: 1px solid #f1f5f9;
      background: #fafafa;
    }
    .pb-info { margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px; }
    .pb-info-row {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; color: #94a3b8;
    }
    .pb-info-row mat-icon { font-size: 13px; width: 13px; height: 13px; }

    .pb-actions { display: flex; align-items: center; gap: 8px; }
    .btn-download {
      background: #272257 !important; color: white !important;
      font-family: 'Montserrat', sans-serif; font-weight: 600;
      font-size: 12px !important; flex: 1; border-radius: 6px;
    }
  `]
})
export class PlaybooksListComponent implements OnInit {
  private playbooksService = inject(PlaybooksService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  playbooks = signal<any[]>([]);
  filteredPlaybooks = signal<any[]>([]);
  loading = signal<boolean>(true);

  showUploadPanel = signal<boolean>(false);
  uploading = signal<boolean>(false);
  selectedFile = signal<File | null>(null);
  isDragOver = signal<boolean>(false);

  uploadForm: FormGroup;
  searchControl = new FormControl('');
  filterCategoriaControl = new FormControl('');

  constructor() {
    this.uploadForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      categoria: ['General', Validators.required],
      version: ['1.0']
    });
  }

  ngOnInit() {
    this.loadPlaybooks();
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
    this.filterCategoriaControl.valueChanges.subscribe(() => this.applyFilters());
  }

  topCategories(): { name: string; count: number }[] {
    const counts: Record<string, number> = {};
    this.playbooks().forEach(pb => {
      counts[pb.categoria] = (counts[pb.categoria] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  loadPlaybooks() {
    this.loading.set(true);
    this.playbooksService.getAll().subscribe({
      next: (data) => {
        this.playbooks.set(Array.isArray(data) && data.length ? data : []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.playbooks.set([]);
        this.applyFilters();
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    let filtered = this.playbooks();
    const search = this.searchControl.value?.toLowerCase() || '';
    const categoria = this.filterCategoriaControl.value;

    if (search) {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(search) ||
        (p.descripcion || '').toLowerCase().includes(search)
      );
    }
    if (categoria) {
      filtered = filtered.filter(p => p.categoria === categoria);
    }
    this.filteredPlaybooks.set(filtered);
  }

  toggleUpload() {
    this.showUploadPanel.update(v => !v);
    if (!this.showUploadPanel()) {
      this.resetUploadForm();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.setFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.setFile(files[0]);
    }
  }

  setFile(file: File) {
    if (file && file.type === 'application/pdf') {
      this.selectedFile.set(file);
      if (!this.uploadForm.get('nombre')?.value) {
        this.uploadForm.get('nombre')?.setValue(file.name.replace('.pdf', '').replace(/[-_]/g, ' '));
      }
    } else {
      this.snackBar.open('Solo se permiten archivos PDF', 'Cerrar', { duration: 3000 });
    }
  }

  clearFile(event: Event) {
    event.stopPropagation();
    this.selectedFile.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  resetUploadForm() {
    this.uploadForm.reset({ categoria: 'General', version: '1.0' });
    this.selectedFile.set(null);
    this.isDragOver.set(false);
  }

  onSubmit() {
    if (this.uploadForm.invalid || !this.selectedFile()) return;

    this.uploading.set(true);
    const formData = new FormData();
    formData.append('file', this.selectedFile() as Blob);
    Object.keys(this.uploadForm.value).forEach(key => {
      if (this.uploadForm.value[key] !== null && this.uploadForm.value[key] !== undefined) {
        formData.append(key, this.uploadForm.value[key]);
      }
    });

    this.playbooksService.upload(formData).subscribe({
      next: () => {
        this.uploading.set(false);
        this.snackBar.open('Playbook subido correctamente', 'Cerrar', { duration: 3000 });
        this.toggleUpload();
        this.loadPlaybooks();
      },
      error: (err) => {
        this.uploading.set(false);
        this.snackBar.open('Error al subir el playbook. Inténtalo de nuevo.', 'Cerrar', { duration: 4000 });
        console.error('Upload error:', err);
      }
    });
  }

  viewPdf(playbook: any) {
    if (!playbook?.id) {
      this.snackBar.open('Archivo no disponible', 'Cerrar', { duration: 3000 });
      return;
    }
    this.snackBar.open('Preparando visualización del PDF...', '', { duration: 2000 });
    this.playbooksService.downloadBlob(playbook.id).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const win = window.open(blobUrl, '_blank');
        // Liberar el objeto URL después de abrirlo
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      },
      error: () => {
        this.snackBar.open('Error al abrir el PDF. Verifica que el archivo existe.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  downloadPdf(playbook: any) {
    if (!playbook?.id) {
      this.snackBar.open('Archivo no disponible para descarga', 'Cerrar', { duration: 3000 });
      return;
    }
    this.snackBar.open('Preparando descarga...', '', { duration: 2000 });
    this.playbooksService.downloadBlob(playbook.id).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${playbook.nombre || 'playbook'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      },
      error: () => {
        this.snackBar.open('Error al descargar el PDF. Verifica que el archivo existe.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  deletePlaybook(playbook: any) {
    if (confirm(`¿Eliminar el playbook "${playbook.nombre}"? Esta acción no se puede deshacer.`)) {
      this.playbooksService.delete(playbook.id).subscribe({
        next: () => {
          this.snackBar.open('Playbook eliminado', 'Cerrar', { duration: 2000 });
          this.loadPlaybooks();
        },
        error: () => {
          this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
