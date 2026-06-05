import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen overflow-x-hidden bg-gradient-to-b from-rose-50 via-white to-amber-50 text-slate-800">
      <section class="relative flex min-h-[72vh] items-center justify-center px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:min-h-[82vh] lg:pb-16 lg:pt-14">
        <div class="absolute inset-0 bg-gradient-to-br from-pink-100 via-white to-amber-50"></div>
        <div class="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-pink-200 opacity-50 blur-3xl sm:h-72 sm:w-72"></div>
        <div class="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-200 opacity-50 blur-3xl sm:h-72 sm:w-72"></div>

        <div class="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10">
          <div class="min-w-0 w-full text-center lg:text-left">
            <div class="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-xl sm:mb-6 sm:px-4">
              <span class="h-2 w-2 rounded-full bg-pink-400"></span>
              <span class="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500 sm:text-[10px] sm:tracking-[0.25em]">
                MoneyMood Digital Planner
              </span>
            </div>

            <h1 class="mx-auto mb-4 max-w-[11ch] text-[3rem] font-black leading-[1.02] tracking-[-0.03em] text-slate-900 sm:max-w-none sm:text-5xl sm:tracking-normal lg:mx-0 lg:mb-5 lg:text-6xl">
              Atur Momen & Finansialmu dengan Lebih Tenang
            </h1>

            <p class="mx-auto mb-7 w-full max-w-xl text-sm font-medium leading-relaxed text-slate-500 sm:text-base lg:mx-0 lg:mb-8">
              MoneyMood menghadirkan digital planner yang simple dan aesthetic untuk membantu kamu mengelola momen penting dengan lebih rapi, dimulai dari Wedding Planner untuk persiapan pernikahan.
            </p>

            <div class="flex flex-col items-center justify-center gap-3 sm:flex-row lg:items-start lg:justify-start">
              <button
                type="button"
                (click)="scrollToProducts()"
                class="w-full max-w-[22rem] rounded-2xl bg-pink-500 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-pink-600 active:scale-95 sm:w-auto sm:max-w-none"
              >
                Lihat Produk
              </button>
            </div>
          </div>

          <div class="relative min-w-0 w-full">
            <div class="rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-2xl backdrop-blur-xl sm:rounded-[2.5rem] sm:p-6 lg:rounded-[3rem] lg:p-8">
              <div class="mb-4 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-pink-400 to-rose-500 p-5 text-white sm:mb-5 sm:rounded-[2.2rem] sm:p-6">
                <p class="mb-3 text-[10px] font-black uppercase tracking-[0.25em] opacity-80">
                  Featured Product
                </p>

                <h2 class="mb-2 text-2xl font-black sm:text-3xl">
                  Wedding Planner
                </h2>

                <p class="text-sm leading-relaxed text-white/85">
                  Kelola budget, daftar tamu, to-do list, vendor, lokasi prewed, dan summary persiapan pernikahan.
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-2xl bg-slate-50 p-4 sm:rounded-3xl">
                  <p class="text-xl font-black text-slate-800 sm:text-2xl">
                    {{ totalUsers() !== null ? totalUsers() + '+' : '-' }}
                  </p>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    User Terdaftar
                  </p>
                </div>

                <div class="rounded-2xl bg-slate-50 p-4 sm:rounded-3xl">
                  <p class="text-xl font-black text-slate-800 sm:text-2xl">
                    6+
                  </p>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Fitur Utama
                  </p>
                </div>

                <div class="rounded-2xl bg-slate-50 p-4 sm:rounded-3xl">
                  <p class="text-xl font-black text-slate-800 sm:text-2xl">
                    Mudah
                  </p>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Digunakan
                  </p>
                </div>

                <div class="rounded-2xl bg-slate-50 p-4 sm:rounded-3xl">
                  <p class="text-xl font-black text-slate-800 sm:text-2xl">
                    Tampilan
                  </p>
                  <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Responsif
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="products" class="relative z-10 px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
        <div class="mx-auto max-w-6xl">
          <div class="mb-8 text-center sm:mb-10">
            <p class="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">
              Produk MoneyMood
            </p>
            <h2 class="text-3xl font-black text-slate-900 sm:text-4xl">
              Pilih Planner Sesuai Kebutuhanmu
            </h2>
          </div>

          <div class="space-y-8">
            <div class="group relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-pink-100 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 sm:rounded-[2.8rem]">
              <div class="relative isolate h-64 overflow-hidden rounded-t-[2rem] sm:h-72 sm:rounded-t-[2.8rem] lg:h-80">
                <div
                  class="absolute inset-0 scale-[1.03] bg-cover bg-center transition-transform duration-700 will-change-transform group-hover:scale-[1.06]"
                  style="background-image: url('images/wedding.jpg'); background-position: center 35%;"
                ></div>

                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                <div class="absolute left-4 top-4 sm:left-5 sm:top-5">
                  <span class="inline-flex items-center gap-2 rounded-full bg-pink-500/90 px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-white shadow-lg backdrop-blur-md sm:px-4 sm:text-[10px] sm:tracking-[0.25em]">
                    Featured Product
                  </span>
                </div>

                <div class="absolute bottom-4 left-4 sm:bottom-5 sm:left-5">
                  <div class="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/20 bg-white/20 text-2xl shadow-lg backdrop-blur-md sm:h-16 sm:w-16 sm:rounded-3xl sm:text-3xl">
                    <span aria-hidden="true">💍</span>
                  </div>
                </div>

                <div class="absolute bottom-5 right-4 text-right sm:bottom-6 sm:right-6">
                  <p class="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                    MoneyMood
                  </p>
                  <h3 class="text-2xl font-black leading-tight text-white drop-shadow-md sm:text-3xl">
                    Wedding Planner
                  </h3>
                </div>
              </div>

              <div class="relative p-4 sm:p-6 lg:p-7">
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-50/70 via-white to-rose-50/70"></div>
                <div class="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-pink-100 opacity-50 blur-3xl"></div>

                <div class="relative z-10">
                  <p class="mb-5 text-sm font-medium leading-relaxed text-slate-500">
                    Aplikasi digital untuk membantu calon pengantin mengatur seluruh persiapan pernikahan
                    dengan lebih rapi, praktis, dan aesthetic.
                  </p>

                  <div class="mb-6 rounded-[1.5rem] border border-pink-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p class="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-pink-500">
                          Harga Launching
                        </p>

                        <div class="flex flex-wrap items-end gap-x-2 gap-y-1">
                          <p class="text-2xl font-black text-slate-900 sm:text-3xl">
                            Rp {{ launchingPrice | number:'1.0-0' }}
                          </p>

                          <p class="mb-1 text-xs font-bold text-slate-400 line-through">
                            Rp {{ normalPrice | number:'1.0-0' }}
                          </p>
                        </div>
                      </div>

                      <span class="w-fit shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        Sekali Bayar
                      </span>
                    </div>

                    <p class="mt-3 text-[11px] font-bold leading-relaxed text-slate-400">
                      Akses personal Wedding Planner digital untuk mengelola persiapan pernikahan sampai hari H.
                    </p>
                  </div>

                  <div class="mb-6 flex flex-wrap gap-2">
                    <span class="rounded-full border border-pink-100 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm">Budgeting</span>
                    <span class="rounded-full border border-pink-100 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm">Guest List</span>
                    <span class="rounded-full border border-pink-100 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm">To-Do List</span>
                    <span class="rounded-full border border-pink-100 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm">Vendor</span>
                    <span class="rounded-full border border-pink-100 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm">Lokasi Prewed</span>
                  </div>

                  <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
                      <p class="text-lg font-black text-slate-800">6+</p>
                      <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fitur Utama</p>
                    </div>
                    <div class="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
                      <p class="text-lg font-black text-slate-800">Responsif</p>
                      <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bisa digunakan di semua device dengan tampilan yang responsif</p>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <button
                      type="button"
                      (click)="openWhatsAppAdmin()"
                      class="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:bg-green-600 active:scale-95 sm:text-xs sm:tracking-widest"
                    >
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>

                      <span>Beli Sekarang via WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      (click)="goToLogin()"
                      class="w-full rounded-2xl bg-slate-900 py-4 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-slate-700 active:scale-95 sm:text-xs sm:tracking-widest"
                    >
                      Sudah Beli? Silahkan Register / Login
                    </button>

                    <p class="text-center text-[11px] font-bold leading-relaxed text-slate-400">
                      Setelah membeli, daftar menggunakan email yang sama dengan email pembelian agar akun bisa divalidasi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mx-auto flex max-w-5xl flex-col items-stretch justify-between gap-4 rounded-[1.75rem] border border-slate-100 bg-white/85 p-4 text-center shadow-sm sm:rounded-[2rem] sm:p-5 md:flex-row md:items-center md:text-left">
              <div class="flex flex-col items-center gap-4 md:flex-row md:items-center">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl shadow-sm">
                  <span aria-hidden="true">💸</span>
                </div>

                <div>
                  <div class="mb-1 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <h3 class="text-xl font-black text-slate-800">
                      Daily Budgeting
                    </h3>

                    <span class="rounded-full bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">
                      Coming Soon
                    </span>
                  </div>

                  <p class="text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
                    Produk berikutnya dari MoneyMood untuk mencatat pemasukan dan pengeluaran harian.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled
                class="w-full cursor-not-allowed rounded-2xl bg-slate-100 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 md:w-auto"
              >
                Dalam Pengembangan
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent implements OnInit {
  @Output() openLogin = new EventEmitter<void>();

  private http = inject(HttpClient);
  private router = inject(Router);

  totalUsers = signal<number | null>(null);

  launchingPrice = 59000;
  normalPrice = 99000;

  adminWhatsAppNumber = '6285177457709';

  ngOnInit() {
    this.loadPublicStats();
  }

  loadPublicStats() {
    this.http.get<{ totalUsers: number }>(`${environment.apiUrl}/public/stats`)
      .subscribe({
        next: (res) => {
          this.totalUsers.set(res.totalUsers || 0);
        },
        error: (err) => {
          console.error('Gagal load public stats:', err);
          this.totalUsers.set(null);
        }
      });
  }

  openWhatsAppAdmin() {
    const message = 'Halo kak, saya tertarik untuk membeli akses MoneyMood Wedding Planner App. Bisa dibantu informasinya?';
    const url = `https://wa.me/${this.adminWhatsAppNumber}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  }

  scrollToProducts() {
    document.getElementById('products')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  goToLogin() {
    this.openLogin.emit();
    this.router.navigateByUrl('/login');
  }
}
