import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style="background-image: url('/images/pink-background.jpg');">
      <div class="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/50 animate-in fade-in zoom-in-95 duration-500">
        
        <!-- Header -->
        <div class="bg-pink-400 p-8 text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-white/5 opacity-20"></div>

          <!-- Logo MoneyMood clickable -->
          <button
            type="button"
            (click)="backHome.emit()"
            class="relative z-10 inline-flex flex-col items-center justify-center group mb-4"
            title="Kembali ke Landing Page MoneyMood"
          >
            <img
              src="images/mmood_white_fix.png"
              alt="MoneyMood"
              class="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            >
          </button>

          <h1 class="text-3xl font-black not-italic tracking-tight text-white mb-2 relative z-10">
            Wedding Planner
          </h1>

          <p class="text-white text-xs font-bold uppercase tracking-widest relative z-10">
            {{ isRegisterMode() ? 'Buat Akun Baru' : 'Masuk ke Dashboard' }}
          </p>
        </div>

        <!-- Form -->
        <div class="p-8 pt-10">
          <form (ngSubmit)="onSubmit()" class="space-y-5">
            
            <!-- Error Message Display -->
            @if (errorMessage()) {
              <div class="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl border border-red-100 text-center animate-pulse">
                {{ errorMessage() }}
              </div>
            }
            <!-- Success Message Display -->
            @if (successMessage()) {
              <div class="bg-green-50 text-green-600 text-xs font-bold p-3 rounded-xl border border-green-100 text-center leading-relaxed">
                {{ successMessage() }}
              </div>
            }

            <!-- Username hanya muncul saat Register -->
            @if (isRegisterMode()) {
              <div class="space-y-1 animate-in slide-in-from-top-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Username</label>
                <input 
                  [(ngModel)]="username" 
                  name="username" 
                  type="text" 
                  required
                  placeholder="Nama Pengguna"
                  class="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-sm font-bold focus:ring-2 focus:ring-slate-200 transition-all text-slate-700"
                >
              </div>
            }

            <!-- Email hanya muncul saat Register -->
            @if (isRegisterMode()) {
              <div class="space-y-1 animate-in slide-in-from-top-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
                <input 
                  [(ngModel)]="email" 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="contoh@gmail.com"
                  class="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-sm font-bold focus:ring-2 focus:ring-slate-200 transition-all text-slate-700"
                >
              </div>
            }

            <!-- Username / Email saat Login -->
            @if (!isRegisterMode()) {
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Username / Email</label>
                <input 
                  [(ngModel)]="identifier" 
                  name="identifier" 
                  type="text" 
                  required 
                  placeholder="Username atau Email"
                  class="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-sm font-bold focus:ring-2 focus:ring-slate-200 transition-all text-slate-700"
                >
              </div>
            }

            <!-- Password -->
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Password
              </label>

              <div class="relative">
                <input 
                  [(ngModel)]="password" 
                  name="password" 
                  [type]="isRegisterMode()
                    ? (showRegisterPassword ? 'text' : 'password')
                    : (showLoginPassword ? 'text' : 'password')" 
                  required
                  placeholder="••••••••"
                  class="w-full p-4 pr-12 bg-slate-50 rounded-2xl border-none outline-none text-sm font-bold focus:ring-2 focus:ring-slate-200 transition-all text-slate-700"
                >

                <button
                  type="button"
                  (click)="isRegisterMode()
                    ? showRegisterPassword = !showRegisterPassword
                    : showLoginPassword = !showLoginPassword"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors text-sm">
                  {{ isRegisterMode()
                    ? (showRegisterPassword ? '🙈' : '👁️')
                    : (showLoginPassword ? '🙈' : '👁️') }}
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              [disabled]="isLoading()"
              class="w-full py-4 mt-4 bg-pink-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              @if (isLoading()) { 
                <span class="animate-spin">⏳</span> Proses... 
              } @else { 
                {{ isRegisterMode() ? 'Daftar Sekarang' : 'Masuk Aplikasi' }} 
              }
            </button>

          </form>

          <!-- Toggle Mode Button -->
          <div class="mt-8 text-center">
            <p class="text-xs text-slate-500 font-bold">
              {{ isRegisterMode() ? 'Sudah punya akun?' : 'Belum punya akun?' }}
              <button 
                (click)="toggleMode()" 
                type="button"
                class="text-blue-600 underline decoration-2 underline-offset-2 ml-1 hover:text-blue-800 transition-colors"
              >
                {{ isRegisterMode() ? 'Login disini' : 'Daftar disini' }}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class LoginComponent {
  @Output() backHome = new EventEmitter<void>();
  private isValidEmail(email: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();

    const allowedDomains = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com'
    ];

    const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      return false;
    }

    const domain = normalizedEmail.split('@')[1];

    return allowedDomains.includes(domain);
  }
  // Inject Service Auth agar bisa Login/Register
  authService = inject(AuthService);
  
  // State untuk UI
  isRegisterMode = signal(false); // Default mode Login
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Data Form
  username = '';
  email = '';
  identifier = '';
  password = '';

  showLoginPassword = false;
  showRegisterPassword = false;

  // Ganti Mode Login <-> Register
  toggleMode() {
    this.isRegisterMode.update(v => !v);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.showLoginPassword = false;
    this.showRegisterPassword = false;
  }

  // Saat tombol submit ditekan
  onSubmit() {
    this.successMessage.set('');

    if (this.isRegisterMode()) {
      const username = this.username.trim();
      const email = this.email.trim();
      const password = this.password;

      if (!username) {
        this.errorMessage.set('Username wajib diisi.');
        return;
      }

      if (username.length < 3) {
        this.errorMessage.set('Username minimal 3 karakter.');
        return;
      }

      if (!email) {
        this.errorMessage.set('Email wajib diisi.');
        return;
      }

      if (!this.isValidEmail(email)) {
        this.errorMessage.set('Gunakan email yang valid');
        return;
      }

      if (!password) {
        this.errorMessage.set('Password wajib diisi.');
        return;
      }

      if (password.length < 6) {
        this.errorMessage.set('Password minimal 6 karakter.');
        return;
      }
    } else {
      const identifier = this.identifier.trim();

      if (!identifier || !this.password) {
        this.errorMessage.set('Mohon lengkapi username/email dan password.');
        return;
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const action$ = this.isRegisterMode()
      ? this.authService.register(
          this.username.trim(),
          this.email.trim().toLowerCase(),
          this.password
        )
      : this.authService.login(
          this.identifier.trim(),
          this.password
        );

    action$.subscribe({
      next: (res) => {
        this.isLoading.set(false);

        if (this.isRegisterMode()) {
          this.successMessage.set(
            'Registrasi berhasil. Silakan tunggu approval admin. Email konfirmasi akan dikirim setelah akun kamu aktif.'
          );

          this.errorMessage.set('');
          this.isRegisterMode.set(false);

          this.username = '';
          this.email = '';
          this.password = '';
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);

        if (err.error && err.error.message) {
          this.errorMessage.set(err.error.message);
        } else {
          this.errorMessage.set(
            typeof err.error === 'string'
              ? err.error
              : 'Gagal terhubung ke server.'
          );
        }
      }
    });
  }
}
