import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

type LogoutReason = 'manual' | 'idle' | 'session-ended' | 'session-invalid';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private activityIntervalId: number | null = null;
  private readonly activityHeartbeatMs = 2 * 60 * 1000;
  private readonly minActivitySyncGapMs = 60 * 1000;
  private lastActivitySyncAt = 0;
  private sessionValidationPromise: Promise<any | null> | null = null;

  currentUser = signal<any>(null);
  sessionResolved = signal(false);

  constructor() {
    this.validateStoredSession();
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password });
  }

  login(identifier: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { identifier, password }).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }

        if (response.user) {
          this.setAuthenticatedUser(response.user);
        }

        this.sessionResolved.set(true);
        this.startActivityTracking();
        this.touchUserActivity(true);
      })
    );
  }

  async ensureSessionResolved() {
    if (this.sessionResolved()) {
      return this.currentUser();
    }

    return this.validateStoredSession();
  }

  logout(reason: LogoutReason = 'manual') {
    this.flushActivityOnLogout(reason);
    this.clearSession();
  }

  notifyUserActivity() {
    const token = localStorage.getItem('token');
    if (!token || !this.currentUser()) return;

    const now = Date.now();
    if (now - this.lastActivitySyncAt < this.minActivitySyncGapMs) {
      return;
    }

    this.touchUserActivity();
  }

  private async validateStoredSession() {
    if (this.sessionValidationPromise) {
      return this.sessionValidationPromise;
    }

    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('wedding_user');

    if (!token || !savedUser) {
      this.clearSession(false);
      this.sessionResolved.set(true);
      return null;
    }

    this.sessionValidationPromise = firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/me/session`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    )
      .then((response) => {
        if (response?.user) {
          this.setAuthenticatedUser(response.user);
          this.startActivityTracking();
          this.touchUserActivity(true);
          this.sessionResolved.set(true);
          return response.user;
        }

        this.clearSession(false);
        this.sessionResolved.set(true);
        return null;
      })
      .catch((err) => {
        console.error('Validasi sesi gagal:', err);
        this.clearSession(false);
        this.sessionResolved.set(true);
        return null;
      })
      .finally(() => {
        this.sessionValidationPromise = null;
      });

    return this.sessionValidationPromise;
  }

  private setAuthenticatedUser(user: any) {
    this.currentUser.set(user);
    localStorage.setItem('wedding_user', JSON.stringify(user));
  }

  private startActivityTracking() {
    if (this.activityIntervalId !== null) return;

    this.activityIntervalId = window.setInterval(() => {
      this.touchUserActivity();
    }, this.activityHeartbeatMs);
  }

  private stopActivityTracking() {
    if (this.activityIntervalId !== null) {
      window.clearInterval(this.activityIntervalId);
      this.activityIntervalId = null;
    }
  }

  private touchUserActivity(force = false, reason = 'active') {
    const token = localStorage.getItem('token');
    if (!token) return;

    const now = Date.now();
    if (!force && now - this.lastActivitySyncAt < this.minActivitySyncGapMs) {
      return;
    }

    this.lastActivitySyncAt = now;

    this.http.post(
      `${this.apiUrl}/me/activity`,
      { reason },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).subscribe({
      error: (err) => {
        if (err?.status === 401 || err?.status === 403) {
          this.clearSession();
          return;
        }
        console.error('Gagal touch user activity:', err);
      }
    });
  }

  private flushActivityOnLogout(reason: string) {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.lastActivitySyncAt = Date.now();

    fetch(`${this.apiUrl}/me/logout`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    }).catch((err) => {
      console.error('Gagal flush user activity saat logout:', err);
    });
  }

  private clearSession(clearResolved = true) {
    this.stopActivityTracking();
    this.currentUser.set(null);
    localStorage.removeItem('wedding_user');
    localStorage.removeItem('token');
    this.lastActivitySyncAt = 0;

    if (clearResolved) {
      this.sessionResolved.set(true);
    }
  }
}
