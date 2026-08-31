import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IncidentesService {
  private api = `${environment.apiUrl}/incidentes`;

  constructor(private http: HttpClient) {}

  getAll(params?: any) {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any[]>(this.api, { params: httpParams });
  }

  getOne(id: string) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  create(data: any) {
    return this.http.post<any>(this.api, data);
  }

  update(id: string, data: any) {
    return this.http.patch<any>(`${this.api}/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete<any>(`${this.api}/${id}`);
  }

  addBitacora(id: string, data: any) {
    return this.http.post<any>(`${this.api}/${id}/bitacora`, data);
  }

  uploadEvidencia(id: string, formData: FormData) {
    return this.http.post<any>(`${this.api}/${id}/evidencia`, formData);
  }

  getStats() {
    return this.http.get<any>(`${this.api}/stats`);
  }
}
