import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <!-- Outer Portal Container -->
      <div class="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl shadow-2xl border border-white/20 animate-zoom-in">
        
        <!-- Header / Logo -->
        <div class="text-center space-y-2">
          <!-- Shield/Access Icon -->
          <div class="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-nhs-darkBlue to-nhs-blue flex items-center justify-center text-white shadow-lg shadow-nhs-blue/20">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-nhs-darkBlue tracking-tight">Clinical Gateway Login</h2>
          <p class="text-xs text-gray-500 max-w-xs mx-auto">Access to the Patient Administration System (PAS) requires valid credentials or identity token validation.</p>
        </div>

        <!-- NHS Smartcard Login Section (Primary NHS CIS2 recommendation) -->
        <div class="space-y-4">
          <div class="relative">
            <div class="absolute inset-0 flex items-center"><span class="w-full border-t border-gray-200"></span></div>
            <div class="relative flex justify-center text-xs uppercase"><span class="px-2 bg-transparent text-gray-400 font-semibold">Recommended Auth (UKI)</span></div>
          </div>

          <button 
            type="button"
            (click)="loginWithSmartcard()"
            [disabled]="isAuthenticating()"
            class="w-full bg-gradient-to-r from-nhs-darkBlue to-nhs-blue text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-md hover:from-blue-900 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-nhs-blue focus:ring-offset-2 transition-all duration-300 flex items-center justify-center space-x-3 alert-glow-green border border-emerald-400/40 relative overflow-hidden group">
            
            <!-- Smartcard Animation Wave -->
            <span class="absolute inset-0 w-full h-full bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></span>

            @if (isReadingCard()) {
              <!-- Smartcard Reading Loader -->
              <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Reading Identity Card...</span>
            } @else {
              <!-- Smartcard Icon -->
              <svg class="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <span>NHS CIS2 Smartcard Login</span>
            }
          </button>
        </div>

        <!-- Username/Password Credentials Section -->
        <form (submit)="loginWithCredentials($event)" class="space-y-5">
          <div class="relative">
            <div class="absolute inset-0 flex items-center"><span class="w-full border-t border-gray-200"></span></div>
            <div class="relative flex justify-center text-xs uppercase"><span class="px-2 bg-transparent text-gray-400 font-semibold">Or Username credentials</span></div>
          </div>

          @if (errorMessage()) {
            <div class="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center space-x-2 text-nhs-emergencyRed text-xs font-semibold animate-pulse">
              <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <div class="space-y-4">
            <div>
              <label for="username" class="block text-xs font-semibold text-gray-500 uppercase">Username / GP Code</label>
              <input 
                id="username"
                type="text" 
                [(ngModel)]="username" 
                name="username" 
                required 
                placeholder="e.g. gp_user or admin"
                class="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue focus:border-nhs-blue" 
              />
            </div>
            <div>
              <label for="password" class="block text-xs font-semibold text-gray-500 uppercase">Password</label>
              <input 
                id="password"
                type="password" 
                [(ngModel)]="password" 
                name="password" 
                required 
                placeholder="••••••••"
                class="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue focus:border-nhs-blue" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            [disabled]="isAuthenticating()"
            class="w-full bg-gray-100 hover:bg-gray-200 text-nhs-darkBlue py-3 px-4 rounded-xl text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-nhs-blue transition-colors duration-200">
            Sign In with Credentials
          </button>
        </form>

        <!-- Compliance note -->
        <p class="text-[10px] text-center text-gray-400">
          This system is regulated under NHS Digital Safety Standards (DCB0129) and HSE GDPR patient registry directives. Unauthorized access attempts are monitored and recorded.
        </p>

      </div>
    </div>
  `,
  styles: [`
    .animate-zoom-in {
      animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form states
  username = '';
  password = '';

  // UI state signals
  isReadingCard = signal<boolean>(false);
  isAuthenticating = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  async loginWithSmartcard() {
    this.errorMessage.set(null);
    this.isReadingCard.set(true);
    this.isAuthenticating.set(true);

    // Simulate clinical smartcard read latency
    setTimeout(async () => {
      try {
        const success = await this.authService.login(undefined, undefined, true);
        if (success) {
          this.router.navigate(['/bedboard']);
        } else {
          this.errorMessage.set('Smartcard authentication failed. Please ensure card is inserted.');
        }
      } finally {
        this.isReadingCard.set(false);
        this.isAuthenticating.set(false);
      }
    }, 1500); // 1.5 second simulated delay
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
        this.router.navigate(['/bedboard']);
      } else {
        this.errorMessage.set('Invalid clinical username or passcode.');
      }
    } finally {
      this.isAuthenticating.set(false);
    }
  }
}
