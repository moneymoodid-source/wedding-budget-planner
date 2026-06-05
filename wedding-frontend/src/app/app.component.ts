import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, inject, ChangeDetectorRef, effect, HostListener } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';

// --- IMPORT KOMPONEN & SERVICE ---
import { AuthService } from './auth.service';
import { LoginComponent } from './login/login.component';
import { AdminComponent } from './admin/admin.component';
import { HomeComponent } from './home/home.component';
import { DataService, Expense, Guest, Todo, Vendor, VendorAPIPayload, PrewedLocation, PrewedAPIPayload, Theme, VendorCategory } from './data.service';

// Payload interfaces
export interface VendorPayload {
  name: string;
  category: string;
  location?: string;
  social_link?: string;
  price: number;
  selected: boolean;
  images: string[]; // hanya fileName
  active_index?: number;
  id?: number;
  user_id?: number;
}

export interface PrewedPayload {
  name: string;
  location_name: string;
  maps_link?: string;
  note?: string;
  price: number;
  selected: boolean;
  images: string[];
  active_index: number;
  id?: number;
  user_id?: number;
}

// Hapus interface Theme lokal, kita pakai dari DataService
interface MenuItem { id: string; label: string; iconPath: string; }

@Component({
   selector: 'app-wedding-planner',
   standalone: true,
   imports: [CommonModule, FormsModule, HttpClientModule, LoginComponent, AdminComponent, HomeComponent, LottieComponent],
   providers: [DecimalPipe],
   changeDetection: ChangeDetectionStrategy.OnPush,
   template: `
      @if (!authService.currentUser()) {
         @if (publicPage() === 'home') {
            <app-home (openLogin)="publicPage.set('login')"></app-home>
         } @else {
            <app-login (backHome)="publicPage.set('home')"></app-login>
         }
      } @else if (authService.currentUser().role === 'admin') {
            <app-admin></app-admin>
      } @else if (isInitialLoading()) {
         <div class="min-h-screen flex items-center justify-center bg-white font-sans">
            <div class="text-center px-6 animate-in fade-in duration-300">
               <img 
                  src="images/mmood_orange_fix.png" 
                  alt="MoneyMood" 
                  class="h-14 w-auto mx-auto mb-4 object-contain"
               >

               <div class="w-12 h-12 mx-auto rounded-full border-4 border-slate-100 border-t-pink-500 animate-spin mb-4"></div>

               <p class="text-sm font-black text-slate-700">
                  Memuat data wedding planner...
               </p>

               <p class="text-xs font-bold text-slate-400 mt-1">
                  Sebentar ya, data kamu sedang disiapkan.
               </p>
            </div>
         </div>
      } @else {
         <div class="min-h-screen pb-32 font-sans text-slate-800 transition-colors duration-500" [style.backgroundColor]="currentTheme().bg">
            <header 
            class="relative overflow-hidden pt-8 pb-20 px-6 rounded-b-[3rem] shadow-2xl transition-all duration-500 group"
            [style.background]="headerBackgroundStyle()"
            (dragover)="onImageDragOver($event)"
            (dragleave)="onImageDragLeave($event)"
            (drop)="uploadDroppedHeaderImage($event)">
               @if (headerImage() && isHeaderImageEditMode()) {
                  <div class="absolute inset-0 z-[65] overflow-hidden"
                     (pointerdown)="startHeaderImageDrag($event)"
                     (pointermove)="onHeaderImageDrag($event)"
                     (pointerup)="endHeaderImageDrag()"
                     (pointercancel)="endHeaderImageDrag()"
                     (pointerleave)="endHeaderImageDrag()">
                     <img
                        [src]="buildUploadsUrl(headerImage()!)"
                        alt="Header preview"
                        class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-transform duration-150"
                        [style.object-position]="headerImageObjectPosition()"
                        draggable="false"
                     >
                     <div class="absolute inset-0 pointer-events-none header-grid-overlay transition-opacity duration-300 ease-out"
                        [class.opacity-100]="isHeaderImageDragging()"
                        [class.opacity-0]="!isHeaderImageDragging()">
                     </div>
                     <div class="absolute inset-[10px] md:inset-[14px] rounded-[2.25rem] pointer-events-none transition-all duration-300 ease-out"
                        [class.border-4]="isHeaderImageDragging()"
                        [class.border-2]="!isHeaderImageDragging()"
                        [class.border-white/95]="isHeaderImageDragging()"
                        [class.border-white/35]="!isHeaderImageDragging()"
                        [class.shadow-[inset_0_0_0_9999px_rgba(15,23,42,0.03),0_0_0_1px_rgba(255,255,255,0.15),0_0_28px_rgba(255,255,255,0.12)]]="isHeaderImageDragging()">
                     </div>
                     <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/35 pointer-events-none transition-opacity duration-150"
                        [class.opacity-100]="isHeaderImageDragging()"
                        [class.opacity-0]="!isHeaderImageDragging()">
                     </div>
                     <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/35 pointer-events-none transition-opacity duration-150"
                        [class.opacity-100]="isHeaderImageDragging()"
                        [class.opacity-0]="!isHeaderImageDragging()">
                     </div>
                     <div class="absolute inset-0 bg-black/10 pointer-events-none transition-opacity duration-150"
                        [class.opacity-30]="isHeaderImageDragging()"
                        [class.opacity-10]="!isHeaderImageDragging()">
                     </div>
                     <div class="absolute top-5 left-1/2 -translate-x-1/2 z-[66] rounded-full bg-black/35 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] text-white font-bold shadow-lg transition-all duration-300 ease-out"
                        [class.opacity-100]="isHeaderImageEditMode()"
                        [class.translate-y-0]="isHeaderImageEditMode()"
                        [class.opacity-0]="!isHeaderImageEditMode()"
                        [class.-translate-y-1]="!isHeaderImageEditMode()"
                        [class.scale-105]="isHeaderImageDragging()">
                        {{ isHeaderImageDragging() ? 'Lepas untuk simpan posisi' : 'Drag foto untuk atur posisi' }}
                     </div>
                      <button
                         type="button"
                         class="absolute bottom-5 left-1/2 -translate-x-1/2 z-[66] px-3 py-1.5 rounded-full bg-emerald-500/85 hover:bg-emerald-500 text-white border border-emerald-300/70 transition-all duration-300 ease-out shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] backdrop-blur-md"
                         (pointerdown)="$event.stopPropagation()"
                         (click)="$event.stopPropagation(); saveHeaderImageEditMode()">
                        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                           <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                        Simpan
                     </button>
                  </div>
               }

               <div class="absolute inset-0 z-0 transition-all duration-500 pointer-events-none" 
                  *ngIf="headerImage()"
                  [style.backgroundColor]="currentTheme().color"
                  style="opacity: 0.65; mix-blend-mode: multiply;">
               </div>
               <div class="absolute inset-0 z-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" *ngIf="headerImage()"></div>

                <button 
                   *ngIf="!isHeaderImageEditMode()"
                   (pointerdown)="$event.stopPropagation()"
                   (click)="logout()" 
                   class="absolute top-5 right-5 z-[70] bg-red-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold shadow-lg hover:bg-red-600 transition-all active:scale-95 flex items-center gap-1 md:gap-2">
                  <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 md:w-4 md:h-4 fill-none stroke-current" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5"></path><path d="M15 12H3"></path><path d="M21 5v14"></path></svg>
                  <span class="hidden sm:inline">Keluar</span>
               </button>

               
               <div class="absolute top-5 left-5 z-[60] flex items-center gap-2 md:gap-3">
               <label 
                  class="w-8 h-8 md:w-9 md:h-9 cursor-pointer bg-white/24 backdrop-blur-md rounded-full border border-white/30 hover:bg-white/36 transition-all duration-300 ease-out shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" class="w-4 h-4 md:w-5 md:h-5 fill-none stroke-current" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"></path><circle cx="12" cy="13" r="3.5"></circle></svg>

                  <input 
                     #headerImageInput
                     type="file" 
                     class="hidden" 
                     (change)="onHeaderImageSelected($event)" 
                     accept="image/*"
                  />
               </label>

               <button 
                  *ngIf="headerImage()" 
                  (pointerdown)="$event.stopPropagation()"
                  (click)="$event.stopPropagation(); toggleHeaderImageEditMode()" 
                  class="w-8 h-8 md:w-9 md:h-9 bg-white/24 backdrop-blur-md text-white rounded-full border border-white/30 hover:bg-white/36 transition-all duration-300 ease-out shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center"
                  [class.ring-2]="isHeaderImageEditMode()"
                  [class.ring-white]="isHeaderImageEditMode()"
                  [attr.aria-label]="isHeaderImageEditMode() ? 'Close header image edit mode' : 'Edit header image'">
                  <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 md:w-4 md:h-4 fill-none stroke-current" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                     <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L16.5 4a2.1 2.1 0 0 0-3 0L3 14.5V20h1z"></path>
                     <path d="M13.5 6.5l4 4"></path>
                  </svg>
               </button>

               <button
                  *ngIf="headerImage() && isHeaderImageEditMode()"
                  (pointerdown)="$event.stopPropagation()"
                  (click)="$event.stopPropagation(); toggleHeaderImageEditMode()"
                  class="px-2.5 h-8 md:h-9 rounded-full bg-emerald-500/85 text-white border border-emerald-300/70 hover:bg-emerald-500 transition-all duration-300 ease-out shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1 text-[10px] md:text-[11px] font-black uppercase tracking-[0.12em] backdrop-blur-md">
                  <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                     <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  <span>Done</span>
               </button>

               <button 
                  *ngIf="headerImage()" 
                  (pointerdown)="$event.stopPropagation()"
                  (click)="removeHeaderImage(headerImageInput)" 
                  class="w-8 h-8 md:w-9 md:h-9 bg-red-500/90 text-white rounded-full border border-red-300/70 hover:bg-red-500 transition-all duration-300 ease-out shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-md">
                  <span class="text-sm font-black leading-none">×</span>
               </button>
               </div>

               <div class="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto text-center text-white relative z-10 mt-16 md:mt-6">
                  <p class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                     Hi, {{ authService.currentUser()?.username }}
                  </p>
                  <div class="flex flex-col items-center justify-center gap-5 w-full z-10 relative">
                     <div class="inline-flex flex-col items-center justify-center px-6 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-sm text-center transition-transform hover:scale-105 cursor-pointer">
                        <span class="text-[11px] font-bold uppercase tracking-[0.25em] text-white/95">Wedding Planner</span>
                        
                        <div class="flex items-center">
                           <span class="text-[12px] text-white/80 font-medium">by</span>
                           <img src="images/mmood_white_fix.png" alt="Moneymood" class="h-8 w-auto object-contain">
                        </div>
                     </div>
                     <div class="group/title relative inline-block text-center mb-10">
                        @if (!isEditingTitle()) {
                           <h1 (click)="startEditTitle()" class="text-4xl md:text-6xl font-serif font-black not-italic tracking-[-0.03em] drop-shadow-md px-4 leading-[0.98] transition-all text-white cursor-pointer">{{ weddingTitle() }}</h1>
                           
                           <span (click)="startEditTitle()" class="absolute -right-6 top-0 text-sm opacity-0 group-hover/title:opacity-100 transition-opacity bg-white/20 rounded-full p-1.5 backdrop-blur-sm hover:bg-white/40 cursor-pointer">✎</span>
                        } @else {
                           <input [(ngModel)]="tempTitle" (blur)="saveTitle()" (keyup.enter)="saveTitle()" class="bg-white/10 border-b-2 border-white/50 text-white text-3xl md:text-6xl font-serif font-black not-italic tracking-[-0.03em] text-center focus:outline-none w-full min-w-[300px] py-1 shadow-inner rounded-lg px-2 backdrop-blur-sm" autoFocus>
                        }
                     </div>
                  </div>
               </div>
            </header>

            <main 
               class="w-full mx-auto px-3 md:px-4 -mt-16 relative z-20 transition-all duration-300"
               [ngClass]="
                  activeTab() === 'expenses' || activeTab() === 'guests' || activeTab() === 'todos' || activeTab() === 'vendors' || activeTab() === 'prewed'
                     ? 'max-w-[1400px]'
                     : 'max-w-md md:max-w-4xl lg:max-w-6xl'
            ">
               <!-- DASHBOARD -->
               @if (activeTab() === 'summary') {
                  <div class="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                     <div class="bg-white p-5 rounded-[2rem] shadow-xl border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
   
                        <!-- Judul Dashboard -->
                        <div class="text-center xl:text-left shrink-0">
                           <h2 class="text-2xl font-serif font-black not-italic tracking-tight text-slate-800">
                              Wedding Dashboard
                           </h2>
                           <p class="text-slate-400 text-xs font-medium">
                              Pantau persiapan pernikahanmu.
                           </p>
                        </div>

                        <!-- Controls -->
                        <div class="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-end gap-3">
                           
                           <!-- Tanggal Acara -->
                           <div 
                              class="relative flex items-center justify-center gap-2.5 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-slate-100 cursor-pointer w-full lg:w-auto min-w-[220px] text-center"
                              (click)="openDatePicker(datePicker)"
                           >
                              <span class="w-[2.125rem] h-[2.125rem] inline-flex items-center justify-center shrink-0 translate-y-[1px]">
                                 <ng-lottie
                                    [options]="calendarIconOptions"
                                    width="34px"
                                    height="34px">
                                 </ng-lottie>
                              </span>

                              <div class="text-center">
                                 <p class="text-[8px] font-black text-slate-400 uppercase tracking-[0.14em] leading-none">
                                    Tanggal Acara
                                 </p>
 
                                 <div class="flex items-center justify-center gap-1.5 mt-1">
                                    <span class="font-bold text-slate-700 text-xs md:text-sm leading-none whitespace-nowrap">
                                       {{ formatDisplayDateLong(weddingDate()) }}
                                    </span>

                                    <svg viewBox="0 0 24 24" class="w-3 h-3 text-slate-400 shrink-0 translate-y-[1px]" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                       <path d="m6 9 6 6 6-6"></path>
                                    </svg>
                                 </div>
                              </div>

                              <input 
                                 #datePicker
                                 type="date" 
                                 [ngModel]="weddingDate()" 
                                 (ngModelChange)="saveDate($event)" 
                                 class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              >
                           </div>

                           <!-- Theme Selector -->
                           <div class="flex items-center justify-center gap-2.5 bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 shadow-sm w-full sm:w-auto min-h-[56px]">
                              <span class="text-[8px] font-black text-slate-400 uppercase tracking-[0.14em] whitespace-nowrap leading-none">
                                  Tema
                              </span>

                              @for (theme of themes(); track theme.id) {
                                 <button 
                                    (click)="selectTheme(theme.id)"
                                    class="w-5 h-5 md:w-[1.35rem] md:h-[1.35rem] rounded-full border-2 border-white transition-all duration-300 hover:scale-125 focus:outline-none relative shadow-sm cursor-pointer ring-offset-2 ring-offset-white shrink-0"
                                    [class.ring-2]="selectedThemeId() === theme.id"
                                    [style.backgroundColor]="theme.color"
                                    [title]="theme.name">
                                 </button>
                              }
                           </div>

                        </div>
                     </div>

                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                           <div class="bg-white min-h-[112px] px-5 py-4.5 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col justify-center items-center text-center text-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300" [style.backgroundColor]="currentTheme().color">
                              <span class="text-[9px] font-black opacity-80 uppercase tracking-[0.14em] mb-1 relative z-10 leading-none">Sisa Budget</span>
                              <span class="text-lg md:text-xl font-black leading-none relative z-10">Rp {{ remainingBudget() | number:'1.0-0' }}</span>
                           </div>
                           <div class="bg-white min-h-[112px] px-5 py-4.5 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col justify-center items-center text-center group hover:-translate-y-1 transition-transform duration-300">
                              <span class="text-3xl font-black text-slate-800 mb-1 leading-none group-hover:scale-110 transition-transform">{{ getDaysLeft() }}</span>
                              <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.14em] leading-none">Hari Lagi</span>
                           </div>
                           <div class="bg-white min-h-[112px] px-5 py-4.5 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col justify-center items-center text-center group hover:-translate-y-1 transition-transform duration-300">
                              <span class="text-2xl font-black text-slate-800 leading-none">{{ getTotalGuestPax() }}</span>
                              <span class="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-[0.14em] leading-none">Total Tamu</span>
                           </div>
                           <div class="bg-white min-h-[112px] px-5 py-4.5 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col justify-center items-center text-center relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300" (click)="activeTab.set('todos')">
                              <div class="absolute bottom-0 left-0 right-0 bg-green-100/50 transition-all duration-1000" [style.height.%]="getTodoPercentage()"></div>
                              <div class="relative z-10">
                                 <span class="text-2xl font-black text-slate-800 leading-none">{{ getPendingTodosCount() }}</span>
                                 <span class="text-[9px] font-black text-slate-400 uppercase block mt-1 tracking-[0.14em] leading-none">Tugas Pending</span>
                              </div>
                           </div>
                     </div>

                     <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-2 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 relative overflow-hidden group/budget">
                           <div class="flex justify-between items-start mb-6">
                              <div>
                                 <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <span class="w-8 h-8 inline-flex items-center justify-center shrink-0">
                                       <ng-lottie
                                          [options]="budgetIconOptions"
                                          width="50px"
                                          height="50px">
                                       </ng-lottie>
                                    </span>
                                    Anggaran
                                 </h3>
                              </div>
                              <button (click)="enableBudgetEdit()" class="px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-wide hover:bg-slate-100 transition-colors border border-slate-100">✎ Edit Budget</button>
                           </div>
                           <div class="mb-8 text-center py-4 bg-slate-50/50 rounded-3xl border border-slate-50/50">
                              <span class="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Total Budget</span>
                              @if (isEditingBudget()) {
                                 <input #budgetInput type="number" [ngModel]="totalBudget()" (ngModelChange)="saveBudget($event)" (blur)="isEditingBudget.set(false)" (keyup.enter)="isEditingBudget.set(false)" class="text-3xl font-black text-center bg-white border-2 border-slate-200 rounded-xl p-2 w-full max-w-[250px] focus:ring-2 focus:ring-slate-300 outline-none text-slate-800">
                              } @else {
                                 <span class="text-3xl md:text-5xl font-black text-slate-800 cursor-pointer hover:opacity-70 transition-opacity" (click)="enableBudgetEdit()">Rp {{ totalBudget() | number:'1.0-0' }}</span>
                              }
                           </div>
                           <div class="relative h-6 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner">
                              <div class="absolute top-0 left-0 h-full transition-all duration-1000 rounded-full flex items-center justify-end pr-2" [style.width.%]="getCompletionPercentage()" [style.backgroundColor]="currentTheme().color">
                                 <span class="text-[9px] font-black text-white drop-shadow-md" *ngIf="getCompletionPercentage() > 10">{{ getCompletionPercentage() | number:'1.0-0' }}%</span>  
                              </div>
                           </div>
                           <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center pb-6">
                              <div class="p-3 rounded-2xl bg-red-50 text-red-600 border border-red-100"><span class="block text-[9px] font-black uppercase opacity-70 mb-1">Terpakai</span><span class="block text-sm sm:text-[15px] md:text-base font-black truncate">Rp {{ totalExpense() | number:'1.0-0' }}</span></div>
                              <div class="p-3 rounded-2xl bg-green-50 text-green-600 border border-green-100"><span class="block text-[9px] font-black uppercase opacity-70 mb-1">Sisa Budget</span><span class="block text-sm sm:text-[15px] md:text-base font-black truncate">Rp {{ remainingBudget() | number:'1.0-0' }}</span></div>
                              <div class="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100"><span class="block text-[9px] font-black uppercase opacity-70 mb-1">Jml. Transaksi</span><span class="block text-sm sm:text-[15px] md:text-base font-black truncate">{{ expenses().length }}</span></div>
                           </div>
                           @if (highestCategory(); as high) {
                              <div class="mb-6 p-4 rounded-2xl border border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white shadow-sm">
                                 <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm text-white" [style.backgroundColor]="currentTheme().color">
                                       <ng-lottie
                                          [options]="walletIconOptions"
                                          width="50px"
                                          height="50px">
                                       </ng-lottie>
                                    </div>
                                    <div>
                                       <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pengeluaran Tertinggi</p>
                                       <p class="text-sm font-bold text-slate-800">{{ high.name }}</p>
                                    </div>
                                 </div>
                                 <div class="text-right">
                                    <p class="text-sm font-black text-slate-00">Rp {{ high.amount | number:'1.0-0' }}</p>
                                    <p class="text-[11px] font-bold" [style.color]="currentTheme().color">{{ high.percentage | number:'1.0-1' }}% dari Budget</p>
                                 </div>
                              </div>
                           }
                        </div>
                        

                        <div class="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col h-full">
                           <h3 class="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                              <span>
                                 <ng-lottie
                                    [options]="notifIconOptions"
                                    width="50px"
                                    height="50px">
                                 </ng-lottie>
                              </span> 
                              Perlu Perhatian
                           </h3>
                           <div class="space-y-3 flex-1">
                              @if (getUnpaidCount() > 0) {
                                 <div class="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 items-center cursor-pointer hover:bg-amber-100 transition-colors" (click)="activeTab.set('expenses'); filterExpenseStatus.set('Belum')">
                                    <div class="w-10 h-10 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center font-bold text-lg shadow-sm">!</div>
                                    <div><p class="font-bold text-amber-900 text-sm">{{ getUnpaidCount() }} Tagihan Belum Lunas</p><p class="text-[10px] text-amber-700 font-bold uppercase tracking-wide opacity-70">Segera Cek</p></div>
                                 </div>
                              } @else {
                                 <div class="p-4 rounded-2xl bg-green-50 border border-green-100 flex gap-3 items-center">
                                    <div class="w-10 h-10 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-lg shadow-sm">✓</div>
                                    <div><p class="font-bold text-green-900 text-sm">Keuangan Aman</p><p class="text-[10px] text-green-700 font-bold uppercase tracking-wide opacity-70">Good Job!</p></div>
                                 </div>
                              }
                              <div class="mt-auto pt-8 border-t border-slate-100">
                                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Catat Tugas Cepat</p>
                                 <div class="flex gap-2 relative group/input">
                                    <input #quickTodo (keyup.enter)="addTodo(quickTodo.value); quickTodo.value=''" class="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-slate-200 outline-none transition-all focus:bg-white" placeholder="To-do list ...">
                                    <button (click)="addTodo(quickTodo.value); quickTodo.value=''" class="w-10 h-10 rounded-2xl bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg active:scale-95">+</button>
                                  </div>
                                  <div class="relative mt-2 min-h-6">
                                     @if (quickTodoSuccessMessage()) {
                                        <p class="absolute left-0 right-0 px-1 text-[11px] font-bold text-green-600 transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-1" [class.opacity-0]="quickTodoSuccessFading()" [class.translate-y-1]="quickTodoSuccessFading()">
                                           {{ quickTodoSuccessMessage() }}
                                        </p>
                                     }
                                  </div>
                                  <div class="mt-2 lg:mt-8 rounded-[1.35rem] bg-slate-50 border border-slate-100 p-3.5 sm:p-4">
                                     <div class="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4">
                                        <div class="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 self-center sm:self-start">
                                           <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
                                              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" stroke-width="3.5" class="text-slate-200"></circle>
                                              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" [attr.stroke-dasharray]="todoProgressPercentage() + ' 100'" class="text-green-500 transition-all duration-500 ease-out"></circle>
                                           </svg>
                                           <div class="absolute inset-0 flex items-center justify-center">
                                               <span class="text-[13px] sm:text-sm font-black text-slate-700 leading-none">{{ todoProgressPercentage() }}%</span>
                                           </div>
                                        </div>

                                        <div class="min-w-0 flex-1 text-center sm:text-left">
                                           <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.14em]">Progress To-do</p>
                                           <p class="mt-1 text-sm font-black text-slate-800 leading-tight">
                                              {{ completedTodosCount() }} selesai dari {{ todos().length }} tugas
                                           </p>
                                           <div class="mt-2.5 flex flex-wrap justify-center sm:justify-start gap-1.5">
                                              <span class="px-2.5 py-1 rounded-full bg-white border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-[0.12em]">
                                                 Sisa {{ getPendingTodosCount() }}
                                              </span>
                                              <span class="px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-[9px] font-black text-green-700 uppercase tracking-[0.12em]">
                                                 Selesai {{ completedTodosCount() }}
                                              </span>
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                                </div>
                            
                            </div>
                        </div>
                     </div>

                     <div class="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 mt-6 relative overflow-hidden">
                        <div class="flex items-center justify-between mb-4">
                           <div class="flex items-center gap-2">
                              <span class="text-2xl">
                                 <ng-lottie
                                    [options]="checklistIconOptions"
                                    width="40px"
                                    height="40px">
                                 </ng-lottie>
                              </span>
                              <h3 class="text-lg font-bold text-slate-800">Checklist Utama</h3>
                           </div>
                           <span class="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                              Checklist mengikuti kategori utama yang kamu pilih di menu 
                              <b [style.color]="currentTheme().color">Vendor</b>
                           </span>
                        </div>
                        @if (vendorCategories().length === 0) {
                           <div class="bg-amber-50 border border-amber-100 rounded-3xl p-5 text-center">
                              <p class="text-sm font-black text-amber-700 mb-1">
                                 Kategori vendor belum tersedia
                              </p>
                              <p class="text-xs font-bold text-amber-500 leading-relaxed">
                                 Tambahkan kategori vendor terlebih dahulu di menu Vendor, atau request ke Admin untuk ditambahkan data Vendor.
                              </p>
                           </div>
                        } @else if (mainChecklistCount() === 0) {
                           <div class="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-center">
                              <p class="text-sm font-black text-slate-700 mb-1">
                                 Checklist Utama belum dipilih
                              </p>
                              <p class="text-xs font-bold text-slate-400 leading-relaxed">
                                 Pilih maksimal 5 kategori vendor di menu Vendor untuk ditampilkan di Checklist Utama.
                              </p>
                           </div>
                        } @else {
                           <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                              @for (item of vendorCompleteness(); track item.category) {
                                 <div class="flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300"
                                       [class.bg-green-50]="item.fulfilled" 
                                       [class.border-green-200]="item.fulfilled"
                                       [class.bg-slate-50]="!item.fulfilled" 
                                       [class.border-slate-100]="!item.fulfilled">
                                    
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm mb-2 shadow-sm transition-colors"
                                          [class.bg-green-500]="item.fulfilled" 
                                          [class.text-white]="item.fulfilled"
                                          [class.bg-white]="!item.fulfilled" 
                                          [class.text-slate-300]="!item.fulfilled">
                                       {{ item.fulfilled ? '✓' : '?' }}
                                    </div>
                                    
                                    <span class="text-[10px] font-bold uppercase tracking-wide text-center"
                                          [class.text-green-700]="item.fulfilled"
                                          [class.text-slate-400]="!item.fulfilled">
                                       {{ item.category }}
                                    </span>
                                 </div>
                              }
                           </div>
                        }
                        
                        @if (isAllVendorsComplete()) {
                           <div class="mt-4 bg-green-100 text-green-800 text-xs font-bold p-3 rounded-xl text-center flex items-center justify-center gap-2 animate-in zoom-in">
                              <span>🎉</span> Vendor utama sudah lengkap semua!
                           </div>
                        }
                     </div>

                     @if (getSelectedPrewedLocations().length > 0 || getSelectedVendors().length > 0) {
                        <div class="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 mt-6 animate-in slide-in-from-bottom-2">
                           <div class="flex justify-between items-center mb-4">
                              <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                                 <ng-lottie
                                    [options]="favoriteIconOptions"
                                    width="70px"
                                    height="70px">
                                 </ng-lottie>
                                 Pilihan Saya
                              </h3>
                              <div class="text-right">
                                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Total</p>
                                 <p class="text-sm font-black" [style.color]="currentTheme().color">Rp {{ getTotalSelectedCost() | number:'1.0-0' }}</p>
                              </div>
                           </div>
                           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              @for (loc of getSelectedPrewedLocations(); track loc.id) {
                                 <div class="relative bg-slate-50 rounded-3xl p-3 flex gap-3 items-center border border-slate-200 overflow-hidden group">
                                    <div class="w-16 h-16 rounded-2xl bg-slate-200 overflow-hidden shrink-0">
                                       @if (loc.images.length > 0) { <img [src]="loc.images[0]?.url" class="w-full h-full object-cover" [title]="loc.images[0]?.originalName"> } @else { <div class="w-full h-full flex items-center justify-center text-xs">No Img</div> }
                                    </div>
                                    <div class="flex-1 min-w-0">
                                       <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Lokasi Prewed</p>
                                       <p class="font-bold text-slate-800 text-sm truncate">{{ loc.name }}</p>
                                       <p class="text-xs font-bold text-slate-500">Rp {{ loc.price | number:'1.0-0' }}</p>
                                    </div>
                                    <button (click)="togglePrewedSelection(loc.id!)" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs hover:bg-red-200 transition-colors">×</button>
                                 </div>
                              }
                              @for (vendor of getSelectedVendors(); track vendor.id) {
                                 <div class="relative bg-slate-50 rounded-3xl p-3 flex gap-3 items-center border border-slate-200 overflow-hidden group">
                                    <div class="w-16 h-16 rounded-2xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xl">
                                       
                                       @if (vendor.images && vendor.images.length > 0) { 
                                          <img [src]="vendor.images[0]?.url" class="w-full h-full object-cover" [title]="vendor.images[0]?.originalName"> 
                                       } @else { 
                                          <span>🏪</span> 
                                       }

                                    </div>
                                    <div class="flex-1 min-w-0">
                                       <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{{ vendor.category }}</p>
                                       <p class="font-bold text-slate-800 text-sm truncate">{{ vendor.name }}</p>
                                       <p class="text-xs font-bold text-slate-500">Rp {{ vendor.price | number:'1.0-0' }}</p>
                                    </div>
                                    <button (click)="toggleVendorSelection(vendor.id!)" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs hover:bg-red-200 transition-colors">×</button>
                                 </div>
                              }
                           </div>
                        </div>
                     }
               </div>
               }

               @if (activeTab() === 'expenses') {
                  <div class="animate-in slide-in-from-bottom-4 duration-500">
                     <div class="flex flex-col md:grid md:grid-cols-12 md:gap-8 items-start">
                        <div class="w-full md:col-span-5 lg:col-span-4 space-y-6 md:sticky md:top-8 z-30">
                           <div id="expenseForm" class="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 relative transition-all duration-300"
                              [class.ring-2]="editingExpenseId() !== null" [class.ring-offset-2]="editingExpenseId() !== null"
                              [style.borderColor]="editingExpenseId() !== null ? currentTheme().color : ''">
                              <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                 <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 
                                 {{ editingExpenseId() ? 'Edit Pengeluaran' : 'Catat Pengeluaran' }}
                              </h3>
                           
                              <div class="space-y-3">
                                 <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                    <div class="lg:col-span-3">
                                       <input [(ngModel)]="newExpense.item" placeholder="Detail Pengeluaran (Cth: Sewa MUA Resepsi)" class="w-full p-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-100 transition-all focus:bg-white">
                                    </div>
                                    <div class="lg:col-span-3">
                                       <input [(ngModel)]="newExpense.date" type="date" class="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none focus:bg-white text-slate-500">
                                    </div>
                                 </div>
                              
                                 <div class="flex gap-2 items-center">
                                    <select 
                                       [(ngModel)]="newExpense.category" 
                                       class="flex-1 p-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:bg-white cursor-pointer"
                                       [class.text-slate-400]="!newExpense.category"
                                       [class.text-slate-700]="newExpense.category">
                                       
                                       <option value="" disabled>
                                          Pilih Kategori Pengeluaran
                                       </option>

                                       @for (cat of expenseCategories(); track cat) {
                                          <option [value]="cat">{{ cat }}</option>
                                       }
                                    </select>
                                     <button (click)="manageCategories()" class="aspect-square shrink-0 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200 transition-colors shadow-sm" aria-label="Kelola Kategori">
                                        <svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                           <circle cx="12" cy="12" r="3"></circle>
                                           <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9A1.7 1.7 0 0 0 10 3.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>
                                        </svg>
                                     </button>
                                 </div>
                                 
                                 <div class="grid grid-cols-2 gap-3">
                                    <div class="relative col-span-2 lg:col-span-1">
                                       <span class="absolute left-3 top-3.5 text-xs font-bold text-slate-400">Rp</span>

                                       <input 
                                          [(ngModel)]="newExpense.amount"
                                          name="expenseAmount"
                                          type="number"
                                          min="0"
                                          placeholder="0"
                                          (focus)="selectAllAmount($event)"
                                          class="w-full p-3 pl-8 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-100 transition-all focus:bg-white"
                                       >
                                    </div>
                                    <select [(ngModel)]="newExpense.status" class="w-full col-span-2 lg:col-span-1 p-3 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:bg-white cursor-pointer"
                                       [class.text-red-500]="newExpense.status === 'Belum'"
                                       [class.text-amber-500]="newExpense.status === 'DP'"
                                       [class.text-green-600]="newExpense.status === 'Lunas'">
                                       <option value="Belum">⏳ Belum</option>
                                       <option value="DP">📝 DP</option>
                                       <option value="Lunas">✅ Lunas</option>
                                    </select>
                                 </div>
                              
                                 <textarea [(ngModel)]="newExpense.note" placeholder="Keterangan (Vendor/Link)" rows="2" class="w-full p-3 bg-slate-50 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-100 transition-all focus:bg-white resize-none"></textarea>
                                 
                                 <div class="flex gap-2 pt-2">
                                    @if (editingExpenseId()) {
                                       <button (click)="cancelEditExpense()" class="flex-1 bg-slate-100 text-slate-500 p-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Batal</button>
                                    }
                                    <button (click)="saveExpense()" class="flex-[2] text-white p-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:brightness-110"
                                          [style.backgroundColor]="currentTheme().color">
                                       {{ editingExpenseId() ? 'Update' : 'Simpan' }}
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div class="w-full md:col-span-7 lg:col-span-8 space-y-4 pb-24 mt-6 md:mt-0">
                           @if (showCategoryManager()) {
                              <div class="bg-slate-50 p-4 rounded-[2rem] border border-slate-200 animate-in zoom-in-95 mb-4">
                                 <h4 class="text-xs font-black text-slate-500 uppercase mb-3">Kelola Kategori</h4>
                                 <div class="flex flex-wrap gap-2 mb-3">
                                    @for (cat of expenseCategories(); track cat) {
                                       <div class="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-100 flex items-center gap-2">
                                          {{ cat }}
                                          <button (click)="deleteCategory(cat)" class="text-red-400 hover:text-red-600">×</button>
                                       </div>
                                    }
                                 </div>
                                 <div class="flex gap-2">
                                    <input #newCatInput placeholder="Kategori Baru..." class="flex-1 p-2 rounded-xl text-xs border border-slate-200 outline-none">
                                    <button (click)="addCategory(newCatInput.value); newCatInput.value=''" class="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Tambah</button>
                                    <button (click)="showCategoryManager.set(false)" class="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-bold">Tutup</button>
                                 </div>
                              </div>
                           }
                           <div class="flex flex-col gap-2 bg-white/50 p-3 rounded-3xl border border-white/60 shadow-sm backdrop-blur-sm">
                              <!-- Status Filter + Search -->
                              <div class="flex flex-col lg:flex-row gap-2">
                                 <div class="flex gap-2 overflow-x-auto pb-1 custom-scrollbar flex-1">
                                    <button 
                                       (click)="filterExpenseStatus.set('ALL'); resetExpensePage()" 
                                       class="px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm border border-slate-100 whitespace-nowrap" 
                                       [style.backgroundColor]="filterExpenseStatus() === 'ALL' ? currentTheme().color : 'white'" 
                                       [style.color]="filterExpenseStatus() === 'ALL' ? 'white' : '#64748b'">
                                       Semua Status
                                    </button>

                                    <button 
                                       (click)="filterExpenseStatus.set('Lunas'); resetExpensePage()" 
                                       class="px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm border border-slate-100 whitespace-nowrap" 
                                       [style.backgroundColor]="isFilterActive('Lunas') ? currentTheme().color : 'white'" 
                                       [style.color]="isFilterActive('Lunas') ? 'white' : '#64748b'">
                                       Lunas
                                    </button>

                                    <button 
                                       (click)="filterExpenseStatus.set('DP'); resetExpensePage()" 
                                       class="px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm border border-slate-100 whitespace-nowrap" 
                                       [style.backgroundColor]="isFilterActive('DP') ? currentTheme().color : 'white'" 
                                       [style.color]="isFilterActive('DP') ? 'white' : '#64748b'">
                                       DP
                                    </button>

                                    <button 
                                       (click)="filterExpenseStatus.set('Belum'); resetExpensePage()" 
                                       class="px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm border border-slate-100 whitespace-nowrap" 
                                       [style.backgroundColor]="isFilterActive('Belum') ? currentTheme().color : 'white'" 
                                       [style.color]="isFilterActive('Belum') ? 'white' : '#64748b'">
                                       Belum
                                    </button>
                                 </div>

                                 <!-- Compact Search -->
                                 <div class="relative w-full lg:w-64">
                                    <input
                                       [ngModel]="expenseSearch()"
                                       (ngModelChange)="expenseSearch.set($event); resetExpensePage()"
                                       placeholder="Search detail pengeluaran..."
                                       class="w-full h-[34px] pl-3 pr-9 bg-white rounded-xl border border-slate-100 text-[11px] font-bold outline-none focus:ring-2 focus:ring-slate-200 shadow-sm text-slate-700"
                                    >

                                    @if (expenseSearch()) {
                                       <button
                                          type="button"
                                          (click)="expenseSearch.set(''); resetExpensePage()"
                                          class="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors font-bold text-xs">
                                          ×
                                       </button>
                                    }
                                 </div>
                              </div>

                              <!-- Kategori Filter tetap di bawah -->
                              <div class="flex flex-wrap gap-2 pb-1">
                                 <button 
                                    (click)="filterExpenseCategory.set('ALL'); resetExpensePage()" 
                                    class="px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm border border-slate-100 whitespace-nowrap" 
                                    [style.backgroundColor]="filterExpenseCategory() === 'ALL' ? currentTheme().color : 'white'" 
                                    [style.color]="filterExpenseCategory() === 'ALL' ? 'white' : '#64748b'">
                                    Semua
                                 </button>

                                 @for (cat of expenseCategories(); track cat) {
                                    <button 
                                       (click)="filterExpenseCategory.set(cat); resetExpensePage()" 
                                       class="px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm border border-slate-100 whitespace-nowrap" 
                                       [style.backgroundColor]="filterExpenseCategory() === cat ? currentTheme().color : 'white'" 
                                       [style.color]="filterExpenseCategory() === cat ? 'white' : '#64748b'">
                                       {{ cat }}
                                    </button>
                                 }
                              </div>
                           </div>

                           <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              @for (exp of paginatedExpenses(); track exp.id) {
                                 <div 
                                    class="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex gap-3 items-start group transition-all hover:shadow-md hover:-translate-y-1 relative"
                                    [class.ring-4]="editingExpenseId() === exp.id"
                                    [class.ring-offset-4]="editingExpenseId() === exp.id"
                                    [class.bg-pink-50]="editingExpenseId() === exp.id"
                                    [style.borderColor]="editingExpenseId() === exp.id ? currentTheme().color : ''"
                                    [style.boxShadow]="editingExpenseId() === exp.id ? '0 0 0 4px rgba(169, 169, 169, 0.2)' : ''"
                                 >
                                    <div class="pt-1">
                                       <input type="checkbox" [checked]="exp.status === 'Lunas'" disabled class="w-5 h-5 rounded-lg border-2 border-slate-200 text-green-500 focus:ring-0 cursor-not-allowed opacity-50 checked:opacity-100">
                                    </div>
                                    <div class="flex-1 min-w-0">
                                       <div class="flex justify-between items-start gap-2">
                                          <div class="min-w-0">
                                             <p class="font-bold text-slate-800 text-sm leading-tight truncate" [class.line-through]="exp.status === 'Lunas'" [class.opacity-50]="exp.status === 'Lunas'" title="{{exp.item}}">{{ exp.item }}</p>
                                             <div class="flex flex-wrap items-center gap-1 mt-0.5">
                                                <span class="text-[9px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap" [ngClass]="getCategoryColorClass(exp.category)">{{ exp.category }}</span>
                                                <span class="text-[10px] text-slate-400 font-bold whitespace-nowrap">• {{ exp.date | date:'dd MMM' }}</span>
                                             </div>
                                          </div>
                                          <div class="text-right shrink-0">
                                             <p class="font-black text-slate-700 text-sm">Rp {{ exp.amount | number:'1.0-0' }}</p>
                                             <span class="text-[9px] font-bold px-2 py-0.5 rounded-lg inline-block mt-1" 
                                                   [class.bg-red-50]="exp.status === 'Belum'" [class.text-red-500]="exp.status === 'Belum'" 
                                                   [class.bg-amber-50]="exp.status === 'DP'" [class.text-amber-600]="exp.status === 'DP'" 
                                                   [class.bg-green-50]="exp.status === 'Lunas'" [class.text-green-600]="exp.status === 'Lunas'">
                                                {{ exp.status }}
                                             </span>
                                          </div>
                                       </div>
                                       @if (exp.note) {
                                          <div class="mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start gap-1">
                                             <span class="text-[10px]">📝</span>
                                             <p class="text-[10px] text-slate-500 italic leading-snug break-all line-clamp-2" [innerHTML]="linkify(exp.note)"></p>
                                          </div>
                                       }
                                       <div class="flex justify-end gap-3 mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                          <button (click)="editExpense(exp)" class="text-[10px] font-bold text-blue-400 hover:text-blue-600 hover:underline">Edit</button>
                                          <button (click)="deleteExpense(exp.id!)" class="text-[10px] font-bold text-red-400 hover:text-red-600 hover:underline">Hapus</button>
                                       </div>
                                    </div>
                                 </div>
                              }
                           </div>
                           @if (expenses().length === 0) {
                              <div class="col-span-full bg-white/80 rounded-[2rem] p-10 text-center border border-slate-100 shadow-sm">
                                 <div class="mb-4 flex justify-center">
                                    <ng-lottie
                                       [options]="wallet2IconOptions"
                                       width="50px"
                                       height="50px">
                                    </ng-lottie>
                                 </div>
                                 <h3 class="text-lg font-black text-slate-700 mb-1">
                                    Data pengeluaran masih kosong
                                 </h3>
                                 <p class="text-xs font-bold text-slate-400">
                                    Silakan input data pengeluaran pertama kamu melalui form Catat Pengeluaran.
                                 </p>
                              </div>
                           } @else if (filteredExpenses().length === 0) {
                              <div class="col-span-full bg-white/80 rounded-[2rem] p-10 text-center border border-slate-100 shadow-sm">
                                 <div class="text-5xl mb-4">🔍</div>
                                 <h3 class="text-lg font-black text-slate-700 mb-1">
                                    Tidak ada pengeluaran yang cocok
                                 </h3>
                                 <p class="text-xs font-bold text-slate-400">
                                    Coba ubah filter status atau kategori pengeluaran.
                                 </p>
                              </div>
                           }
                           @if (filteredExpenses().length > expensePageSize) {
                              <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 rounded-3xl p-4 border border-white/60 shadow-sm mt-4">
                                 <div class="text-xs font-bold text-slate-400">
                                    Menampilkan
                                    <span class="text-slate-700">
                                       {{ ((expensePage() - 1) * expensePageSize) + 1 }}
                                    </span>
                                    -
                                    <span class="text-slate-700">
                                       {{ Math.min(expensePage() * expensePageSize, filteredExpenses().length) }}
                                    </span>
                                    dari
                                    <span class="text-slate-700">
                                       {{ filteredExpenses().length }}
                                    </span>
                                    data pengeluaran
                                 </div>

                                 <div class="flex items-center gap-2">
                                    <button
                                       type="button"
                                       (click)="prevExpensePage()"
                                       [disabled]="expensePage() === 1"
                                       class="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                                       Prev
                                    </button>

                                    <span class="px-4 py-2 rounded-2xl bg-slate-800 text-white text-xs font-black">
                                       {{ expensePage() }} / {{ totalExpensePages() }}
                                    </span>

                                    <button
                                       type="button"
                                       (click)="nextExpensePage()"
                                       [disabled]="expensePage() === totalExpensePages()"
                                       class="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                                       Next
                                    </button>
                                 </div>
                              </div>
                           }
                        </div>
                     </div>
                  </div>
               }

               @if (activeTab() === 'guests') {
                  <div class="animate-in slide-in-from-bottom-4 duration-500">
                     
                     <!-- [FITUR DIKEMBALIKAN] MODAL BROADCAST -->
                     @if (isBroadcastMode()) {
                        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                           <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="closeBroadcastModal()"></div>
                           <div class="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
                              <div class="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                 <div>
                                    <h3 class="font-black text-slate-800 text-xl tracking-tight">Broadcast WhatsApp</h3>
                                    <p class="text-xs text-slate-500 font-bold mt-1">
                                       Antrian:
                                       <span class="text-green-600">{{ queueTotal() }}</span>
                                       / {{ selectedGuestsForBroadcast().length }}

                                       @if (!allowResend() && sentCount() > 0) {
                                          <span class="text-[10px] text-slate-400 ml-1">
                                             ({{ sentCount() }} sudah terkirim)
                                          </span>
                                       }
                                    </p>
                                    <label class="flex items-center gap-2 mt-2 text-xs text-slate-600">
                                       <input
                                          type="checkbox"
                                          [checked]="allowResend()"
                                          (change)="allowResend.set($event.target.checked)"
                                       />
                                       Kirim ulang ke tamu yang sudah menerima WhatsApp
                                    </label>


                                    @if (allowResend()) {
                                       <p class="text-[10px] text-orange-500 mt-1 flex items-center gap-1">
                                          <span aria-hidden="true">⚠️</span> Pesan akan dikirim ulang ke tamu yang sudah menerima WhatsApp
                                       </p>
                                    }

                                 </div>
                                 <button (click)="closeBroadcastModal()" class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors font-bold">×</button>
                              </div>
                              <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                 <div class="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col gap-3 shadow-inner">
                                    <div>
                                       <p class="text-xs font-black text-blue-700 uppercase flex items-center gap-1"><span>🚀</span> Antrian Pengiriman</p>
                                       <p class="text-[10px] text-blue-500 leading-tight mt-0.5">Klik tombol di bawah untuk mengirim pesan ke tamu berikutnya.</p>
                                    </div>
                                    @if (nextPendingGuest(); as nextGuest) { 
                                       <button (click)="sendToNextGuest()" class="w-full bg-blue-600 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-blue-700 transition-transform active:scale-95 flex items-center justify-center gap-2 group animate-in slide-in-from-top-2">
                                          <span>Kirim ke</span><span class="underline decoration-blue-300 underline-offset-2">{{ nextGuest.name }}</span><span class="group-hover:translate-x-1 transition-transform">→</span>
                                       </button> 
                                    } @else { 
                                       <div class="w-full bg-green-500 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 animate-pulse"><span>✓</span> Semua Pesan Terkirim!</div> 
                                    }
                                 </div>
                                 <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pesan Template</label>
                                    <div class="relative group">
                                       <textarea [ngModel]="broadcastTemplate()" (ngModelChange)="broadcastTemplate.set($event)" class="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-medium text-slate-700 focus:ring-2 focus:ring-green-400 focus:bg-white transition-all h-32 resize-none shadow-inner" placeholder="Tulis pesan..."></textarea>
                                       <div class="absolute bottom-3 right-3 text-[10px] bg-white/80 backdrop-blur px-2 py-1 rounded-lg text-slate-400 border border-slate-100 pointer-events-none">
                                          Gunakan <b>{{ '{name}' }}</b> untuk nama tamu
                                       </div>
                                    </div>
                                 </div>
                                 <div>
                                    <div class="flex justify-between items-end mb-3">
                                       <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Penerima</label>
                                       <div class="text-[10px] font-bold text-slate-400">
                                          Halaman {{ broadcastPage() }} / {{ totalBroadcastPages() }}
                                       </div>
                                    </div>
                                    <div class="space-y-2">
                                       @for (guest of paginatedBroadcastGuests(); track guest.id; let i = $index) {
                                          <div class="flex items-center justify-between p-3 rounded-2xl border transition-all duration-300" 
                                             [class.bg-green-50]="guest.invited" [class.border-green-200]="guest.invited" 
                                             [class.bg-white]="!guest.invited" [class.border-slate-100]="!guest.invited" 
                                             [class.opacity-60]="guest.invited">
                                             <div class="flex items-center gap-3 overflow-hidden">
                                                <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors" 
                                                   [class.bg-green-200]="guest.invited" [class.text-green-700]="guest.invited" 
                                                   [class.bg-slate-100]="!guest.invited" [class.text-slate-400]="!guest.invited">
                                                   {{ (broadcastPage() - 1) * broadcastPageSize + i + 1 }}
                                                </div>
                                                <div class="min-w-0">
                                                   <p class="font-bold text-sm truncate" [class.text-green-800]="guest.invited" [class.text-slate-700]="!guest.invited">{{ guest.name }}</p>
                                                   <p class="text-[9px] opacity-60 truncate">{{ guest.phone }}</p>
                                                </div>
                                             </div>
                                             <div class="shrink-0 ml-2">
                                                @if (!guest.invited) { 
                                                   <span class="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap"><span aria-hidden="true">⏳</span> Pending</span> 
                                                } @else { 
                                                   <span class="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap animate-in zoom-in"><span>✓</span> Terkirim</span> 
                                                }
                                             </div>
                                          </div>
                                       }
                                    </div>
                                    <div class="flex justify-center gap-2 mt-4" *ngIf="totalBroadcastPages() > 1">
                                       <button (click)="prevBroadcastPage()" [disabled]="broadcastPage() === 1" class="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors text-xs font-bold">&lt; Prev</button>
                                       <span class="px-2 py-1 text-xs font-bold text-slate-500 self-center">{{ broadcastPage() }}</span>
                                       <button (click)="nextBroadcastPage()" [disabled]="broadcastPage() === totalBroadcastPages()" class="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors text-xs font-bold">Next &gt;</button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     }

                     <div class="flex flex-col md:grid md:grid-cols-12 md:gap-8 items-start">
                        <!-- Left Column: Form -->
                        <div class="w-full md:col-span-5 lg:col-span-4 space-y-6 md:sticky md:top-8 z-30">
                           <div id="guestForm" class="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 relative transition-all duration-300" 
                              [class.ring-2]="editingGuestId() !== null" [class.ring-offset-2]="editingGuestId() !== null" 
                              [style.borderColor]="editingGuestId() !== null ? currentTheme().color : ''">
                              <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                 <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                 {{ editingGuestId() ? 'Edit Data Tamu' : 'Tambah Tamu Baru' }}
                              </h3>
                              <div class="space-y-3">
                                 <input [(ngModel)]="newGuest.name" placeholder="Nama Tamu" class="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-sm font-bold focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all">
                                 <div class="flex gap-2">
                                    <select [(ngModel)]="newGuest.side" class="flex-1 p-2 bg-slate-50 rounded-2xl border-none outline-none text-sm font-bold focus:bg-white">
                                       <option value="CPP">Pihak CPP</option>
                                       <option value="CPW">Pihak CPW</option>
                                    </select>
                                    <div class="flex-1 flex gap-2 items-center">
                                       <select [(ngModel)]="newGuest.category" class="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-sm font-bold focus:bg-white">
                                          @for (cat of guestCategories(); track cat) { <option [value]="cat">{{ cat }}</option> }
                                       </select>
                                       <button (click)="showGuestCategoryManager.set(true)" class="aspect-square shrink-0 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200 transition-colors shadow-sm" title="Kelola Kategori" aria-label="Kelola Kategori">
                                          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                             <circle cx="12" cy="12" r="3"></circle>
                                             <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9A1.7 1.7 0 0 0 10 3.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>
                                          </svg>
                                       </button>
                                    </div>
                                 </div>
                                 <div class="grid grid-cols-[0.8fr_1.2fr] gap-3 items-start">
                                    <div class="space-y-1">
                                       <input [(ngModel)]="newGuest.pax" type="number" min="1" placeholder="Jumlah (Orang)" class="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold text-center outline-none transition-all focus:bg-white" [class.bg-red-50]="isGuestPaxInvalid()" [class.text-red-600]="isGuestPaxInvalid()" [class.ring-2]="isGuestPaxInvalid()" [class.ring-red-200]="isGuestPaxInvalid()" [class.focus:ring-red-200]="isGuestPaxInvalid()">
                                       @if (isGuestPaxInvalid()) {
                                          <p class="px-1 text-[10px] font-bold text-red-500">Minimal 1 orang</p>
                                       }
                                    </div>
                                    <input [(ngModel)]="newGuest.phone" placeholder="WA (contoh : 628123456789)" class="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-none focus:bg-white">
                                 </div>
                                 <div class="flex gap-2">
                                    @if (editingGuestId()) { 
                                       <button (click)="cancelEditGuest()" class="flex-1 bg-slate-100 text-slate-500 p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Batal</button> 
                                    }
                                    <button (click)="saveGuest()" class="flex-[2] text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all transform active:scale-95 hover:brightness-110" [style.backgroundColor]="currentTheme().color">
                                       {{ editingGuestId() ? 'Simpan' : 'Tambah Tamu' }}
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <!-- Right Column: List -->
                        <div class="w-full md:col-span-7 lg:col-span-8 space-y-4 pb-24 mt-6 md:mt-0">
                           @if (showGuestCategoryManager()) {
                              <div class="bg-slate-50 p-4 rounded-[2rem] border border-slate-200 animate-in zoom-in-95 mb-4">
                                 <h4 class="text-xs font-black text-slate-500 uppercase mb-3">Kelola Kategori Tamu</h4>
                                 <div class="flex flex-wrap gap-2 mb-3">
                                    @for (cat of guestCategories(); track cat) { 
                                       <div class="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-100 flex items-center gap-2">
                                          {{ cat }} <button (click)="deleteGuestCategory(cat)" class="text-red-400 hover:text-red-600">×</button>
                                       </div> 
                                    }
                                 </div>
                                 <div class="flex gap-2">
                                    <input #newGuestCatInput placeholder="Kategori Baru..." class="flex-1 p-2 rounded-xl text-xs border border-slate-200 outline-none">
                                    <button (click)="addGuestCategory(newGuestCatInput.value); newGuestCatInput.value=''" class="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Tambah</button>
                                    <button (click)="showGuestCategoryManager.set(false)" class="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-bold">Tutup</button>
                                 </div>
                              </div>
                           }
                           <div class="grid grid-cols-3 gap-2 mb-2">
                              <div class="bg-white p-3 rounded-2xl border border-slate-50 shadow-sm text-center">
                                 <p class="text-[10px] font-bold text-slate-400 uppercase">Total Tamu</p>
                                 <p class="text-xl font-black text-slate-800">{{ getTotalGuestPax() }} <span class="text-[10px] text-slate-400">Orang</span></p>
                              </div>
                              <div class="bg-blue-50 p-3 rounded-2xl border border-blue-100 shadow-sm text-center">
                                 <p class="text-[10px] font-bold text-blue-400 uppercase">Tamu CPP</p>
                                 <p class="text-xl font-black text-blue-700">{{ getCPPPax() }} <span class="text-[10px] text-blue-400">Orang</span></p>
                              </div>
                              <div class="bg-pink-50 p-3 rounded-2xl border border-pink-100 shadow-sm text-center">
                                 <p class="text-[10px] font-bold text-pink-400 uppercase">Tamu CPW</p>
                                 <p class="text-xl font-black text-pink-700">{{ getCPWPax() }} <span class="text-[10px] text-pink-400">Orang</span></p>
                              </div>
                           </div>
                           <div class="grid grid-cols-2 gap-2 mb-2">
                              <div class="bg-green-50 p-3 rounded-2xl border border-green-100 shadow-sm text-center">
                                 <p class="text-[10px] font-bold text-green-400 uppercase">✓ WA Terkirim</p>
                                 <p class="text-xl font-black text-green-700">{{ getWhatsAppStats().sent }} <span class="text-[10px] text-green-400">Tamu</span></p>
                              </div>
                              <div class="bg-orange-50 p-3 rounded-2xl border border-orange-100 shadow-sm text-center">
                                 <p class="text-[10px] font-bold text-orange-400 uppercase flex items-center justify-center gap-1">
                                    <svg viewBox="0 0 24 24" class="w-3 h-3 fill-none stroke-current shrink-0" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                       <circle cx="12" cy="13" r="8"></circle>
                                       <path d="M12 9v4l2.5 1.5"></path>
                                       <path d="M9 3h6"></path>
                                       <path d="M15 3v2"></path>
                                       <path d="M9 3v2"></path>
                                    </svg>
                                    <span>Belum Kirim</span>
                                 </p>
                                 <p class="text-xl font-black text-orange-700">{{ getWhatsAppStats().unsent }} <span class="text-[10px] text-orange-400">Tamu</span></p>
                              </div>
                           </div>
                           <div class="flex gap-2">
                              <input 
                                 [ngModel]="searchQuery()"
                                 (ngModelChange)="searchQuery.set($event); resetGuestPage()"
                                 placeholder="Cari nama tamu..." 
                                 class="flex-1 p-3 bg-white rounded-2xl border border-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200 shadow-sm"
                              >
                              @if (hasSelectedGuests()) { 
                                 <button (click)="broadcastWhatsAppToSelected()" class="px-4 bg-green-500 text-white rounded-2xl font-bold text-xs shadow-lg animate-in zoom-in hover:bg-green-600 transition-colors flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                       <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                    Broadcast ({{ getSelectedCount() }})
                                 </button> 
                              }
                           </div>
                           <div class="bg-white/50 p-3 rounded-3xl border border-white/60 shadow-sm backdrop-blur-sm">
                              <div class="flex flex-wrap gap-2">
                                 <!-- Filter Pihak (Dropdown) -->
                                 <select 
                                    [ngModel]="filterSide()" 
                                    (ngModelChange)="filterSide.set($event); resetGuestPage()"
                                    class="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border border-slate-200 bg-white cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200" 
                                    [style.color]="filterSide() !== 'ALL' ? currentTheme().color : '#64748b'" 
                                    [style.borderColor]="filterSide() !== 'ALL' ? currentTheme().color : '#e2e8f0'"
                                 >
                                    <option value="ALL">👥 Semua Pihak</option>
                                    <option value="CPP">🤵 Pria (CPP)</option>
                                    <option value="CPW">👰 Wanita (CPW)</option>
                                 </select>

                                 <!-- Filter Status WhatsApp (Dropdown) -->
                                 <select 
                                    [ngModel]="filterWhatsApp()" 
                                    (ngModelChange)="filterWhatsApp.set($event); resetGuestPage()" class="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border border-slate-200 bg-white cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200" [style.color]="filterWhatsApp() !== 'ALL' ? currentTheme().color : '#64748b'" [style.borderColor]="filterWhatsApp() !== 'ALL' ? currentTheme().color : '#e2e8f0'">
                                    <option value="ALL">💬 Semua Status WA</option>
                                    <option value="SENT">✓ Terkirim</option>
                                    <option value="UNSENT">Belum Kirim</option>
                                 </select>

                                 <!-- Filter Kategori (Dropdown) -->
                                 <select 
                                    [ngModel]="filterCategory()" 
                                    (ngModelChange)="filterCategory.set($event); resetGuestPage()" class="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border border-slate-200 bg-white cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200" [style.color]="filterCategory() !== 'ALL' ? currentTheme().color : '#64748b'" [style.borderColor]="filterCategory() !== 'ALL' ? currentTheme().color : '#e2e8f0'">
                                    <option value="ALL">📂 Semua Kategori</option>
                                    @for (cat of guestCategories(); track cat) { <option [value]="cat">{{ cat }}</option> }
                                 </select>

                                 <!-- Button Reset Filter (Optional) -->
                                 @if (filterSide() !== 'ALL' || filterWhatsApp() !== 'ALL' || filterCategory() !== 'ALL') {
                                    <button (click)="resetFiltersGuest()" class="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shadow-sm border border-slate-200 whitespace-nowrap">🔄 Reset filter</button>
                              }
                              </div>
                           </div>
                           <div class="flex flex-wrap items-center justify-between gap-2 px-2" *ngIf="filteredGuests().length > 0">
                              <label class="flex items-center gap-2 cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    [checked]="areAllFilteredGuestsSelected()" 
                                    (change)="toggleSelectAll($event)" 
                                    class="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-0 cursor-pointer"
                                 >

                                 <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    Pilih Semua ({{ filteredGuests().length }})
                                 </span>
                              </label>


                              @if (hasSelectedGuests()) {
                                 <div class="flex flex-wrap items-center gap-2">
                                    <button
                                       type="button"
                                       (click)="uncheckAllGuests()"
                                       class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-colors">
                                       Uncheck All
                                    </button>

                                    <button
                                       type="button"
                                       (click)="deleteSelectedGuests()"
                                       class="px-3 py-1.5 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest border border-red-500 hover:bg-red-600 transition-colors shadow-sm">
                                       Hapus Terpilih
                                    </button>
                                 </div>
                              }
                           </div>
                           <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
                              @for (guest of paginatedGuests(); track guest.id) {
                                 <div 
                                    class="bg-white p-4 rounded-3xl border border-slate-50 flex items-center justify-between shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative"
                                    [class.ring-4]="editingGuestId() === guest.id"
                                    [class.ring-offset-4]="editingGuestId() === guest.id"
                                    [class.bg-pink-50]="editingGuestId() === guest.id"
                                    [style.borderColor]="editingGuestId() === guest.id ? currentTheme().color : ''"
                                    [style.boxShadow]="editingGuestId() === guest.id ? '0 0 0 4px rgba(169, 169, 169, 0.2)' : ''"
                                 >
                                    <div class="flex items-center gap-3 min-w-0">
                                       <input type="checkbox" [checked]="guest.selected ?? false" (change)="toggleGuest(guest.id!)" class="w-5 h-5 rounded-lg border-2 border-slate-200 text-slate-800 focus:ring-0 cursor-pointer shrink-0">
                                       <div 
                                          class="w-10 h-10 rounded-2xl flex items-center justify-center font-serif italic text-white text-md shadow-md transition-colors duration-500 shrink-0"
                                          [class.bg-blue-500]="guest.side === 'CPP'"
                                          [class.bg-pink-500]="guest.side === 'CPW'"
                                       >
                                          {{ guest.name.charAt(0) }}
                                       </div>
                                       <div class="min-w-0">
                                          <p class="font-bold text-slate-800 text-sm leading-tight truncate" title="{{ guest.name }}">{{ guest.name }}</p>
                                          <div class="flex flex-wrap gap-1 mt-1">
                                             <span class="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded whitespace-nowrap">{{ guest.side }}</span>
                                             <span class="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded whitespace-nowrap">{{ guest.category }}</span>
                                             <span class="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded whitespace-nowrap">{{ guest.pax }} Orang</span>
                                             
                                             @if (guest.invited) {
                                                <span class="text-[9px] font-bold bg-green-100 text-green-600 px-1.5 py-0.5 rounded whitespace-nowrap flex items-center gap-0.5">
                                                   <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                                   WA Terkirim
                                                </span>
                                             } @else if (guest.phone) {
                                                <span class="text-[9px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded whitespace-nowrap flex items-center gap-0.5">
                                                   <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                                                   Belum Kirim
                                                </span>
                                             }
                                          </div>
                                          <!-- WAKTU PENGIRIMAN -->
                                          @if (guest.invited && guest.sent_at) {
                                             <p class="text-[8px] text-slate-400 mt-0.5">Dikirim: {{ guest.sent_at }}</p>
                                          }
                                       </div>
                                    </div>
                                    <div class="flex gap-2 shrink-0 ml-2">
                                       <!-- TOMBOL WHATSAPP - BARU -->
                                       @if (guest.phone) {
                                          <button (click)="sendWhatsApp(guest)" 
                                             [class]="guest.invited ? 'w-8 h-8 rounded-xl bg-green-50 text-green-500 flex items-center justify-center text-xs hover:bg-green-100 transition-colors shadow-sm' : 'w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center text-xs hover:bg-green-600 transition-colors shadow-sm'"
                                             [title]="guest.invited ? 'Kirim Ulang WA' : 'Kirim WA'">
                                             <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                          </button>
                                       }
                                       <button (click)="editGuest(guest)" class="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xs hover:bg-blue-100 transition-colors shadow-sm" title="Edit Data Tamu">
                                          ✎
                                       </button>
                                       <button (click)="deleteGuest(guest.id!)" class="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center text-xs hover:bg-red-100 transition-colors shadow-sm" title="Hapus Tamu">
                                          ×
                                       </button>
                                    </div>
                                 </div>
                              }
                           </div>
                           @if (guests().length === 0) {
                              <div class="bg-white/80 rounded-[2rem] p-10 text-center border border-slate-100 shadow-sm">
                                 <div class="flex justify-center">
                                    <ng-lottie
                                       [options]="userIconOptions"
                                       width="100px"
                                       height="100px">
                                    </ng-lottie>
                                 </div>
                                 <h3 class="text-lg font-black text-slate-700 mb-1">
                                    Data tamu masih kosong
                                 </h3>
                                 <p class="text-xs font-bold text-slate-400">
                                    Silakan input data tamu pertama kamu melalui form Tambah Tamu Baru.
                                 </p>
                              </div>
                           } @else if (filteredGuests().length === 0) {
                              <div class="bg-white/80 rounded-[2rem] p-10 text-center border border-slate-100 shadow-sm">
                                 <div class="text-5xl mb-4">🔍</div>
                                 <h3 class="text-lg font-black text-slate-700 mb-1">
                                    Tidak ada tamu yang cocok
                                 </h3>
                                 <p class="text-xs font-bold text-slate-400">
                                    Coba ubah pencarian atau filter tamu.
                                 </p>
                              </div>
                           }
                           @if (filteredGuests().length > guestPageSize) {
                              <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 rounded-3xl p-4 border border-white/60 shadow-sm mt-4">
                                 <div class="text-xs font-bold text-slate-400">
                                    Menampilkan
                                    <span class="text-slate-700">
                                       {{ ((guestPage() - 1) * guestPageSize) + 1 }}
                                    </span>
                                    -
                                    <span class="text-slate-700">
                                       {{ Math.min(guestPage() * guestPageSize, filteredGuests().length) }}
                                    </span>
                                    dari
                                    <span class="text-slate-700">
                                       {{ filteredGuests().length }}
                                    </span>
                                    data tamu
                                 </div>

                                 <div class="flex items-center gap-2">
                                    <button
                                       type="button"
                                       (click)="prevGuestPage()"
                                       [disabled]="guestPage() === 1"
                                       class="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                                       Prev
                                    </button>

                                    <span class="px-4 py-2 rounded-2xl bg-slate-800 text-white text-xs font-black">
                                       {{ guestPage() }} / {{ totalGuestPages() }}
                                    </span>

                                    <button
                                       type="button"
                                       (click)="nextGuestPage()"
                                       [disabled]="guestPage() === totalGuestPages()"
                                       class="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                                       Next
                                    </button>
                                 </div>
                              </div>
                           }
                        </div>
                     </div>
                  </div>
               }

               @if (activeTab() === 'todos') {
               <div class="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-24">

                  <!-- Header -->
                  <div class="text-center mb-4">
                     <h2 class="text-2xl font-serif font-black not-italic tracking-tight text-white transition-colors duration-500">
                     To-Do List
                     </h2>
                     <p class="text-xs text-white">
                     Jangan sampai ada yang terlewat!
                     </p>

                     <!-- Progress Summary -->
                     <div class="mt-4 max-w-xl mx-auto bg-white/90 backdrop-blur-xl rounded-[2rem] p-4 shadow-lg border border-white/60">
                     <div class="flex items-center justify-between mb-3">
                        <div class="text-left">
                           <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           Progress Persiapan
                           </p>
                           <p class="text-sm font-bold text-slate-700">
                           {{ completedTodosCount() }} selesai dari {{ todos().length }} tugas
                           </p>
                        </div>

                        <div class="text-right">
                           <p class="text-2xl font-black text-slate-800">
                           {{ todoProgressPercentage() }}%
                           </p>
                        </div>
                     </div>

                     <div class="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                           class="h-full rounded-full transition-all duration-700"
                           [style.width.%]="todoProgressPercentage()"
                           [style.backgroundColor]="currentTheme().color">
                        </div>
                     </div>

                     <div class="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div class="bg-slate-50 rounded-2xl p-3">
                           <p class="text-lg font-black text-slate-800">{{ todos().length }}</p>
                           <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                        </div>

                        <div class="bg-amber-50 rounded-2xl p-3">
                           <p class="text-lg font-black text-amber-600">{{ pendingTodosCount() }}</p>
                           <p class="text-[9px] font-black text-amber-500 uppercase tracking-widest">Belum</p>
                        </div>

                        <div class="bg-green-50 rounded-2xl p-3">
                           <p class="text-lg font-black text-green-600">{{ completedTodosCount() }}</p>
                           <p class="text-[9px] font-black text-green-500 uppercase tracking-widest">Selesai</p>
                        </div>
                     </div>
                     </div>
                  </div>

                  <!-- Input Todo -->
                  <div class="max-w-xl mx-auto flex gap-2 bg-white p-2 rounded-[1.5rem] shadow-lg border border-slate-50 hover:shadow-xl transition-shadow">
                     <input 
                     #todoInput
                     (keyup.enter)="addTodo(todoInput.value); todoInput.value = ''"
                     placeholder="Tugas baru..."
                     class="flex-1 p-3 bg-transparent outline-none text-sm font-bold pl-4">

                     <button 
                     (click)="addTodo(todoInput.value); todoInput.value = ''"
                     class="w-12 h-12 rounded-2xl font-bold shadow-md text-white text-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                     [style.backgroundColor]="currentTheme().color">
                     +
                     </button>
                  </div>

                  <!-- Filter Todo + Search -->
                  <div class="max-w-3xl mx-auto flex flex-col md:flex-row gap-2 bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] shadow-sm border border-white">
                     
                     <div class="flex gap-2 justify-center md:justify-start overflow-x-auto custom-scrollbar">
                        <button 
                           (click)="filterTodoStatus.set('ALL'); resetTodoPage()"
                           class="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                           [class.text-white]="filterTodoStatus() === 'ALL'"
                           [class.bg-slate-800]="filterTodoStatus() === 'ALL'"
                           [class.text-slate-400]="filterTodoStatus() !== 'ALL'"
                           [class.bg-slate-50]="filterTodoStatus() !== 'ALL'">
                           Semua
                        </button>

                        <button 
                           (click)="filterTodoStatus.set('PENDING'); resetTodoPage()"
                           class="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                           [class.text-white]="filterTodoStatus() === 'PENDING'"
                           [class.bg-amber-500]="filterTodoStatus() === 'PENDING'"
                           [class.text-slate-400]="filterTodoStatus() !== 'PENDING'"
                           [class.bg-slate-50]="filterTodoStatus() !== 'PENDING'">
                           Belum
                        </button>

                        <button 
                           (click)="filterTodoStatus.set('DONE'); resetTodoPage()"
                           class="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                           [class.text-white]="filterTodoStatus() === 'DONE'"
                           [class.bg-green-500]="filterTodoStatus() === 'DONE'"
                           [class.text-slate-400]="filterTodoStatus() !== 'DONE'"
                           [class.bg-slate-50]="filterTodoStatus() !== 'DONE'">
                           Selesai
                        </button>
                     </div>

                     <div class="relative flex-1 min-w-0">
                        <input
                           [ngModel]="todoSearch()"
                           (ngModelChange)="todoSearch.set($event); resetTodoPage()"
                           placeholder="Cari tugas..."
                           class="w-full h-full min-h-[36px] pl-4 pr-9 bg-white rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-200 shadow-sm text-slate-700"
                        >

                        @if (todoSearch()) {
                           <button
                              type="button"
                              (click)="todoSearch.set(''); resetTodoPage()"
                              class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors font-bold text-xs">
                              ×
                           </button>
                        }
                     </div>
                  </div>

                  <!-- Empty State -->
                  @if (filteredTodos().length === 0) {
                     <div class="max-w-xl mx-auto bg-white/90 rounded-[2rem] p-10 text-center shadow-sm border border-slate-50">
                     <div class="flex justify-center">
                        <ng-lottie
                           [options]="checklist2IconOptions"
                           width="100px"
                           height="100px">
                        </ng-lottie>
                     </div>

                     @if (todos().length === 0) {
                        <h3 class="text-lg font-black text-slate-700 mb-1">
                           Belum ada tugas
                        </h3>
                        <p class="text-xs font-bold text-slate-400">
                           Tambahkan checklist persiapan pernikahan pertamamu.
                        </p>
                     } @else {
                        <h3 class="text-lg font-black text-slate-700 mb-1">
                           Tidak ada tugas di filter ini
                        </h3>
                        <p class="text-xs font-bold text-slate-400">
                           Coba pilih filter lainnya.
                        </p>
                     }
                     </div>
                  }

                  <!-- Todo List -->
                  @if (filteredTodos().length > 0) {
                     <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     @for (task of paginatedTodos(); track task.id) {
                        <div 
                           class="bg-white p-4 rounded-2xl border border-slate-50 flex items-center gap-4 shadow-sm transition-all hover:shadow-md"
                           [class.opacity-60]="task.completed">

                           <button 
                           (click)="toggleTodo(task.id!)"
                           class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0"
                           [style.borderColor]="task.completed ? currentTheme().color : '#cbd5e1'"
                           [style.backgroundColor]="task.completed ? currentTheme().color : 'transparent'">
                           <span *ngIf="task.completed" class="text-white text-[10px]">✓</span>
                           </button>

                           <div class="flex-1 min-w-0">
                           <span 
                              class="block text-sm font-bold text-slate-700 truncate"
                              [class.line-through]="task.completed">
                              {{ task.task }}
                           </span>

                           <span 
                              class="inline-block mt-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest"
                              [class.bg-green-50]="task.completed"
                              [class.text-green-600]="task.completed"
                              [class.bg-amber-50]="!task.completed"
                              [class.text-amber-600]="!task.completed">
                              {{ task.completed ? 'Selesai' : 'Belum' }}
                           </span>
                           </div>

                           <button 
                           (click)="deleteTodo(task.id!)"
                           class="text-slate-300 hover:text-red-400 p-2 hover:bg-red-50 rounded-xl transition-colors">
                           ×
                           </button>
                        </div>
                     }
                     </div>
                  }
                  @if (filteredTodos().length > todoPageSize) {
                     <div class="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 rounded-3xl p-4 border border-white/60 shadow-sm mt-4">
                        <div class="text-xs font-bold text-slate-400">
                           Menampilkan
                           <span class="text-slate-700">
                              {{ ((todoPage() - 1) * todoPageSize) + 1 }}
                           </span>
                           -
                           <span class="text-slate-700">
                              {{ Math.min(todoPage() * todoPageSize, filteredTodos().length) }}
                           </span>
                           dari
                           <span class="text-slate-700">
                              {{ filteredTodos().length }}
                           </span>
                           tugas
                        </div>

                        <div class="flex items-center gap-2">
                           <button
                              type="button"
                              (click)="prevTodoPage()"
                              [disabled]="todoPage() === 1"
                              class="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                              Prev
                           </button>

                           <span class="px-4 py-2 rounded-2xl bg-slate-800 text-white text-xs font-black">
                              {{ todoPage() }} / {{ totalTodoPages() }}
                           </span>

                           <button
                              type="button"
                              (click)="nextTodoPage()"
                              [disabled]="todoPage() === totalTodoPages()"
                              class="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                              Next
                           </button>
                        </div>
                     </div>
                  }
               </div>
               }

               @if (activeTab() === 'vendors') {
                  <div class="animate-in slide-in-from-bottom-4 duration-500 pb-24">
                     <h2 class="text-2xl font-serif font-black not-italic tracking-tight text-center mb-6 transition-colors duration-500 text-white">List Vendor</h2>
                     <div class="flex flex-col md:grid md:grid-cols-12 md:gap-8 items-start">
                           
                           <div class="w-full md:col-span-5 lg:col-span-4 space-y-6 md:sticky md:top-8 z-30">
                              <div id="vendorForm" class="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 relative transition-all duration-300" [class.ring-2]="editingVendorId() !== null" [class.ring-offset-2]="editingVendorId() !== null" [style.borderColor]="editingVendorId() !== null ? currentTheme().color : ''">
                                 <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {{ editingVendorId() ? 'Edit Vendor' : 'Tambah Vendor Baru' }}</h3>
                                 <div class="space-y-3">
                                    <input [(ngModel)]="newVendor.name" placeholder="Nama Vendor" class="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all">
                                    <div class="flex gap-2 items-center">
                                       <select 
                                          [(ngModel)]="newVendor.category"
                                          class="flex-1 p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                          [disabled]="vendorCategories().length === 0"
                                          [class.text-slate-400]="!newVendor.category"
                                          [class.text-slate-700]="newVendor.category"
                                       >
                                          @if (vendorCategories().length === 0) {
                                             <option value="" disabled>
                                                Belum ada kategori vendor
                                             </option>
                                          } @else {
                                             <option value="" disabled>
                                                Pilih Kategori Vendor
                                             </option>

                                             @for (cat of vendorCategories(); track cat.id) { 
                                                <option [value]="cat.name">{{ cat.name }}</option> 
                                             }
                                          }
                                       </select>
                                       <button (click)="showVendorCategoryManager.set(true)" class="aspect-square shrink-0 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200 transition-colors shadow-sm" title="Kelola Kategori" aria-label="Kelola Kategori">
                                          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                             <circle cx="12" cy="12" r="3"></circle>
                                             <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9A1.7 1.7 0 0 0 10 3.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>
                                          </svg>
                                       </button>
                                    </div>
                                    @if (vendorCategories().length === 0) {
                                       <p class="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2 leading-relaxed">
                                          Belum ada kategori vendor. Tambahkan kategori terlebih dahulu melalui tombol gear, atau gunakan data dari Database Vendor Admin.
                                       </p>
                                    }
                                    <input [(ngModel)]="newVendor.location" placeholder="Lokasi (Kota/Alamat)" class="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all">
                                    <div class="relative">
                                       <span class="absolute left-4 top-4 text-xs font-bold text-slate-400">Rp</span>

                                       <input 
                                          [(ngModel)]="newVendor.price"
                                          name="vendorPrice"
                                          type="number"
                                          min="0"
                                          placeholder="0"
                                          (focus)="selectAllAmount($event)"
                                          class="w-full p-4 pl-10 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all"
                                       >
                                       <p class="text-[10px] font-bold text-slate-400 -mt-1 px-1 leading-relaxed">
                                          Tanyakan ke Vendor terkait pricelist > Vendor kirim pricelist > Pilih paket sesuai budget anda > Input harga
                                       </p>
                                    </div>
                                    <input [(ngModel)]="newVendor.social_link" placeholder="Link Sosial Media (Instagram/Web)" class="w-full p-4 bg-slate-50 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all text-blue-500">
                                    
                                    <div 
                                       class="bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-300 transition-all hover:border-slate-400"
                                       (dragover)="onImageDragOver($event)"
                                       (dragleave)="onImageDragLeave($event)"
                                       (drop)="uploadDroppedImages($event, 'vendor')">
                                       <p class="text-[10px] font-bold text-slate-400 uppercase mb-2">
                                          Galeri Foto
                                          <span class="normal-case font-bold text-slate-400">
                                             — drag & drop foto ke sini, geser foto untuk ubah urutan
                                          </span>
                                       </p>
                                       
                                       <div class="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                                          @for (img of newVendor.images; track img; let i = $index) { 
                                             <div 
                                                draggable="true"
                                                (dragstart)="startDragVendorImage(i)"
                                                (dragover)="onImageDragOver($event)"
                                                (drop)="dropVendorImageAt(i)"
                                                class="w-16 h-16 shrink-0 relative rounded-lg overflow-hidden group cursor-move border border-slate-200 hover:ring-2 hover:ring-slate-300 transition-all"
                                             >
                                                <img [src]="img.url" [title]="img.originalName" class="w-full h-full object-cover">

                                                <div class="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                                                   {{ i + 1 }}
                                                </div>

                                                <button 
                                                   type="button"
                                                   (click)="removeImageFromVendor(img.fileName)" 
                                                   class="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                                   ×
                                                </button>
                                             </div> 
                                          }
                                       </div>

                                       <div class="mt-2">
                                          <label class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 rounded-xl text-xs font-bold text-white cursor-pointer hover:bg-slate-700 transition-colors shadow-sm active:scale-95" [class.opacity-50]="isUploading()" [class.pointer-events-none]="isUploading()">
                                             <span *ngIf="!isUploading()">📤</span>
                                             <span *ngIf="isUploading()" class="animate-spin">⏳</span> 
                                             {{ isUploading() ? 'Memproses...' : 'Upload Foto' }}
                                             
                                             <input type="file" class="hidden" (change)="handleVendorImageUpload($event)" accept="image/*" multiple [disabled]="isUploading()">
                                          </label>

                                          
                                          <div *ngIf="isUploading()" class="mt-3 animate-in fade-in slide-in-from-top-1">
                                             <div class="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><span>Mengunggah...</span><span>{{ uploadProgress() }}%</span></div>
                                             <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div class="bg-green-500 h-full transition-all duration-300 ease-out rounded-full" [style.width.%]="uploadProgress()"></div></div>
                                          </div>
                                       </div>
                                    </div>
                                    
                                    <div class="flex gap-2 pt-2">
                                       @if (editingVendorId()) { <button (click)="cancelEditVendor()" class="flex-1 bg-slate-100 text-slate-500 p-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Batal</button> }
                                       <button 
                                          (click)="saveVendor()" 
                                          [disabled]="vendorCategories().length === 0 || !newVendor.category"
                                          class="flex-[2] text-white p-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                                          [style.backgroundColor]="currentTheme().color">
                                          {{ editingVendorId() ? 'Update' : 'Simpan' }}
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div class="w-full md:col-span-7 lg:col-span-8 space-y-4 mt-6 md:mt-0">
                              
                              @if (showVendorCategoryManager()) {
                                 <div class="bg-slate-50 p-4 rounded-[2rem] border border-slate-200 animate-in zoom-in-95 mb-4">
                                    <h4 class="text-xs font-black text-slate-500 uppercase mb-3">Kelola Kategori Vendor</h4>
                                    <div class="flex flex-wrap gap-2 mb-3">
                                       @for (cat of vendorCategories(); track cat.id) { 
                                          <div class="bg-white px-3 py-2 rounded-2xl text-xs font-bold text-slate-600 border border-slate-100 flex flex-col gap-2">
                                             <div class="flex items-center justify-between gap-2">
                                                <span>{{ cat.name }}</span>

                                                <button 
                                                   type="button"
                                                   (click)="deleteVendorCategory(cat.id)" 
                                                   class="text-red-400 hover:text-red-600 text-sm font-black">
                                                   ×
                                                </button>
                                             </div>

                                             <label class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                                                [class.text-green-600]="cat.is_main_checklist"
                                                [class.text-slate-400]="!cat.is_main_checklist"
                                                [class.opacity-40]="!cat.is_main_checklist && mainChecklistCount() >= 5">

                                                <input 
                                                   type="checkbox"
                                                   [checked]="cat.is_main_checklist"
                                                   [disabled]="!cat.is_main_checklist && mainChecklistCount() >= 5"
                                                   (change)="toggleVendorCategoryMainChecklist(cat)"
                                                   class="w-3.5 h-3.5 rounded border-slate-300 text-green-500 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                                                >

                                                Checklist Utama
                                             </label>

                                          </div> 
                                       }
                                    </div>
                                    <div class="mb-3 text-[10px] font-bold text-slate-400 bg-white rounded-2xl px-3 py-2 border border-slate-100">
                                       Dipilih untuk Checklist Utama:
                                       <span class="font-black text-slate-700">
                                          {{ mainChecklistCount() }}/5
                                       </span>
                                    </div>
                                    <div class="flex gap-2">
                                       <input #newVendorCatInput placeholder="Kategori Baru..." class="flex-1 p-2 rounded-xl text-xs border border-slate-200 outline-none">
                                       <button (click)="addVendorCategory(newVendorCatInput.value); newVendorCatInput.value=''" class="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Tambah</button>
                                       <button (click)="showVendorCategoryManager.set(false)" class="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-bold">Tutup</button>
                                    </div>
                                 </div>
                              }

                              <div class="flex flex-wrap gap-2 pb-2">
                                 <button (click)="selectedFilter.set('Semua'); resetVendorPage()" 
                                       class="px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border" 
                                       [style.backgroundColor]="selectedFilter() === 'Semua' ? currentTheme().color : 'white'" 
                                       [class.text-white]="selectedFilter() === 'Semua'" 
                                       [class.bg-white]="selectedFilter() !== 'Semua'" 
                                       [class.text-slate-500]="selectedFilter() !== 'Semua'" 
                                       [class.border-transparent]="selectedFilter() === 'Semua'" 
                                       [class.border-slate-100]="selectedFilter() !== 'Semua'">
                                    Semua
                                 </button>

                                 @for (cat of vendorCategories(); track cat.id) { 
                                    <button (click)="selectedFilter.set(cat.name); resetVendorPage()" 
                                          class="px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border" 
                                          [style.backgroundColor]="selectedFilter() === cat.name ? currentTheme().color : 'white'" 
                                          [class.text-white]="selectedFilter() === cat.name" 
                                          [class.bg-white]="selectedFilter() !== cat.name" 
                                          [class.text-slate-500]="selectedFilter() !== cat.name" 
                                          [class.border-transparent]="selectedFilter() === cat.name" 
                                          [class.border-slate-100]="selectedFilter() !== cat.name">
                                       {{ cat.name }}
                                    </button> 
                                 }
                              </div>

                              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                 @for (vendor of paginatedVendors(); track vendor.id) {
                                    <div 
                                       class="bg-white rounded-[2rem] shadow-md border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col relative"
                                       [class.ring-4]="editingVendorId() === vendor.id"
                                       [class.ring-2]="vendor.selected && editingVendorId() !== vendor.id"
                                       [class.ring-offset-4]="editingVendorId() === vendor.id"
                                       [class.ring-offset-2]="vendor.selected && editingVendorId() !== vendor.id"
                                       [class.bg-pink-50]="editingVendorId() === vendor.id"
                                       [style.borderColor]="editingVendorId() === vendor.id ? currentTheme().color : vendor.selected ? currentTheme().color : ''"
                                       [style.boxShadow]="editingVendorId() === vendor.id ? '0 0 0 4px rgba(169, 169, 169, 0.2)' : ''"
                                    >
                                       <div *ngIf="vendor.selected" class="absolute top-0 right-0 z-20 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">✓ Terpilih</div>

                                       <div class="w-full h-48 bg-slate-100 relative group/slider overflow-hidden">
            
                                          @if (vendor.images && vendor.images.length > 0) {
                                             
                                             <div class="flex h-full w-full transition-transform duration-700 ease-in-out" 
                                                [style.transform]="'translateX(-' + ((vendor.active_index || 0) * 100) + '%)'">
                                                @for (img of vendor.images; track img) {
                                                   <img [src]="img.url" 
                                                         (click)="openLightbox(vendor, $index)"
                                                         class="w-full h-full object-cover shrink-0 cursor-pointer hover:scale-105 transition-transform duration-500">
                                                }
                                             </div>

                                             @if (vendor.images.length > 1) {
                                                <button (click)="manualVendorSlide(vendor.id!, 'prev', $event)" 
                                                      class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur-sm flex items-center justify-center text-white hover:text-slate-800 transition-all opacity-0 group-hover/slider:opacity-100 z-10 shadow-sm">
                                                   <svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
                                                </button>
                                                
                                                <button (click)="manualVendorSlide(vendor.id!, 'next', $event)" 
                                                      class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur-sm flex items-center justify-center text-white hover:text-slate-800 transition-all opacity-0 group-hover/slider:opacity-100 z-10 shadow-sm">
                                                   <svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>
                                                </button>

                                                <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                                                   @for (img of vendor.images; track $index) {
                                                      <div class="w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm"
                                                         [class.bg-white]="(vendor.active_index || 0) === $index"
                                                         [class.scale-125]="(vendor.active_index || 0) === $index"
                                                         [class.bg-white_50]="(vendor.active_index || 0) !== $index"
                                                         style="background-color: {{(vendor.active_index || 0) === $index ? 'white' : 'rgba(255,255,255,0.4)'}}">
                                                      </div>
                                                   }
                                                </div>
                                             }

                                          } @else {
                                          <div class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                                             <div class="w-16 h-16 rounded-2xl bg-white/70 flex items-center justify-center shadow-sm border border-slate-200">
                                                <span class="text-4xl">🖼️</span>
                                             </div>
                                             <p class="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                No Image
                                             </p>
                                          </div>
                                          }
                                       </div>

                                       <div class="p-4 flex flex-col flex-1">
                                          <div class="flex justify-between items-start mb-2">
                                             <div>
                                                <span class="inline-block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">{{ vendor.category }}</span>
                                                <h4 class="font-bold text-slate-800 text-lg leading-tight">{{ vendor.name }}</h4>
                                             </div>
                                             <div class="flex gap-1">
                                                <button (click)="editVendor(vendor)" class="w-7 h-7 rounded-full bg-slate-50 text-blue-500 hover:bg-blue-50 flex items-center justify-center transition-colors" title="Edit">✎</button>
                                                <button (click)="deleteVendor(vendor.id!)" class="w-7 h-7 rounded-full bg-slate-50 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors" title="Hapus">×</button>
                                             </div>
                                          </div>

                                          <div class="space-y-1 mb-4 flex-1">
                                             <p class="text-xs text-slate-500 font-bold flex items-center gap-1">
                                                <span class="text-slate-400">📍</span> {{ vendor.location || '-' }}
                                             </p>
                                             @if (vendor.social_link) { 
                                                <div class="text-xs truncate text-blue-500 font-bold hover:underline cursor-pointer flex items-center gap-1">
                                                   <span class="text-slate-400">🔗</span> <span [innerHTML]="linkify(vendor.social_link)"></span>
                                                </div> 
                                             }
                                          </div>

                                          <div class="pt-3 border-t border-slate-50 mt-auto">
                                             <div class="flex justify-between items-end mb-3">
                                                <span class="text-[10px] font-bold text-slate-400">Harga / Paket</span>
                                                <p class="text-lg font-black" [style.color]="currentTheme().color">
                                                   Rp {{ vendor.price | number:'1.0-0' }}
                                                </p>
                                             </div>
                                             
                                             <button 
                                                (click)="toggleVendorSelection(vendor.id!)" 
                                                class="w-full py-2.5 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                                [ngClass]="vendor.selected 
                                                   ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' 
                                                   : 'bg-slate-800 text-white border-transparent hover:bg-slate-700'"
                                             >
                                                <span *ngIf="vendor.selected">× Batalkan</span>
                                                <span *ngIf="!vendor.selected">✓ Pilih Vendor</span>
                                             </button>
                                          </div>
                                       </div>
                                    </div>
                                 }
                                 @if (vendors().length === 0) {
                                    <div class="col-span-full bg-white/80 rounded-[2rem] p-10 text-center border border-slate-100 shadow-sm">
                                       <div class="flex justify-center">
                                          <ng-lottie
                                             [options]="forvendorIconOptions"
                                             width="100px"
                                             height="100px">
                                          </ng-lottie>
                                       </div>
                                       <h3 class="text-lg font-black text-slate-700 mb-1">
                                          Data vendor masih kosong
                                       </h3>
                                       <p class="text-xs font-bold text-slate-400">
                                          Silakan input data vendor pertama kamu melalui form Tambah Vendor Baru.
                                       </p>
                                    </div>
                                 } @else if (filteredVendors().length === 0) {
                                    <div class="col-span-full bg-white/80 rounded-[2rem] p-10 text-center border border-slate-100 shadow-sm">
                                       <div class="text-5xl mb-4">🔍</div>
                                       <h3 class="text-lg font-black text-slate-700 mb-1">
                                          Tidak ada vendor yang cocok
                                       </h3>
                                       <p class="text-xs font-bold text-slate-400">
                                          Coba pilih kategori vendor lainnya.
                                       </p>
                                    </div>
                                 }
                              </div>
                              @if (filteredVendors().length > vendorPageSize) {
                                 <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 rounded-3xl p-4 border border-white/60 shadow-sm mt-4">
                                    <div class="text-xs font-bold text-slate-400">
                                       Menampilkan
                                       <span class="text-slate-700">
                                          {{ ((vendorPage() - 1) * vendorPageSize) + 1 }}
                                       </span>
                                       -
                                       <span class="text-slate-700">
                                          {{ Math.min(vendorPage() * vendorPageSize, filteredVendors().length) }}
                                       </span>
                                       dari
                                       <span class="text-slate-700">
                                          {{ filteredVendors().length }}
                                       </span>
                                       vendor
                                    </div>

                                    <div class="flex items-center gap-2">
                                       <button
                                          type="button"
                                          (click)="prevVendorPage()"
                                          [disabled]="vendorPage() === 1"
                                          class="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                                          Prev
                                       </button>

                                       <span class="px-4 py-2 rounded-2xl bg-slate-800 text-white text-xs font-black">
                                          {{ vendorPage() }} / {{ totalVendorPages() }}
                                       </span>

                                       <button
                                          type="button"
                                          (click)="nextVendorPage()"
                                          [disabled]="vendorPage() === totalVendorPages()"
                                          class="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                                          Next
                                       </button>
                                    </div>
                                 </div>
                              }
                           </div>
                     </div>
                  </div>
               }

               @if (activeTab() === 'prewed') {
                  <div class="animate-in slide-in-from-bottom-4 duration-500 pb-24">
                     <h2 class="text-2xl font-serif font-black not-italic tracking-tight text-center mb-6 transition-colors duration-500 text-white">Lokasi Prewed</h2>
                     <div class="flex flex-col md:grid md:grid-cols-12 md:gap-8 items-start">
                           
                           <div class="w-full md:col-span-5 lg:col-span-4 space-y-6 md:sticky md:top-8 z-30">
                              <div id="prewedForm" class="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 relative transition-all duration-300" [class.ring-2]="editingPrewedId() !== null" [class.ring-offset-2]="editingPrewedId() !== null" [style.borderColor]="editingPrewedId() !== null ? currentTheme().color : ''">
                                 <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {{ editingPrewedId() ? 'Edit Lokasi' : 'Tambah Lokasi Baru' }}</h3>
                                 <div class="space-y-3">
                                    <input [(ngModel)]="newPrewed.name" placeholder="Nama Lokasi" class="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all">
                                    <input [(ngModel)]="newPrewed.location_name" placeholder="Alamat Singkat / Kota" class="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all">
                                    <div class="relative">
                                       <span class="absolute left-4 top-4 text-xs font-bold text-slate-400">Rp</span>

                                       <input 
                                          [(ngModel)]="newPrewed.price"
                                          name="prewedPrice"
                                          type="number"
                                          min="0"
                                          placeholder="0"
                                          (focus)="selectAllAmount($event)"
                                          class="w-full p-4 pl-10 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all"
                                       >

                                       <p class="text-[10px] font-bold text-slate-400 -mt-1 px-1 leading-relaxed">
                                          Input harga sewa lokasi sesuai informasi dari PIC / penyewa lokasi.
                                       </p>
                                    </div>
                                    <input [(ngModel)]="newPrewed.maps_link" placeholder="Link Google Maps" class="w-full p-4 bg-slate-50 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all text-blue-500">
                                    <textarea 
                                       [(ngModel)]="newPrewed.note" 
                                       placeholder="Catatan lokasi / informasi tambahan. Bisa isi kontak PIC, link WhatsApp, aturan booking, jam operasional, biaya tambahan, dll." 
                                       rows="3"
                                       class="w-full p-4 bg-slate-50 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all resize-none">
                                    </textarea>
                                    
                                    <div 
                                       class="bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-300 transition-all hover:border-slate-400"
                                       (dragover)="onImageDragOver($event)"
                                       (dragleave)="onImageDragLeave($event)"
                                       (drop)="uploadDroppedImages($event, 'prewed')">
                                       <p class="text-[10px] font-bold text-slate-400 uppercase mb-2">
                                          Galeri Foto (Slide)
                                          <span class="normal-case font-bold text-slate-400">
                                             — drag & drop foto ke sini, geser foto untuk ubah urutan
                                          </span>
                                       </p>
                                       <div class="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                                          @for (img of newPrewed.images; track img; let i = $index) { 
                                             <div 
                                                draggable="true"
                                                (dragstart)="startDragPrewedImage(i)"
                                                (dragover)="onImageDragOver($event)"
                                                (drop)="dropPrewedImageAt(i)"
                                                class="w-16 h-16 shrink-0 relative rounded-lg overflow-hidden group cursor-move border border-slate-200 hover:ring-2 hover:ring-slate-300 transition-all"
                                             >
                                                <img [src]="img.url" [title]="img.originalName" class="w-full h-full object-cover">

                                                <div class="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                                                   {{ i + 1 }}
                                                </div>

                                                <button 
                                                   type="button"
                                                   (click)="removeImageFromPrewed(img.fileName)" 
                                                   class="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                                   ×
                                                </button>
                                             </div> 
                                          }
                                       </div>
                                       <div class="mt-2">
                                          <label class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 rounded-xl text-xs font-bold text-white cursor-pointer hover:bg-slate-700 transition-colors shadow-sm active:scale-95" [class.opacity-50]="isUploading()" [class.pointer-events-none]="isUploading()">
                                             <span *ngIf="!isUploading()">📤</span><span *ngIf="isUploading()" class="animate-spin">⏳</span> {{ isUploading() ? 'Memproses...' : 'Upload Foto' }}
                                             <input 
                                                type="file" 
                                                class="hidden" 
                                                (change)="handlePrewedImageUpload($event)" 
                                                accept="image/*" 
                                                multiple 
                                                [disabled]="isUploading()"
                                             >
                                          </label>

                                           <div *ngIf="isUploading()" class="mt-3 animate-in fade-in slide-in-from-top-1">
                                             <div class="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><span>Mengunggah...</span><span>{{ uploadProgress() }}%</span></div>
                                             <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div class="bg-green-500 h-full transition-all duration-300 ease-out rounded-full" [style.width.%]="uploadProgress()"></div></div>
                                          </div>
                                       </div>
                                    </div>
                                    <div class="flex gap-2 pt-2">
                                       @if (editingPrewedId()) { <button (click)="cancelEditPrewed()" class="flex-1 bg-slate-100 text-slate-500 p-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Batal</button> }
                                       <button (click)="savePrewed()" class="flex-[2] text-white p-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:brightness-110" [style.backgroundColor]="currentTheme().color">{{ editingPrewedId() ? 'Update' : 'Simpan' }}</button>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div class="w-full md:col-span-7 lg:col-span-8 space-y-4 mt-6 md:mt-0">
                              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                 @for (loc of paginatedPrewedLocations(); track loc.id) {
                                    <div 
                                       class="bg-white rounded-[2rem] shadow-md border border-slate-100 overflow-hidden group/slider hover:shadow-xl transition-all duration-300 flex flex-col h-full relative"
                                       [class.ring-4]="editingPrewedId() === loc.id"
                                       [class.ring-2]="loc.selected && editingPrewedId() !== loc.id"
                                       [class.ring-offset-4]="editingPrewedId() === loc.id"
                                       [class.ring-offset-2]="loc.selected && editingPrewedId() !== loc.id"
                                       [class.bg-pink-50]="editingPrewedId() === loc.id"
                                       [style.borderColor]="editingPrewedId() === loc.id ? currentTheme().color : loc.selected ? currentTheme().color : ''"
                                       [style.boxShadow]="editingPrewedId() === loc.id ? '0 0 0 4px rgba(169, 169, 169, 0.2)' : ''"
                                    >
                                    <div *ngIf="loc.selected" class="absolute top-0 right-0 z-30 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                                       ✓ Terpilih
                                    </div>

                                    <!-- IMAGE DI ATAS -->
                                    <div class="w-full h-64 bg-slate-100 relative group/controls overflow-hidden">
                                       @if (loc.images && loc.images.length > 0) {
                                          <div 
                                          class="flex h-full w-full transition-transform duration-700 ease-in-out" 
                                          [style.transform]="'translateX(-' + ((loc.active_index || 0) * 100) + '%)'">
                                          @for (img of loc.images; track img) {
                                             <img [src]="img.url" [title]="img.originalName"
                                                (click)="openPrewedLightbox(loc, $index)"
                                                class="w-full h-full object-cover shrink-0 cursor-pointer hover:scale-105 transition-transform duration-500">
                                          }
                                          </div>

                                          @if (loc.images.length > 1) {
                                          <button 
                                             (click)="manualSlide(loc, 'prev')" 
                                             class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur-sm flex items-center justify-center text-white hover:text-slate-800 transition-all opacity-0 group-hover/controls:opacity-100 z-20 shadow-sm">
                                             <svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
                                          </button>

                                          <button 
                                             (click)="manualSlide(loc, 'next')" 
                                             class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur-sm flex items-center justify-center text-white hover:text-slate-800 transition-all opacity-0 group-hover/controls:opacity-100 z-20 shadow-sm">
                                             <svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>
                                          </button>

                                          <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                                             @for (img of loc.images; track $index) {
                                                <button 
                                                (click)="jumpToSlide(loc, $index)" 
                                                class="w-2 h-2 rounded-full transition-all duration-300 shadow-sm border border-black/10 cursor-pointer hover:scale-125"
                                                [class.bg-white]="(loc.active_index || 0) === $index"
                                                style="background-color: {{(loc.active_index || 0) === $index ? 'white' : 'rgba(255,255,255,0.4)'}}">
                                                </button>
                                             }
                                          </div>
                                          }
                                       } @else {
                                          <div class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                                          <div class="w-16 h-16 rounded-2xl bg-white/70 flex items-center justify-center shadow-sm border border-slate-200">
                                             <span class="text-4xl">🖼️</span>
                                          </div>
                                          <p class="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                             No Image
                                          </p>
                                          </div>
                                       }
                                    </div>

                                    <!-- DETAIL DI BAWAH -->
                                    <div class="p-4 flex flex-col flex-1">
                                       <div class="flex justify-between items-start mb-2">
                                          <div>
                                          <span class="inline-block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                             Lokasi Prewed
                                          </span>
                                          <h4 class="font-bold text-slate-800 text-lg leading-tight">
                                             {{ loc.name }}
                                          </h4>
                                          </div>

                                          <div class="flex gap-1">
                                          <button 
                                             (click)="editPrewed(loc)" 
                                             class="w-7 h-7 rounded-full bg-slate-50 text-blue-500 hover:bg-blue-50 flex items-center justify-center transition-colors" 
                                             title="Edit">
                                             ✎
                                          </button>

                                          <button 
                                             (click)="deletePrewed(loc.id!)" 
                                             class="w-7 h-7 rounded-full bg-slate-50 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors" 
                                             title="Hapus">
                                             ×
                                          </button>
                                          </div>
                                       </div>

                                       <div class="space-y-1 mb-4 flex-1">
                                          <p class="text-xs text-slate-500 font-bold flex items-center gap-1">
                                          <span class="text-slate-400">📍</span> {{ loc.location_name || '-' }}
                                          </p>

                                          @if (loc.maps_link) {
                                          <a 
                                             [href]="loc.maps_link" 
                                             target="_blank" 
                                             class="inline-flex items-center gap-1 text-xs truncate text-blue-500 font-bold hover:underline">
                                             <span class="text-slate-400">🗺️</span> Buka di Maps
                                          </a>
                                          }
                                          @if (loc.note) {
                                             <div class="mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100 relative z-30">
                                                <p class="text-[10px] text-slate-500 italic leading-snug break-words">
                                                   @for (part of parseNoteLinks(loc.note); track $index) {
                                                      @if (part.type === 'link') {
                                                         <a 
                                                            [href]="part.href"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            (click)="$event.stopPropagation()"
                                                            (mousedown)="$event.stopPropagation()"
                                                            class="text-blue-500 font-bold underline not-italic relative z-50 cursor-pointer">
                                                            {{ part.text }}
                                                         </a>
                                                      } @else {
                                                         <span>{{ part.text }}</span>
                                                      }
                                                   }
                                                </p>
                                             </div>
                                          }
                                       </div>

                                       <div class="pt-3 border-t border-slate-50 mt-auto">
                                          <div class="flex justify-between items-end mb-3">
                                          <span class="text-[10px] font-bold text-slate-400">Harga Sewa</span>
                                          <p class="text-lg font-black" [style.color]="currentTheme().color">
                                             Rp {{ loc.price | number:'1.0-0' }}
                                          </p>
                                          </div>

                                          <button 
                                                (click)="togglePrewedSelection(loc.id!)" 
                                                class="w-full py-2.5 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                                [ngClass]="loc.selected 
                                                   ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' 
                                                   : 'bg-slate-800 text-white border-transparent hover:bg-slate-700'"
                                             >
                                                <span *ngIf="loc.selected">× Batalkan</span>
                                                <span *ngIf="!loc.selected">✓ Pilih Lokasi</span>
                                             </button>
                                       </div>
                                    </div>
                                    </div>
                                 }
                                 @if (prewedLocations().length === 0) { 
                                    <div class="col-span-full bg-white/80 rounded-[2rem] p-10 text-center border border-slate-100 shadow-sm">
                                       <div class="flex justify-center">
                                          <ng-lottie
                                             [options]="locationIconOptions"
                                             width="100px"
                                             height="100px">
                                          </ng-lottie>
                                       </div>
                                       <h3 class="text-lg font-black text-slate-700 mb-1">
                                          Data lokasi prewed masih kosong
                                       </h3>
                                       <p class="text-xs font-bold text-slate-400">
                                          Silakan input lokasi prewed pertama kamu melalui form Tambah Lokasi Baru.
                                       </p>
                                    </div> 
                                 }
                              </div>
                              @if (sortedPrewedLocations().length > prewedPageSize) {
                                 <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 rounded-3xl p-4 border border-white/60 shadow-sm mt-4">
                                    <div class="text-xs font-bold text-slate-400">
                                       Menampilkan
                                       <span class="text-slate-700">
                                          {{ ((prewedPage() - 1) * prewedPageSize) + 1 }}
                                       </span>
                                       -
                                       <span class="text-slate-700">
                                          {{ Math.min(prewedPage() * prewedPageSize, sortedPrewedLocations().length) }}
                                       </span>
                                       dari
                                       <span class="text-slate-700">
                                          {{ sortedPrewedLocations().length }}
                                       </span>
                                       lokasi prewed
                                    </div>

                                    <div class="flex items-center gap-2">
                                       <button
                                          type="button"
                                          (click)="prevPrewedPage()"
                                          [disabled]="prewedPage() === 1"
                                          class="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                                          Prev
                                       </button>

                                       <span class="px-4 py-2 rounded-2xl bg-slate-800 text-white text-xs font-black">
                                          {{ prewedPage() }} / {{ totalPrewedPages() }}
                                       </span>

                                       <button
                                          type="button"
                                          (click)="nextPrewedPage()"
                                          [disabled]="prewedPage() === totalPrewedPages()"
                                          class="px-4 py-2 rounded-2xl bg-white border border-slate-100 text-xs font-black text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                                          Next
                                       </button>
                                    </div>
                                 </div>
                              }
                           </div>
                     </div>
                  </div>
               }

               </main>

               @if (lightboxVendor(); as vendor) {
                  <div class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
                     
                     <button (click)="closeLightbox()" class="absolute top-4 right-4 text-white/50 hover:text-white z-50 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                     </button>

                     <div class="relative w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center p-4">
                        
                        <img 
                           [src]="lightboxVendorImages()[lightboxVendorIndex()]"
                           class="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 select-none will-change-transform"
                           [class.transition-transform]="!isDraggingLightbox()"
                           [style.transform]="'translate3d(' + Math.round(lightboxPanX()) + 'px, ' + Math.round(lightboxPanY()) + 'px, 0) scale(' + lightboxZoom() + ')'"
                           [class.cursor-default]="lightboxZoom() === 1"
                           [class.cursor-grab]="lightboxZoom() > 1 && !isDraggingLightbox()"
                           [class.cursor-grabbing]="isDraggingLightbox()"
                           (wheel)="onLightboxWheel($event)"
                           (mousedown)="startLightboxDrag($event)"
                           (mousemove)="moveLightboxDrag($event)"
                           (mouseup)="endLightboxDrag()"
                           (mouseleave)="endLightboxDrag()"
                           (dblclick)="resetLightboxZoom()"
                           draggable="false"
                        >
                        <div class="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-2 rounded-full pointer-events-none">
                           Scroll untuk zoom • Setelah zoom, drag untuk geser • Double click untuk reset
                        </div>
                        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                           {{ lightboxVendorIndex() + 1 }} / {{ vendor.images.length }}
                        </div>

                        @if (vendor.images.length > 1) {
                           <button (click)="slideLightbox('prev')" class="absolute left-2 md:left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95">
                              <svg viewBox="0 0 24 24" class="w-6 h-6 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
                           </button>

                           <button (click)="slideLightbox('next')" class="absolute right-2 md:right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95">
                              <svg viewBox="0 0 24 24" class="w-6 h-6 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>
                           </button>
                        }
                     </div>
                  </div>
               }

               @if (lightboxPrewed(); as loc) {
                  <div class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
                     
                     <button (click)="closePrewedLightbox()" class="absolute top-4 right-4 text-white/50 hover:text-white z-50 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                           <line x1="18" y1="6" x2="6" y2="18"></line>
                           <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                     </button>

                     <div class="relative w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center p-4">
                        
                        <img 
                           [src]="lightboxPrewedImages()[lightboxPrewedIndex()]"
                           class="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 select-none will-change-transform"
                           [class.transition-transform]="!isDraggingLightbox()"
                           [style.transform]="'translate3d(' + Math.round(lightboxPanX()) + 'px, ' + Math.round(lightboxPanY()) + 'px, 0) scale(' + lightboxZoom() + ')'"
                           [class.cursor-default]="lightboxZoom() === 1"
                           [class.cursor-grab]="lightboxZoom() > 1 && !isDraggingLightbox()"
                           [class.cursor-grabbing]="isDraggingLightbox()"
                           (wheel)="onLightboxWheel($event)"
                           (mousedown)="startLightboxDrag($event)"
                           (mousemove)="moveLightboxDrag($event)"
                           (mouseup)="endLightboxDrag()"
                           (mouseleave)="endLightboxDrag()"
                           (dblclick)="resetLightboxZoom()"
                           draggable="false"
                        >

                        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                           {{ lightboxPrewedIndex() + 1 }} / {{ loc.images.length }}
                        </div>

                        @if (loc.images.length > 1) {
                           <button 
                              (click)="slidePrewedLightbox('prev', $event)" 
                              class="absolute left-2 md:left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95">
                              <svg viewBox="0 0 24 24" class="w-6 h-6 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
                           </button>

                           <button 
                              (click)="slidePrewedLightbox('next', $event)" 
                              class="absolute right-2 md:right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95">
                              <svg viewBox="0 0 24 24" class="w-6 h-6 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>
                           </button>
                        }
                     </div>
                  </div>
               }

               <!-- Bottom Navigation (Fixed Compact on All Screens) -->
               @if (!isBroadcastMode()) {
               <nav class="fixed bottom-5 left-4 right-4 max-w-md mx-auto z-50 pointer-events-none">
                  <div class="bg-white/95 backdrop-blur-xl rounded-[2.5rem] border border-white/50 flex justify-between items-center shadow-2xl shadow-slate-300/50 pointer-events-auto px-1.5 py-1">
                     @for (menu of menuItems; track menu.id) {
                     <button 
                        (click)="activeTab.set(menu.id)" 
                        class="flex flex-col items-center justify-center w-full min-h-[68px] py-2 rounded-[2rem] transition-all duration-300 group relative"
                        [class.active]="activeTab() === menu.id">
                        <span *ngIf="activeTab() === menu.id" class="absolute top-0 w-7 h-1 rounded-b-lg transition-colors duration-300 shadow-sm" [style.backgroundColor]="currentTheme().color"></span>
                        <div class="w-[2.125rem] h-[2.125rem] flex items-center justify-center rounded-full mb-1 transition-all duration-300 group-hover:-translate-y-0.5" [style.color]="activeTab() === menu.id ? currentTheme().color : '#cbd5e1'">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" [innerHTML]="getSafeSvg(menu.iconPath)" class="w-[1.375rem] h-[1.375rem] fill-current drop-shadow-sm"></svg>
                        </div>
                        <span class="text-[8px] font-black uppercase tracking-[0.12em] leading-none transition-all duration-300" [class.scale-100]="activeTab() === menu.id" [class.scale-95]="activeTab() !== menu.id" [style.color]="activeTab() === menu.id ? currentTheme().color : '#94a3b8'">{{ menu.label }}</span>
                     </button>
                     }
                  </div>
               </nav>
               }
            </div>
         }
      `,
   styles: [`
      .font-serif { font-family: Georgia, 'Times New Roman', Times, serif; }
      .animate-in { animation: fadeIn 0.5s ease-out; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      
      /* Animation Utility Helpers */
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      
      .slide-in-from-bottom-4 { animation: slideUp 0.5s ease-out; }
      .zoom-in-95 { animation: zoomIn 0.3s ease-out; }
      
      .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      .header-grid-overlay {
         background-image:
            linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px);
         background-size: 20% 20%;
         mix-blend-mode: screen;
         opacity: 0;
      }
   `]
})
export class App implements OnInit, OnDestroy {
   Math = Math;

