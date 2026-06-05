import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="min-h-screen bg-slate-100 p-6 font-sans">
            <div class="max-w-4xl mx-auto">
                
                <!-- Header Dashboard Admin -->
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h1 class="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
                        <p class="text-slate-500 text-sm">Validasi pembayaran dan pendaftaran user baru.</p>
                    </div>
                    <button (click)="logout()" class="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-600 transition-colors shadow-sm">
                        Keluar
                    </button>
                </div>

                <!-- Tabel Daftar User -->
                <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                    <div class="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 class="font-bold text-lg text-slate-700">Daftar Pengguna</h3>
                        <button (click)="loadUsers()" class="text-blue-500 text-xs font-bold hover:underline">Refresh Data ↻</button>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                                    <th class="p-4">Username</th>
                                    <th class="p-4">Email</th>
                                    <th class="p-4">Status</th>
                                    <th class="p-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                @for (user of users(); track user.id) {
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <!-- Kolom Username -->
                                        <td class="p-4 font-bold text-slate-700">
                                            {{ user.username }} 
                                            <span *ngIf="user.role === 'admin'" class="bg-black text-white text-[9px] px-1 py-0.5 rounded ml-1">ADMIN</span>
                                        </td>
                                        
                                        <!-- Kolom Email -->
                                        <td class="p-4 text-sm text-slate-500">{{ user.email }}</td>
                                        
                                        <!-- Kolom Status -->
                                        <td class="p-4">
                                            <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                                                [class.bg-green-100]="user.status === 'approved'"
                                                [class.text-green-600]="user.status === 'approved'"
                                                [class.bg-amber-100]="user.status === 'pending'"
                                                [class.text-amber-600]="user.status === 'pending'">
                                                {{ user.status }}
                                            </span>
                                        </td>

                                        <!-- Kolom Aksi (Tombol) -->
                                        <td class="p-4 text-center">
                                            @if (user.role !== 'admin') {
                                                @if (user.status === 'pending') {
                                                <div class="flex gap-2 justify-center">
                                                    <button 
                                                        (click)="approveUser(user.id)" 
                                                        class="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 shadow-sm active:scale-95 transition-all">
                                                        ✓ Terima
                                                    </button>

                                                    <button 
                                                        (click)="rejectUser(user.id)" 
                                                        class="bg-red-100 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 transition-all">
                                                        ✕ Tolak
                                                    </button>
                                                </div>
                                                } @else {
                                                <div class="flex gap-2 justify-center">
                                                    <button 
                                                        (click)="resetUserPassword(user.id)" 
                                                        class="bg-blue-50 text-blue-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all">
                                                        Reset PW
                                                    </button>
                                                    <button 
                                                        (click)="deleteUser(user.id)" 
                                                        class="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-all">
                                                        Hapus
                                                    </button>
                                                </div>
                                                }
                                            } @else {
                                                <span class="text-xs text-slate-300 font-bold">Admin</span>
                                            }
                                        </td>
                                    </tr>
                                }
                                @if (users().length === 0) {
                                    <tr><td colspan="4" class="p-8 text-center text-slate-400 text-sm">Belum ada data user.</td></tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                <!-- Duplicate Vendor -->
                <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 mt-6">
                    <div class="p-6 border-b border-slate-100 bg-slate-50">
                        <h3 class="font-bold text-lg text-slate-700">Duplicate Vendor</h3>
                        <p class="text-slate-500 text-xs mt-1">
                        Copy semua data vendor dari satu akun user ke akun user lainnya.
                        </p>
                    </div>

                    <div class="p-6 space-y-5">

                        <!-- Akun Sumber -->
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Akun Sumber Vendor
                            </label>

                            <select
                                [(ngModel)]="selectedSourceUserId"
                                class="w-full mt-2 p-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-slate-100">
                                <option [ngValue]="null">Pilih akun sumber</option>

                                @for (user of users(); track user.id) {
                                    @if (user.role !== 'admin' && user.status === 'approved') {
                                        <option [ngValue]="user.id">
                                        {{ user.username }} - {{ user.email }}
                                        </option>
                                    }
                                }
                            </select>
                        </div>

                        <!-- Akun Tujuan -->
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Akun Tujuan
                            </label>

                            <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                                @for (user of users(); track user.id) {
                                    @if (user.role !== 'admin' && user.status === 'approved' && user.id !== selectedSourceUserId) {
                                        <label class="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100 cursor-pointer hover:bg-slate-100">
                                        <input
                                            type="checkbox"
                                            [checked]="selectedTargetUserIds.includes(user.id)"
                                            (change)="toggleTargetUser(user.id, $event)"
                                            class="w-4 h-4">

                                        <div class="min-w-0">
                                            <p class="text-sm font-bold text-slate-700 truncate">
                                            {{ user.username }}
                                            </p>
                                            <p class="text-[10px] text-slate-400 font-bold truncate">
                                            {{ user.email }}
                                            </p>
                                        </div>
                                        </label>
                                    }
                                }
                            </div>
                        </div>

                        <button
                            (click)="duplicateVendorsToUsers()"
                            [disabled]="isDuplicatingVendors"
                            class="w-full p-4 rounded-2xl bg-slate-800 text-white text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {{ isDuplicatingVendors ? 'Memproses...' : 'Duplicate Vendor' }}
                        </button>

                        @if (duplicateVendorMessage) {
                        <div class="text-center text-xs font-bold p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                            {{ duplicateVendorMessage }}
                        </div>
                        }

                    </div>
                </div>
                <!-- Duplicate Lokasi Prewed -->
                <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 mt-6">
                    <div class="p-6 border-b border-slate-100 bg-slate-50">
                        <h3 class="font-bold text-lg text-slate-700">Duplicate Lokasi Prewed</h3>
                        <p class="text-slate-500 text-xs mt-1">
                            Copy semua data lokasi prewed dari satu akun user ke akun user lainnya.
                        </p>
                    </div>

                    <div class="p-6 space-y-5">

                        <!-- Akun Sumber -->
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Akun Sumber Lokasi Prewed
                            </label>

                            <select
                                [(ngModel)]="selectedPrewedSourceUserId"
                                class="w-full mt-2 p-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-slate-100">
                                <option [ngValue]="null">Pilih akun sumber</option>

                                @for (user of users(); track user.id) {
                                    @if (user.role !== 'admin' && user.status === 'approved') {
                                        <option [ngValue]="user.id">
                                            {{ user.username }} - {{ user.email }}
                                        </option>
                                    }
                                }
                            </select>
                        </div>

                        <!-- Akun Tujuan -->
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Akun Tujuan
                            </label>

                            <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                                @for (user of users(); track user.id) {
                                    @if (user.role !== 'admin' && user.status === 'approved' && user.id !== selectedPrewedSourceUserId) {
                                        <label class="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100 cursor-pointer hover:bg-slate-100">
                                            <input
                                                type="checkbox"
                                                [checked]="selectedPrewedTargetUserIds.includes(user.id)"
                                                (change)="togglePrewedTargetUser(user.id, $event)"
                                                class="w-4 h-4">

                                            <div class="min-w-0">
                                                <p class="text-sm font-bold text-slate-700 truncate">
                                                    {{ user.username }}
                                                </p>
                                                <p class="text-[10px] text-slate-400 font-bold truncate">
                                                    {{ user.email }}
                                                </p>
                                            </div>
                                        </label>
                                    }
                                }
                            </div>
                        </div>

                        <!-- Tombol Duplicate -->
                        <button
                            (click)="duplicatePrewedToUsers()"
                            [disabled]="isDuplicatingPrewed"
                            class="w-full p-4 rounded-2xl bg-slate-800 text-white text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {{ isDuplicatingPrewed ? 'Memproses...' : 'Duplicate Lokasi Prewed' }}
                        </button>

                        <!-- Message -->
                        @if (duplicatePrewedMessage) {
                            <div class="text-center text-xs font-bold p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                                {{ duplicatePrewedMessage }}
                            </div>
                        }

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

    users = signal<any[]>([]);

    selectedSourceUserId: number | null = null;
    selectedTargetUserIds: number[] = [];
    isDuplicatingVendors = false;
    duplicateVendorMessage = '';

    selectedPrewedSourceUserId: number | null = null;
    selectedPrewedTargetUserIds: number[] = [];
    isDuplicatingPrewed = false;
    duplicatePrewedMessage = '';

    apiUrl = `${environment.apiUrl}/admin`;// Endpoint khusus admin

    ngOnInit() {
        this.loadUsers();
    }

    // Helper to get current admin's id
    get adminId(): number {
        return this.authService.currentUser()?.id;
    }

    // Header Authorization untuk request admin JWT
    getAuthHeaders() {
        const token = localStorage.getItem('token');

        return {
            Authorization: `Bearer ${token}`
        };
    }

    // Ambil data user dari backend
    loadUsers() {
        this.http.get<any[]>(`${this.apiUrl}/users`, {
            headers: this.getAuthHeaders()
        }).subscribe({
            next: (data) => this.users.set(data),
            error: (err) => {
                console.error('Gagal memuat user:', err);
                alert(err.error?.message || 'Gagal memuat data user.');
            }
        });
    }

    // Fungsi Approve (Terima Pembayaran)
    approveUser(userId: number) {
        if(!confirm('Validasi pembayaran sudah oke? Terima user ini agar bisa login?')) return;

        this.http.post(`${this.apiUrl}/approve`, { userId }, {
            headers: this.getAuthHeaders()
        }).subscribe({
            next: () => {
                alert('User berhasil disetujui!');
                this.loadUsers(); 
            },
            error: (err) => {
                console.error('Detail Error:', err);
                alert(err.error?.message || 'Gagal memproses approval.');
            }
        });
    }

    // Fungsi Reject (Hapus User)
    rejectUser(userId: number) {
        if(!confirm('Yakin ingin menolak dan menghapus user ini secara permanen?')) return;
        
        this.http.post(`${this.apiUrl}/reject`, { userId }, {
            headers: this.getAuthHeaders()
        }).subscribe({
            next: () => {
                alert('User berhasil ditolak dan dihapus.');
                this.loadUsers();
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
            this.selectedTargetUserIds = this.selectedTargetUserIds.filter(id => id !== userId);
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
            this.selectedPrewedTargetUserIds = this.selectedPrewedTargetUserIds.filter(id => id !== userId);
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
        const user = this.users().find(u => u.id === userId);

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
                this.loadUsers();
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
        if(confirm('Keluar dari Admin Dashboard?')) {
            this.authService.logout();
            this.router.navigateByUrl('/login');
        }
    }
}
