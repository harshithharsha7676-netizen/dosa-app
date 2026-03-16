import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MenuItem, MenuItemRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Public ────────────────────────────────────────────────────────────────
  getAvailableItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.api}/menu/public/items`);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  getAllItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.api}/menu/items`);
  }

  createItem(req: MenuItemRequest, image?: File): Observable<MenuItem> {
    return this.http.post<MenuItem>(
      `${this.api}/menu/items`,
      this.buildFormData(req, image)
    );
  }

  updateItem(id: number, req: MenuItemRequest, image?: File): Observable<MenuItem> {
    return this.http.put<MenuItem>(
      `${this.api}/menu/items/${id}`,
      this.buildFormData(req, image)
    );
  }

  toggleAvailability(id: number): Observable<void> {
    return this.http.put<void>(`${this.api}/menu/items/${id}/toggle`, {});
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/menu/items/${id}`);
  }

  // ── Helper ────────────────────────────────────────────────────────────────
  // Backend uses @RequestPart("item") which needs the JSON part sent as
  // a Blob with application/json content-type inside multipart form data.
  private buildFormData(req: MenuItemRequest, image?: File): FormData {
    const form = new FormData();
    form.append(
      'item',
      new Blob([JSON.stringify(req)], { type: 'application/json' })
    );
    if (image) {
      form.append('image', image, image.name);
    }
    return form;
  }
}