   private sanitizer = inject(DomSanitizer);
   private cdr = inject(ChangeDetectorRef);
   public authService = inject(AuthService);
   private dataService = inject(DataService);
   private http = inject(HttpClient);
   private router = inject(Router);

   // Identity & Theme
   weddingTitle = signal('The Wedding of Us');
   isEditingTitle = signal(false);
   tempTitle = '';
   headerImage = signal<string | null>(null);
   headerImagePosX = signal(50);
   headerImagePosY = signal(50);
   isHeaderImageEditMode = signal(false);
   isHeaderImageDragging = signal(false);
   private headerImageDragState: {
      active: boolean;
      pointerId: number | null;
      startClientX: number;
      startClientY: number;
      startPosX: number;
      startPosY: number;
    } = {
      active: false,
      pointerId: null,
      startClientX: 0,
      startClientY: 0,
      startPosX: 50,
      startPosY: 50
   };
   selectedThemeId = signal<string>(localStorage.getItem('user_theme') || 'gold');
   private getInitialThemes(): Theme[] {
      const savedThemeObject = localStorage.getItem('user_theme_object');

      if (savedThemeObject) {
         try {
            return [JSON.parse(savedThemeObject)];
         } catch {
            localStorage.removeItem('user_theme_object');
         }
      }

      return [
         {
            id: 'gold',
            name: 'Gold Luxury',
            color: '#D4AF37',
            header: 'linear-gradient(135deg, #D4AF37 0%, #997F29 100%)',
            bg: '#FDFBF7',
            accent: '#F3E5AB'
         }
      ];
   }
   themes = signal<Theme[]>(this.getInitialThemes());
   budgetIconOptions: AnimationOptions = {
      path: '/lottie/budget.json',
      loop: true,
      autoplay: true
   };
   calendarIconOptions: AnimationOptions = {
      path: '/lottie/calendar.json',
      loop: true,
      autoplay: true
   };
   notifIconOptions: AnimationOptions = {
      path: '/lottie/notifbell.json',
      loop: true,
      autoplay: true
   };
   walletIconOptions: AnimationOptions = {
      path: '/lottie/wallet.json',
      loop: true,
      autoplay: true
   };
   wallet2IconOptions: AnimationOptions = {
      path: '/lottie/wallet2.json',
      loop: true,
      autoplay: true
   };
   checklistIconOptions: AnimationOptions = {
      path: '/lottie/checklist.json',
      loop: true,
      autoplay: true
   };
   checklist2IconOptions: AnimationOptions = {
      path: '/lottie/checklist2.json',
      loop: true,
      autoplay: true
   };
   favoriteIconOptions: AnimationOptions = {
      path: '/lottie/heart.json',
      loop: true,
      autoplay: true
   };
   userIconOptions: AnimationOptions = {
      path: '/lottie/user.json',
      loop: true,
      autoplay: true
   };
   forvendorIconOptions: AnimationOptions = {
      path: '/lottie/couplewedding.json',
      loop: true,
      autoplay: true
   };
   locationIconOptions: AnimationOptions = {
      path: '/lottie/location.json',
      loop: true,
      autoplay: true
   };

