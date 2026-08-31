import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = `${environment.apiUrl}/dashboard`;
  constructor(private http: HttpClient) {}
  getKpis() { return this.http.get<any>(`${this.api}/kpis`); }
  getCharts() { return this.http.get<any>(`${this.api}/charts`); }
  getRecentActivity() { return this.http.get<any>(`${this.api}/activity`); }
}
