import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';

// ==========================================
// 1. INTERFACES (Tipe Data)
// ==========================================

export interface Theme {
  id: string; // atau number, sesuaikan dengan isi tabel themes (misal 'gold', 'blue')
  name: string;
  color: string;
  header: string;
  bg: string;
  accent: string;
}

export interface WeddingSummary {
  id?: number;
  user_id?: number;
  wedding_title: string;
  wedding_date: string;
  total_budget: number;
  header_image: string;
  header_image_pos_x?: number;
  header_image_pos_y?: number;
  theme_id: string;
  updated_at?: string;
}

export interface Expense { 
  id?: number; 
  user_id?: number; 
  date: string; 
  item: string; 
  amount: number; 
  category: string; 
  status: string; 
  note: string; 
  checked?: boolean; 
  paid?: boolean; }

export interface Guest {
  id?: number;
  user_id?: number;
  name: string;
  category: string;
  side: string;
  pax: number;
  phone?: string;
  invited?: boolean;
  sent_at?: string;
  selected?: boolean;
}
export interface Todo { 
  id?: number; 
  user_id?: number; 
  task: string; 
  completed?: boolean; 
  due_date?: string; 
}

export interface Vendor {
  id?: number;
  user_id?: number;
  name: string;
  category: string;
  location: string;
  social_link: string;
  images: { fileName: string; originalName: string; url: string }[]; // objek lengkap
  price: number;
  selected?: boolean;
  active_index?: number;
}

export interface VendorAPIPayload {
  name: string;
  category: string;
  location: string;
  social_link: string;
  price: number;
  selected: boolean;
  images: string[];
}

export interface VendorCategory { 
  id: number;
  user_id?: number;
  name: string;
  is_main_checklist?: boolean;
}

export interface PrewedLocation { 
  id?: number;
  user_id?: number;
  name: string;
  location_name: string;
  maps_link: string;
  note?: string;
  price: number;
  images: { fileName: string; originalName: string; url: string }[];
  active_index?: number;
  selected?: boolean
}

export interface PrewedAPIPayload {
  name: string;
  location_name: string;
  maps_link: string;
  note: string;
  price: number;
  selected: boolean;
  active_index: number;
  images: string[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  created_at?: string;
}

// ==========================================
// 2. DATA SERVICE
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private getAuthHeaders() {
    const token = localStorage.getItem('token');

    return {
      Authorization: `Bearer ${token}`
    };
  }

  getUploadsBaseUrl(): string {
    return this.apiUrl.replace(/\/api\/?$/, '/uploads');
  }

  // --- MASTER DATA (THEMES) ---
  getThemes(): Observable<Theme[]> {
    return this.http.get<Theme[]>(`${this.apiUrl}/themes`);
  }

  // --- SUMMARY / WEDDING DETAILS ---
  getSummary(_userId?: number): Observable<WeddingSummary> {
    return this.http.get<WeddingSummary>(`${this.apiUrl}/summary`, {
      headers: this.getAuthHeaders()
    });
  }

  // Update Data Summary (Title, Date, Budget, Theme, Image)
  updateSummary(_userId: number, data: Partial<WeddingSummary>): Observable<WeddingSummary> {
    return this.http.put<WeddingSummary>(`${this.apiUrl}/summary`, data, {
      headers: this.getAuthHeaders()
    });
  }

