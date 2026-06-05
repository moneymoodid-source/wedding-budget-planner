import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  // Pastikan URL ini sesuai dengan port backend Anda (biasanya 3000)
  private apiUrl = environment.apiUrl; 

  // Signal untuk menyimpan data user
  currentUser = signal<any>(null);

  constructor() {
    // Cek apakah ada user yang tersimpan di localStorage saat aplikasi dibuka
    // (Agar user tidak perlu login ulang setiap refresh)
    const savedUser = localStorage.getItem('wedding_user');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('wedding_user');
      }
    }
  }

  // Register ke Backend
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password });
  }

  // Login ke Backend
  login(identifier: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { identifier, password }).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        if (response.user) {
          this.currentUser.set(response.user);
          localStorage.setItem('wedding_user', JSON.stringify(response.user));
        }
      })
    );
  }

  // Logout
  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('wedding_user');
    localStorage.removeItem('token');
  }
}