import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,_#3e47e8_0%,_#2ae6e1_100%)] px-4 py-6 [font-family:Poppins,sans-serif] sm:px-6 lg:px-8">
      <div class="absolute inset-0 bg-[url('/images/melati.jpg')] bg-cover bg-center opacity-75"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_28%),linear-gradient(180deg,_rgba(62,71,232,0.72)_0%,_rgba(42,230,225,0.56)_100%)]"></div>

      <div class="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div class="w-full max-w-[400px] rounded-[26px] border border-white/30 bg-white/14 px-5 py-5 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-[18px] sm:px-7 sm:py-6">
          <div class="mb-5 text-center">
            <button
              type="button"
              (click)="goHome()"
              class="mx-auto mb-3 block transition hover:scale-[1.03] active:scale-[0.98]"
              aria-label="Kembali ke landing page"
            >
              <img
                src="/images/mmood_white_fix.png"
                alt="MoneyMood"
                class="h-[54px] w-auto object-contain sm:h-[62px]"
              >
            </button>

            <h2 class="text-base font-semibold tracking-[-0.01em] text-white/95 drop-shadow-[0_2px_12px_rgba(15,23,42,0.16)]">
              {{ isRegisterMode() ? 'Langkah Awal Menuju Hari Bahagia' : 'Hi, Calon Pengantin! 💍' }}
            </h2>

            <p class="mt-1 text-xs font-medium text-white/65">
              {{ isRegisterMode() ? 'Silahkan daftar untuk mulai menyusun rencana pernikahanmu.' : 'Yuk, masukkan data akun kamu untuk mengelola checklist, vendor, tamu, dan budget pernikahanmu.' }}
            </p>
          </div>

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            @if (errorMessage()) {
              <div class="rounded-2xl border border-red-200/70 bg-red-50/90 px-4 py-3 text-sm font-semibold leading-relaxed text-red-600 shadow-sm">
                {{ errorMessage() }}
              </div>
            }

            @if (successMessage()) {
              <div class="rounded-2xl border border-emerald-200/70 bg-emerald-50/90 px-4 py-3 text-sm font-semibold leading-relaxed text-emerald-700 shadow-sm">
                {{ successMessage() }}
              </div>
            }

            @if (isRegisterMode()) {
              <div class="space-y-2">
                <label class="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                  Username
                </label>
                <input
                  [(ngModel)]="username"
                  name="username"
                  type="text"
                  required
                  autocomplete="username"
                  placeholder="misal. made.petruk"
                  class="w-full rounded-2xl border border-white/35 bg-white/90 px-4 py-3.5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
                  [ngClass]="{
                    'border-rose-300 bg-rose-50/95 shadow-[0_0_0_4px_rgba(251,113,133,0.18)]': shouldHighlightUsernameField()
                  }"
                >
              </div>

              <div class="space-y-2">
                <label class="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                  Email
                </label>
                <input
                  [(ngModel)]="email"
                  name="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="nama@gmail.com"
                  class="w-full rounded-2xl border border-white/35 bg-white/90 px-4 py-3.5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
                  [ngClass]="{
                    'border-rose-300 bg-rose-50/95 shadow-[0_0_0_4px_rgba(251,113,133,0.18)]': shouldHighlightEmailField()
                  }"
                >
              </div>
            } @else {
              <div class="space-y-2">
                <label class="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                  Username / Email
                </label>
                <input
                  [(ngModel)]="identifier"
                  name="identifier"
                  type="text"
                  required
                  autocomplete="username"
                  placeholder="Masukkan username atau email"
                  class="w-full rounded-2xl border border-white/35 bg-white/90 px-4 py-3.5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
                >
              </div>
            }

            <div class="space-y-2">
              <label class="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                Password
              </label>
              <div class="relative">
                <input
                  [(ngModel)]="password"
                  name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  required
                  (focus)="onPasswordFocus()"
                  (blur)="onPasswordBlur()"
                  autocomplete="{{ isRegisterMode() ? 'new-password' : 'current-password' }}"
                  placeholder="Masukkan password"
                  class="w-full rounded-2xl border border-white/35 bg-white/90 px-4 py-3.5 pr-14 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
                  [ngClass]="{
                    'border-rose-300 bg-rose-50/95 shadow-[0_0_0_4px_rgba(251,113,133,0.18)]': shouldHighlightPasswordField()
                  }"
                >
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  [attr.aria-label]="showPassword() ? 'Sembunyikan password' : 'Tampilkan password'"
                >
                  @if (showPassword()) {
                    <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1-2.68 2.74-4.88 4.94-6.32"></path>
                      <path d="M1 1l22 22"></path>
                      <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5a3.5 3.5 0 0 0 2.47-5.97"></path>
                      <path d="M14.47 14.47L9.53 9.53"></path>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  }
                </button>
              </div>

              @if (isRegisterMode() && shouldShowPasswordChecklist()) {
                <div class="grid gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-xs text-white/85">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]"
                      [class.border-emerald-300]="hasMinPasswordLength()"
                      [class.bg-emerald-400]="hasMinPasswordLength()"
                      [class.text-emerald-950]="hasMinPasswordLength()"
                      [class.border-white/40]="!hasMinPasswordLength()"
                      [class.text-transparent]="!hasMinPasswordLength()">
                      ✓
                    </span>
                    <span [class.text-white]="hasMinPasswordLength()" [class.text-white/70]="!hasMinPasswordLength()">Minimal 8 karakter</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]"
                      [class.border-emerald-300]="hasUppercasePassword()"
                      [class.bg-emerald-400]="hasUppercasePassword()"
                      [class.text-emerald-950]="hasUppercasePassword()"
                      [class.border-white/40]="!hasUppercasePassword()"
                      [class.text-transparent]="!hasUppercasePassword()">
                      ✓
                    </span>
                    <span [class.text-white]="hasUppercasePassword()" [class.text-white/70]="!hasUppercasePassword()">Mengandung huruf besar</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]"
                      [class.border-emerald-300]="hasLowercasePassword()"
                      [class.bg-emerald-400]="hasLowercasePassword()"
                      [class.text-emerald-950]="hasLowercasePassword()"
                      [class.border-white/40]="!hasLowercasePassword()"
                      [class.text-transparent]="!hasLowercasePassword()">
                      ✓
                    </span>
                    <span [class.text-white]="hasLowercasePassword()" [class.text-white/70]="!hasLowercasePassword()">Mengandung huruf kecil</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]"
                      [class.border-emerald-300]="hasNumberPassword()"
                      [class.bg-emerald-400]="hasNumberPassword()"
                      [class.text-emerald-950]="hasNumberPassword()"
                      [class.border-white/40]="!hasNumberPassword()"
                      [class.text-transparent]="!hasNumberPassword()">
                      ✓
                    </span>
                    <span [class.text-white]="hasNumberPassword()" [class.text-white/70]="!hasNumberPassword()">Mengandung angka</span>
                  </div>
                </div>
              }
            </div>

            <button
              type="submit"
              [disabled]="isLoading()"
              class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_rgba(62,71,232,0.96)_0%,_rgba(42,230,225,0.96)_100%)] px-4 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_16px_38px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(15,23,42,0.22)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              @if (isLoading()) {
                <svg viewBox="0 0 24 24" class="h-4 w-4 animate-spin fill-none stroke-current" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.22-8.56"></path>
                </svg>
                Memproses
              } @else {
                {{ isRegisterMode() ? 'Register' : 'Login' }}
              }
            </button>
          </form>

          <div class="mt-5 text-center text-sm text-white/85">
            <p class="font-medium">
              {{ isRegisterMode() ? 'Sudah punya akun?' : 'Belum punya akun?' }}
              <button
                type="button"
                (click)="toggleMode()"
                class="ml-1 font-bold text-white underline decoration-2 underline-offset-4 transition hover:text-slate-100"
              >
                {{ isRegisterMode() ? 'Masuk' : 'Daftar disini' }}
              </button>
            </p>
          </div>

          @if (!isRegisterMode()) {
            <div class="mt-7 flex items-center justify-center gap-4">
              <a
                href="https://instagram.com/moneymood.id"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram MoneyMood"
                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 transition hover:-translate-y-0.5 hover:bg-white/15 hover:text-[#E4405F]"
              >
                <i class="fa-brands fa-instagram text-xl" aria-hidden="true"></i>
              </a>

              <a
                href="https://wa.me/6285177457709"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp MoneyMood"
                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 transition hover:-translate-y-0.5 hover:bg-white/15 hover:text-[#25D366]"
              >
                <i class="fa-brands fa-whatsapp text-xl" aria-hidden="true"></i>
              </a>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  @Input() mode: 'login' | 'register' | null = null;
  @Output() backHome = new EventEmitter<void>();

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  authService = inject(AuthService);

  isRegisterMode = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  isPasswordFocused = signal(false);

  username = '';
  email = '';
  identifier = '';
  password = '';

  private readonly usernameRegex = /^(?!.*\s)[a-zA-Z0-9._-]{3,20}$/;
  private readonly passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  private readonly emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

  ngOnInit() {
    this.route.data.subscribe((data) => {
      const requestedMode = this.mode ?? (data['mode'] as 'login' | 'register' | undefined) ?? 'login';
      const registeredMessage = sessionStorage.getItem('post_register_message');

      this.syncMode(requestedMode);

      if (requestedMode === 'login' && registeredMessage) {
        this.successMessage.set(registeredMessage);
        sessionStorage.removeItem('post_register_message');
      }
    });
  }

  private syncMode(mode: 'login' | 'register') {
    this.isRegisterMode.set(mode === 'register');
    this.errorMessage.set('');

    if (mode !== 'login') {
      this.successMessage.set('');
    }

    this.showPassword.set(false);
    this.isPasswordFocused.set(false);
    this.password = '';
  }

  goHome() {
    this.backHome.emit();
    this.router.navigateByUrl('/landing');
  }

  toggleMode() {
    const nextMode = this.isRegisterMode() ? 'login' : 'register';
    this.syncMode(nextMode);
    this.router.navigateByUrl(`/${nextMode}`);
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  onPasswordFocus() {
    this.isPasswordFocused.set(true);
  }

  onPasswordBlur() {
    this.isPasswordFocused.set(false);
  }

  shouldShowPasswordChecklist() {
    return this.isPasswordFocused() || this.password.length > 0;
  }

  hasMinPasswordLength() {
    return this.password.length >= 8;
  }

  hasUppercasePassword() {
    return /[A-Z]/.test(this.password);
  }

  hasLowercasePassword() {
    return /[a-z]/.test(this.password);
  }

  hasNumberPassword() {
    return /\d/.test(this.password);
  }

  shouldHighlightUsernameField() {
    if (!this.isRegisterMode()) return false;
    const value = this.username.trim();
    return value.length > 0 && !this.usernameRegex.test(value);
  }

  shouldHighlightEmailField() {
    if (!this.isRegisterMode()) return false;
    const value = this.email.trim().toLowerCase();
    return value.length > 0 && !this.emailRegex.test(value);
  }

  shouldHighlightPasswordField() {
    if (!this.isRegisterMode()) return false;
    return this.password.length > 0 && !this.passwordRegex.test(this.password);
  }

  private validateRegisterForm() {
    const username = this.username.trim();
    const email = this.email.trim().toLowerCase();
    const password = this.password;

    if (!this.usernameRegex.test(username)) {
      this.errorMessage.set('Username harus 3-20 karakter, tanpa spasi, dan hanya boleh huruf, angka, titik, underscore, atau dash.');
      return false;
    }

    if (!this.emailRegex.test(email)) {
      this.errorMessage.set('Format email tidak valid.');
      return false;
    }

    if (!this.passwordRegex.test(password)) {
      this.errorMessage.set('Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, serta angka.');
      return false;
    }

    return true;
  }

  onSubmit() {
    this.successMessage.set('');

    if (this.isRegisterMode()) {
      if (!this.validateRegisterForm()) {
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
          sessionStorage.setItem(
            'post_register_message',
            'Registrasi berhasil. Silakan tunggu approval admin. Email konfirmasi akan dikirim setelah akun kamu aktif.'
          );

          this.username = '';
          this.email = '';
          this.password = '';
          this.identifier = '';
          this.errorMessage.set('');
          this.router.navigateByUrl('/login');
          return;
        }

        const user = res?.user ?? this.authService.currentUser();
        const destination = user?.role === 'admin' ? '/admin' : '/wedding-planner';

        this.router.navigateByUrl(destination);
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
