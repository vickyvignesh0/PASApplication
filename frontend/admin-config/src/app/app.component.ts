import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserProfile, WardConfig, RolePermission } from './services/admin.service';

interface User {
  displayName: string;
  role: string;
  userIdentifier: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-900">
      <!-- Toast Container -->
      <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        @for (toast of toasts(); track toast.id) {
          <div [ngClass]="{
            'bg-emerald-500 text-slate-950': toast.type === 'success',
            'bg-rose-500 text-white': toast.type === 'error',
            'bg-sky-500 text-slate-950': toast.type === 'info'
          }" class="p-4 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-slide-in font-medium transition-all duration-300">
            <div class="flex items-center gap-2">
              @if (toast.type === 'success') {
                <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              } @else if (toast.type === 'error') {
                <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              } @else {
                <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              }
              <span>{{ toast.message }}</span>
            </div>
            <button (click)="dismissToast(toast.id)" class="hover:opacity-75 focus:outline-none">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        }
      </div>

      <!-- Authentication Portal -->
      @if (!isAuthenticated()) {
        <div class="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900 via-slate-900 to-black">
          <!-- Decorative Background Gradients -->
          <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
          <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

          <div class="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
            <div class="flex flex-col items-center mb-8">
              <!-- Logo / Badge -->
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-teal-500/20 mb-4">
                CP
              </div>
              <h1 class="text-2xl font-bold text-white tracking-tight">CarePortal</h1>
              <p class="text-slate-400 text-sm mt-1">Administrative Configuration Suite</p>
            </div>

            <!-- Login Form -->
            <form (submit)="login($event)" class="space-y-5">
              @if (loginError()) {
                <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl flex items-start gap-3">
                  <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{{ loginError() }}</span>
                </div>
              }

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username / Login ID</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <input type="text" [(ngModel)]="loginUsername" name="username" placeholder="e.g. admin" required [disabled]="useSmartcard()"
                         class="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input type="password" [(ngModel)]="loginPassword" name="password" placeholder="••••••••" required [disabled]="useSmartcard()"
                         class="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                </div>
              </div>

              <!-- Smartcard Toggle Switch -->
              <div class="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div class="flex items-center gap-2.5">
                  <svg class="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" /></svg>
                  <div>
                    <p class="text-sm font-semibold text-white">NHS Smartcard Login</p>
                    <p class="text-xs text-slate-500">CIS2 smartcard authentication</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [(ngModel)]="useSmartcard" name="useSmartcard" class="sr-only peer">
                  <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>

              <!-- NHS Security Mandate Disclaimer -->
              <div class="text-[10px] text-slate-500 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 leading-relaxed">
                <span class="font-bold text-amber-500/80">SECURITY AUDIT WARNING:</span> Unauthorized entry is prohibited. Accessing this dashboard triggers an audit event logged under Caldicott principles.
              </div>

              <button type="submit" [disabled]="loading()"
                      class="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-500/10 focus:outline-none hover:shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                @if (loading()) {
                  <svg class="animate-spin h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying Credentials...
                } @else {
                  Authenticate Session
                }
              </button>
            </form>
          </div>
        </div>
      } @else {
        <!-- Main Admin Dashboard -->
        <!-- Header with Glowing SVG Logo and Premium Micro-Card -->
        <header class="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20 shadow-md">
          <!-- Visual accent line -->
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-600"></div>

          <div class="flex items-center gap-3.5">
            <!-- Medical ECG Pulse Logo Icon -->
            <div class="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200">
              <svg class="h-6 w-6 text-teal-400 drop-shadow-[0_0_6px_rgba(45,212,191,0.6)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h2.25l1.35-3.375c.215-.537.97-.537 1.185 0L10.5 16.5l1.35-6.75a.625.625 0 011.185 0L14.25 15h2.25" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-lg font-extrabold text-white tracking-tight">CarePortal</h1>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400 uppercase tracking-widest border border-teal-500/25">Admin Config</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wide">Regional PAS & Bed Manager Administration Console</p>
            </div>
          </div>

          <!-- User Details / Controls -->
          <div class="flex items-center gap-4">
            <!-- Secure Connection Badge -->
            <div class="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
              <span class="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span class="text-[9px] font-bold uppercase tracking-wider text-teal-400">Admin Mode</span>
            </div>

            <!-- Profile micro-card -->
            <div class="bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-xl flex items-center space-x-3 shadow-md hover:bg-slate-800/60 transition-all duration-200 cursor-pointer">
              <div class="text-right hidden sm:block">
                <p class="text-xs font-bold text-white leading-none mb-1">{{ currentUser()?.displayName }}</p>
                <div class="flex items-center space-x-1.5 justify-end">
                  <span [class]="userRoleBadgeClass()" class="text-[9px] font-bold tracking-wider rounded px-1.5 py-0.25 border uppercase">
                    {{ currentUser()?.role }}
                  </span>
                  <span class="text-[9px] text-teal-400 font-semibold bg-teal-500/10 px-1.5 rounded border border-teal-500/20">
                    {{ userSmartcardLevel() }}
                  </span>
                </div>
              </div>
              <!-- Avatar with status ring -->
              <div class="relative">
                <div [class]="userAvatarGradient()" class="h-9 w-9 rounded-xl bg-gradient-to-br border border-slate-800 flex items-center justify-center text-xs font-black shadow-md uppercase">
                  {{ currentUser()?.displayName?.substring(0, 2) }}
                </div>
                <div class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-teal-400 border-2 border-slate-950 shadow-sm animate-pulse"></div>
              </div>
            </div>

            <button (click)="logout()" title="Logout Session" class="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-500 hover:border-rose-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow">
              <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <!-- Main Workspace -->
        <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
          <!-- Sidebar Navigation -->
          <aside class="w-full md:w-64 bg-slate-950/40 border-r border-slate-800 p-4 space-y-2 flex-shrink-0">
            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 mb-4">Configuration Consoles</div>
            
            <button (click)="activeTab.set('users')" [ngClass]="{'bg-teal-500/10 text-teal-400 border border-teal-500/25': activeTab() === 'users', 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent': activeTab() !== 'users'}"
                    class="w-full text-left px-3.5 py-3 rounded-xl font-medium transition-all flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span>User Directory</span>
              </div>
              <span class="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-bold group-hover:bg-slate-700 transition-colors">{{ adminService.users().length }}</span>
            </button>

            <button (click)="activeTab.set('wards')" [ngClass]="{'bg-teal-500/10 text-teal-400 border border-teal-500/25': activeTab() === 'wards', 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent': activeTab() !== 'wards'}"
                    class="w-full text-left px-3.5 py-3 rounded-xl font-medium transition-all flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <span>Ward Configurator</span>
              </div>
              <span class="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-bold group-hover:bg-slate-700 transition-colors">{{ adminService.Wards().length }}</span>
            </button>

            <button (click)="activeTab.set('permissions')" [ngClass]="{'bg-teal-500/10 text-teal-400 border border-teal-500/25': activeTab() === 'permissions', 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent': activeTab() !== 'permissions'}"
                    class="w-full text-left px-3.5 py-3 rounded-xl font-medium transition-all flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span>Permissions Grid</span>
              </div>
            </button>

            <div class="pt-6">
              <div class="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-2.5">
                <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">System Parameters</p>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-400">Environment:</span>
                  <span class="font-bold text-teal-400">NHS Local</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-400">MPI Sync:</span>
                  <span class="font-bold text-teal-400">Online</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-400">Marten DB:</span>
                  <span class="font-bold text-teal-400">PostgreSQL</span>
                </div>
              </div>
            </div>
          </aside>

          <!-- Tab Panel Views -->
          <main class="flex-1 overflow-y-auto p-6 bg-slate-900/60">
            <!-- TAB 1: USER ACCOUNT MANAGEMENT -->
            @if (activeTab() === 'users') {
              <div class="space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 class="text-2xl font-bold text-white tracking-tight">Clinical User Directory</h2>
                    <p class="text-sm text-slate-400">Configure roles and NHS/HSE Smartcard levels (Levels 1-4) for authorized practitioners.</p>
                  </div>
                  <button (click)="openAddUserModal()" class="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all flex items-center gap-2 text-sm">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Register User
                  </button>
                </div>

                <!-- Filters & Search -->
                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div class="relative w-full sm:flex-1">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input type="text" [(ngModel)]="userSearchQuery" placeholder="Search by practitioner name or username..."
                           class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none text-white text-sm transition-all">
                  </div>
                  <div class="flex items-center gap-2 w-full sm:w-auto">
                    <select [(ngModel)]="roleFilter" class="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none w-full sm:w-auto">
                      <option value="">All Roles</option>
                      <option value="SystemAdmin">SystemAdmin</option>
                      <option value="ClinicalStaff">ClinicalStaff</option>
                      <option value="WardManager">WardManager</option>
                    </select>
                  </div>
                </div>

                <!-- Users Table -->
                <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                      <thead>
                        <tr class="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <th class="p-4">Display Name</th>
                          <th class="p-4">Username</th>
                          <th class="p-4">Assigned Role</th>
                          <th class="p-4">Smartcard Level</th>
                          <th class="p-4">Audit Status</th>
                          <th class="p-4">Registration Date</th>
                          <th class="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60 text-sm">
                        @for (usr of filteredUsers(); track usr.id) {
                          <tr class="hover:bg-slate-800/20 transition-colors">
                            <td class="p-4 font-semibold text-white">{{ usr.displayName }}</td>
                            <td class="p-4 text-slate-400 font-mono text-xs">{{ usr.username }}</td>
                            <td class="p-4">
                              <span [ngClass]="{
                                'bg-purple-500/10 text-purple-400 border-purple-500/20': usr.role === 'SystemAdmin',
                                'bg-sky-500/10 text-sky-400 border-sky-500/20': usr.role === 'ClinicalStaff',
                                'bg-teal-500/10 text-teal-400 border-teal-500/20': usr.role === 'WardManager'
                              }" class="px-2.5 py-1 rounded-full text-xs font-medium border uppercase tracking-wider">
                                {{ usr.role }}
                              </span>
                            </td>
                            <td class="p-4">
                              <div class="flex items-center gap-1.5">
                                @for (star of [1,2,3,4]; track star) {
                                  <svg [ngClass]="star <= usr.smartcardLevel ? 'text-amber-400' : 'text-slate-700'" class="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                }
                                <span class="text-xs text-slate-400 ml-1">(Level {{ usr.smartcardLevel }})</span>
                              </div>
                            </td>
                            <td class="p-4">
                              <span [ngClass]="usr.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'"
                                    class="px-2.5 py-1 rounded-full text-xs font-medium border">
                                {{ usr.isActive ? 'Active' : 'Revoked' }}
                              </span>
                            </td>
                            <td class="p-4 text-xs text-slate-500">{{ usr.createdAt | date:'dd MMM yyyy HH:mm' }}</td>
                            <td class="p-4 text-right">
                              <button (click)="openEditUserModal(usr)" class="text-teal-400 hover:text-teal-300 font-semibold text-xs bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 rounded-lg border border-teal-500/20 transition-all">
                                Edit User
                              </button>
                            </td>
                          </tr>
                        } @empty {
                          <tr>
                            <td colspan="7" class="p-8 text-center text-slate-500">No users found matching parameters.</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 2: WARD CONFIGURATOR -->
            @if (activeTab() === 'wards') {
              <div class="space-y-6 animate-fade-in">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 class="text-2xl font-bold text-white tracking-tight">Ward Configurator & Bed Allocation</h2>
                    <p class="text-sm text-slate-400">Configure regional hospital wards, assign bed limits, and toggle infectious isolation statuses.</p>
                  </div>
                  <button (click)="showAddWardCard.set(!showAddWardCard())" class="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all flex items-center gap-2 text-sm">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Create New Ward
                  </button>
                </div>

                <!-- Add Ward Card (Toggled) -->
                @if (showAddWardCard()) {
                  <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-slide-in relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
                    <h3 class="text-lg font-bold text-white mb-4">Register New Ward Configuration</h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Ward Code</label>
                        <input type="text" [(ngModel)]="newWard.wardCode" placeholder="e.g. ICU"
                               class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-500 focus:outline-none text-white text-sm">
                      </div>
                      <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Ward Name</label>
                        <input type="text" [(ngModel)]="newWard.name" placeholder="e.g. Intensive Care Unit"
                               class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-500 focus:outline-none text-white text-sm">
                      </div>
                      <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Bed Capacity</label>
                        <input type="number" [(ngModel)]="newWard.totalBeds" min="1"
                               class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-500 focus:outline-none text-white text-sm">
                      </div>
                      <div class="flex items-center gap-4">
                        <button (click)="createWard()" class="flex-1 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-teal-500/10">
                          Register Ward
                        </button>
                        <button (click)="showAddWardCard.set(false)" class="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                }

                <!-- Wards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  @for (ward of adminService.Wards(); track ward.id) {
                    <!-- Ward Configuration Card -->
                    <div [ngClass]="{
                      'border-amber-500/50 shadow-amber-500/5 bg-gradient-to-br from-amber-500/5 via-slate-900 to-slate-900': ward.isInfectionControlZone,
                      'border-slate-800 bg-slate-900': !ward.isInfectionControlZone
                    }" class="border rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden transition-all duration-300">
                      
                      <!-- Infectious Warning Ribbon -->
                      @if (ward.isInfectionControlZone) {
                        <div class="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 animate-pulse"></div>
                      }

                      <div class="space-y-2.5">
                        <div class="flex items-center justify-between">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/80 text-slate-400 border border-slate-800 uppercase tracking-widest">{{ ward.wardCode }}</span>
                          @if (ward.isInfectionControlZone) {
                            <span class="flex items-center gap-1 text-xs font-bold text-amber-500">
                              <svg class="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              Infection Hotzone
                            </span>
                          }
                        </div>
                        <h3 class="text-lg font-bold text-white tracking-tight">{{ ward.name }}</h3>
                      </div>

                      <div class="space-y-4">
                        <!-- Bed Capacity Settings -->
                        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800/60 flex items-center justify-between">
                          <div>
                            <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Allocated Beds</p>
                            <p class="text-2xl font-black text-white mt-1">{{ ward.totalBeds }}</p>
                          </div>
                          <div class="flex items-center gap-2">
                            <button (click)="adjustBedCapacity(ward, -1)" class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white flex items-center justify-center font-bold text-lg select-none transition-all">-</button>
                            <button (click)="adjustBedCapacity(ward, 1)" class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white flex items-center justify-center font-bold text-lg select-none transition-all">+</button>
                          </div>
                        </div>

                        <!-- Infection Control Toggle -->
                        <div class="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/40">
                          <div>
                            <p class="text-xs font-semibold text-slate-300">Infection Isolation</p>
                            <p class="text-[10px] text-slate-500">Requires PPE protocols</p>
                          </div>
                          <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" [checked]="ward.isInfectionControlZone" (change)="toggleInfectionControl(ward)" class="sr-only peer">
                            <div class="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- TAB 3: PERMISSIONS MATRIX -->
            @if (activeTab() === 'permissions') {
              <div class="space-y-6">
                <div>
                  <h2 class="text-2xl font-bold text-white tracking-tight">Role Permissions Matrix</h2>
                  <p class="text-sm text-slate-400">Map structural CarePortal modules to default clinical positions. Unauthorized modules are dynamically locked inside console directories.</p>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div class="overflow-x-auto">
                    <table class="w-full border-collapse">
                      <thead>
                        <tr class="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <th class="p-6 text-left w-1/3">Portal Module</th>
                          <th class="p-6 text-center">SystemAdmin</th>
                          <th class="p-6 text-center">ClinicalStaff</th>
                          <th class="p-6 text-center">WardManager</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/60">
                        @for (module of modulesList; track module) {
                          <tr class="hover:bg-slate-800/10 transition-colors">
                            <td class="p-6 text-left">
                              <div>
                                <span class="font-semibold text-white">{{ module }}</span>
                                <p class="text-xs text-slate-500 mt-1">{{ getModuleDescription(module) }}</p>
                              </div>
                            </td>
                            <!-- SystemAdmin Checkbox -->
                            <td class="p-6 text-center">
                              <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" [checked]="hasPermission('SystemAdmin', module)" (change)="togglePermission('SystemAdmin', module)" class="sr-only peer">
                                <div class="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                              </label>
                            </td>
                            <!-- ClinicalStaff Checkbox -->
                            <td class="p-6 text-center">
                              <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" [checked]="hasPermission('ClinicalStaff', module)" (change)="togglePermission('ClinicalStaff', module)" class="sr-only peer">
                                <div class="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                              </label>
                            </td>
                            <!-- WardManager Checkbox -->
                            <td class="p-6 text-center">
                              <label class="inline-flex items-center cursor-pointer">
                                <input type="checkbox" [checked]="hasPermission('WardManager', module)" (change)="togglePermission('WardManager', module)" class="sr-only peer">
                                <div class="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                              </label>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="flex justify-end gap-3 mt-4">
                  <button (click)="savePermissions()" class="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold py-3 px-6 rounded-xl shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all flex items-center gap-2 text-sm">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save Permissions Matrix
                  </button>
                </div>
              </div>
            }
          </main>
        </div>

        <!-- Add/Edit User Modal Dialog -->
        @if (showUserModal()) {
          <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-slide-in">
              <button (click)="closeUserModal()" class="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <h3 class="text-xl font-bold text-white mb-6">
                {{ userModalMode() === 'add' ? 'Register New Practitioner Profile' : 'Edit User Profile' }}
              </h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Display Name</label>
                  <input type="text" [(ngModel)]="modalUser.displayName" placeholder="e.g. Dr. Fiona Gallagher"
                         class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-500 focus:outline-none text-white text-sm">
                </div>

                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username / Login ID</label>
                  <input type="text" [(ngModel)]="modalUser.username" placeholder="e.g. fiona_sc" [disabled]="userModalMode() === 'edit'"
                         class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-500 focus:outline-none text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Assigned Role</label>
                    <select [(ngModel)]="modalUser.role"
                            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-500 focus:outline-none text-white text-sm">
                      <option value="ClinicalStaff">ClinicalStaff</option>
                      <option value="SystemAdmin">SystemAdmin</option>
                      <option value="WardManager">WardManager</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Smartcard Level</label>
                    <select [(ngModel)]="modalUser.smartcardLevel"
                            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-teal-500 focus:outline-none text-white text-sm">
                      <option [ngValue]="1">Level 1 (Basic)</option>
                      <option [ngValue]="2">Level 2 (Standard)</option>
                      <option [ngValue]="3">Level 3 (Specialist)</option>
                      <option [ngValue]="4">Level 4 (Admin/Full)</option>
                    </select>
                  </div>
                </div>

                <div class="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <p class="text-sm font-semibold text-white">Active Status</p>
                    <p class="text-xs text-slate-500">Allow logins with credentials</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [(ngModel)]="modalUser.isActive" class="sr-only peer">
                    <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <button (click)="closeUserModal()" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button (click)="submitUserModal()" class="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold py-2.5 px-5 rounded-xl text-sm transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateY(1rem); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class AppComponent implements OnInit {
  public adminService = inject(AdminService);

  // Authentication State
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<User | null>(null);

  // Computed values for user avatar and badge styling
  public userAvatarGradient = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) return 'from-slate-400 to-slate-600 text-slate-350';
    if (role === 'SystemAdmin') return 'from-purple-500 to-indigo-600 text-white';
    if (role === 'WardManager') return 'from-amber-400 to-rose-500 text-white';
    return 'from-emerald-400 to-teal-600 text-white';
  });

  public userRoleBadgeClass = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) return 'bg-slate-500/20 text-slate-350 border-slate-500/30';
    if (role === 'SystemAdmin') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (role === 'WardManager') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  });

  public userSmartcardLevel = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) return 'Lvl 1';
    if (role === 'SystemAdmin') return 'Lvl 4';
    if (role === 'WardManager') return 'Lvl 3';
    return 'Lvl 2';
  });
  public loading = signal<boolean>(false);
  public loginError = signal<string>('');
  
  public loginUsername = '';
  public loginPassword = '';
  public useSmartcard = signal<boolean>(false);

  // Active Tab
  public activeTab = signal<'users' | 'wards' | 'permissions'>('users');

  // Search & Filters
  public userSearchQuery = '';
  public roleFilter = '';

  // Toasts
  public toasts = signal<Toast[]>([]);
  private toastIdCounter = 0;

  // Modals & Forms
  public showUserModal = signal<boolean>(false);
  public userModalMode = signal<'add' | 'edit'>('add');
  public modalUser: UserProfile = this.createEmptyUser();

  public showAddWardCard = signal<boolean>(false);
  public newWard = this.createEmptyWard();

  // Modules catalog
  public modulesList = [
    'BedBoard',
    'Referrals',
    'Booking',
    'Emergency',
    'Documents',
    'MpiDirectory',
    'AdminConfig'
  ];

  ngOnInit() {
    this.restoreSession();
  }

  // Session handling
  private restoreSession() {
    const token = localStorage.getItem('pas_auth_token');
    const userJson = localStorage.getItem('pas_auth_user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        if (user.role === 'SystemAdmin') {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
          this.loadAllData();
        } else {
          // Clean up if the token does not belong to an admin
          localStorage.removeItem('pas_auth_token');
          localStorage.removeItem('pas_auth_user');
        }
      } catch {
        localStorage.removeItem('pas_auth_token');
        localStorage.removeItem('pas_auth_user');
      }
    }
  }

  public async login(event: Event) {
    event.preventDefault();
    this.loginError.set('');
    this.loading.set(true);

    try {
      const url = 'http://localhost:5000/api/auth/login-simulated';
      const body = {
        username: this.useSmartcard() ? 'CIS2-User' : this.loginUsername,
        password: this.useSmartcard() ? '' : this.loginPassword,
        useSmartcard: this.useSmartcard()
      };

      let response;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          response = await res.json();
        } else {
          throw new Error('Invalid credentials');
        }
      } catch (apiErr) {
        console.warn('API connection offline, using simulated login flow.', apiErr);
        // Fallback simulated login
        if (this.loginUsername.toLowerCase() === 'admin' || this.useSmartcard()) {
          response = {
            token: 'mock_jwt_token_for_admin_run',
            displayName: this.useSmartcard() ? 'Dr. Fiona Gallagher (NHS Smartcard)' : 'System Administrator',
            role: this.useSmartcard() ? 'ClinicalStaff' : 'SystemAdmin',
            userIdentifier: this.useSmartcard() ? 'NHS-SC-883921' : 'ADMIN-001'
          };
        } else {
          throw new Error('Access Denied. Only SystemAdmin or Smartcard can access Admin Panel.');
        }
      }

      if (response.role !== 'SystemAdmin') {
        this.loginError.set('Access Denied: You must possess SystemAdmin permissions.');
        this.loading.set(false);
        return;
      }

      localStorage.setItem('pas_auth_token', response.token);
      localStorage.setItem('pas_auth_user', JSON.stringify({
        displayName: response.displayName,
        role: response.role,
        userIdentifier: response.userIdentifier
      }));

      this.currentUser.set({
        displayName: response.displayName,
        role: response.role,
        userIdentifier: response.userIdentifier
      });
      this.isAuthenticated.set(true);
      this.showToast('Authentication successful.', 'success');
      this.loadAllData();
    } catch (err: any) {
      this.loginError.set(err.message || 'Login failed.');
    } finally {
      this.loading.set(false);
    }
  }

  public logout() {
    localStorage.removeItem('pas_auth_token');
    localStorage.removeItem('pas_auth_user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.showToast('Session terminated.', 'info');
  }

  // Load backend configurations
  private async loadAllData() {
    try {
      await Promise.all([
        this.adminService.loadUsers(),
        this.adminService.loadWards(),
        this.adminService.loadPermissions()
      ]);
      this.showToast('Administrative directory synchronised.', 'success');
    } catch {
      this.showToast('Sync error. Operating in offline simulated database.', 'info');
    }
  }

  // User list operations
  public filteredUsers = computed(() => {
    let list = this.adminService.users();
    
    if (this.userSearchQuery.trim()) {
      const q = this.userSearchQuery.toLowerCase();
      list = list.filter(u => 
        u.displayName.toLowerCase().includes(q) || 
        u.username.toLowerCase().includes(q)
      );
    }

    if (this.roleFilter) {
      list = list.filter(u => u.role === this.roleFilter);
    }

    return list;
  });

  private createEmptyUser(): UserProfile {
    return {
      id: '',
      username: '',
      displayName: '',
      role: 'ClinicalStaff',
      smartcardLevel: 2,
      isActive: true,
      createdAt: new Date().toISOString()
    };
  }

  public openAddUserModal() {
    this.modalUser = this.createEmptyUser();
    // Generate new unique ID representation
    this.modalUser.id = 'usr-' + Math.random().toString(36).substr(2, 9);
    this.userModalMode.set('add');
    this.showUserModal.set(true);
  }

  public openEditUserModal(user: UserProfile) {
    this.modalUser = { ...user };
    this.userModalMode.set('edit');
    this.showUserModal.set(true);
  }

  public closeUserModal() {
    this.showUserModal.set(false);
  }

  public async submitUserModal() {
    if (!this.modalUser.username.trim() || !this.modalUser.displayName.trim()) {
      this.showToast('Please specify all details.', 'error');
      return;
    }

    try {
      await this.adminService.saveUser(this.modalUser);
      await this.adminService.loadUsers();
      this.showToast('Practitioner profile saved successfully.', 'success');
      this.closeUserModal();
    } catch {
      this.showToast('Failed to save profile.', 'error');
    }
  }

  // Ward operations
  private createEmptyWard(): WardConfig {
    return {
      id: '',
      wardCode: '',
      name: '',
      totalBeds: 10,
      isInfectionControlZone: false
    };
  }

  public async createWard() {
    if (!this.newWard.wardCode.trim() || !this.newWard.name.trim()) {
      this.showToast('Please complete all ward parameters.', 'error');
      return;
    }

    try {
      this.newWard.id = 'w-' + Math.random().toString(36).substr(2, 9);
      await this.adminService.saveWard(this.newWard);
      await this.adminService.loadWards();
      this.newWard = this.createEmptyWard();
      this.showAddWardCard.set(false);
      this.showToast('Ward registered successfully.', 'success');
    } catch {
      this.showToast('Failed to register ward.', 'error');
    }
  }

  public async adjustBedCapacity(ward: WardConfig, delta: number) {
    const updated = { ...ward, totalBeds: Math.max(1, ward.totalBeds + delta) };
    try {
      await this.adminService.saveWard(updated);
      await this.adminService.loadWards();
      this.showToast(`Updated capacity for ${ward.wardCode} to ${updated.totalBeds}.`, 'success');
    } catch {
      this.showToast('Failed to adjust bed capacity.', 'error');
    }
  }

  public async toggleInfectionControl(ward: WardConfig) {
    const updated = { ...ward, isInfectionControlZone: !ward.isInfectionControlZone };
    try {
      await this.adminService.saveWard(updated);
      await this.adminService.loadWards();
      const status = updated.isInfectionControlZone ? 'Activated Hotzone isolation' : 'Deactivated hotzone isolation';
      this.showToast(`${status} for ward ${ward.wardCode}.`, 'success');
    } catch {
      this.showToast('Failed to toggle infection control.', 'error');
    }
  }

  // Permissions matrix operations
  public hasPermission(role: string, module: string): boolean {
    const records = this.adminService.permissions();
    const match = records.find(p => p.role === role);
    return match ? match.allowedModules.includes(module) : false;
  }

  public togglePermission(role: string, module: string) {
    const records = [ ...this.adminService.permissions() ];
    let match = records.find(p => p.role === role);
    
    if (!match) {
      match = { id: 'p-' + Math.random().toString(36).substr(2, 9), role: role, allowedModules: [] };
      records.push(match);
    }

    if (match.allowedModules.includes(module)) {
      match.allowedModules = match.allowedModules.filter(m => m !== module);
    } else {
      match.allowedModules.push(module);
    }

    // Set local state immediately for UI response
    this.adminService.permissions.set(records);
  }

  public async savePermissions() {
    try {
      const records = this.adminService.permissions();
      await Promise.all(
        records.map(record => this.adminService.savePermission(record))
      );
      this.showToast('Permissions configuration saved to database.', 'success');
    } catch {
      this.showToast('Failed to save permissions.', 'error');
    }
  }

  public getModuleDescription(module: string): string {
    const descMap: { [key: string]: string } = {
      'BedBoard': 'Real-time bed allocation grid, occupancy indicators, and ward assignment dashboards.',
      'Referrals': 'Inpatient and outpatient clinical referral routing, waitlist trackers, and external transfer forms.',
      'Booking': 'Integrated scheduler for clinical consultations, theatres, and specialty clinics.',
      'Emergency': 'Emergency department casualty log, trauma triage, and rapid assessment queues.',
      'Documents': 'Case record document storage, PDF scans upload, and external health record ingestion.',
      'MpiDirectory': 'Master Patient Index directory search, national identifiers verification, and demographics registry.',
      'AdminConfig': 'System-wide configuration, access permission grids, user profiles, and ward mappings.'
    };
    return descMap[module] || 'Portal module service access scope.';
  }

  // Toast utilities
  public showToast(message: string, type: 'success' | 'error' | 'info') {
    const id = this.toastIdCounter++;
    this.toasts.update(t => [...t, { id, message, type }]);
    
    // Auto dismiss after 3.5s
    setTimeout(() => {
      this.dismissToast(id);
    }, 3500);
  }

  public dismissToast(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