   currentTheme = computed(() => this.themes().find(t => t.id === this.selectedThemeId()) || this.themes()[0]);
   headerImageObjectPosition = computed(() => `${this.headerImagePosX()}% ${this.headerImagePosY()}%`);
   headerBackgroundStyle = computed(() => {
      const img = this.headerImage();
      const posX = this.headerImagePosX();
      const posY = this.headerImagePosY();
      return img ? `url(${this.buildUploadsUrl(img)}) ${posX}% ${posY}% / cover no-repeat` : this.currentTheme().header;
   });

   // App State
   publicPage = signal<'home' | 'login'>('home');
   activeTab = signal<string>('summary');
   isEditingBudget = signal(false);
   isBroadcastMode = signal(false); 
   isAutoBroadcasting = signal(false);
   
   isInitialLoading = signal(true);
   hasLoadedData = signal(false);

   private idleTimeout: any = null;
   private readonly idleLimitMs = 60 * 60 * 1000; // 60 menit

   // Edit IDs (Database uses serial integers)
   editingGuestId = signal<number | null>(null);
   editingExpenseId = signal<number | null>(null);
   editingPrewedId = signal<number | null>(null);
   editingVendorId = signal<number | null>(null);

   showCategoryManager = signal(false);
   showVendorCategoryManager = signal(false);
   showGuestCategoryManager = signal(false);
   broadcastTemplate = signal('Halo {name}, kami mengundang Anda untuk hadir di acara pernikahan kami. Mohon doa restu Anda. Terima kasih!');
   allowResend = signal(false);
   weddingDate = signal(this.getTodayDate());

