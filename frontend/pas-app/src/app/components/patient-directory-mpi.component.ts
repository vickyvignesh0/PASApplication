import { Component, signal, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-patient-directory-mpi',
  standalone: true,
  template: `
    <div class="min-h-[60vh] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div class="max-w-xl w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6 relative overflow-hidden">
        
        <!-- Top Security Stripe -->
        <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"></div>

        <!-- Warning Shield Header -->
        <div class="text-center space-y-3">
          <div class="mx-auto h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/50 shadow-inner">
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0-6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-slate-900 tracking-tight">Access Restricted: Caldicott Guardian Authorization Required</h3>
          <p class="text-xs text-slate-500">National Master Patient Index (MPI) Directory Integration</p>
        </div>

        <!-- Security Meta Details Box -->
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
          <h4 class="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Your Session Entitlements</h4>
          
          <div class="grid grid-cols-2 gap-y-2 text-slate-600">
            <div>
              <span class="text-slate-400 block text-[10px]">Subject Identity</span>
              <span class="font-semibold text-slate-800">{{ authService.currentUser()?.displayName || 'Unknown Clinician' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Identity Authority</span>
              <span class="font-semibold text-slate-800">NHS CIS2 OIDC Provider</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Credential Level</span>
              <span class="font-semibold text-slate-800">Clinical Staff - Level 2</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Access Status</span>
              <span class="font-semibold text-red-600">UNAUTHORIZED (Requires Level 4)</span>
            </div>
          </div>
        </div>

        <!-- Privacy Directive Alert -->
        <div class="bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl text-xs text-amber-800 space-y-2 leading-relaxed">
          <p class="font-semibold">⚠️ Legal Notice (GDPR & Data Protection Act 2018):</p>
          <p>
            Direct searches against the national demographics registry (demographics syncing and GP register lookups) are strictly audited under the Caldicott Principles. All access attempts are logged under GDPR Article 9(2)(h) and HIQA patient privacy mandates.
          </p>
        </div>

        <!-- Simulated Override Action -->
        <div class="space-y-3 pt-2">
          @if (overrideLogged()) {
            <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center space-x-2 text-emerald-800 text-xs font-semibold animate-fade-in">
              <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Override Request logged. Request reference: NHS-REQ-{{ reqRef }}. Caldicott Guardian notified.</span>
            </div>
          } @else {
            <button 
              (click)="requestOverride()"
              class="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center space-x-2">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m-5-3a5 5 0 11-5 5 5 5 0 015-5z" />
              </svg>
              <span>Request Caldicott Guardian Override (Audited)</span>
            </button>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PatientDirectoryMpiComponent {
  authService = inject(AuthService);

  overrideLogged = signal<boolean>(false);
  reqRef = Math.floor(100000 + Math.random() * 900000);

  requestOverride() {
    this.overrideLogged.set(true);
    console.warn(`[AUDIT] Caldicott Guardian override requested by ${this.authService.currentUser()?.displayName} (ID: ${this.authService.currentUser()?.userIdentifier}) for National MPI access.`);
  }
}