  removeSummaryHeaderImage(_userId: number, imageName: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/summary/remove-header-image`,
      { imageName },
      { headers: this.getAuthHeaders() }
    );
  }

  // --- THEME ---
  // Reuse endpoint updateSummary karena theme_id ada di tabel yang sama (wedding_details)
  updateUserTheme(userId: number, themeId: string): Observable<any> {
      return this.updateSummary(userId, { theme_id: themeId });
  }

  // --- EXPENSES ---
  getExpenses(_userId?: number): Observable<Expense[]> { 
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses`, {
      headers: this.getAuthHeaders()
    }); 
  }

  addExpense(_userId: number, expense: Partial<Expense>): Observable<Expense> { 
    return this.http.post<Expense>(`${this.apiUrl}/expenses`, expense, {
      headers: this.getAuthHeaders()
    }); 
  }

  updateExpense(_userId: number, id: number, expense: Partial<Expense>): Observable<Expense> { 
    return this.http.put<Expense>(`${this.apiUrl}/expenses/${id}`, expense, {
      headers: this.getAuthHeaders()
    }); 
  }

  deleteExpense(_userId: number, id: number): Observable<any> { 
    return this.http.delete(`${this.apiUrl}/expenses/${id}`, {
      headers: this.getAuthHeaders()
    }); 
  }

  // --- GUESTS ---
  getGuests(_userId?: number): Observable<Guest[]> { 
    return this.http.get<Guest[]>(`${this.apiUrl}/guests`, {
      headers: this.getAuthHeaders()
    }); 
  }

  addGuest(_userId: number, guest: Partial<Guest>): Observable<Guest> { 
    return this.http.post<Guest>(`${this.apiUrl}/guests`, guest, {
      headers: this.getAuthHeaders()
    }); 
  }

  updateGuest(_userId: number, id: number, guest: Partial<Guest>): Observable<Guest> { 
    return this.http.put<Guest>(`${this.apiUrl}/guests/${id}`, guest, {
      headers: this.getAuthHeaders()
    }); 
  }

  updateGuestWhatsAppStatus(
    _userId: number, 
    guestId: number, 
    status: { invited: boolean, sent_at: string }
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/guests/${guestId}/whatsapp-status`, {
      invited: status.invited,
      sent_at: status.sent_at
    }, {
      headers: this.getAuthHeaders()
    });
  }

  updateGuestSelected(
  _userId: number,
  guestId: number,
  selected: boolean
): Observable<any> {
  return this.http.patch(`${this.apiUrl}/guests/${guestId}/selected`, {
    selected
  }, {
    headers: this.getAuthHeaders()
  });
}

  deleteGuest(_userId: number, id: number): Observable<any> { 
    return this.http.delete(`${this.apiUrl}/guests/${id}`, {
      headers: this.getAuthHeaders()
    }); 
  }

  // --- TODOS ---
  getTodos(_userId?: number): Observable<Todo[]> { 
    return this.http.get<Todo[]>(`${this.apiUrl}/todos`, {
      headers: this.getAuthHeaders()
    }); 
  }

  addTodo(_userId: number, todo: Partial<Todo>): Observable<Todo> { 
    return this.http.post<Todo>(`${this.apiUrl}/todos`, todo, {
      headers: this.getAuthHeaders()
    }); 
  }

  updateTodo(_userId: number, id: number, todo: Partial<Todo>): Observable<Todo> { 
    return this.http.put<Todo>(`${this.apiUrl}/todos/${id}`, todo, {
      headers: this.getAuthHeaders()
    }); 
  }

  deleteTodo(_userId: number, id: number): Observable<any> { 
    return this.http.delete(`${this.apiUrl}/todos/${id}`, {
      headers: this.getAuthHeaders()
    }); 
  }

  // --- VENDORS ---
  getVendors(_userId?: number): Observable<Vendor[]> { 
    return this.http.get<Vendor[]>(`${this.apiUrl}/vendors`, { headers: this.getAuthHeaders() });
  }

  getVendorCategories(_userId?: number): Observable<VendorCategory[]> { 
    return this.http.get<VendorCategory[]>(`${this.apiUrl}/vendors-categories`, { headers: this.getAuthHeaders() });
  }

  addVendor(_userId: number, vendor: VendorAPIPayload): Observable<Vendor> { 
    // Mapping images: jika objek, ambil fileName, jika string biarkan
    const payload = {
      ...vendor,
      images: (vendor.images || []).map((img: string | { fileName: string }) =>
        typeof img === 'string' ? img : img.fileName
      )
    };

    return this.http.post<Vendor>(
      `${this.apiUrl}/vendors`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  addVendorCategory(_userId: number, name: string): Observable<VendorCategory> { 
    return this.http.post<VendorCategory>(`${this.apiUrl}/vendors-categories`, { name }, { headers: this.getAuthHeaders() });
  }

  updateVendorCategoryMainChecklist(_userId: number, categoryId: number, isMainChecklist: boolean): Observable<VendorCategory> {
    return this.http.patch<VendorCategory>(
      `${this.apiUrl}/vendors-categories/${categoryId}/main-checklist`,
      { is_main_checklist: isMainChecklist },
      { headers: this.getAuthHeaders() }
    );
  }

  updateVendor(_userId: number, id: number, vendor: VendorAPIPayload): Observable<Vendor> { 
    const payload = {
      ...vendor,
      images: (vendor.images || []).map((img: string | { fileName: string }) =>
        typeof img === 'string' ? img : img.fileName
      )
    };

    return this.http.put<Vendor>(
      `${this.apiUrl}/vendors/${id}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteVendor(_userId: number, id: number): Observable<any> { 
    return this.http.delete(`${this.apiUrl}/vendors/${id}`, { headers: this.getAuthHeaders() });
  }

  removeVendorImage(_userId: number, vendorId: number, imageName: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/vendors/${vendorId}/remove-image`,
      { imageName },
      { headers: this.getAuthHeaders() }
    );
  }

  deleteVendorCategory(_userId: number, id: number): Observable<any> { 
    return this.http.delete(`${this.apiUrl}/vendors-categories/${id}`, { headers: this.getAuthHeaders() });
  }

  // --- PREWED LOCATIONS ---
  getPrewedLocations(_userId?: number): Observable<PrewedLocation[]> { 
    return this.http.get<PrewedLocation[]>(`${this.apiUrl}/prewed-locations`, {
      headers: this.getAuthHeaders()
    }); 
  }

  addPrewedLocation(_userId: number, loc: PrewedAPIPayload): Observable<PrewedLocation> { 
    const payload = {
        ...loc,
        images: (loc.images || []).map((img: string | { fileName: string }) =>
          typeof img === 'string' ? img : img.fileName
        )
    };

    return this.http.post<PrewedLocation>(
        `${this.apiUrl}/prewed-locations`,
        payload,
        { headers: this.getAuthHeaders() }
    );
  }

  updatePrewedLocation(_userId: number, id: number, loc: PrewedAPIPayload): Observable<PrewedLocation> { 
    const payload = {
        ...loc,
        images: (loc.images || []).map((img: string | { fileName: string }) =>
          typeof img === 'string' ? img : img.fileName
        )
    };

    return this.http.put<PrewedLocation>(
        `${this.apiUrl}/prewed-locations/${id}`,
        payload,
        { headers: this.getAuthHeaders() }
    );
  }

  deletePrewedLocation(_userId: number, id: number): Observable<any> { 
    return this.http.delete(`${this.apiUrl}/prewed-locations/${id}`, {
        headers: this.getAuthHeaders()
    });
  }

  removePrewedImage(_userId: number, prewedId: number, imageName: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/prewed-locations/${prewedId}/remove-image`,
      { imageName },
      { headers: this.getAuthHeaders() }
    );
  }

  // ==========================================
  // UPLOAD FILE (MULTER)
  // ==========================================
  
  uploadFile(file: File): Observable<{ fileName: string; originalName: string; url: string }> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxFileSize = 5 * 1024 * 1024; // 5 MB

  if (!allowedTypes.includes(file.type)) {
    return throwError(() => new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'));
  }

  if (file.size > maxFileSize) {
    return throwError(() => new Error('Ukuran file terlalu besar. Maksimal 5 MB.'));
  }

  const formData = new FormData();
  formData.append('image', file);

  return this.http.post<{ fileName: string; originalName: string; url: string }>(`${this.apiUrl}/upload`, formData, {
    headers: this.getAuthHeaders()
  });
}

  // --- ADMIN ---
  getAdminUsers(_adminId?: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`, {
      headers: this.getAuthHeaders()
    });
  }

  approveUser(_adminId: number, targetUserId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/approve`,
      { userId: targetUserId },
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  rejectUser(_adminId: number, targetUserId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/reject`,
      { userId: targetUserId },
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  duplicateVendors(
    _adminId: number,
    sourceUserId: number,
    targetUserIds: number[]
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/duplicate-vendors`,
      {
        sourceUserId,
        targetUserIds
      },
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  duplicatePrewedLocations(
    _adminId: number,
    sourceUserId: number,
    targetUserIds: number[]
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/duplicate-prewed-locations`,
      {
        sourceUserId,
        targetUserIds
      },
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  resetUserPassword(
    _adminId: number,
    targetUserId: number,
    newPassword: string
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/reset-password`,
      {
        userId: targetUserId,
        newPassword
      },
      {
        headers: this.getAuthHeaders()
      }
    );
  }
}
