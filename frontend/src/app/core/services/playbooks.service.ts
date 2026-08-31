import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlaybooksService {
  private api = `${environment.apiUrl}/playbooks`;

  constructor(private http: HttpClient) {}

  getAll(params?: any) { return this.http.get<any>(this.api, { params }); }
  getOne(id: string) { return this.http.get<any>(`${this.api}/${id}`); }
  upload(formData: FormData) { return this.http.post<any>(this.api, formData); }
  update(id: string, data: any) { return this.http.patch<any>(`${this.api}/${id}`, data); }
  delete(id: string) { return this.http.delete<any>(`${this.api}/${id}`); }

  /**
   * Descarga el PDF como Blob (incluye el JWT en el header automáticamente).
   * Usar para visualizar inline o descargar.
   */
  downloadBlob(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/${id}/download`, { responseType: 'blob' });
  }
}
