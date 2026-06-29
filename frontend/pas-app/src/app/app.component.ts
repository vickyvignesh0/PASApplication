import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans">
      <!-- Top Banner / Header with Ambient Dark Blue Gradient & Modern Branding -->
      <header class="bg-gradient-to-r from-slate-950 via-nhs-darkBlue to-nhs-blue text-white shadow-lg relative overflow-hidden">
        <!-- Visual Accent line -->
        <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500"></div>
        
        <div class="w-full px-6 h-16 flex items-center justify-between relative z-10">
          <div class="flex items-center space-x-3.5">
            <!-- Medical ECG Pulse Logo Icon -->
            <div class="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md shadow-md hover:scale-105 transition-transform duration-200">
              <svg class="h-6 w-6 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h2.25l1.35-3.375c.215-.537.97-.537 1.185 0L10.5 16.5l1.35-6.75a.625.625 0 011.185 0L14.25 15h2.25" />
              </svg>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h1 class="text-lg font-extrabold tracking-tight">CarePortal</h1>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase tracking-widest border border-emerald-400/30">PAS</span>
              </div>
              <p class="text-[9px] text-blue-100 uppercase tracking-widest font-bold opacity-80">UK & Ireland Enterprise Registry</p>
            </div>
          </div>

          <!-- Active Session Info (Premium Micro-Card) -->
          @if (authService.isAuthenticated()) {
            <div class="hidden md:flex items-center space-x-4">
              <!-- Secure Connection Badge -->
              <div class="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Secure Session</span>
              </div>

              <!-- Profile micro-card -->
              <div class="bg-white/10 border border-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center space-x-3 shadow-md hover:bg-white/15 transition-all duration-200 cursor-pointer">
                <div class="text-right">
                  <p class="text-xs font-bold text-white leading-none mb-1">{{ authService.currentUser()?.displayName }}</p>
                  <div class="flex items-center space-x-1.5 justify-end">
                    <span [class]="userRoleBadgeClass()" class="text-[9px] font-bold tracking-wider rounded-md px-1.5 py-0.25 border uppercase">
                      {{ authService.currentUser()?.role }}
                    </span>
                    <span class="text-[9px] text-slate-300 font-semibold bg-white/10 px-1 rounded">
                      {{ userSmartcardLevel() }}
                    </span>
                  </div>
                </div>
                <!-- Avatar with status ring -->
                <div class="relative">
                  <div [class]="userAvatarGradient()" class="h-9 w-9 rounded-xl bg-gradient-to-br border border-white/30 flex items-center justify-center text-xs font-black shadow-md uppercase">
                    {{ authService.currentUser()?.displayName?.substring(0, 2) }}
                  </div>
                  <div class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-sm animate-pulse"></div>
                </div>
              </div>

              <!-- Sign Out Button -->
              <button 
                (click)="authService.logout()"
                title="Sign Out Session"
                class="h-9 w-9 rounded-xl bg-white/10 border border-white/20 hover:bg-nhs-emergencyRed hover:border-nhs-emergencyRed/45 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow">
                <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          }
        </div>
      </header>

      <!-- Main Navigation Menu (Premium Button-style tabs) -->
      @if (authService.isAuthenticated()) {
        <nav class="bg-white border-b border-gray-200/80 shadow-sm overflow-x-auto">
          <div class="w-full px-6 flex items-center space-x-3 h-14 min-w-max">
            <!-- Unified Workspace Cockpit -->
            <a routerLink="/workspace" 
               routerLinkActive="bg-nhs-blue/10 text-nhs-blue border-nhs-blue/20 shadow-sm"
               [routerLinkActiveOptions]="{exact: true}"
               class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent inline-flex items-center space-x-2 transition-all duration-150">
               <svg class="h-4.5 w-4.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
               </svg>
               <span>Clinical Cockpit</span>
            </a>

            <!-- Bed Board -->
            <a routerLink="/bedboard" 
               routerLinkActive="bg-nhs-blue/10 text-nhs-blue border-nhs-blue/20 shadow-sm"
               class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent inline-flex items-center space-x-2 transition-all duration-150">
               <svg class="h-4.5 w-4.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
               <span>Real-Time Bed Board</span>
            </a>
            
            <!-- Referrals & Waiting List -->
            <a routerLink="/referrals" 
               routerLinkActive="bg-nhs-blue/10 text-nhs-blue border-nhs-blue/20 shadow-sm"
               class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent inline-flex items-center space-x-2 transition-all duration-150">
               <svg class="h-4.5 w-4.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
               <span>Referrals & Waitlist</span>
            </a>

            <!-- Clinic Booking -->
            <a routerLink="/booking" 
               routerLinkActive="bg-nhs-blue/10 text-nhs-blue border-nhs-blue/20 shadow-sm"
               class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent inline-flex items-center space-x-2 transition-all duration-150">
               <svg class="h-4.5 w-4.5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
               <span>Clinic Booking</span>
            </a>

            <!-- Emergency care (ED) -->
            <a routerLink="/emergency" 
               routerLinkActive="bg-nhs-blue/10 text-nhs-blue border-nhs-blue/20 shadow-sm"
               class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent inline-flex items-center space-x-2 transition-all duration-150">
               <svg class="h-4.5 w-4.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               <span>Emergency Dept (ED)</span>
            </a>

            <!-- Clinical Documents / Case Files -->
            <a routerLink="/documents" 
               routerLinkActive="bg-nhs-blue/10 text-nhs-blue border-nhs-blue/20 shadow-sm"
               class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent inline-flex items-center space-x-2 transition-all duration-150">
               <svg class="h-4.5 w-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
               </svg>
               <span>Case Documents</span>
            </a>

            <!-- Locked Patient Directory MPI -->
            <a routerLink="/mpi" 
               routerLinkActive="bg-nhs-blue/10 text-nhs-blue border-nhs-blue/20 shadow-sm"
               class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent inline-flex items-center space-x-2 transition-all duration-150">
               <svg class="h-4.5 w-4.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
               <span>Patient Directory (MPI)</span>
            </a>
          </div>
        </nav>
      }

      <!-- Content Container -->
      <main class="flex-grow w-full px-6 py-6 flex flex-col">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t border-gray-200 py-4">
        <div class="w-full px-6 text-center text-xs text-gray-500 flex justify-between items-center">
          <p>© 2026 CarePortal Enterprise PAS. Built for NHS & HSE interoperability.</p>
          <div class="flex items-center space-x-2">
            <span class="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-medium text-gray-600">Zoneless Change Detection Active</span>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class AppComponent {
  authService = inject(AuthService);

  userAvatarGradient = computed(() => {
    const role = this.authService.currentUser()?.role;
    if (!role) return 'from-slate-400 to-slate-600';
    if (role === 'SystemAdmin') return 'from-purple-500 to-indigo-600 text-white';
    if (role === 'WardManager') return 'from-amber-400 to-rose-500 text-white';
    return 'from-emerald-400 to-teal-600 text-white';
  });

  userRoleBadgeClass = computed(() => {
    const role = this.authService.currentUser()?.role;
    if (!role) return 'bg-slate-500/20 text-slate-350 border-slate-500/30';
    if (role === 'SystemAdmin') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (role === 'WardManager') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  });

  userSmartcardLevel = computed(() => {
    const role = this.authService.currentUser()?.role;
    if (!role) return 'Lvl 1';
    if (role === 'SystemAdmin') return 'Lvl 4';
    if (role === 'WardManager') return 'Lvl 3';
    return 'Lvl 2';
  });
}

