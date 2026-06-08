import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  created_at?: string | null;
  last_active_at?: string | null;
  last_login_at?: string | null;
  last_active?: string | null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(236,253,245,0.92)_35%,_rgba(239,246,255,0.9)_70%,_rgba(248,250,252,0.96)_100%)] px-3 py-4 text-slate-800 sm:px-4 md:px-6 lg:px-8">
      <div class="mx-auto flex max-w-[1500px] gap-3 lg:gap-6">
        <aside class="hidden w-[96px] shrink-0 lg:block">
          <div class="sticky top-6 overflow-hidden rounded-[32px] border border-white/70 bg-white/75 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-lg font-black text-white shadow-lg">
              MM
            </div>

            <div class="mt-8 space-y-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                  <rect x="14" y="3" width="7" height="5" rx="1.5"></rect>
                  <rect x="14" y="11" width="7" height="10" rx="1.5"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                </svg>
              </div>
            </div>

            <div class="mt-12 border-t border-slate-100 pt-4">
              <button
                (click)="logout()"
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-xs font-black text-rose-600 ring-1 ring-rose-100 transition hover:bg-rose-100"
              >
                OUT
              </button>
            </div>
          </div>
        </aside>

        <div class="min-w-0 flex-1">
          <div class="overflow-hidden rounded-[36px] border border-white/80 bg-white/80 shadow-[0_35px_120px_rgba(15,23,42,0.10)] backdrop-blur">
            <header class="border-b border-slate-100 px-4 py-4 sm:px-5 md:px-7 lg:px-8">
              <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div class="min-w-0">
                  <div class="flex items-center gap-3">
                    <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-black text-white shadow-lg lg:hidden">
                      MM
                    </div>
                    <div>
                      <p class="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">MoneyMood Control</p>
                      <h1 class="text-xl font-black tracking-tight text-slate-800 sm:text-2xl md:text-3xl">Admin Dashboard</h1>
                    </div>
                  </div>
                  <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    Pantau pertumbuhan user, aktivitas terbaru, serta proses inject vendor dan lokasi prewed dalam satu dashboard yang lebih rapi.
                  </p>
                </div>

                <div class="flex w-full items-center justify-end gap-3 xl:w-auto">
                  <button
                    (click)="refreshAll()"
                    class="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
                    aria-label="Refresh data"
                    title="Refresh data"
                  >
                    <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M21 12a9 9 0 1 1-2.64-6.36"></path>
                      <path d="M21 3v6h-6"></path>
                    </svg>
                  </button>
                  <button
                    (click)="logout()"
                    class="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 sm:flex-none"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            </header>

            <div class="px-4 py-4 sm:px-5 sm:py-5 md:px-7 md:py-7 lg:px-8 lg:py-8">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div class="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70 p-5 shadow-[0_20px_50px_rgba(16,185,129,0.10)]">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-500">User Approved</p>
                      <p class="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">{{ totalUsers() }}</p>
                    </div>
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M18 21a6 6 0 0 0-12 0"></path>
                        <circle cx="12" cy="8" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                  <p class="mt-4 text-xs leading-5 text-slate-500">Jumlah user non-admin yang sudah aktif dan bisa login ke aplikasi.</p>
                </div>

                <div class="rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50/70 p-5 shadow-[0_20px_50px_rgba(14,165,233,0.10)]">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-[11px] font-black uppercase tracking-[0.25em] text-sky-500">Total Visit</p>
                      <p class="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">{{ totalVisits() }}</p>
                    </div>
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white">
                      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </div>
                  </div>
                  <p class="mt-4 text-xs leading-5 text-slate-500">Akumulasi akses landing page yang sudah tercatat oleh sistem.</p>
                </div>

                <div class="rounded-[28px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50/70 p-5 shadow-[0_20px_50px_rgba(245,158,11,0.10)]">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-[11px] font-black uppercase tracking-[0.25em] text-amber-500">Pending Approval</p>
                      <p class="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">{{ pendingUsersCount() }}</p>
                    </div>
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white">
                      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 9v4"></path>
                        <path d="M12 17h.01"></path>
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path>
                      </svg>
                    </div>
                  </div>
                  <p class="mt-4 text-xs leading-5 text-slate-500">User yang sedang menunggu approval admin sebelum bisa memakai MoneyMood.</p>
                </div>
              </div>

              <div class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
                <section class="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                  <div class="border-b border-slate-100 px-4 py-4 sm:px-5 md:px-6">
                    <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div>
                        <p class="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">User Management</p>
                        <h2 class="mt-2 text-xl font-black text-slate-800">Daftar Pengguna</h2>
                      </div>
                      <div class="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.18em]">
                        <span class="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">Approved {{ approvedUsersCount() }}</span>
                        <span class="rounded-full bg-amber-50 px-3 py-2 text-amber-700">Pending {{ pendingUsersCount() }}</span>
                      </div>
                    </div>

                    <div class="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div class="relative w-full lg:max-w-sm">
                        <input
                          [(ngModel)]="userSearchTerm"
                          (ngModelChange)="onUserSearchChange()"
                          type="text"
                          placeholder="Cari username atau email user"
                          class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
                        />
                        <svg viewBox="0 0 24 24" class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <circle cx="11" cy="11" r="7"></circle>
                          <path d="m20 20-3.5-3.5"></path>
                        </svg>
                      </div>

                      <p class="text-xs font-bold text-slate-400">
                        Menampilkan {{ paginatedUsers().length }} dari {{ filteredUsers().length }} user
                      </p>
                    </div>
                  </div>

                  <div class="space-y-3 px-4 py-4 sm:px-5 md:hidden">
                    @for (user of paginatedUsers(); track user.id) {
                      <article class="rounded-[24px] border border-slate-100 bg-slate-50/70 p-4 shadow-sm">
                        <div class="flex items-start gap-3">
                          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xs font-black uppercase text-slate-700 shadow-sm">
                            {{ getInitials(user.username) }}
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-2">
                              <p class="truncate text-sm font-black text-slate-800">{{ user.username }}</p>
                              @if (user.role === 'admin') {
                                <span class="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white">Admin</span>
                              }
                              <span
                                class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                                [class.bg-emerald-50]="user.status === 'approved'"
                                [class.text-emerald-700]="user.status === 'approved'"
                                [class.bg-amber-50]="user.status === 'pending'"
                                [class.text-amber-700]="user.status === 'pending'"
                              >
                                {{ user.status }}
                              </span>
                            </div>
                            <p class="mt-1 truncate text-xs text-slate-500">{{ user.email }}</p>
                            <div class="mt-3 rounded-2xl bg-white/90 px-3 py-3 ring-1 ring-slate-100">
                              <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Last Active</p>
                              <p class="mt-1 text-sm font-semibold text-slate-700">{{ formatLastActive(getActivityDate(user)) }}</p>
                              <p class="mt-1 text-xs text-slate-400">{{ formatRelativeTime(getActivityDate(user)) }}</p>
                            </div>
                          </div>
                        </div>

                        <div class="mt-4">
                          @if (user.role !== 'admin') {
                            @if (user.status === 'pending') {
                              <div class="grid grid-cols-2 gap-2">
                                <button
                                  (click)="approveUser(user.id)"
                                  class="rounded-2xl bg-emerald-500 px-3 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition hover:bg-emerald-600"
                                >
                                  Terima
                                </button>
                                <button
                                  (click)="rejectUser(user.id)"
                                  class="rounded-2xl bg-rose-50 px-3 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-rose-600 transition hover:bg-rose-100"
                                >
                                  Tolak
                                </button>
                              </div>
                            } @else {
                              <div class="grid grid-cols-2 gap-2">
                                <button
                                  (click)="resetUserPassword(user.id)"
                                  class="rounded-2xl bg-sky-50 px-3 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-sky-700 transition hover:bg-sky-100"
                                >
                                  Reset PW
                                </button>
                                <button
                                  (click)="deleteUser(user.id)"
                                  class="rounded-2xl bg-rose-50 px-3 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-rose-600 transition hover:bg-rose-100"
                                >
                                  Hapus
                                </button>
                              </div>
                            }
                          } @else {
                            <div class="rounded-2xl border border-dashed border-slate-200 px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                              Protected
                            </div>
                          }
                        </div>
                      </article>
                    }

                    @if (filteredUsers().length === 0) {
                      <div class="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-400">
                        Tidak ada user yang cocok dengan pencarian.
                      </div>
                    }
                  </div>

                  <div class="hidden overflow-x-auto md:block">
                    <table class="min-w-full border-collapse text-left">
                      <thead>
                        <tr class="border-b border-slate-100 bg-slate-50/90 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                          <th class="px-5 py-4">User</th>
                          <th class="px-5 py-4">Status</th>
                          <th class="px-5 py-4">Last Active</th>
                          <th class="px-5 py-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        @for (user of paginatedUsers(); track user.id) {
                          <tr class="transition hover:bg-slate-50/80">
                            <td class="px-5 py-4">
                              <div class="flex items-center gap-3">
                                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-black uppercase text-slate-700">
                                  {{ getInitials(user.username) }}
                                </div>
                                <div class="min-w-0">
                                  <div class="flex items-center gap-2">
                                    <p class="truncate text-sm font-black text-slate-800">{{ user.username }}</p>
                                    @if (user.role === 'admin') {
                                      <span class="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white">Admin</span>
                                    }
                                  </div>
                                  <p class="truncate text-xs text-slate-500">{{ user.email }}</p>
                                </div>
                              </div>
                            </td>

                            <td class="px-5 py-4">
                              <span
                                class="inline-flex rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em]"
                                [class.bg-emerald-50]="user.status === 'approved'"
                                [class.text-emerald-700]="user.status === 'approved'"
                                [class.bg-amber-50]="user.status === 'pending'"
                                [class.text-amber-700]="user.status === 'pending'"
                              >
                                {{ user.status }}
                              </span>
                            </td>

                            <td class="px-5 py-4">
                              <p class="text-sm font-semibold text-slate-700">
                                {{ formatLastActive(getActivityDate(user)) }}
                              </p>
                              <p class="mt-1 text-xs text-slate-400">
                                {{ formatRelativeTime(getActivityDate(user)) }}
                              </p>
                            </td>

                            <td class="px-5 py-4 text-center">
                              @if (user.role !== 'admin') {
                                @if (user.status === 'pending') {
                                  <div class="flex flex-wrap justify-center gap-2">
                                    <button
                                      (click)="approveUser(user.id)"
                                      class="rounded-2xl bg-emerald-500 px-3 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-sm transition hover:bg-emerald-600"
                                    >
                                      Terima
                                    </button>
                                    <button
                                      (click)="rejectUser(user.id)"
                                      class="rounded-2xl bg-rose-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-rose-600 transition hover:bg-rose-100"
                                    >
                                      Tolak
                                    </button>
                                  </div>
                                } @else {
                                  <div class="flex flex-wrap justify-center gap-2">
                                    <button
                                      (click)="resetUserPassword(user.id)"
                                      class="rounded-2xl bg-sky-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-sky-700 transition hover:bg-sky-100"
                                    >
                                      Reset PW
                                    </button>
                                    <button
                                      (click)="deleteUser(user.id)"
                                      class="rounded-2xl bg-rose-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-rose-600 transition hover:bg-rose-100"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                }
                              } @else {
                                <span class="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Protected</span>
                              }
                            </td>
                          </tr>
                        }

                        @if (filteredUsers().length === 0) {
                          <tr>
                            <td colspan="4" class="px-5 py-12 text-center text-sm text-slate-400">
                              Tidak ada user yang cocok dengan pencarian.
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  @if (filteredUsers().length > pageSize) {
                    <div class="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between md:px-6">
                      <p class="text-xs font-semibold text-slate-400">
                        Halaman {{ currentUserPage }} dari {{ totalUserPages() }}
                      </p>

                      <div class="grid grid-cols-2 gap-2 md:flex md:items-center">
                        <button
                          (click)="goToPreviousUserPage()"
                          [disabled]="currentUserPage === 1"
                          class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <button
                          (click)="goToNextUserPage()"
                          [disabled]="currentUserPage === totalUserPages()"
                          class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  }
                </section>

                <div class="space-y-6">
                    <section class="rounded-[32px] border border-slate-100 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-5 md:p-6">
                      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p class="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Reports</p>
                          <h3 class="mt-2 text-lg font-black text-slate-800">Status Ringkas</h3>
                      </div>
                      <div class="rounded-2xl bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Real-time
                      </div>
                    </div>

                    <div class="mt-5 space-y-3">
                      <article class="rounded-[24px] border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 p-4">
                        <div class="flex items-start gap-3">
                          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm shadow-amber-500/20">
                            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <path d="M12 9v4"></path>
                              <path d="M12 17h.01"></path>
                              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path>
                            </svg>
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="text-sm font-black text-slate-800">{{ pendingUsersCount() }} user menunggu approval</p>
                            <p class="mt-1 text-xs leading-5 text-slate-500">Segera validasi pembayaran agar mereka bisa masuk ke dashboard wedding planner.</p>
                          </div>
                        </div>
                      </article>

                      <article class="rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 p-4">
                        <div class="flex items-start gap-3">
                          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
                            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <path d="M3 12h4l3-7 4 14 3-7h4"></path>
                            </svg>
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="text-sm font-black text-slate-800">{{ activeThisWeekCount() }} user aktif minggu ini</p>
                            <p class="mt-1 text-xs leading-5 text-slate-500">Sinyal ini membantu kita melihat apakah aplikasi sedang benar-benar dipakai oleh user.</p>
                          </div>
                        </div>
                      </article>
                    </div>
                  </section>

                    <section class="rounded-[32px] border border-slate-100 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-5 md:p-6">
                      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p class="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Recent Activity</p>
                          <h3 class="mt-2 text-lg font-black text-slate-800">Last Active User</h3>
                      </div>
                    </div>

                    <div class="mt-5 space-y-3">
                      @for (user of recentActiveUsers(); track user.id) {
                        <article class="flex items-start gap-3 rounded-[24px] border border-slate-100 bg-slate-50/70 p-4">
                          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xs font-black uppercase text-slate-700 shadow-sm">
                            {{ getInitials(user.username) }}
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-black text-slate-800">{{ user.username }}</p>
                            <p class="truncate text-xs text-slate-500">{{ user.email }}</p>
                            <p class="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                              {{ formatRelativeTime(getActivityDate(user)) }}
                            </p>
                          </div>
                        </article>
                      }

                      @if (recentActiveUsers().length === 0) {
                        <div class="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-400">
                          Belum ada aktivitas user yang tercatat.
                        </div>
                      }
                    </div>
                  </section>
                </div>
              </div>

              <div class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section class="rounded-[32px] border border-slate-100 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-5 md:p-6">
                  <div class="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p class="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Inject Vendor</p>
                      <h3 class="mt-2 text-xl font-black text-slate-800">Duplicate Vendor</h3>
                      <p class="mt-2 text-sm leading-6 text-slate-500">Tambahkan vendor dari akun sumber ke beberapa user tujuan tanpa menimpa data user yang sudah ada.</p>
                    </div>
                    <div class="rounded-2xl bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Shared media aman
                    </div>
                  </div>

                  <div class="mt-5 space-y-5">
                    <div>
                      <label class="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Akun sumber vendor</label>
                      <select
                        [(ngModel)]="selectedSourceUserId"
                        class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white"
                      >
                        <option [ngValue]="null">Pilih akun sumber</option>
                        @for (user of selectableUsers(); track user.id) {
                          <option [ngValue]="user.id">{{ user.username }} - {{ user.email }}</option>
                        }
                      </select>
                    </div>

                    <div>
                      <label class="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Akun tujuan</label>
                      <div class="mt-2 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 xl:grid-cols-2">
                        @for (user of vendorTargetUsers(); track user.id) {
                          <label class="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 transition hover:bg-slate-100">
                            <input
                              type="checkbox"
                              [checked]="selectedTargetUserIds.includes(user.id)"
                              (change)="toggleTargetUser(user.id, $event)"
                              class="h-4 w-4"
                            />
                            <div class="min-w-0">
                              <p class="truncate text-sm font-black text-slate-700">{{ user.username }}</p>
                              <p class="truncate text-[11px] text-slate-400">{{ user.email }}</p>
                            </div>
                          </label>
                        }
                      </div>
                    </div>

                      <button
                        (click)="duplicateVendorsToUsers()"
                        [disabled]="isDuplicatingVendors"
                        class="w-full rounded-2xl bg-slate-900 px-4 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:tracking-[0.24em]"
                      >
                        {{ isDuplicatingVendors ? 'Memproses duplicate vendor...' : 'Duplicate Vendor' }}
                      </button>

                    @if (duplicateVendorMessage) {
                      <div class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold leading-6 text-slate-600">
                        {{ duplicateVendorMessage }}
                      </div>
                    }
                  </div>
                </section>

                <section class="rounded-[32px] border border-slate-100 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-5 md:p-6">
                  <div class="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p class="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Inject Prewed</p>
                      <h3 class="mt-2 text-xl font-black text-slate-800">Duplicate Lokasi Prewed</h3>
                      <p class="mt-2 text-sm leading-6 text-slate-500">Bagikan referensi lokasi prewed dari satu akun sumber ke beberapa akun tujuan dengan flow yang tetap aman.</p>
                    </div>
                    <div class="rounded-2xl bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Tambah data baru saja
                    </div>
                  </div>

                  <div class="mt-5 space-y-5">
                    <div>
                      <label class="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Akun sumber lokasi</label>
                      <select
                        [(ngModel)]="selectedPrewedSourceUserId"
                        class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-300 focus:bg-white"
                      >
                        <option [ngValue]="null">Pilih akun sumber</option>
                        @for (user of selectableUsers(); track user.id) {
                          <option [ngValue]="user.id">{{ user.username }} - {{ user.email }}</option>
                        }
                      </select>
                    </div>

                    <div>
                      <label class="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Akun tujuan</label>
                      <div class="mt-2 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 xl:grid-cols-2">
                        @for (user of prewedTargetUsers(); track user.id) {
                          <label class="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 transition hover:bg-slate-100">
                            <input
                              type="checkbox"
                              [checked]="selectedPrewedTargetUserIds.includes(user.id)"
                              (change)="togglePrewedTargetUser(user.id, $event)"
                              class="h-4 w-4"
                            />
                            <div class="min-w-0">
                              <p class="truncate text-sm font-black text-slate-700">{{ user.username }}</p>
                              <p class="truncate text-[11px] text-slate-400">{{ user.email }}</p>
                            </div>
                          </label>
                        }
                      </div>
                    </div>

                      <button
                        (click)="duplicatePrewedToUsers()"
                        [disabled]="isDuplicatingPrewed"
                        class="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-sky-500/20 transition hover:from-cyan-600 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:tracking-[0.24em]"
                      >
                        {{ isDuplicatingPrewed ? 'Memproses duplicate lokasi...' : 'Duplicate Lokasi Prewed' }}
                      </button>

                    @if (duplicatePrewedMessage) {
                      <div class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold leading-6 text-slate-600">
                        {{ duplicatePrewedMessage }}
                      </div>
                    }
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  http = inject(HttpClient);
  authService = inject(AuthService);
  router = inject(Router);

  users = signal<AdminUser[]>([]);
  totalUsers = signal(0);
  totalVisits = signal(0);
  userSearchTerm = '';
  currentUserPage = 1;
  readonly pageSize = 10;

  selectedSourceUserId: number | null = null;
  selectedTargetUserIds: number[] = [];
  isDuplicatingVendors = false;
  duplicateVendorMessage = '';

  selectedPrewedSourceUserId: number | null = null;
  selectedPrewedTargetUserIds: number[] = [];
  isDuplicatingPrewed = false;
  duplicatePrewedMessage = '';

  apiUrl = `${environment.apiUrl}/admin`;

  ngOnInit() {
    this.refreshAll();
  }

  get adminId(): number {
    return this.authService.currentUser()?.id;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');

    return {
      Authorization: `Bearer ${token}`
    };
  }

  refreshAll() {
    this.loadUsers();
    this.loadDashboardStats();
  }

  loadUsers() {
    this.http.get<AdminUser[]>(`${this.apiUrl}/users`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.users.set(this.sortUsersByActivity(data));
        this.clampCurrentUserPage();
      },
      error: (err) => {
        console.error('Gagal memuat user:', err);
        alert(err.error?.message || 'Gagal memuat data user.');
      }
    });
  }

  loadDashboardStats() {
    this.http.get<{ totalUsers: number; totalVisits: number }>(`${environment.apiUrl}/public/stats`).subscribe({
      next: (res) => {
        this.totalUsers.set(res.totalUsers || 0);
        this.totalVisits.set(res.totalVisits || 0);
      },
      error: (err) => {
        console.error('Gagal memuat statistik publik:', err);
      }
    });
  }

  approvedUsersCount() {
    return this.users().filter((user) => user.role !== 'admin' && user.status === 'approved').length;
  }

  pendingUsersCount() {
    return this.users().filter((user) => user.role !== 'admin' && user.status === 'pending').length;
  }

  activeThisWeekCount() {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    return this.users().filter((user) => {
      if (user.role === 'admin') return false;
      const activityDate = this.parseDate(this.getActivityDate(user));
      return !!activityDate && now - activityDate.getTime() <= sevenDaysMs;
    }).length;
  }

  selectableUsers() {
    return this.users().filter((user) => user.role !== 'admin' && user.status === 'approved');
  }

  vendorTargetUsers() {
    return this.selectableUsers().filter((user) => user.id !== this.selectedSourceUserId);
  }

  prewedTargetUsers() {
    return this.selectableUsers().filter((user) => user.id !== this.selectedPrewedSourceUserId);
  }

  recentActiveUsers() {
    return this.sortedUsers()
      .filter((user) => user.role !== 'admin' && this.getActivityDate(user))
      .slice(0, 4);
  }

  filteredUsers() {
    const keyword = this.userSearchTerm.trim().toLowerCase();
    const users = this.sortedUsers();

    if (!keyword) {
      return users;
    }

    return users.filter((user) => {
      const username = String(user.username || '').toLowerCase();
      const email = String(user.email || '').toLowerCase();
      return username.includes(keyword) || email.includes(keyword);
    });
  }

  paginatedUsers() {
    const start = (this.currentUserPage - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  }

  totalUserPages() {
    return Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize));
  }

  onUserSearchChange() {
    this.currentUserPage = 1;
  }

  goToPreviousUserPage() {
    if (this.currentUserPage > 1) {
      this.currentUserPage -= 1;
    }
  }

  goToNextUserPage() {
    if (this.currentUserPage < this.totalUserPages()) {
      this.currentUserPage += 1;
    }
  }

  clampCurrentUserPage() {
    this.currentUserPage = Math.min(this.currentUserPage, this.totalUserPages());
    this.currentUserPage = Math.max(1, this.currentUserPage);
  }

  sortedUsers() {
    return this.sortUsersByActivity(this.users());
  }

  sortUsersByActivity(users: AdminUser[]) {
    return [...users].sort((a, b) => {
      const aTime = this.parseDate(this.getActivityDate(a))?.getTime() || 0;
      const bTime = this.parseDate(this.getActivityDate(b))?.getTime() || 0;
      return bTime - aTime;
    });
  }

  approveUser(userId: number) {
    if (!confirm('Validasi pembayaran sudah oke? Terima user ini agar bisa login?')) return;

    this.http.post(`${this.apiUrl}/approve`, { userId }, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        alert('User berhasil disetujui!');
        this.refreshAll();
      },
      error: (err) => {
        console.error('Detail Error:', err);
        alert(err.error?.message || 'Gagal memproses approval.');
      }
    });
  }

  rejectUser(userId: number) {
    if (!confirm('Yakin ingin menolak dan menghapus user ini secara permanen?')) return;

    this.http.post(`${this.apiUrl}/reject`, { userId }, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        alert('User berhasil ditolak dan dihapus.');
        this.refreshAll();
      },
      error: (err) => {
        console.error('Detail Error:', err);
        alert(err.error?.message || 'Gagal menghapus user.');
      }
    });
  }

  toggleTargetUser(userId: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedTargetUserIds = [...this.selectedTargetUserIds, userId];
    } else {
      this.selectedTargetUserIds = this.selectedTargetUserIds.filter((id) => id !== userId);
    }
  }

  duplicateVendorsToUsers() {
    this.duplicateVendorMessage = '';

    if (!this.selectedSourceUserId) {
      this.duplicateVendorMessage = 'Pilih akun sumber vendor terlebih dahulu.';
      return;
    }

    if (this.selectedTargetUserIds.length === 0) {
      this.duplicateVendorMessage = 'Pilih minimal satu akun tujuan.';
      return;
    }

    if (this.selectedTargetUserIds.includes(this.selectedSourceUserId)) {
      this.duplicateVendorMessage = 'Akun sumber tidak boleh menjadi akun tujuan.';
      return;
    }

    const confirmed = confirm(
      `Duplicate semua vendor dari user ID ${this.selectedSourceUserId} ke ${this.selectedTargetUserIds.length} user tujuan?`
    );

    if (!confirmed) return;

    this.isDuplicatingVendors = true;

    this.http.post<any>(`${this.apiUrl}/duplicate-vendors`, {
      sourceUserId: this.selectedSourceUserId,
      targetUserIds: this.selectedTargetUserIds
    }, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (res) => {
        this.isDuplicatingVendors = false;

        this.duplicateVendorMessage =
          `${res.message || 'Vendor berhasil diduplikasi.'} ` +
          `Vendor ditambahkan: ${res.insertedCount || 0}, ` +
          `vendor dilewati: ${res.skippedVendorCount || 0}, ` +
          `kategori ditambahkan: ${res.insertedCategoryCount || 0}, ` +
          `kategori dilewati: ${res.skippedCategoryCount || 0}.`;

        this.selectedSourceUserId = null;
        this.selectedTargetUserIds = [];

        alert('Vendor berhasil diduplikasi!');
      },
      error: (err) => {
        this.isDuplicatingVendors = false;
        console.error('Gagal duplicate vendor:', err);

        const message =
          err.error?.detail ||
          err.error?.message ||
          err.error ||
          err.message ||
          'Gagal duplicate vendor.';

        this.duplicateVendorMessage = message;
      }
    });
  }

  togglePrewedTargetUser(userId: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedPrewedTargetUserIds = [...this.selectedPrewedTargetUserIds, userId];
    } else {
      this.selectedPrewedTargetUserIds = this.selectedPrewedTargetUserIds.filter((id) => id !== userId);
    }
  }

  duplicatePrewedToUsers() {
    this.duplicatePrewedMessage = '';

    if (!this.selectedPrewedSourceUserId) {
      this.duplicatePrewedMessage = 'Pilih akun sumber lokasi prewed terlebih dahulu.';
      return;
    }

    if (this.selectedPrewedTargetUserIds.length === 0) {
      this.duplicatePrewedMessage = 'Pilih minimal satu akun tujuan.';
      return;
    }

    if (this.selectedPrewedTargetUserIds.includes(this.selectedPrewedSourceUserId)) {
      this.duplicatePrewedMessage = 'Akun sumber tidak boleh menjadi akun tujuan.';
      return;
    }

    const confirmed = confirm(
      `Duplicate semua lokasi prewed dari user ID ${this.selectedPrewedSourceUserId} ke ${this.selectedPrewedTargetUserIds.length} user tujuan?`
    );

    if (!confirmed) return;

    this.isDuplicatingPrewed = true;

    this.http.post<any>(`${this.apiUrl}/duplicate-prewed-locations`, {
      sourceUserId: this.selectedPrewedSourceUserId,
      targetUserIds: this.selectedPrewedTargetUserIds
    }, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (res) => {
        this.isDuplicatingPrewed = false;

        this.duplicatePrewedMessage =
          `${res.message || 'Lokasi prewed berhasil diduplikasi.'} ` +
          `Berhasil tambah: ${res.insertedCount || 0}, ` +
          `dilewati karena sudah ada: ${res.skippedCount || 0}.`;

        this.selectedPrewedSourceUserId = null;
        this.selectedPrewedTargetUserIds = [];

        alert('Lokasi prewed berhasil diduplikasi!');
      },
      error: (err) => {
        this.isDuplicatingPrewed = false;
        console.error('Gagal duplicate lokasi prewed:', err);

        const message =
          err.error?.detail ||
          err.error?.message ||
          err.error ||
          err.message ||
          'Gagal duplicate lokasi prewed.';

        this.duplicatePrewedMessage = message;
      }
    });
  }

  deleteUser(userId: number) {
    const user = this.users().find((item) => item.id === userId);

    const confirmation = prompt(
      `Tindakan ini akan menghapus user "${user?.username || userId}" secara permanen.\n\nKetik HAPUS untuk melanjutkan:`
    );

    if (confirmation !== 'HAPUS') {
      alert('Penghapusan dibatalkan.');
      return;
    }

    this.http.post(`${this.apiUrl}/reject`, { userId }, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        alert('User berhasil dihapus.');
        this.refreshAll();
      },
      error: (err) => {
        console.error('Detail Error:', err);
        alert(err.error?.message || 'Gagal menghapus user.');
      }
    });
  }

  resetUserPassword(userId: number) {
    const newPassword = prompt('Masukkan password baru untuk user ini:');

    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert('Password minimal 6 karakter.');
      return;
    }

    const confirmed = confirm('Yakin ingin reset password user ini?');

    if (!confirmed) return;

    this.http.post(`${this.apiUrl}/reset-password`, {
      userId,
      newPassword
    }, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        alert('Password user berhasil direset.');
      },
      error: (err) => {
        console.error('Gagal reset password:', err);

        const message =
          err.error?.message ||
          err.error ||
          err.message ||
          'Gagal reset password.';

        alert(message);
      }
    });
  }

  logout() {
    if (confirm('Keluar dari Admin Dashboard?')) {
      this.authService.logout();
      this.router.navigateByUrl('/login');
    }
  }

  getActivityDate(user: AdminUser) {
    return user.last_active || user.last_active_at || user.last_login_at || user.created_at || null;
  }

  getInitials(name: string) {
    return String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'US';
  }

  formatLastActive(value: string | null | undefined) {
    const date = this.parseDate(value);
    if (!date) return '-';

    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  formatRelativeTime(value: string | null | undefined) {
    const date = this.parseDate(value);
    if (!date) return 'Belum ada aktivitas';

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Baru saja aktif';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return 'Aktivitas lebih lama';
  }

  parseDate(value: string | null | undefined) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
