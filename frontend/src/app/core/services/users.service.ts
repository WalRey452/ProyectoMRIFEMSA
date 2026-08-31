import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = `${environment.apiUrl}/users`;
  constructor(private http: HttpClient) {}

  /** Obtiene todos los usuarios (maneja respuesta paginada o array) */
  getAll(params?: any) {
    return this.http.get<any>(this.api, { params }).pipe(
      map((res: any) => {
        // El backend devuelve { items, total, page, limit, totalPages }
        if (res && Array.isArray(res.items)) return res.items;
        if (Array.isArray(res)) return res;
        return [];
      })
    );
  }

  getOne(id: string)                      { return this.http.get<any>(`${this.api}/${id}`); }
  create(data: any)                       { return this.http.post<any>(this.api, data); }
  update(id: string, data: any)           { return this.http.put<any>(`${this.api}/${id}`, data); }
  deactivate(id: string)                  { return this.http.delete<any>(`${this.api}/${id}`); }

  /**
   * Actualiza el perfil propio del usuario (nombre, apellido, cargo).
   * Endpoint: PATCH /api/v1/users/:id/profile
   * Disponible para cualquier rol autenticado; solo puede editar su propio perfil.
   */
  updateProfile(id: string, data: { firstName?: string; lastName?: string; cargo?: string }) {
    return this.http.patch<any>(`${this.api}/${id}/profile`, data);
  }
}