   formatDisplayDateLong(dateString: string): string {
      if (!dateString) return '-';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const [year, month, day] = dateString.split('-');
      const monthName = months[parseInt(month) - 1];
      return `${parseInt(day)} ${monthName} ${year}`;
   }
   openDatePicker(input: HTMLInputElement) {
      const pickerInput = input as HTMLInputElement & { showPicker?: () => void };

      if (pickerInput.showPicker) {
         pickerInput.showPicker();
      } else {
         pickerInput.click();
      }
   }

   // Upload State
   uploadProgress = signal(0);
   isUploading = signal(false);

   draggedVendorImageIndex = signal<number | null>(null);
   draggedPrewedImageIndex = signal<number | null>(null);

   // Pagination State
   broadcastPage = signal(1);
   broadcastPageSize = 5;

   guestPage = signal(1);
   guestPageSize = 20;

   vendorPage = signal(1);
   vendorPageSize = 12;

   prewedPage = signal(1);
   prewedPageSize = 6;

   // Filters & Search
   searchQuery = signal('');
   filterSide = signal<'ALL' | 'CPP' | 'CPW'>('ALL');
   filterCategory = signal('ALL');
   // Filter WhatsApp Status
   filterWhatsApp = signal<'ALL' | 'SENT' | 'UNSENT'>('ALL');

