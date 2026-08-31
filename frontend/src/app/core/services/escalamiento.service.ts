import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EscalamientoService {
  private api = `${environment.apiUrl}/escalamiento`;
  constructor(private http: HttpClient) {}
  getAll() { return this.http.get<any[]>(this.api); }
  create(data: any) { return this.http.post<any>(this.api, data); }
  update(id: string, data: any) { return this.http.patch<any>(`${this.api}/${id}`, data); }
  delete(id: string) { return this.http.delete<any>(`${this.api}/${id}`); }
}
