import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

interface DemoUser {
  name: string;
  role: string;
  dept: string;
  username: string;
  avatar: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 animate-zoom-in">
        
        <!-- Left Side: Login Form -->
        <div class="p-8 flex flex-col justify-between space-y-6">
          <div>
            <!-- Header / Logo -->
            <div class="flex items-center space-x-2">
              <span class="text-3xl">🏥</span>
              <div>
                <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">CarePortal HIS</h2>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enterprise Patient Administration</p>
              </div>
            </div>
            
            <div class="mt-6">
              <h3 class="text-lg font-bold text-slate-900 leading-snug">Sign in to your session</h3>
              <p class="text-xs text-slate-500 mt-1">Authenticate using your smartcard or local Active Directory credentials.</p>
            </div>

            <!-- Smartcard quicklogin -->
            <div class="mt-6">
              <button 
                type="button"
                (click)="loginWithSmartcard()"
                [disabled]="isAuthenticating()"
                class="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2">
                @if (isReadingCard()) {
                  <span class="animate-ping h-2 w-2 rounded-full bg-blue-600"></span>
                  <span>Reading Smartcard...</span>
                } @else {
                  <span>💳 Sign In with NHS CIS2 Smartcard</span>
                }
              </button>
            </div>

            <!-- Divider -->
            <div class="relative my-5">
              <div class="absolute inset-0 flex items-center"><span class="w-full border-t border-slate-200"></span></div>
              <div class="relative flex justify-center text-[10px] uppercase font-bold text-slate-400"><span class="px-2 bg-white">Or Credentials</span></div>
            </div>

            <!-- Credentials Form -->
            <form (submit)="loginWithCredentials($event)" class="space-y-4">
              @if (errorMessage()) {
                <div class="bg-red-50 border border-red-200 p-3 rounded-lg text-red-700 text-xs font-semibold">
                  {{ errorMessage() }}
                </div>
              }

              <div>
                <label for="username" class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                <input 
                  id="username"
                  type="text" 
                  [(ngModel)]="username" 
                  name="username" 
                  required 
                  placeholder="Enter AD username"
                  class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                />
              </div>

              <div>
                <label for="password" class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <input 
                  id="password"
                  type="password" 
                  [(ngModel)]="password" 
                  name="password" 
                  required 
                  placeholder="••••••••"
                  class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                />
              </div>

              <div class="flex items-center justify-between text-[11px]">
                <label class="flex items-center space-x-2 cursor-pointer text-slate-650">
                  <input type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span>Remember Me</span>
                </label>
                <a href="#" class="text-blue-600 hover:underline">Forgot Password?</a>
              </div>

              <button 
                type="submit" 
                [disabled]="isAuthenticating()"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                Sign In
              </button>
            </form>
          </div>

          <!-- Version & Environment Badge -->
          <div class="flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] text-slate-400 font-semibold uppercase">
            <span>Version 5.4.1</span>
            <span class="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
              Training / Test Environment
            </span>
          </div>
        </div>

        <!-- Right Side: Demo User Selector Grid -->
        <div class="bg-slate-50 p-8 border-l border-slate-200 flex flex-col">
          <h3 class="font-bold text-slate-900 text-sm">Demo Identity Gateway</h3>
          <p class="text-[11px] text-slate-450 mt-1">Select a role template below to immediately simulate Active Directory authentication.</p>
          
          <div class="grid grid-cols-2 gap-3 mt-4 overflow-y-auto max-h-[360px] scrollbar-none pr-1">
            @for (user of demoUsers; track user.username) {
              <div 
                (click)="quickLogin(user)"
                class="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-2.5 cursor-pointer flex items-center space-x-2.5 hover:shadow-sm transition-all duration-150 group">
                <span class="text-xl bg-slate-50 rounded-lg h-8 w-8 flex items-center justify-center">{{ user.avatar }}</span>
                <div class="truncate leading-tight">
                  <h4 class="font-bold text-slate-800 text-[11px] group-hover:text-blue-600 truncate">{{ user.name }}</h4>
                  <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">{{ user.role }}</span>
                  <span class="text-[8px] text-slate-400 truncate block">{{ user.dept }}</span>
                </div>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .animate-zoom-in {
      animation: zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-none {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';

  isReadingCard = signal<boolean>(false);
  isAuthenticating = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  demoUsers: DemoUser[] = [
    { name: 'Dr. Gregory House', role: 'Consultant', dept: 'Cardiology', username: 'dr_house', avatar: '👨‍⚕️' },
    { name: 'Dr. Beverly Crusher', role: 'Doctor', dept: 'General Medicine', username: 'dr_crusher', avatar: '👩‍⚕️' },
    { name: 'Admin Staff User', role: 'Administrator', dept: 'IT Operations', username: 'admin', avatar: '🛡️' },
    { name: 'Nurse Sarah Connor', role: 'Nurse', dept: 'Emergency Dept', username: 'nurse_connor', avatar: '🩺' },
    { name: 'Ward Clerk Smith', role: 'Ward Clerk', dept: 'Acute Medical Unit', username: 'ward_clerk', avatar: '📁' },
    { name: 'Records Officer', role: 'Records Officer', dept: 'Medical Archives', username: 'records_officer', avatar: '🗄️' },
    { name: 'Radiologist Vance', role: 'Radiologist', dept: 'Imaging Suite', username: 'radiologist_vance', avatar: '🩻' },
    { name: 'Pharmacist Cuddy', role: 'Pharmacist', dept: 'Pharmacy Ward', username: 'pharmacist_cuddy', avatar: '💊' },
    { name: 'Lab Tech Kutner', role: 'Lab Tech', dept: 'Pathology Lab', username: 'lab_tech', avatar: '🔬' },
    { name: 'Receptionist O\'Neill', role: 'Receptionist', dept: 'Outpatients Desk', username: 'receptionist_oneill', avatar: '👤' },
    { name: 'Finance Lead Cooper', role: 'Finance Officer', dept: 'Revenue Audit', username: 'finance_cooper', avatar: '🪙' }
  ];

  async loginWithSmartcard() {
    this.errorMessage.set(null);
    this.isReadingCard.set(true);
    this.isAuthenticating.set(true);

    setTimeout(async () => {
      try {
        const success = await this.authService.login('Dr. Fiona Gallagher', 'pass', true);
        if (success) {
          this.router.navigate(['/']);
        } else {
          this.errorMessage.set('Smartcard authentication failed.');
        }
      } finally {
        this.isReadingCard.set(false);
        this.isAuthenticating.set(false);
      }
    }, 1200);
  }

  async loginWithCredentials(event: Event) {
    event.preventDefault();
    this.errorMessage.set(null);

    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage.set('Username and Password are required.');
      return;
    }

    this.isAuthenticating.set(true);
    try {
      const success = await this.authService.login(this.username, this.password, false);
      if (success) {
        this.router.navigate(['/']);
      } else {
        this.errorMessage.set('Invalid username or password.');
      }
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  async quickLogin(user: DemoUser) {
    this.errorMessage.set(null);
    this.isAuthenticating.set(true);

    try {
      const success = await this.authService.login(user.name, 'pass', false);
      if (success) {
        this.router.navigate(['/']);
      } else {
        this.errorMessage.set('Quick login authentication failed.');
      }
    } finally {
      this.isAuthenticating.set(false);
    }
  }
}