   // Expense Filter Signals
   filterExpenseCategory = signal('ALL');
   filterExpenseStatus = signal<'ALL' | 'Belum' | 'DP' | 'Lunas'>('ALL');
   expenseSearch = signal('');
   expensePage = signal(1);
   expensePageSize = 15;

   // Todo Filter Signals
   filterTodoStatus = signal<'ALL' | 'PENDING' | 'DONE'>('ALL');

   todoSearch = signal('');
   todoPage = signal(1);
   todoPageSize = 15;
   quickTodoSuccessMessage = signal('');
   quickTodoSuccessFading = signal(false);

   completedTodosCount = computed(() => {
      return this.todos().filter(todo => todo.completed).length;
   });

   pendingTodosCount = computed(() => {
      return this.todos().filter(todo => !todo.completed).length;
   });

   todoProgressPercentage = computed(() => {
      const total = this.todos().length;
   if (total === 0) return 0;

   return Math.round((this.completedTodosCount() / total) * 100);
   });

   filteredTodos = computed(() => {
      const filter = this.filterTodoStatus();
      const keyword = this.todoSearch().trim().toLowerCase();

      let result = [...this.todos()];

      if (filter === 'DONE') {
         result = result.filter(todo => todo.completed);
      } else if (filter === 'PENDING') {
         result = result.filter(todo => !todo.completed);
      }

      if (keyword) {
         result = result.filter(todo =>
            (todo.task || '').toLowerCase().includes(keyword)
         );
      }

      return result.sort((a, b) => {
         // Prioritas 1: tugas belum selesai di atas
         const completedA = a.completed ? 1 : 0;
         const completedB = b.completed ? 1 : 0;

         if (completedA !== completedB) {
            return completedA - completedB;
         }

         // Prioritas 2: tugas terbaru di atas
         return Number(b.id || 0) - Number(a.id || 0);
      });
   });
   paginatedTodos = computed(() => {
      const page = this.todoPage();
      const start = (page - 1) * this.todoPageSize;
      const end = start + this.todoPageSize;

      return this.filteredTodos().slice(start, end);
   });

   totalTodoPages = computed(() => {
      const total = this.filteredTodos().length;
      return Math.max(1, Math.ceil(total / this.todoPageSize));
   });

   // Filter Active Helper
   isFilterActive = (status: 'Belum' | 'DP' | 'Lunas') => {
      const filter = this.filterExpenseStatus();
      if (filter === 'Belum') return status === 'Belum' || status === 'DP';
      return filter === status;
   };

   // --- REAL DATA SIGNALS (Initial Empty) ---
   totalBudget = signal(100000000);
   expenses = signal<Expense[]>([]);
   guests = signal<Guest[]>([]);
   todos = signal<Todo[]>([]);
   vendors = signal<Vendor[]>([]);
   prewedLocations = signal<PrewedLocation[]>([]);

   // Forms (Partial Models)
   newGuest: Partial<Guest> = { name: '', phone: '', side: 'CPP', category: 'Keluarga' };
   newExpense: Partial<Expense> = { 
      item: '', 
      amount: 0, 
      category: '', 
      status: 'Belum', 
      date: this.getTodayDate(), 
      note: '', 
      checked: false 
   };
   newVendor: Partial<Vendor> & { images: { fileName: string; originalName: string; url: string }[] } = {
      name: '',
      category: '',
      location: '',
      social_link: '',
      images: [],
      price: 0,
      selected: false
   };

   newPrewed: PrewedLocation & { images: { fileName: string; originalName: string; url: string }[] } = {
      name: '',
      location_name: '',
      maps_link: '',
      note: '',
      price: 0,
      images: [],
      selected: false,
      active_index: 0
   };

   // ==========================================
   // LIGHTBOX VENDOR
   // ==========================================
   
   // 1. State untuk Modal
   lightboxVendor = signal<Vendor | null>(null); // Vendor mana yang dibuka?
   lightboxVendorIndex = signal(0); // Foto urutan keberapa?
   lightboxVendorImages = signal<string[]>([]); // Array URL foto vendor yang sedang dibuka


   // Zoom + Pan untuk lightbox Vendor dan Prewed
   lightboxZoom = signal(1);
   lightboxPanX = signal(0);
   lightboxPanY = signal(0);
   isDraggingLightbox = signal(false);
   private quickTodoSuccessTimeout: ReturnType<typeof setTimeout> | null = null;
   private quickTodoSuccessFadeTimeout: ReturnType<typeof setTimeout> | null = null;

   private lightboxDragStartX = 0;
   private lightboxDragStartY = 0;
   private lightboxStartPanX = 0;
   private lightboxStartPanY = 0;

   // 2. Buka Modal
   openLightbox(vendor: Vendor, index: number) {
      this.lightboxVendor.set(vendor);
      this.lightboxVendorImages.set((vendor.images || []).map(img => img.url));
      this.lightboxVendorIndex.set(index);
      this.resetLightboxZoom();
      document.body.style.overflow = 'hidden';
   }

   // 3. Tutup Modal
   closeLightbox() {
      this.lightboxVendor.set(null);
      this.lightboxVendorIndex.set(0);
      this.lightboxVendorImages.set([]);
      this.resetLightboxZoom();
      document.body.style.overflow = 'auto';
   }
   //Pada saat user open lighbox image Vendor, tekan ESC untuk menutup modal
   @HostListener('window:keydown', ['$event'])
   handleKeyboardEvent(event: KeyboardEvent) {
      // aktivitas keyboard tetap reset idle timer
      this.resetIdleTimer();

      const isLightboxOpen = this.lightboxVendor() || this.lightboxPrewed();

      if (isLightboxOpen && ['Escape', 'ArrowRight', 'ArrowLeft'].includes(event.key)) {
         event.preventDefault();
         event.stopPropagation();
      }

      // Lightbox Vendor
      if (this.lightboxVendor()) {
         if (event.key === 'Escape') {
            this.closeLightbox();
            return;
         }

         if (event.key === 'ArrowRight') {
            this.slideLightbox('next');
            return;
         }

         if (event.key === 'ArrowLeft') {
            this.slideLightbox('prev');
            return;
         }

         if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            this.zoomLightboxIn();
            return;
         }

         if (event.key === '-') {
            event.preventDefault();
            this.zoomLightboxOut();
            return;
         }

         if (event.key === '0') {
            event.preventDefault();
            this.resetLightboxZoom();
            return;
         }
      }

      // Lightbox Prewed
      if (this.lightboxPrewed()) {
         if (event.key === 'Escape') {
            this.closePrewedLightbox();
            return;
         }

         if (event.key === 'ArrowRight') {
            this.slidePrewedLightbox('next');
            return;
         }

         if (event.key === 'ArrowLeft') {
            this.slidePrewedLightbox('prev');
            return;
         }

         if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            this.zoomLightboxIn();
            return;
         }

         if (event.key === '-') {
            event.preventDefault();
            this.zoomLightboxOut();
            return;
         }

