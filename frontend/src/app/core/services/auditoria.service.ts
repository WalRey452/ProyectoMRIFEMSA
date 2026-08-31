import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private api = `${environment.apiUrl}/auditoria`;
  constructor(private http: HttpClient) {}
  getAll(params?: any) { return this.http.get<any>(this.api, { params }); }
}