         if (event.key === '0') {
            event.preventDefault();
            this.resetLightboxZoom();
            return;
         }
      }

      // Modal Broadcast
      if (event.key === 'Escape' && this.isBroadcastMode()) {
         this.closeBroadcastModal();
      }
   }
   // 4. Slide Manual di dalam Modal
   slideLightbox(direction: 'prev' | 'next') {
      const images = this.lightboxVendorImages();
      if (!images.length) return;

      const current = this.lightboxVendorIndex();
      const total = images.length;

      let nextIndex = direction === 'next'
         ? (current + 1) % total
         : (current - 1 + total) % total;

      this.lightboxVendorIndex.set(nextIndex);
      this.resetLightboxZoom();
   }
   zoomLightboxIn() {
      this.lightboxZoom.update(value => Math.min(value + 0.2, 3));
   }

   zoomLightboxOut() {
      this.lightboxZoom.update(value => {
         const nextValue = Math.max(value - 0.2, 1);

         if (nextValue === 1) {
            this.lightboxPanX.set(0);
            this.lightboxPanY.set(0);
         }

         return nextValue;
      });
   }

   resetLightboxZoom() {
      this.lightboxZoom.set(1);
      this.lightboxPanX.set(0);
      this.lightboxPanY.set(0);
      this.isDraggingLightbox.set(false);
   }
   onLightboxWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();

      if (event.deltaY < 0) {
         this.zoomLightboxIn();
      } else {
         this.zoomLightboxOut();
      }
   }

   startLightboxDrag(event: MouseEvent) {
      if (this.lightboxZoom() <= 1) {
         return;
      }

      event.preventDefault();
      event.stopPropagation();

      this.isDraggingLightbox.set(true);

      this.lightboxDragStartX = event.clientX;
      this.lightboxDragStartY = event.clientY;

      this.lightboxStartPanX = this.lightboxPanX();
      this.lightboxStartPanY = this.lightboxPanY();
   }

   moveLightboxDrag(event: MouseEvent) {
      if (!this.isDraggingLightbox()) {
         return;
      }

      event.preventDefault();
      event.stopPropagation();

      const deltaX = event.clientX - this.lightboxDragStartX;
      const deltaY = event.clientY - this.lightboxDragStartY;

      requestAnimationFrame(() => {
         this.lightboxPanX.set(this.lightboxStartPanX + deltaX);
         this.lightboxPanY.set(this.lightboxStartPanY + deltaY);
      });
   }

   endLightboxDrag() {
      this.isDraggingLightbox.set(false);
   }
   

   // ==========================================
   // LIGHTBOX PREWED
   // ==========================================

   // 1. State untuk Modal Prewed
   lightboxPrewed = signal<PrewedLocation | null>(null);
   lightboxPrewedIndex = signal(0);
   lightboxPrewedImages = signal<string[]>([]);

   // 2. Buka Modal Prewed
   openPrewedLightbox(prewed: PrewedLocation, index: number) {
      this.lightboxPrewed.set(prewed);
      this.lightboxPrewedImages.set((prewed.images || []).map(img => img.url));
      this.lightboxPrewedIndex.set(index);
      this.resetLightboxZoom();
      document.body.style.overflow = 'hidden';
   }

   // 3. Tutup Modal Prewed
   closePrewedLightbox() {
      this.lightboxPrewed.set(null);
      this.lightboxPrewedIndex.set(0);
      this.lightboxPrewedImages.set([]);
      this.resetLightboxZoom();
      document.body.style.overflow = 'auto';
   }

   // 4. Slide Manual di dalam Modal Prewed
   slidePrewedLightbox(direction: 'prev' | 'next', event?: Event) {
      if (event) event.stopPropagation();

      const loc = this.lightboxPrewed();
      if (!loc || !loc.images) return;

      const total = loc.images.length;
      const current = this.lightboxPrewedIndex();
      let next = 0;

      if (direction === 'next') {
         next = (current + 1) % total;
      } else {
         next = (current - 1 + total) % total;
      }

      this.lightboxPrewedIndex.set(next);
      this.resetLightboxZoom();
   }

   // Local Categories
   guestCategories = signal<string[]>(['Keluarga', 'Teman SMA', 'Teman Kuliah', 'Rekan Kerja', 'Bestie', 'VIP', 'Lainnya']);
   defaultExpenseCategories = [
      'Venue',
      'Catering',
      'Pakaian',
      'Prewedding',
      'Cincin',
      'Seserahan',
      'Lainnya'
   ];

   expenseCategories = signal<string[]>(
      JSON.parse(localStorage.getItem('expense_categories') || 'null') 
      || this.defaultExpenseCategories
   );

   vendorCategories = signal<VendorCategory[]>([]);
      
   menuItems: MenuItem[] = [
      { 
         id: 'summary', 
         label: 'Summary', 
         iconPath: '<path d="M5 3h6a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm10 0h4a2 2 0 012 2v2a2 2 0 01-2 2h-4a2 2 0 01-2-2V5a2 2 0 012-2zM5 13h4a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2zm8-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-6a2 2 0 01-2-2v-6a2 2 0 012-2z"/>' 
      },
      { 
         id: 'expenses', 
         label: 'Pengeluaran', 
         iconPath: '<path d="M20 4H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zM4 6h16v2H4V6zm0 12v-6h16.001l.001 6H4z"/><path d="M6 14h6v2H6z"/>' 
      },
      { 
         id: 'guests', 
         label: 'Tamu', 
         iconPath: '<path d="M16.604 11.048a5.67 5.67 0 0 0 .751-3.44c-.179-1.784-1.175-3.361-2.803-4.44l-1.105 1.666c1.119.742 1.8 1.799 1.918 2.974a3.693 3.693 0 0 1-1.072 2.986l-1.192 1.192 1.618.475C18.951 13.701 19 17.957 19 18h2c0-1.789-.956-5.285-4.396-6.952z"/><path d="M9.5 12c2.206 0 4-1.794 4-4s-1.794-4-4-4-4 1.794-4 4 1.794 4 4 4zm0-6c1.103 0 2 .897 2 2s-.897 2-2 2-2-.897-2-2 .897-2 2-2zm1.5 7H8c-3.309 0-6 2.691-6 6v1h2v-1c0-2.206 1.794-4 4-4h3c2.206 0 4 1.794 4 4v1h2v-1c0-3.309-2.691-6-6-6z"/>' 
      },
      { 
         id: 'todos', 
         label: 'To-Do', 
         iconPath: '<path d="M5 22h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2h-2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1H5c-1.103 0-2 .897-2 2v15c0 1.103.897 2 2 2zM5 5h2v2h10V5h2v15H5V5z"/><path d="m11 13.586-1.793-1.793-1.414 1.414L11 16.414l5.207-5.207-1.414-1.414z"/>' 
      },
      { 
         id: 'vendors', 
         label: 'Vendor', 
         iconPath: '<path d="M3 9l1.5-5h15L21 9v1a2.5 2.5 0 01-4 2 2.5 2.5 0 01-4 0 2.5 2.5 0 01-4 0 2.5 2.5 0 01-4 0A2.5 2.5 0 013 10V9zm2 4.5h14V20a1 1 0 01-1 1h-3v-4H9v4H6a1 1 0 01-1-1v-6.5z"/>' 
      },
      { 
         id: 'prewed', 
         label: 'Lokasi', 
         iconPath: '<path d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10zm0-7a3 3 0 100-6 3 3 0 000 6z"/>' 
      },
   ];

   // Computed Logic
   totalExpense = computed(() => this.expenses().reduce((sum, e) => sum + (+e.amount), 0));
   remainingBudget = computed(() => this.totalBudget() - this.totalExpense());
   highestCategory = computed(() => {
      const expenses = this.expenses();
      if (expenses.length === 0) return null;

      // 1. Grouping & Summing
      const totals: Record<string, number> = {};
      expenses.forEach(e => {
         const amount = Number(e.amount) || 0;
         if (totals[e.category]) {
            totals[e.category] += amount;
         } else {
            totals[e.category] = amount;
         }
      });

      // 2. Cari Nilai Max
      let maxCat = '';
      let maxVal = 0;
      for (const [cat, val] of Object.entries(totals)) {
         if (val > maxVal) {
            maxVal = val;
            maxCat = cat;
         }
      }

      if (maxVal === 0) return null;

      // 3. Return Data
      return {
         name: maxCat,
         amount: maxVal,
         percentage: (maxVal / (this.totalBudget() || 1)) * 100 // Avoid division by zero
      };
   });
   getCompletionPercentage = computed(() => {
      const total = this.totalBudget();
      if (total <= 0) return 0;
      const used = this.totalExpense();
      return Math.min((used / total) * 100, 100);
   });
   
   // Selected Items Computed
   getSelectedVendors = computed(() => this.vendors().filter(v => v.selected));
   getSelectedPrewedLocations = computed(() => this.prewedLocations().filter(l => l.selected));
   getTotalSelectedCost = computed(() => {
      const vendorCost = this.getSelectedVendors().reduce((sum, v) => sum + (+v.price || 0), 0);
      const prewedCost = this.getSelectedPrewedLocations().reduce((sum, l) => sum + (+l.price || 0), 0);
      return vendorCost + prewedCost;
   });

   // Filtered Expenses
   filteredExpenses = computed(() => {
      const keyword = this.expenseSearch().trim().toLowerCase();

      return [...this.expenses()]
         .sort((a, b) => {
            // Prioritas utama: id terbaru di atas
            const idA = Number(a.id || 0);
            const idB = Number(b.id || 0);

            if (idA !== idB) {
               return idB - idA;
            }

            // Fallback kalau id tidak tersedia: tanggal terbaru di atas
            const dateA = new Date(a.date || '').getTime() || 0;
            const dateB = new Date(b.date || '').getTime() || 0;

            return dateB - dateA;
         })
         .filter(exp => {
            const statusFilter = this.filterExpenseStatus();

            let matchStatus = true;

            if (statusFilter === 'Belum') {
               matchStatus = exp.status === 'Belum' || exp.status === 'DP';
            } else if (statusFilter === 'DP') {
               matchStatus = exp.status === 'DP';
            } else if (statusFilter === 'Lunas') {
               matchStatus = exp.status === 'Lunas';
            }

            const categoryFilter = this.filterExpenseCategory();
            const matchCategory = categoryFilter === 'ALL' || exp.category === categoryFilter;

            const searchableText = [
               exp.item,
               exp.category,
               exp.status,
               exp.note,
               exp.date,
               String(exp.amount || '')
            ]
               .join(' ')
               .toLowerCase();

            const matchSearch = !keyword || searchableText.includes(keyword);

            return matchStatus && matchCategory && matchSearch;
         });
   });

   // ExpendsPagination

   paginatedExpenses = computed(() => {
      const page = this.expensePage();
      const start = (page - 1) * this.expensePageSize;
      const end = start + this.expensePageSize;

      return this.filteredExpenses().slice(start, end);
   });

   totalExpensePages = computed(() => {
      const total = this.filteredExpenses().length;
      return Math.max(1, Math.ceil(total / this.expensePageSize));
   });

   // Filtered Guests
   filteredGuests = computed(() => {
      let result = [...this.guests()];

      if (this.filterSide() !== 'ALL') {
         result = result.filter(g => g.side === this.filterSide());
      }

      if (this.filterCategory() !== 'ALL') {
         result = result.filter(g => g.category === this.filterCategory());
      }

      if (this.filterWhatsApp() === 'SENT') {
         result = result.filter(g => g.invited === true);
      } else if (this.filterWhatsApp() === 'UNSENT') {
         result = result.filter(g => !g.invited && g.phone);
      }

      if (this.searchQuery().trim()) {
         const keyword = this.searchQuery().trim().toLowerCase();

         result = result.filter(g =>
            [
               g.name,
               g.phone,
               g.side,
               g.category
            ]
               .join(' ')
               .toLowerCase()
               .includes(keyword)
         );
      }

      return result.sort((a, b) => {
         // Prioritas 1: yang belum dikirim WA tampil di atas
         const invitedA = a.invited ? 1 : 0;
         const invitedB = b.invited ? 1 : 0;

         if (invitedA !== invitedB) {
            return invitedA - invitedB;
         }

         // Prioritas 2: tamu terbaru tampil paling atas
         return Number(b.id || 0) - Number(a.id || 0);
      });
   });

   paginatedGuests = computed(() => {
      const page = this.guestPage();
      const start = (page - 1) * this.guestPageSize;
      const end = start + this.guestPageSize;

      return this.filteredGuests().slice(start, end);
   });

   totalGuestPages = computed(() => {
      const total = this.filteredGuests().length;
      return Math.max(1, Math.ceil(total / this.guestPageSize));
   });

   selectedGuestsForBroadcast = computed(() => this.filteredGuests().filter(g => g.selected));

   // Filter Vendor
   selectedFilter = signal<string>('Semua');
   vendorCompleteness = computed(() => {
      const selectedVendors = this.getSelectedVendors();
      const mainCategories = this.mainChecklistCategories();

      return mainCategories.map(cat => {
         const isFound = selectedVendors.some(v =>
            v.category?.trim().toLowerCase() === cat.name.trim().toLowerCase()
         );

         return {
            category: cat.name,
            fulfilled: isFound
         };
      });
   });
   isAllVendorsComplete = computed(() => {
      const items = this.vendorCompleteness();
      return items.length > 0 && items.every(item => item.fulfilled);
   });
   filteredVendors = computed(() => {
      const filter = this.selectedFilter();

      let vendors = [...this.vendors()];

      if (filter !== 'Semua') {
         vendors = vendors.filter(v => v.category === filter);
      }

      return vendors.sort((a, b) => {
         // Prioritas 1: vendor yang terpilih tampil di atas
         const selectedA = a.selected ? 1 : 0;
         const selectedB = b.selected ? 1 : 0;

         if (selectedA !== selectedB) {
            return selectedB - selectedA;
         }

         // Prioritas 2: vendor terbaru tampil paling atas
         return Number(b.id || 0) - Number(a.id || 0);
      });
   });
   paginatedVendors = computed(() => {
      const page = this.vendorPage();
      const start = (page - 1) * this.vendorPageSize;
      const end = start + this.vendorPageSize;

      return this.filteredVendors().slice(start, end);
   });

   totalVendorPages = computed(() => {
      const total = this.filteredVendors().length;
      return Math.max(1, Math.ceil(total / this.vendorPageSize));
   });

   totalPrewedPages = computed(() => {
      return Math.max(1, Math.ceil(this.sortedPrewedLocations().length / this.prewedPageSize));
   });

   paginatedPrewedLocations = computed(() => {
      const start = (this.prewedPage() - 1) * this.prewedPageSize;
      const end = start + this.prewedPageSize;

      return this.sortedPrewedLocations().slice(start, end);
   });

   mainChecklistCategories = computed(() => {
      return this.vendorCategories().filter(cat => cat.is_main_checklist);
   });

   mainChecklistCount = computed(() => {
      return this.mainChecklistCategories().length;
   });

   // Dashboard Stats
   getDaysLeft = computed(() => {
      const dateString = this.weddingDate();
      if (!dateString) return 0;
      const [year, month, day] = dateString.split('-').map(Number);
      const target = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      const diff = target.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 3600 * 24));
   });
   getTotalGuestPax = computed(() => this.guests().reduce((sum, g) => sum + (+g.pax || 1), 0));
   getCPPPax = computed(() => this.guests().filter(g => g.side === 'CPP').reduce((sum, g) => sum + (+g.pax || 1), 0));
   getCPWPax = computed(() => this.guests().filter(g => g.side === 'CPW').reduce((sum, g) => sum + (+g.pax || 1), 0));
   getPendingTodosCount = computed(() => this.todos().filter(t => !t.completed).length);
   getTodoPercentage = computed(() => {
      const total = this.todos().length;
      if (total === 0) return 0;
      const completed = this.todos().filter(t => t.completed).length;
      return (completed / total) * 100;
   });
   getUnpaidCount = computed(() => this.expenses().filter(e => e.status !== 'Lunas').length);

   // PAGINATION BROADCAST
   paginatedBroadcastGuests = computed(() => {
      const all = this.selectedGuestsForBroadcast();
      const start = (this.broadcastPage() - 1) * this.broadcastPageSize;
      return all.slice(start, start + this.broadcastPageSize);
   });
   broadcastQueue = computed(() => {
      const selected = this.selectedGuestsForBroadcast();
      return this.allowResend() ? selected : selected.filter(g => !g.invited);
   });
   totalBroadcastPages = computed(() => Math.ceil(this.selectedGuestsForBroadcast().length / this.broadcastPageSize));
   areAllFilteredGuestsSelected = computed(() => { const v = this.filteredGuests(); return v.length > 0 && v.every(g => !!g.selected); });
   nextPendingGuest = computed(() => this.broadcastQueue()[0] ?? null);
   queueTotal = computed(() => {
      const guests = this.selectedGuestsForBroadcast();
      return guests.filter(g => this.allowResend() ? true : !g.invited).length;
   });
   sentCount = computed(() => 
      this.selectedGuestsForBroadcast().length - this.queueTotal());

   // WHATSAPP METHODS 

   getWhatsAppStats = computed(() => {
      const allGuests = this.guests();
      const withPhone = allGuests.filter(g => g.phone);
      const sent = withPhone.filter(g => g.invited).length;
      const unsent = withPhone.length - sent;
      return { sent, unsent, total: withPhone.length };
   });

   getSelectedCount() { return this.selectedGuestsForBroadcast().length; }

   getTodayDate(): string {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
   }

   // ==========================================
  // LIFECYCLE & INIT
  // ==========================================

   constructor() {
      effect(() => {
         const user = this.authService.currentUser();

         if (user && user.role === 'user') {
            if (!this.hasLoadedData()) {
               this.isInitialLoading.set(true);
            }

            this.loadThemes();
            this.loadData();
            this.resetIdleTimer();
         }
      });
   }

   ngOnInit() {
      const params = new URLSearchParams(window.location.search);

      if (params.get('logout') === 'true') {
         this.authService.logout();
      }

      if (params.get('openLogin') === 'true') {
         this.publicPage.set('login');

         window.history.replaceState({}, document.title, window.location.pathname);
      }
      this.tempTitle = this.weddingTitle(); 
      this.startImageSlider();
   }

   @HostListener('window:mousemove')
   @HostListener('window:mousedown')
   @HostListener('window:scroll')
   @HostListener('window:touchstart')
   onUserActivity() {
      this.resetIdleTimer();
   }
   
   ngOnDestroy() {
      if (this.idleTimeout) {
         clearTimeout(this.idleTimeout);
         this.idleTimeout = null;
      }

      if (this.quickTodoSuccessTimeout) {
         clearTimeout(this.quickTodoSuccessTimeout);
         this.quickTodoSuccessTimeout = null;
      }

      if (this.quickTodoSuccessFadeTimeout) {
         clearTimeout(this.quickTodoSuccessFadeTimeout);
         this.quickTodoSuccessFadeTimeout = null;
      }

      if (this.vendorSliderInterval) {
         clearInterval(this.vendorSliderInterval);
         this.vendorSliderInterval = null;
      }

      if (this.sliderInterval) {
         clearInterval(this.sliderInterval);
         this.sliderInterval = null;
      }
   }

   // LOAD DATA
   loadThemes() {
      this.dataService.getThemes().subscribe({
         next: (data) => {
            if (data && data.length > 0) {
            this.themes.set(data);

            const selectedTheme = data.find(t => t.id === this.selectedThemeId());
            if (selectedTheme) {
               localStorage.setItem('user_theme_object', JSON.stringify(selectedTheme));
            }
            }
         },
         error: (err) => console.error('Failed to load themes', err)
      });
   }
   // --- LOAD DATA FROM BACKEND ---
   loadData() {
      const user = this.authService.currentUser();

      if (!user || user.role !== 'user') {
         return;
      }

      const uid = user.id;
      const firstLoad = !this.hasLoadedData();

      if (firstLoad) {
         this.isInitialLoading.set(true);
      }

      // Load Summary
      this.dataService.getSummary(uid).subscribe({
         next: (summary) => {
            if (summary) {
               this.weddingTitle.set(summary.wedding_title || 'The Wedding of Us');
               this.weddingDate.set(summary.wedding_date || this.getTodayDate());
               this.totalBudget.set(Number(summary.total_budget) || 0);
               this.headerImage.set(summary.header_image || null);
               this.headerImagePosX.set(Number(summary.header_image_pos_x ?? 50));
               this.headerImagePosY.set(Number(summary.header_image_pos_y ?? 50));

               if (summary.theme_id) {
                  this.selectedThemeId.set(summary.theme_id);
                  localStorage.setItem('user_theme', summary.theme_id);
               }
            }
         },
         error: (err) => console.error('Gagal load summary:', err)
      });

      // Load Vendor Categories
      this.dataService.getVendorCategories(uid).subscribe({
         next: (cats) => {
            if (Array.isArray(cats)) this.vendorCategories.set(cats);
         },
         error: (err) => console.error('Gagal load kategori vendor:', err)
      });

      // Load Expenses
      this.dataService.getExpenses(uid).subscribe({
         next: (data) => {
            if (Array.isArray(data)) this.expenses.set(data);
         },
         error: (err) => console.error('Gagal load pengeluaran:', err)
      });

      // Load Guests
      this.dataService.getGuests(uid).subscribe({
         next: (data) => {
            if (Array.isArray(data)) this.guests.set(data);
         },
         error: (err) => console.error('Gagal load tamu:', err)
      });

      // Load Todos
      this.dataService.getTodos(uid).subscribe({
         next: (data) => {
            if (Array.isArray(data)) this.todos.set(data);
         },
         error: (err) => console.error('Gagal load todo:', err)
      });

      // --- Load Vendors ---
      this.dataService.getVendors(uid).subscribe({
         next: (data) => {
            if (Array.isArray(data)) {
               const vendorsWithIndex = data.map(v => ({
                  ...v,
                  active_index: v.active_index || 0,
                  images: (v.images || []).map(file => {
                     if (typeof file === 'string') {
                        const f = file as string; // Type assertion supaya TS tidak error
                        const fileName = f.split('/').pop()!;
                        return {
                              fileName,
                              originalName: fileName,
                              url: this.buildUploadsUrl(f)
                        };
                     } else {
                        return file; // { fileName, originalName, url }
                     }
                  })
               }));
               this.vendors.set(vendorsWithIndex);
               this.startVendorSlider();
            }
         },
         error: (err) => console.error('Gagal load vendor:', err)
      });

      // Load Prewed Locations
      this.dataService.getPrewedLocations(uid).subscribe({
         next: (data) => {
            if (Array.isArray(data)) {
               const prewedsWithIndex = data.map(p => ({
                  ...p,
                  active_index: p.active_index || 0,
                  images: (p.images || []).map(file => {
                     if (typeof file === 'string') {
                        const f = file as string;
                        const fileName = f.split('/').pop()!;
                        return {
                              fileName,
                              originalName: fileName,
                              url: this.buildUploadsUrl(f)
                        };
                     } else {
                        return file;
                     }
                  })
               }));
               this.prewedLocations.set(prewedsWithIndex);
            }
         },
         error: (err) => console.error('Gagal load prewed locations:', err)
      });

      setTimeout(() => {
         this.hasLoadedData.set(true);
         this.isInitialLoading.set(false);
      }, 700);
   }

   // Helper untuk update partial summary ke DB
   updateSummaryDB(data: any) {
      const user = this.authService.currentUser();
      if(user) {
         this.dataService.updateSummary(user.id, data).subscribe();
      }
   }

   buildUploadsUrl(fileNameOrUrl: string): string {
      if (!fileNameOrUrl) return '';
      if (fileNameOrUrl.startsWith('http://') || fileNameOrUrl.startsWith('https://')) {
         return fileNameOrUrl;
      }
      const normalizedFileName = fileNameOrUrl.split('/').pop()!;
      return `${this.dataService.getUploadsBaseUrl()}/${normalizedFileName}`;
   }

   private getHeaderImageFileName(): string | null {
      const img = this.headerImage();
      if (!img) return null;
      if (img.startsWith('http://') || img.startsWith('https://')) {
         return img.split('/').pop()?.split('?')[0] || null;
      }
      return img.split('/').pop() || null;
   }

   startEditTitle() {
      this.tempTitle = this.weddingTitle(); // Copy judul terbaru ke variable temp
      this.isEditingTitle.set(true);        // Baru tampilkan mode edit
      
      // Auto focus ke input (opsional, untuk UX lebih baik)
      setTimeout(() => {
         const input = document.querySelector('input[autoFocus]') as HTMLInputElement;
         if(input) input.focus();
      }, 50);
   }

   // --- ACTIONS ---
   selectTheme(themeId: string) {
      this.selectedThemeId.set(themeId);
      localStorage.setItem('user_theme', themeId);

      const selectedTheme = this.themes().find(t => t.id === themeId);
      if (selectedTheme) {
         localStorage.setItem('user_theme_object', JSON.stringify(selectedTheme));
      }

      const user = this.authService.currentUser();
      if (user) {
         this.dataService.updateUserTheme(user.id, themeId).subscribe();
      }
   }

   // --- METHOD SAVE SUMMARY DATA (Title, Date, Budget) ---
   saveTitle() { 
      this.isEditingTitle.set(false);
      if (this.tempTitle.trim()) {
         this.weddingTitle.set(this.tempTitle);
         this.updateSummaryDB({ wedding_title: this.tempTitle });
      }
   }

   saveDate(newDate: string) {
      this.weddingDate.set(newDate);
      this.updateSummaryDB({ wedding_date: newDate });
   }

   saveBudget(newBudget: number) {
      this.totalBudget.set(newBudget);
      this.updateSummaryDB({ total_budget: newBudget });
   }

   onHeaderImagePositionChange(axis: 'x' | 'y', value: string | number) {
      const numericValue = Math.max(0, Math.min(100, Number(value)));

      if (axis === 'x') {
         this.headerImagePosX.set(numericValue);
         this.updateSummaryDB({ header_image_pos_x: numericValue });
      } else {
         this.headerImagePosY.set(numericValue);
         this.updateSummaryDB({ header_image_pos_y: numericValue });
      }

      this.cdr.markForCheck();
   }

   toggleHeaderImageEditMode() {
      if (!this.headerImage()) return;
      this.isHeaderImageEditMode.update(v => !v);
      this.cdr.markForCheck();
   }

   saveHeaderImageEditMode() {
      if (!this.headerImage()) return;
      const user = this.authService.currentUser();
      if (!user) return;

      this.dataService.updateSummary(user.id, {
         header_image_pos_x: this.headerImagePosX(),
         header_image_pos_y: this.headerImagePosY()
      }).subscribe({
         next: () => {
            this.isHeaderImageDragging.set(false);
            if (this.headerImageDragState.pointerId !== null) {
               const activeEl = document.activeElement as HTMLElement | null;
               activeEl?.blur();
            }
            this.headerImageDragState = {
               active: false,
               pointerId: null,
               startClientX: 0,
               startClientY: 0,
               startPosX: 0,
               startPosY: 0
            };
            this.isHeaderImageEditMode.set(false);
            this.cdr.markForCheck();
         },
         error: (err) => {
            console.error('Gagal menyimpan posisi header image:', err);
            alert(err?.error?.message || 'Gagal menyimpan posisi header image.');
         }
      });
   }

   startHeaderImageDrag(event: PointerEvent) {
      if (!this.headerImage()) return;
      if (!this.isHeaderImageEditMode()) return;
      const target = event.currentTarget as HTMLElement | null;
      if (!target) return;

      target.setPointerCapture(event.pointerId);
      this.isHeaderImageDragging.set(true);
      this.headerImageDragState = {
         active: true,
         pointerId: event.pointerId,
         startClientX: event.clientX,
         startClientY: event.clientY,
         startPosX: this.headerImagePosX(),
         startPosY: this.headerImagePosY()
      };
   }

   onHeaderImageDrag(event: PointerEvent) {
      if (!this.headerImageDragState.active || this.headerImageDragState.pointerId !== event.pointerId) {
         return;
      }

      const target = event.currentTarget as HTMLElement | null;
      if (!target) return;

      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const deltaX = ((event.clientX - this.headerImageDragState.startClientX) / rect.width) * 100;
      const deltaY = ((event.clientY - this.headerImageDragState.startClientY) / rect.height) * 100;

      const nextX = Math.max(0, Math.min(100, this.headerImageDragState.startPosX + deltaX));
      const nextY = Math.max(0, Math.min(100, this.headerImageDragState.startPosY + deltaY));

      this.headerImagePosX.set(nextX);
      this.headerImagePosY.set(nextY);
      this.cdr.markForCheck();
   }

   endHeaderImageDrag() {
      if (this.headerImage() && this.isHeaderImageEditMode()) {
         const user = this.authService.currentUser();
         if (user) {
            this.dataService.updateSummary(user.id, {
               header_image_pos_x: this.headerImagePosX(),
               header_image_pos_y: this.headerImagePosY()
            }).subscribe();
         }
      }

      this.headerImageDragState.active = false;
      this.headerImageDragState.pointerId = null;
      this.isHeaderImageDragging.set(false);
   }

   resetHeaderImagePosition() {
      this.headerImagePosX.set(50);
      this.headerImagePosY.set(50);
      this.isHeaderImageEditMode.set(true);
      this.updateSummaryDB({ header_image_pos_x: 50, header_image_pos_y: 50 });
      this.cdr.markForCheck();
   }

   uploadDroppedHeaderImage(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();

      const files = event.dataTransfer?.files;

      if (!files || files.length === 0) {
         return;
      }

      const inputEvent = {
         target: {
            files
         }
      } as unknown as Event;

      this.onHeaderImageSelected(inputEvent);
   }

   removeHeaderImage(input?: HTMLInputElement) {
      const confirmed = confirm('Hapus header image Summary?');
      if (!confirmed) return;

      const user = this.authService.currentUser();
      const currentImageFileName = this.getHeaderImageFileName();
      if (user && currentImageFileName) {
         this.dataService.removeSummaryHeaderImage(user.id, currentImageFileName).subscribe({
            next: () => {
               this.headerImage.set(null);
               this.headerImagePosX.set(50);
               this.headerImagePosY.set(50);
               this.isHeaderImageEditMode.set(false);
               this.cdr.markForCheck();
            },
            error: (err) => {
               console.error('Gagal menghapus header image:', err);
               alert(err.error?.message || 'Gagal menghapus header image.');
            }
         });
      } else {
         this.headerImage.set(null);
         this.headerImagePosX.set(50);
         this.headerImagePosY.set(50);
         this.isHeaderImageEditMode.set(false);
         this.updateSummaryDB({ header_image: null, header_image_pos_x: 50, header_image_pos_y: 50 });
      }

      if (input) {
         input.value = '';
      }

      this.cdr.markForCheck();
   }  
   
   onHeaderImageSelected(event: Event) {
      const input = event.target as HTMLInputElement;

      if (input.files && input.files[0]) {
         const file = input.files[0];

         this.isUploading.set(true);

         this.dataService.uploadFile(file).subscribe({
            next: (response) => {
               this.headerImage.set(response.fileName);
               this.headerImagePosX.set(50);
               this.headerImagePosY.set(50);
               this.isHeaderImageEditMode.set(true);
               this.updateSummaryDB({ header_image: response.fileName });

               this.isUploading.set(false);
               input.value = '';
               this.cdr.markForCheck();
            },
            error: (err) => {
               console.error('Upload gagal header:', err);

               alert(
                  err?.error?.message ||
                  err?.message ||
                  'Gagal mengupload gambar di header.'
               );

               this.isUploading.set(false);
               input.value = '';
               this.cdr.markForCheck();
            }
         });
      }
   }

   // --- RESET STATE (PENTING UNTUK LOGOUT) ---
   private resetState() {
      localStorage.removeItem('user_theme');

      this.selectedThemeId.set('gold'); 
      this.expenses.set([]);
      this.guests.set([]);
      this.todos.set([]);
      this.vendors.set([]);
      this.prewedLocations.set([]);

      this.activeTab.set('summary');
      this.headerImage.set(null);
      this.headerImagePosX.set(50);
      this.headerImagePosY.set(50);
      this.isHeaderImageEditMode.set(false);
      this.weddingTitle.set('The Wedding of Us');
      this.totalBudget.set(100000000);

      this.hasLoadedData.set(false);
      this.isInitialLoading.set(true);

      this.editingGuestId.set(null);
      this.editingExpenseId.set(null);
      this.editingPrewedId.set(null);
      this.editingVendorId.set(null);

      this.searchQuery.set('');
      this.filterSide.set('ALL');
      this.filterCategory.set('ALL');
      this.filterWhatsApp.set('ALL');

      this.filterExpenseCategory.set('ALL');
      this.filterExpenseStatus.set('ALL');
      this.expenseSearch.set('');
      this.expensePage.set(1);

      this.todoSearch.set('');
      this.filterTodoStatus.set('ALL');
      this.todoPage.set(1);

      this.selectedFilter.set('Semua');
   }

   // Helpers & Logic
   enableBudgetEdit() {
      this.isEditingBudget.set(true);
      setTimeout(() => { const input = document.querySelector('input[type="number"]') as HTMLInputElement | null; input?.focus(); }, 50);
   }
   getSafeSvg(path: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(path); }
   
   linkify(text: string): SafeHtml {
      if (!text) return '';

      const urlRegex = /((https?:\/\/)|(www\.)|(wa\.me\/)|(api\.whatsapp\.com\/))[^\s<]+/g;

      const html = text.replace(urlRegex, (url) => {
         let href = url;

         if (url.startsWith('www.')) {
            href = 'https://' + url;
         }

         if (url.startsWith('wa.me/') || url.startsWith('api.whatsapp.com/')) {
            href = 'https://' + url;
         }

         return `
            <a 
               href="${href}" 
               target="_blank" 
               rel="noopener noreferrer"
               style="color:#2563eb; font-weight:700; text-decoration:underline; cursor:pointer; pointer-events:auto; position:relative; z-index:50;">
               ${url}
            </a>
         `;
      });

      return this.sanitizer.bypassSecurityTrustHtml(html);
   }

   parseNoteLinks(text: string) {
      if (!text) return [];

      const urlRegex = /((https?:\/\/)|(www\.)|(wa\.me\/)|(api\.whatsapp\.com\/))[^\s<]+/g;

      const parts: Array<{
         type: 'text' | 'link';
         text: string;
         href?: string;
      }> = [];

      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = urlRegex.exec(text)) !== null) {
         const url = match[0];

         if (match.index > lastIndex) {
            parts.push({
               type: 'text',
               text: text.slice(lastIndex, match.index)
            });
         }

         let href = url;

         if (url.startsWith('www.')) {
            href = 'https://' + url;
         }

         if (url.startsWith('wa.me/') || url.startsWith('api.whatsapp.com/')) {
            href = 'https://' + url;
         }

         parts.push({
            type: 'link',
            text: url,
            href
         });

         lastIndex = match.index + url.length;
      }

      if (lastIndex < text.length) {
         parts.push({
            type: 'text',
            text: text.slice(lastIndex)
         });
      }

      return parts;
   }

   getCategoryColorClass(category: string): string {
      switch (category) {
         case 'Venue': return 'text-purple-600 bg-purple-50';
         case 'Catering': return 'text-orange-600 bg-orange-50';
         case 'Pakaian': return 'text-pink-600 bg-pink-50';
         case 'Prewedding': return 'text-blue-600 bg-blue-50';
         case 'Cincin': return 'text-yellow-600 bg-yellow-50';
         case 'Seserahan': return 'text-teal-600 bg-teal-50';
         default: return 'text-slate-600 bg-slate-100';
      }
   }

   private parseGuestPax(): number | null {
      const paxInput = this.newGuest.pax as number | string | null | undefined;
      if (paxInput === '' || paxInput === null || paxInput === undefined) {
         return null;
      }

      const paxValue = Number(paxInput);
      return Number.isFinite(paxValue) ? paxValue : null;
   }

   isGuestPaxInvalid(): boolean {
      const paxInput = this.newGuest.pax as number | string | null | undefined;
      if (paxInput === '' || paxInput === null || paxInput === undefined) {
         return false;
      }

      const paxValue = this.parseGuestPax();
      return paxValue === null || paxValue < 1;
   }

   // --- CRUD GUESTS ---
   saveGuest() {
      if (!this.newGuest.name?.trim()) {
         alert('Nama tamu wajib diisi.');
         return;
      }

      const paxValue = this.parseGuestPax();
      if (paxValue === null || paxValue < 1) {
         alert('Jumlah tamu minimal 1 orang.');
         return;
      }

      const uid = this.authService.currentUser().id;

      const payload = {
         ...this.newGuest,
         name: this.newGuest.name.trim(),
         pax: paxValue,
         phone: this.newGuest.phone?.trim() || '',
         side: this.newGuest.side || 'CPP',
         category: this.newGuest.category || 'Keluarga'
      };

      if (this.editingGuestId() !== null) {
         this.dataService.updateGuest(uid, this.editingGuestId()!, payload).subscribe({
            next: () => {
               this.loadData();
               this.editingGuestId.set(null);
               this.newGuest = { name: '', phone: '', side: 'CPP', category: 'Keluarga' };
               this.resetGuestPage();
            },
            error: (err) => {
               console.error('Gagal update tamu:', err);
               alert(err.error?.message || 'Gagal update tamu.');
            }
         });
      } else {
         this.dataService.addGuest(uid, payload).subscribe({
            next: () => {
               this.loadData();
               this.newGuest = { name: '', phone: '', side: 'CPP', category: 'Keluarga' };
               this.guestPage.set(1);
            },
            error: (err) => {
               console.error('Gagal tambah tamu:', err);
               alert(err.error?.message || 'Gagal tambah tamu.');
            }
         });
      }
   }
   editGuest(guest: Guest) { this.newGuest = { ...guest }; this.editingGuestId.set(guest.id!); document.getElementById('guestForm')?.scrollIntoView({ behavior: 'smooth' }); }
   cancelEditGuest() { this.editingGuestId.set(null); this.newGuest = { name: '', phone: '', side: 'CPP', category: 'Keluarga' }; }
   deleteGuest(id: number) { 
      const uid = this.authService.currentUser().id;
      if(confirm('Hapus tamu ini?')) this.dataService.deleteGuest(uid, id).subscribe(() => this.loadData()); 
   }
   toggleSelectAll(e: any) { 
      const checked = e.target.checked;
      const uid = this.authService.currentUser().id;
      const filtered = this.filteredGuests();

      const filteredIds = new Set(filtered.map(g => g.id));

      this.guests.update(list =>
         list.map(g => filteredIds.has(g.id) ? { ...g, selected: checked } : g)
      );

      filtered.forEach(g => {
         this.dataService.updateGuestSelected(uid, g.id!, checked).subscribe({
            error: (err) => {
            console.error('Gagal update pilih semua tamu:', err);
            }
         });
      });
   }
   uncheckAllGuests() {
      const uid = this.authService.currentUser().id;

      const selectedGuests = this.guests().filter(g => g.selected);

      if (selectedGuests.length === 0) {
         return;
      }

      this.guests.update(list =>
         list.map(g => g.selected ? { ...g, selected: false } : g)
      );

      selectedGuests.forEach(g => {
         this.dataService.updateGuestSelected(uid, g.id!, false).subscribe({
            error: (err) => {
               console.error('Gagal uncheck tamu:', err);
            }
         });
      });
   }
   deleteSelectedGuests() {
      const uid = this.authService.currentUser().id;
      const selectedGuests = this.guests().filter(g => g.selected);

      if (selectedGuests.length === 0) {
         alert('Tidak ada tamu yang dipilih.');
         return;
      }

      const guestNamesPreview = selectedGuests
         .slice(0, 5)
         .map(g => `- ${g.name}`)
         .join('\n');

      const moreText = selectedGuests.length > 5
         ? `\n...dan ${selectedGuests.length - 5} tamu lainnya`
         : '';

      const confirmed = confirm(
         `Yakin ingin menghapus ${selectedGuests.length} tamu yang dipilih?\n\n${guestNamesPreview}${moreText}\n\nData tamu yang dihapus tidak dapat dikembalikan.`
      );

      if (!confirmed) return;

      const selectedIds = selectedGuests
         .map(g => g.id)
         .filter((id): id is number => !!id);

      // Optimistic update: langsung hilang dari UI
      this.guests.update(list =>
         list.filter(g => !selectedIds.includes(g.id!))
      );

      let successCount = 0;
      let failedCount = 0;

      selectedIds.forEach(id => {
         this.dataService.deleteGuest(uid, id).subscribe({
            next: () => {
               successCount++;

               if (successCount + failedCount === selectedIds.length) {
                  if (failedCount > 0) {
                     alert(`${successCount} tamu berhasil dihapus, ${failedCount} gagal dihapus.`);
                     this.loadData();
                  }

                  if (this.guestPage() > this.totalGuestPages()) {
                     this.guestPage.set(this.totalGuestPages());
                  }
               }
            },
            error: (err) => {
               failedCount++;
               console.error('Gagal hapus tamu terpilih:', err);

               if (successCount + failedCount === selectedIds.length) {
                  alert(`${successCount} tamu berhasil dihapus, ${failedCount} gagal dihapus.`);
                  this.loadData();
               }
            }
         });
      });
   }
   toggleGuest(id: number) { 
      const guest = this.guests().find(g => g.id === id);
      if (!guest) return;

      const uid = this.authService.currentUser().id;
      const previousSelected = !!guest.selected;
      const newSelected = !previousSelected;

      // Update UI langsung
      this.guests.update(list =>
         list.map(g => g.id === id ? { ...g, selected: newSelected } : g)
      );

      // Simpan hanya field selected
      this.dataService.updateGuestSelected(uid, id, newSelected).subscribe({
         error: (err) => {
            console.error('Gagal update checklist tamu:', err);

            // Rollback kalau gagal
            this.guests.update(list =>
            list.map(g => g.id === id ? { ...g, selected: previousSelected } : g)
            );

            alert(err.error?.message || 'Gagal update checklist tamu.');
         }
      });
   }

   selectAllAmount(event: Event) {
      const input = event.target as HTMLInputElement;

      setTimeout(() => {
         input.select();
      }, 0);
   }
   
   // --- CRUD EXPENSES ---
   saveExpense() {
      const uid = this.authService.currentUser().id;

      const item = this.newExpense.item?.trim() || '';
      const category = this.newExpense.category?.trim() || '';
      const status = this.newExpense.status || 'Belum';
      const isLunas = status === 'Lunas';

      if (!item) {
         alert('Detail pengeluaran wajib diisi.');
         return;
      }

      if (!category) {
         alert('Kategori pengeluaran wajib dipilih.');
         return;
      }

      const payload = { 
         ...this.newExpense,
         item,
         category,
         status,
         amount: Number(this.newExpense.amount || 0),
         date: this.newExpense.date || this.getTodayDate(),
         note: this.newExpense.note || '',
         checked: isLunas,
         paid: isLunas
      };

      if (this.editingExpenseId()) {
         this.dataService.updateExpense(uid, this.editingExpenseId()!, payload).subscribe({
            next: (updated) => {
               this.expenses.update(expenses =>
                  expenses.map(exp => exp.id === updated.id ? updated : exp)
               );

               this.resetExpenseForm();
            },
            error: (err) => {
               console.error('Gagal update pengeluaran:', err);
               alert(err.error?.message || 'Gagal update pengeluaran.');
            }
         });
      } else {
         this.dataService.addExpense(uid, payload).subscribe({
            next: (created) => {
               this.expenses.update(expenses => [created, ...expenses]);
               this.resetExpenseForm();
               this.expensePage.set(1);
            },
            error: (err) => {
               console.error('Gagal tambah pengeluaran:', err);
               alert(err.error?.message || 'Gagal tambah pengeluaran.');
            }
         });
      }
   }

   editExpense(exp: Expense) {
      this.newExpense = { ...exp, amount: Number(exp.amount) }; 
      this.editingExpenseId.set(exp.id!); 
      document.getElementById('expenseForm')?.scrollIntoView({ behavior: 'smooth' }); 
   }

   cancelEditExpense() {
      this.resetExpenseForm();
   }

   deleteExpense(id: number) {
      const expense = this.expenses().find(e => e.id === id);

      const confirmed = confirm(
         `Yakin ingin menghapus pengeluaran "${expense?.item || 'ini'}"?`
      );

      if (!confirmed) return;

      const uid = this.authService.currentUser().id;

      this.dataService.deleteExpense(uid, id).subscribe({
         next: () => {
            this.expenses.update(expenses => expenses.filter(exp => exp.id !== id));

            if (this.expensePage() > this.totalExpensePages()) {
               this.expensePage.set(this.totalExpensePages());
            }
         },
         error: (err) => {
            console.error('Gagal hapus pengeluaran:', err);
            alert(err.error?.message || 'Gagal hapus pengeluaran.');
         }
      });
   }
   resetExpenseForm() {
      this.newExpense = { 
         item: '', 
         amount: 0, 
         category: '', 
         status: 'Belum', 
         date: this.getTodayDate(), 
         note: '', 
         checked: false 
      };

      this.editingExpenseId.set(null);
   }

   resetExpensePage() {
      this.expensePage.set(1);
   }

   nextExpensePage() {
      if (this.expensePage() < this.totalExpensePages()) {
         this.expensePage.update(page => page + 1);
      }
   }

   prevExpensePage() {
      if (this.expensePage() > 1) {
         this.expensePage.update(page => page - 1);
      }
   }

   onAmountInput(event: Event) {
      const input = event.target as HTMLInputElement;
      const cursorPosition = input.selectionStart || 0;
      const oldLength = input.value.length;
      const rawValue = input.value.replace(/[^\d]/g, '');
      if (!rawValue) {
         this.newExpense.amount = 0;
         input.value = '';
         return;
      }
      const numValue = parseInt(rawValue);
      this.newExpense.amount = numValue;
      const formattedValue = numValue.toLocaleString('id-ID'); 
      input.value = formattedValue;
      const newLength = formattedValue.length;
      const diff = newLength - oldLength;
      const newCursorPosition = cursorPosition + diff;
      input.setSelectionRange(newCursorPosition, newCursorPosition);
   }
   
   // --- CRUD PREWED ---
   savePrewed() {
      if (!this.newPrewed.name?.trim()) return;

      const uid = this.authService.currentUser().id;

      const payloadForAPI: PrewedAPIPayload = {
         name: this.newPrewed.name.trim(),
         location_name: this.newPrewed.location_name?.trim() || '',
         maps_link: this.newPrewed.maps_link?.trim() || '',
         note: this.newPrewed.note?.trim() || '',
         price: Number(this.newPrewed.price || 0),
         selected: this.newPrewed.selected ?? false,
         active_index: this.newPrewed.active_index ?? 0,
         images: (this.newPrewed.images || []).map(img => img.fileName)
      };

      if (this.editingPrewedId() !== null) {
         this.dataService.updatePrewedLocation(uid, this.editingPrewedId()!, payloadForAPI).subscribe({
            next: () => {
               this.loadData();
               this.resetPrewedForm();
               this.resetPrewedPage();
            },
            error: (err) => {
               console.error('Gagal update lokasi prewed:', err);
               alert(err.error?.message || 'Gagal update lokasi prewed.');
            }
         });
      } else {
         this.dataService.addPrewedLocation(uid, payloadForAPI).subscribe({
            next: () => {
               this.loadData();
               this.resetPrewedForm();
               this.resetPrewedPage();
            },
            error: (err) => {
               console.error('Gagal tambah lokasi prewed:', err);
               alert(err.error?.message || 'Gagal tambah lokasi prewed.');
            }
         });
      }
   }

   editPrewed(loc: PrewedLocation) {
      this.newPrewed = { 
         ...loc,
         maps_link: loc.maps_link || '',
         note: loc.note || '',
         images: loc.images || [],
         active_index: loc.active_index || 0
      };

      this.editingPrewedId.set(loc.id!);
   }
   cancelEditPrewed() { 
      this.resetPrewedForm();
   }
   deletePrewed(id: number) {
      const loc = this.prewedLocations().find(p => p.id === id);

      const confirmed = confirm(
         `Yakin ingin menghapus lokasi prewed "${loc?.name || 'ini'}"?`
      );

      if (!confirmed) return;

      const uid = this.authService.currentUser().id;

      this.dataService.deletePrewedLocation(uid, id).subscribe({
         next: () => {
            this.prewedLocations.update(list => list.filter(p => p.id !== id));
         },
         error: (err) => {
            console.error('Gagal menghapus lokasi prewed:', err);
            alert(err.error?.message || 'Gagal menghapus lokasi prewed.');
         }
      });
   }

   resetPrewedForm() {
      this.newPrewed = {
         name: '',
         location_name: '',
         price: 0,
         maps_link: '',
         note: '',
         images: [],
         selected: false,
         active_index: 0
      };

      this.editingPrewedId.set(null);
   }
   
   // --- CRUD VENDORS ---
   saveVendor() {
      if (!this.newVendor.name?.trim()) {
         alert('Nama vendor wajib diisi.');
         return;
      }

      if (this.vendorCategories().length === 0) {
         alert('Kategori vendor masih kosong.');
         return;
      }

      if (!this.newVendor.category?.trim()) {
         alert('Kategori vendor wajib dipilih.');
         return;
      }

      const uid = this.authService.currentUser().id;

      // Payload API hanya string[] untuk images
      const payloadForAPI: VendorAPIPayload = {
         name: this.newVendor.name.trim(),
         category: this.newVendor.category.trim(),
         location: this.newVendor.location?.trim() || '',
         social_link: this.newVendor.social_link?.trim() || '',
         price: Number(this.newVendor.price || 0),
         selected: this.newVendor.selected ?? false,
         images: (this.newVendor.images || []).map(img => img.fileName)
      };

      if (this.editingVendorId() !== null) {
         this.dataService.updateVendor(uid, this.editingVendorId()!, payloadForAPI).subscribe({
            next: () => {
               this.loadData();
               this.editingVendorId.set(null);
               this.resetVendorForm();
               this.vendorPage.set(1);
            },
            error: (err) => {
               console.error('Gagal update vendor:', err);
               alert(err.error?.message || 'Gagal update vendor.');
            }
         });
      } else {
         this.dataService.addVendor(uid, payloadForAPI).subscribe({
            next: () => {
               this.loadData();
               this.resetVendorForm();
               this.vendorPage.set(1);
            },
            error: (err) => {
               console.error('Gagal tambah vendor:', err);
               alert(err.error?.message || 'Gagal tambah vendor.');
            }
         });
      }
   }
   resetVendorForm() {
      this.newVendor = {
         name: '',
         category: '',
         location: '',
         social_link: '',
         images: [],
         price: 0,
         selected: false
      };

      this.editingVendorId.set(null);
   }
   editVendor(vendor: Vendor) { 
      // Pastikan images diinisialisasi sebagai array, jangan biarkan null/undefined
      this.newVendor = { 
         ...vendor, 
         images: (vendor.images || []).map(file => 
            typeof file === 'string'
               ? { fileName: file, originalName: file, url: `/uploads/${file}` }
               : file
         )
      }; 
      this.editingVendorId.set(vendor.id!);
   }
   cancelEditVendor() { 
      this.resetVendorForm();
   }
   deleteVendor(id: number) {
      const vendor = this.vendors().find(v => v.id === id);

      const confirmed = confirm(
         `Yakin ingin menghapus vendor "${vendor?.name || 'ini'}"?`
      );

      if (!confirmed) return;

      const uid = this.authService.currentUser().id;

      this.dataService.deleteVendor(uid, id).subscribe({
         next: () => {
            this.vendors.update(vendors => vendors.filter(v => v.id !== id));
         },
         error: (err) => {
            console.error('Gagal menghapus vendor:', err);
            alert(err.error?.message || 'Gagal menghapus vendor.');
         }
      });
   }

   // --- CRUD TODOS ---
   addTodo(val: string) {
      const task = val.trim();

      if (!task) return;

      const uid = this.authService.currentUser().id;

      this.dataService.addTodo(uid, { task }).subscribe({
         next: () => {
            this.loadData();
            this.todoPage.set(1);
            this.quickTodoSuccessMessage.set(`"${task}" berhasil ditambahkan ke To-do List.`);
            this.quickTodoSuccessFading.set(false);
            if (this.quickTodoSuccessTimeout) {
               clearTimeout(this.quickTodoSuccessTimeout);
            }
            if (this.quickTodoSuccessFadeTimeout) {
               clearTimeout(this.quickTodoSuccessFadeTimeout);
            }
            this.quickTodoSuccessTimeout = setTimeout(() => {
               this.quickTodoSuccessFading.set(true);
               this.quickTodoSuccessFadeTimeout = setTimeout(() => {
                  this.quickTodoSuccessMessage.set('');
                  this.quickTodoSuccessFading.set(false);
                  this.quickTodoSuccessFadeTimeout = null;
                  this.quickTodoSuccessTimeout = null;
               }, 300);
            }, 2200);
         },
         error: (err) => {
            console.error('Gagal tambah tugas:', err);
            alert(err.error?.message || 'Gagal tambah tugas.');
         }
      });
   }
   toggleTodo(id: number) {
      const task = this.todos().find(t => t.id === id);
      if (!task) return;

      const uid = this.authService.currentUser().id;
      const updatedTask = {
         ...task,
         completed: !task.completed
      };

      // Update UI langsung agar card selesai langsung turun
      this.todos.update(todos =>
         todos.map(t => t.id === id ? updatedTask : t)
      );

      this.dataService.updateTodo(uid, id, updatedTask).subscribe({
         error: (err) => {
            console.error('Gagal update tugas:', err);
            alert(err.error?.message || 'Gagal update tugas.');

            // Rollback kalau gagal
            this.todos.update(todos =>
               todos.map(t => t.id === id ? task : t)
            );
         }
      });
   }
   deleteTodo(id: number) {
      const todo = this.todos().find(t => t.id === id);

      const confirmed = confirm(
         `Yakin ingin menghapus tugas "${todo?.task || 'ini'}"?`
      );

      if (!confirmed) return;

      const uid = this.authService.currentUser().id;

      this.dataService.deleteTodo(uid, id).subscribe({
         next: () => {
            this.todos.update(todos => todos.filter(t => t.id !== id));

            if (this.todoPage() > this.totalTodoPages()) {
               this.todoPage.set(this.totalTodoPages());
            }
         },
         error: (err) => {
            console.error('Gagal menghapus todo:', err);
            alert(err.error?.message || 'Gagal menghapus tugas.');
         }
      });
   }

   // --- SELECTION TOGGLES ---
   togglePrewedSelection(id: number) {
      const loc = this.prewedLocations().find(l => l.id === id);
      if (!loc) return;

      const uid = this.authService.currentUser().id;

      // Flip selected untuk tampilan UI
      const updatedLoc = {
         ...loc,
         selected: !loc.selected
      };

      this.prewedLocations.update(list =>
         list.map(item => item.id === id ? updatedLoc : item)
      );

      this.resetPrewedPage();

      // Buat payload API sesuai tipe PrewedAPIPayload
      const payloadForAPI: PrewedAPIPayload = {
         name: loc.name,
         location_name: loc.location_name,
         maps_link: loc.maps_link,
         note: loc.note || '', // pastikan selalu string
         price: loc.price,
         selected: !loc.selected, // nilai flipped
         active_index: loc.active_index ?? 0,
         images: (loc.images || []).map(img => img.fileName)
      };

      // Simpan ke backend
      this.dataService.updatePrewedLocation(uid, id, payloadForAPI).subscribe({
         error: (err) => {
            console.error('Gagal update pilihan prewed:', err);

            // Rollback jika gagal
            this.prewedLocations.update(list =>
            list.map(item => item.id === id ? loc : item)
            );
         }
      });
   }
   sortedPrewedLocations = computed(() => {
      return [...this.prewedLocations()].sort((a, b) => {
         const selectedA = a.selected ? 1 : 0;
         const selectedB = b.selected ? 1 : 0;

         if (selectedA !== selectedB) {
            return selectedB - selectedA;
         }

         return (b.id || 0) - (a.id || 0);
      });
   });

   toggleVendorSelection(id: number) {
      const vendor = this.vendors().find(v => v.id === id);
      if (!vendor) return;

      const uid = this.authService.currentUser().id;

      // Flip selected untuk tampilan UI
      const updatedVendor = {
         ...vendor,
         selected: !vendor.selected
      };

      this.vendors.update(list =>
         list.map(item => item.id === id ? updatedVendor : item)
      );

      // Buat payload API sesuai tipe VendorAPIPayload
      const payloadForAPI: VendorAPIPayload = {
         name: vendor.name,
         category: vendor.category,
         location: vendor.location,
         social_link: vendor.social_link,
         price: vendor.price,
         selected: !vendor.selected, // nilai flipped
         images: (vendor.images || []).map(img => img.fileName)
      };

      // Simpan ke backend
      this.dataService.updateVendor(uid, id, payloadForAPI).subscribe({
         error: (err) => {
            console.error('Gagal update pilihan vendor:', err);

            // Rollback jika gagal
            this.vendors.update(list =>
            list.map(item => item.id === id ? vendor : item)
            );
         }
      });
   }

   // --- VENDOR SLIDER LOGIC ---
   
   // 1. Mulai Otomatis
   startVendorSlider() {
      this.resetVendorSliderTimer();
   }

   // 2. Reset Timer (Supaya tidak bentrok saat diklik manual)
   resetVendorSliderTimer() {
      if (this.vendorSliderInterval) clearInterval(this.vendorSliderInterval);
      
      // Ganti gambar setiap 4 detik
      this.vendorSliderInterval = setInterval(() => {
         this.vendors.update(list => {
            return list.map(v => {
               // Hanya slide kalau gambarnya lebih dari 1
               if (!v.images || v.images.length <= 1) return v;
               
               const currentIndex = v.active_index || 0;
               const nextIndex = (currentIndex + 1) % v.images.length;
               return { ...v, active_index: nextIndex };
            });
         });
      }, 4000); 
   }
   // 3. Manual Slide (Tombol Panah)
   manualVendorSlide(vendorId: number, direction: 'prev' | 'next', event: Event) {
      event.stopPropagation(); // Supaya tidak memicu klik card lain
      
      this.vendors.update(list => {
         return list.map(v => {
            if (v.id !== vendorId || !v.images || v.images.length <= 1) return v;

            const currentIndex = v.active_index || 0;
            let nextIndex = 0;

            if (direction === 'next') {
               nextIndex = (currentIndex + 1) % v.images.length;
            } else {
               nextIndex = (currentIndex - 1 + v.images.length) % v.images.length;
            }

            return { ...v, active_index: nextIndex };
         });
      });

      // Reset timer agar user punya waktu melihat gambar yang baru diklik
      this.resetVendorSliderTimer();
   }

   // 4. Jump to Slide (Klik Titik/Dots)
   jumpToVendorSlide(vendorId: number, index: number, event: Event) {
      event.stopPropagation();
      this.vendors.update(list =>
         list.map(v =>
            v.id === vendorId
               ? { ...v, active_index: index }
               : v
         )
      );
      this.resetVendorSliderTimer();
   }
   addVendorImage(url: string, originalName: string) {
      if (!url?.trim()) return;

      const fileName = url.split('/').pop()!; // ambil nama file dari URL
      const imageObj = {
         fileName,
         originalName,
         url
      };

      // Tambahkan ke array images
      this.newVendor.images = [...(this.newVendor.images || []), imageObj];

      // Update UI
      this.cdr.markForCheck();
   }

   addPrewedImage(url: string, originalName: string) {
      if (!url?.trim()) return;

      const fileName = url.split('/').pop()!;
      const imageObj = {
         fileName,
         originalName,
         url
      };

      // Tambahkan ke array images
      this.newPrewed.images = [...(this.newPrewed.images || []), imageObj];

      // Update UI
      this.cdr.markForCheck();
   }

   private getUploadErrorMessage(err: any): string {
      return (
         err?.error?.message ||
         err?.message ||
         'Gagal mengupload gambar.'
      );
   }
   startDragPrewedImage(index: number) {
      this.draggedPrewedImageIndex.set(index);
   }

   dropPrewedImageAt(targetIndex: number) {
      const draggedIndex = this.draggedPrewedImageIndex();
      if (draggedIndex === null || draggedIndex === targetIndex) return;

      // Pastikan semua elemen adalah objek { fileName, originalName, url }
      this.newPrewed.images = (this.newPrewed.images || []).map(img =>
         typeof img === 'string'
               ? { fileName: img, originalName: img, url: `/uploads/${img}` }
               : img
      );

      const images = [...this.newPrewed.images];
      const [movedImage] = images.splice(draggedIndex, 1);
      images.splice(targetIndex, 0, movedImage);

      this.newPrewed.images = images;

      this.draggedPrewedImageIndex.set(null);
      this.cdr.markForCheck();
   }
   handlePrewedImageUpload(event: Event) {
      const input = event.target as HTMLInputElement;
      if (!input.files?.length) { input.value = ''; return; }

      this.isUploading.set(true);
      this.uploadProgress.set(0);

      const files = Array.from(input.files);
      let processedCount = 0;

      files.forEach(file => {
         this.dataService.uploadFile(file).subscribe({
            next: (response: any) => {
               const fileName = response.url.split('/').pop()!;
               const url = response.url;
               const originalName = file.name;

               // Simpan ke state frontend
               this.newPrewed.images = [
                  ...(this.newPrewed.images || []),
                  { fileName, originalName, url }
               ];
               this.cdr.markForCheck();

               processedCount++;
               this.uploadProgress.set(Math.round((processedCount / files.length) * 100));

               if (processedCount === files.length) {
                  setTimeout(() => {
                     this.isUploading.set(false);
                     this.uploadProgress.set(0);
                     input.value = '';
                  }, 500);
               }
            },
            error: (err) => {
               console.error('Gagal upload prewed', err);
               alert(this.getUploadErrorMessage(err));
               processedCount++;
            }
         });
      });
   }

   private vendorSliderInterval: any;

   // Upload Helper
   onImageDragOver(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
   }

   onImageDragLeave(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
   }

   uploadDroppedImages(event: DragEvent, target: 'vendor' | 'prewed') {
      event.preventDefault();
      event.stopPropagation();

      const files = event.dataTransfer?.files;

      if (!files || files.length === 0) {
         return;
      }

      const inputEvent = {
         target: {
            files
         }
      } as unknown as Event;

      if (target === 'vendor') {
         this.handleVendorImageUpload(inputEvent);
      }

      if (target === 'prewed') {
         this.handlePrewedImageUpload(inputEvent);
      }
   }
   startDragVendorImage(index: number) {
      this.draggedVendorImageIndex.set(index);
   }

   dropVendorImageAt(targetIndex: number) {
      const draggedIndex = this.draggedVendorImageIndex(); // Ambil index dari signal
      if (draggedIndex === null || draggedIndex === targetIndex) return;

      // Pastikan semua elemen adalah objek { fileName, originalName, url }
      this.newVendor.images = (this.newVendor.images || []).map(img =>
         typeof img === 'string'
               ? { fileName: img, originalName: img, url: `/uploads/${img}` }
               : img
      );

      // Salin array images
      const images = [...this.newVendor.images];

      // Ambil objek yang digeser
      const [movedImage] = images.splice(draggedIndex, 1);

      // Sisipkan kembali di posisi target
      images.splice(targetIndex, 0, movedImage);

      // Update array images
      this.newVendor.images = images;

      // Reset index dragged
      this.draggedVendorImageIndex.set(null);
      this.cdr.markForCheck();
   }

   // Vendor Upload
   handleVendorImageUpload(event: Event) {
      const input = event.target as HTMLInputElement;
      if (!input.files?.length) { input.value = ''; return; }

      this.isUploading.set(true);
      this.uploadProgress.set(0);

      const files = Array.from(input.files);
      let processedCount = 0;

      files.forEach(file => {
         this.dataService.uploadFile(file).subscribe({
            next: (response: any) => {
               console.log('Response upload:', response);
               const fileName = response.url.split('/').pop()!;
               const url = response.url;
               const originalName = file.name;

               // Tambahkan ke state frontend agar UI langsung menampilkan gambar
               this.newVendor.images = [
                  ...(this.newVendor.images || []),
                  { fileName, originalName, url }
               ];
               this.cdr.markForCheck();

               processedCount++;
               this.uploadProgress.set(Math.round((processedCount / files.length) * 100));

               if (processedCount === files.length) {
                  setTimeout(() => {
                     this.isUploading.set(false);
                     this.uploadProgress.set(0);
                     input.value = '';
                  }, 500);
               }
            },
            error: (err) => {
               console.error('Gagal upload vendor', err);
               alert(this.getUploadErrorMessage(err));
               processedCount++;
            }
         });
      });
   }

   removeImageFromVendor(fileName: string) {
      const vendorId = this.editingVendorId();
      if (!vendorId) return;

      const confirmed = confirm('Hapus image vendor ini?');
      if (!confirmed) return;

      // filter array
      this.newVendor.images = (this.newVendor.images || []).filter(img => img.fileName !== fileName);
      this.cdr.markForCheck();

      // panggil backend
      const uid = this.authService.currentUser().id;
      this.dataService.removeVendorImage(uid, vendorId, fileName).subscribe({
         next: (res: any) => console.log(res.message),
         error: (err: any) => alert('Gagal menghapus image vendor.')
      });
   }

   removeImageFromPrewed(fileName: string) {
      const prewedId = this.editingPrewedId();
      if (!prewedId) return;

      const confirmed = confirm('Hapus image lokasi prewed ini?');
      if (!confirmed) return;

      this.newPrewed.images = (this.newPrewed.images || []).filter(img => img.fileName !== fileName);
      this.cdr.markForCheck();

      const uid = this.authService.currentUser().id;
      this.dataService.removePrewedImage(uid, prewedId, fileName).subscribe({
         next: (res: any) => console.log(res.message),
         error: (err: any) => alert('Gagal menghapus image Prewed.')
      });
   }

   // --- Image Slider Logic ---
   private sliderInterval: any;

   startImageSlider() {
      this.resetSliderTimer(); // Start initial timer
   }

   resetSliderTimer() {
      if (this.sliderInterval) clearInterval(this.sliderInterval);
      
      this.sliderInterval = setInterval(() => {
         this.prewedLocations.update(locs => {
         return locs.map(loc => {
            if (!loc.images || loc.images.length <= 1) return loc;
            const nextIndex = ((loc.active_index || 0) + 1) % loc.images.length;
            return { ...loc, active_index: nextIndex };
         });
         });
         this.cdr.markForCheck(); // Paksa update tampilan
      }, 3000); // 3 detik
   }

   // Manual Navigation Logic
   manualSlide(loc: PrewedLocation, direction: 'prev' | 'next') {
      if (!loc.images || loc.images.length <= 1) return;
      const currentIndex = loc.active_index || 0;
      let nextIndex = 0;
      if (direction === 'next') { nextIndex = (currentIndex + 1) % loc.images.length; } else { nextIndex = (currentIndex - 1 + loc.images.length) % loc.images.length; }
      this.prewedLocations.update(locs => locs.map(l => l.id === loc.id ? { ...l, active_index: nextIndex } : l));
      this.resetSliderTimer();
   }
   jumpToSlide(loc: PrewedLocation, index: number) {
      this.prewedLocations.update(locs => locs.map(l => l.id === loc.id ? { ...l, active_index: index } : l));
      this.resetSliderTimer();
   }
   manageCategories() { 
      this.showCategoryManager.set(true); 
   }

   saveExpenseCategoriesToLocalStorage() {
      localStorage.setItem(
         'expense_categories',
         JSON.stringify(this.expenseCategories())
      );
   }

   addCategory(name: string) {
      const cleanName = name.trim();

      if (!cleanName) return;

      const exists = this.expenseCategories().some(
         c => c.toLowerCase() === cleanName.toLowerCase()
      );

      if (exists) {
         alert('Kategori sudah ada.');
         return;
      }

      this.expenseCategories.update(c => [...c, cleanName]);
      this.saveExpenseCategoriesToLocalStorage();
   }

   deleteCategory(name: string) {
      const usedByExpense = this.expenses().some(exp => exp.category === name);

      if (usedByExpense) {
         const confirmed = confirm(
            `Kategori "${name}" masih digunakan pada data pengeluaran. Tetap hapus dari daftar kategori?`
         );

         if (!confirmed) return;
      }

      this.expenseCategories.update(c => c.filter(x => x !== name));
      this.saveExpenseCategoriesToLocalStorage();

      if (this.filterExpenseCategory() === name) {
         this.filterExpenseCategory.set('ALL');
      }

      if (this.newExpense.category === name) {
         this.newExpense.category = 'Lainnya';
      }
   }

   addVendorCategory(name: string) { 
      const cleanName = name.trim();

      if (!cleanName) return;

      const exists = this.vendorCategories().some(
         cat => cat.name.trim().toLowerCase() === cleanName.toLowerCase()
      );

      if (exists) {
         alert('Kategori vendor sudah ada.');
         return;
      }

      const uid = this.authService.currentUser().id;

      this.dataService.addVendorCategory(uid, cleanName).subscribe({
         next: (newCat) => {
            this.vendorCategories.update(current => [...current, newCat]);
         },
         error: (err) => {
            console.error('Gagal tambah kategori vendor:', err);
            alert(err.error?.message || 'Gagal tambah kategori vendor.');
         }
      });
   }
   deleteVendorCategory(id: number) { 
      const uid = this.authService.currentUser().id;
      this.dataService.deleteVendorCategory(uid, id).subscribe(() => {
         this.vendorCategories.update(current => current.filter(c => c.id !== id));
      });
   }
   toggleVendorCategoryMainChecklist(cat: VendorCategory) {
      const uid = this.authService.currentUser().id;
      const nextValue = !cat.is_main_checklist;

      if (nextValue && this.mainChecklistCount() >= 5) {
         alert('Maksimal hanya 5 kategori yang bisa ditampilkan di Checklist Utama.');
         return;
      }

      // Optimistic update agar UI langsung berubah
      this.vendorCategories.update(categories =>
         categories.map(category =>
            category.id === cat.id
               ? {
                  ...category,
                  is_main_checklist: nextValue
               }
               : category
         )
      );

      this.dataService.updateVendorCategoryMainChecklist(uid, cat.id, nextValue).subscribe({
         next: (updatedCategory) => {
            this.vendorCategories.update(categories =>
               categories.map(category =>
                  category.id === updatedCategory.id
                     ? updatedCategory
                     : category
               )
            );
         },
         error: (err) => {
            console.error('Gagal update Checklist Utama kategori vendor:', err);

            // Rollback kalau gagal
            this.vendorCategories.update(categories =>
               categories.map(category =>
                  category.id === cat.id
                     ? {
                        ...category,
                        is_main_checklist: cat.is_main_checklist
                     }
                     : category
               )
            );

            alert(err.error?.message || 'Gagal update Checklist Utama kategori vendor.');
         }
      });
   }

   addGuestCategory(name: string) { if(name.trim()) this.guestCategories.update(c => [...c, name]); }
   deleteGuestCategory(name: string) { this.guestCategories.update(c => c.filter(x => x !== name)); }
   resetFiltersGuest() {
      this.filterSide.set('ALL');
      this.filterWhatsApp.set('ALL');
      this.filterCategory.set('ALL');
      this.resetGuestPage();
   }


   toggleAllowResend(e: any) {
      this.allowResend.set(e.target.checked);
   }

   // --- BROADCAST LOGIC (BARU) ---
   broadcastWhatsAppToSelected() {
      const selectedGuests = this.guests().filter(g => g.selected && g.phone);

      if (selectedGuests.length === 0) {
         alert('Tidak ada tamu yang dipilih atau tidak memiliki nomor WhatsApp.');
         return;
      }

      const alreadySentGuests = selectedGuests.filter(g => g.invited);

      if (alreadySentGuests.length > 0) {
         const guestNames = alreadySentGuests
            .map(g => g.name)
            .join(', ');

         const confirmed = confirm(
            `Tamu berikut sudah pernah dikirim broadcast:\n\n${guestNames}\n\nApakah ingin mengirim pesan kembali ke tamu tersebut?`
         );

         if (!confirmed) {
            return;
         }

         // Agar tamu yang sudah pernah dikirim tetap masuk antrian broadcast
         this.allowResend.set(true);
      } else {
         // Reset agar broadcast normal tidak membawa mode kirim ulang sebelumnya
         this.allowResend.set(false);
      }

      this.isBroadcastMode.set(true);
   }
   sendWhatsApp(guest: Guest) {
      if (!guest.phone) {
         alert('Nomor WhatsApp tidak tersedia untuk tamu ini.');
         return;
      }

      if (guest.invited && !this.allowResend()) {
         const confirmed = confirm(
            `Tamu "${guest.name}" sudah pernah dikirim broadcast.\n\nApakah ingin mengirim pesan kembali ke tamu ini?`
         );

         if (!confirmed) {
            return;
         }
      }

      let message = this.broadcastTemplate();
      message = message.replace(/\{name\}/g, guest.name);

      let phone = guest.phone.replace(/\D/g, '');

      if (phone.startsWith('0')) {
         phone = '62' + phone.substring(1);
      } else if (!phone.startsWith('62')) {
         phone = '62' + phone;
      }

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');

      this.markAsInvited(guest.id!);
   }

   markAsInvited(id: number) {
      const uid = this.authService.currentUser().id;
      const now = new Date().toISOString();

      // Update UI langsung: WA terkirim + checkbox broadcast hilang
      this.guests.update(gs =>
         gs.map(g =>
            g.id === id
               ? {
                  ...g,
                  invited: true,
                  sent_at: now,
                  selected: false
               }
               : g
         )
      );

      // Simpan status WA ke database
      this.dataService.updateGuestWhatsAppStatus(uid, id, {
         invited: true,
         sent_at: now
      }).subscribe({
         next: () => {
            // Simpan juga selected = false ke database
            this.dataService.updateGuestSelected(uid, id, false).subscribe({
               error: (err) => {
                  console.error('Gagal menghapus checklist broadcast tamu:', err);
               }
            });
         },
         error: (err) => {
            console.error('Gagal update status WhatsApp:', err);
            alert(err.error?.message || 'Gagal update status WhatsApp.');
         }
      });
   }
   sendToNextGuest() { 
      const guest = this.nextPendingGuest(); 
      if (!guest) return; 
      
      this.sendWhatsApp(guest);
   }
   hasSelectedGuests() { 
      return this.selectedGuestsForBroadcast().length > 0; 
   }
   closeBroadcastModal() {
      this.isBroadcastMode.set(false);
      this.broadcastPage.set(1);
      this.allowResend.set(false);
   }
   nextBroadcastPage() { 
      if (this.broadcastPage() < this.totalBroadcastPages()) this.broadcastPage.update(p => p + 1); 
   }
   prevBroadcastPage() { 
      if (this.broadcastPage() > 1) this.broadcastPage.update(p => p - 1); 
   }
   resetGuestPage() {
      this.guestPage.set(1);
   }

   nextGuestPage() {
      if (this.guestPage() < this.totalGuestPages()) {
         this.guestPage.update(page => page + 1);
      }
   }

   prevGuestPage() {
      if (this.guestPage() > 1) {
         this.guestPage.update(page => page - 1);
      }
   }
   resetTodoPage() {
      this.todoPage.set(1);
   }

   nextTodoPage() {
      if (this.todoPage() < this.totalTodoPages()) {
         this.todoPage.update(page => page + 1);
      }
   }

   prevTodoPage() {
      if (this.todoPage() > 1) {
         this.todoPage.update(page => page - 1);
      }
   }
   resetVendorPage() {
      this.vendorPage.set(1);
   }

   nextVendorPage() {
      if (this.vendorPage() < this.totalVendorPages()) {
         this.vendorPage.update(page => page + 1);
      }
   }

   prevVendorPage() {
      if (this.vendorPage() > 1) {
         this.vendorPage.update(page => page - 1);
      }
   }

   resetPrewedPage() {
      this.prewedPage.set(1);
   }

   nextPrewedPage() {
      if (this.prewedPage() < this.totalPrewedPages()) {
         this.prewedPage.update(page => page + 1);
      }
   }

   prevPrewedPage() {
      if (this.prewedPage() > 1) {
         this.prewedPage.update(page => page - 1);
      }
   }

   resetIdleTimer() {
      const user = this.authService.currentUser();

      if (!user) {
         return;
      }

      if (this.idleTimeout) {
         clearTimeout(this.idleTimeout);
      }

      this.idleTimeout = setTimeout(() => {
         this.autoLogoutByIdle();
      }, this.idleLimitMs);
   }

   logout() {
      if (confirm('Yakin ingin keluar aplikasi?')) {
         if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = null;
         }

         this.authService.logout();
         this.resetState();
         this.publicPage.set('login');
         this.router.navigateByUrl('/login');
      }
   }
   autoLogoutByIdle() {
      if (this.idleTimeout) {
         clearTimeout(this.idleTimeout);
         this.idleTimeout = null;
      }

      alert('Sesi kamu berakhir karena tidak ada aktivitas. Silakan login ulang.');

      this.authService.logout();
      this.resetState();
      this.publicPage.set('login');
      this.router.navigateByUrl('/login');
   }
}








