import { Component, inject, computed, signal, effect } from '@angular/core';
import { AuthService } from './services/auth.service';
import { PatientService, Patient } from './services/patient.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './components/login.component';

import {
  DashboardHomeComponent,
  PatientSearchViewComponent,
  PatientRegistrationViewComponent,
  ReferralSearchViewComponent,
  ReferralCreateViewComponent,
  WaitingListSearchViewComponent,
  WaitingListCreateViewComponent,
  AppointmentSearchViewComponent,
  AppointmentBookingViewComponent,
  WardManagementViewComponent,
  AlertCreateViewComponent,
  DocumentsSearchViewComponent,
  ClinicalNotesViewComponent,
  ReportsStatisticsViewComponent
} from './components/clinical-modules.component';

interface Tab {
  id: string;
  title: string;
  moduleType: string;
  patient?: Patient;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoginComponent,
    DashboardHomeComponent,
    PatientSearchViewComponent,
    PatientRegistrationViewComponent,
    ReferralSearchViewComponent,
    ReferralCreateViewComponent,
    WaitingListSearchViewComponent,
    WaitingListCreateViewComponent,
    AppointmentSearchViewComponent,
    AppointmentBookingViewComponent,
    WardManagementViewComponent,
    AlertCreateViewComponent,
    DocumentsSearchViewComponent,
    ClinicalNotesViewComponent,
    ReportsStatisticsViewComponent
  ],
  template: `
    <!-- 1. Authentication wrapper: if not logged in, render only LoginComponent -->
    @if (!authService.isAuthenticated()) {
      <app-login></app-login>
    } @else {
      <!-- 2. Main HIS Application Shell -->
      <div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 text-[14px]">
        
        <!-- Header - Height 60px -->
        <header class="bg-white border-b border-slate-200 h-[60px] flex items-center justify-between px-6 shadow-sm relative z-30">
          
          <!-- Left: Branding Logo -->
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <span class="text-xl">🏥</span>
              <h1 class="text-[17px] font-extrabold text-blue-600 tracking-tight">CarePortal HIS</h1>
              <span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-widest">Enterprise</span>
            </div>
            <span class="text-slate-300">|</span>
            <span class="text-xs font-semibold text-slate-500">{{ activeModuleName() }}</span>
          </div>

          <!-- Center: Dynamic Patient Banner Context -->
          <div class="flex-grow flex justify-center px-6">
            @if (patientService.activePatient(); as patient) {
              <div class="bg-blue-50/70 border border-blue-200 rounded-lg px-4 py-1.5 flex items-center space-x-5 text-xs text-blue-900 shadow-sm animate-fade-in">
                <div class="flex items-center space-x-1.5">
                  <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <strong class="uppercase tracking-tight">{{ patient.lastName }}, {{ patient.firstName }}</strong>
                </div>
                <div class="hidden sm:flex space-x-4">
                  <span><strong>PID:</strong> <span class="font-mono text-[11px]">{{ patient.id.substring(0, 8).toUpperCase() }}</span></span>
                  <span><strong>DOB:</strong> {{ patient.dateOfBirth }}</span>
                  <span><strong>Age:</strong> {{ getAge(patient.dateOfBirth) }} yrs</span>
                  <span><strong>Gender:</strong> {{ patient.gender }}</span>
                </div>
                <button 
                  (click)="clearPatientContext()"
                  title="Clear active patient context"
                  class="text-blue-500 hover:text-red-500 font-bold ml-2">
                  ✕
                </button>
              </div>
            } @else {
              <div class="text-[11px] text-slate-400 font-medium italic">No active patient selected. Set context in Patient Search.</div>
            }
          </div>

          <!-- Right: Notifications & Logged User -->
          <div class="flex items-center space-x-4">
            <!-- Notifications Badge -->
            <div class="relative cursor-pointer">
              <button class="h-8 w-8 text-slate-400 hover:text-slate-650 flex items-center justify-center transition-colors">
                🔔
              </button>
              <span class="absolute top-0.5 right-0.5 bg-red-500 text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center">3</span>
            </div>

            <!-- Profile Info microcard -->
            <div class="flex items-center space-x-2.5">
              <div class="hidden md:flex flex-col text-right leading-none">
                <span class="text-xs font-bold text-slate-900">{{ authService.currentUser()?.displayName }}</span>
                <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{{ authService.currentUser()?.role }}</span>
              </div>
              <div class="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                {{ authService.currentUser()?.displayName?.substring(0, 2) }}
              </div>
              <button 
                (click)="showLogoutConfirm.set(true)" 
                title="Sign Out Session"
                class="h-8 w-8 rounded-lg text-slate-400 hover:text-red-650 flex items-center justify-center transition-colors">
                🚪
              </button>
            </div>
          </div>
        </header>

        <!-- Main Workspace Frame -->
        <div class="flex-grow flex relative overflow-hidden">
          
          <!-- Collapsible Left Navigation Sidebar -->
          <aside 
            [class.w-[250px]]="!isCollapsed()" 
            [class.w-[70px]]="isCollapsed()" 
            class="bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-all duration-300 z-20 select-none shadow-sm overflow-y-auto scrollbar-none">
            
            <!-- Sidebar Header toggle -->
            <div class="h-11 px-4 border-b border-slate-100 flex items-center justify-between">
              <span *ngIf="!isCollapsed()" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PAS Console</span>
              <button 
                (click)="isCollapsed.set(!isCollapsed())" 
                title="Toggle Sidebar"
                class="text-slate-400 hover:text-slate-650 rounded-lg flex items-center justify-center transition-colors ml-auto p-1 text-xs">
                {{ isCollapsed() ? '⏩' : '⏪' }}
              </button>
            </div>

            <!-- Quick Modules Search (Visible only if expanded) -->
            <div *ngIf="!isCollapsed()" class="p-3 border-b border-slate-100 bg-slate-50/50">
              <input 
                type="text" 
                [(ngModel)]="navSearchQuery"
                placeholder="Quick search modules..."
                class="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <!-- Navigation Links -->
            <div class="p-2 space-y-1">
              @for (nav of filteredNavItems(); track nav.type) {
                <a 
                  (click)="launchModule(nav.type, nav.label)"
                  [ngClass]="activeTabModule() === nav.type ? 'bg-blue-50/80 text-blue-600 border-blue-200/50 font-bold' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900 border-transparent'"
                  class="flex items-center px-3 py-1.5 rounded-lg text-xs border transition-all duration-150 relative group cursor-pointer">
                  
                  <span class="flex-shrink-0 mr-3 text-base">{{ nav.icon }}</span>
                  <span *ngIf="!isCollapsed()" class="truncate">{{ nav.label }}</span>

                  <!-- Pinned indicator -->
                  <span *ngIf="!isCollapsed() && isPinned(nav.type)" class="ml-auto text-[10px] text-blue-400">📌</span>

                  <!-- Hover Tooltip when collapsed -->
                  <span *ngIf="isCollapsed()" class="absolute left-16 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50 whitespace-nowrap">
                    {{ nav.label }}
                  </span>
                </a>
              }
            </div>

            <!-- Recently Visited Patients list (Visible only if expanded) -->
            <div *ngIf="!isCollapsed() && recentlyVisitedPatients().length > 0" class="mt-4 pt-4 border-t border-slate-100 px-4 space-y-2">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Recent Patients</span>
              <div class="space-y-1.5">
                @for (pat of recentlyVisitedPatients(); track pat.id) {
                  <div 
                    (click)="patientService.activePatient.set(pat)"
                    class="text-[11px] text-slate-600 hover:text-blue-650 cursor-pointer truncate font-medium flex items-center space-x-1.5">
                    <span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                    <span class="uppercase">{{ pat.lastName }}, {{ pat.firstName }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Bottom: Pinned Sign Out Menu Item -->
            <div class="mt-auto border-t border-slate-100 p-2">
              <a 
                (click)="showLogoutConfirm.set(true)"
                class="flex items-center px-3 py-1.5 rounded-lg text-xs text-red-650 hover:bg-red-50 hover:text-red-700 transition-all duration-150 relative group cursor-pointer border border-transparent">
                <span class="flex-shrink-0 mr-3 text-base">🚪</span>
                <span *ngIf="!isCollapsed()" class="truncate font-semibold">Sign Out</span>
                <span *ngIf="isCollapsed()" class="absolute left-16 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50 whitespace-nowrap">
                  Sign Out
                </span>
              </a>
            </div>
          </aside>

          <!-- Workspace Center Panel -->
          <div class="flex-grow flex flex-col overflow-hidden">
            
            <!-- Tab Layout Bar -->
            <div class="bg-white border-b border-slate-200 px-6 h-10 flex items-end overflow-x-auto select-none gap-1 scrollbar-none shrink-0 shadow-inner">
              @for (tab of tabs(); track tab.id) {
                <div 
                  (click)="activeTabId.set(tab.id)"
                  [ngClass]="activeTabId() === tab.id ? 'bg-slate-50 text-blue-600 font-bold border-t-2 border-t-blue-600 border-x border-x-slate-200' : 'bg-white text-slate-500 hover:text-slate-800'"
                  class="px-4 py-1.5 rounded-t-lg text-xs flex items-center gap-2 flex-shrink-0 cursor-pointer h-9 transition-all relative border-b-0">
                  
                  <span>{{ tab.title }}</span>
                  
                  @if (tab.id !== 'dashboard') {
                    <button 
                      (click)="triggerCloseTab(tab.id, $event)"
                      class="text-[9px] text-slate-400 hover:text-red-500 font-bold focus:outline-none ml-1">
                      ✕
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Active View Frame Containers (Toggles visibility with [class.hidden] to preserve input states) -->
            <main class="flex-grow overflow-y-auto p-6 bg-slate-50 relative">
              @for (tab of tabs(); track tab.id) {
                <div [class.hidden]="activeTabId() !== tab.id" class="w-full h-full animate-fade-in">
                  @switch (tab.moduleType) {
                    @case ('dashboard') {
                      <app-dashboard-home (onModuleSelect)="onModuleSelect($event)"></app-dashboard-home>
                    }
                    @case ('patient-search') {
                      <app-patient-search-view></app-patient-search-view>
                    }
                    @case ('patient-registration') {
                      <app-patient-registration-view></app-patient-registration-view>
                    }
                    @case ('referrals-search') {
                      <app-referral-search-view></app-referral-search-view>
                    }
                    @case ('referrals-create') {
                      <app-referral-create-view [patient]="tab.patient"></app-referral-create-view>
                    }
                    @case ('waiting-search') {
                      <app-waiting-list-search-view></app-waiting-list-search-view>
                    }
                    @case ('waiting-create') {
                      <app-waiting-list-create-view [patient]="tab.patient"></app-waiting-list-create-view>
                    }
                    @case ('appointment-search') {
                      <app-appointment-search-view></app-appointment-search-view>
                    }
                    @case ('appointment-booking') {
                      <app-appointment-booking-view [patient]="tab.patient"></app-appointment-booking-view>
                    }
                    @case ('ward-management') {
                      <app-ward-management-view></app-ward-management-view>
                    }
                    @case ('alert-create') {
                      <app-alert-create-view [patient]="tab.patient"></app-alert-create-view>
                    }
                    @case ('documents-search') {
                      <app-documents-search-view [patient]="tab.patient"></app-documents-search-view>
                    }
                    @case ('clinical-notes') {
                      <app-clinical-notes-view [patient]="tab.patient"></app-clinical-notes-view>
                    }
                    @case ('reports-statistics') {
                      <app-reports-statistics-view></app-reports-statistics-view>
                    }
                  }
                </div>
              }
            </main>

          </div>

        </div>

        <!-- 3. MODAL DIALOGS -->

        <!-- A. Sign Out Confirmation Modal -->
        @if (showLogoutConfirm()) {
          <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
            <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full space-y-4 text-center">
              <span class="text-3xl">🚪</span>
              <h3 class="font-bold text-slate-900 text-sm">Sign Out Confirmation</h3>
              <p class="text-xs text-slate-500">Are you sure you want to terminate your CarePortal PAS session?</p>
              <div class="flex space-x-3 text-xs font-bold pt-2">
                <button (click)="logout()" class="flex-grow bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">Sign Out</button>
                <button (click)="showLogoutConfirm.set(false)" class="flex-grow bg-slate-100 text-slate-700 py-2 rounded-lg border border-slate-200 hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          </div>
        }

        <!-- B. Unsaved Changes Modal -->
        @if (showCloseTabConfirm(); as tabId) {
          <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
            <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full space-y-4 text-center">
              <span class="text-3xl text-amber-500">⚠</span>
              <h3 class="font-bold text-slate-900 text-sm">Unsaved Session Progress</h3>
              <p class="text-xs text-slate-500">This tab has modified form values or clinical progress. Closing it will discard unsaved data.</p>
              <div class="flex space-x-3 text-xs font-bold pt-2">
                <button (click)="confirmCloseTab(tabId)" class="flex-grow bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">Discard Changes</button>
                <button (click)="showCloseTabConfirm.set(null)" class="flex-grow bg-slate-100 text-slate-700 py-2 rounded-lg border border-slate-200 hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          </div>
        }

      </div>
    }
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
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
export class AppComponent {
  authService = inject(AuthService);
  patientService = inject(PatientService);

  isCollapsed = signal<boolean>(false);
  navSearchQuery = '';

  // Modal display controllers
  showLogoutConfirm = signal<boolean>(false);
  showCloseTabConfirm = signal<string | null>(null);

  // Global Tab Manager State
  tabs = signal<Tab[]>([
    { id: 'dashboard', title: 'Dashboard', moduleType: 'dashboard' }
  ]);
  activeTabId = signal<string>('dashboard');

  // Recently Selected Patient Context Tracking
  recentlyVisitedPatients = signal<Patient[]>([]);

  sideNavItems = [
    { label: 'Dashboard', type: 'dashboard', icon: '🏠' },
    { label: 'Patient Search', type: 'patient-search', icon: '👤' },
    { label: 'Patient Registration', type: 'patient-registration', icon: '📝' },
    { label: 'Referral Search', type: 'referrals-search', icon: '📋' },
    { label: 'Referral Create', type: 'referrals-create', icon: '➕' },
    { label: 'Waiting List Search', type: 'waiting-search', icon: '📅' },
    { label: 'Waiting List Create', type: 'waiting-create', icon: '🛏' },
    { label: 'Appointment Search', type: 'appointment-search', icon: '📆' },
    { label: 'Appointment Booking', type: 'appointment-booking', icon: '✔' },
    { label: 'Ward Management', type: 'ward-management', icon: '🏢' },
    { label: 'Alert Create', type: 'alert-create', icon: '⚠' },
    { label: 'Documents Search', type: 'documents-search', icon: '📄' },
    { label: 'Clinical Notes', type: 'clinical-notes', icon: '🗒️' },
    { label: 'Reports & Statistics', type: 'reports-statistics', icon: '📊' }
  ];

  pinnedModules = ['patient-search', 'ward-management', 'reports-statistics'];

  constructor() {
    // Monitor active patient selection changes to track recently visited list
    effect(() => {
      const active = this.patientService.activePatient();
      if (active) {
        this.recentlyVisitedPatients.update(list => {
          const filtered = list.filter(p => p.id !== active.id);
          return [active, ...filtered].slice(0, 5); // Keep last 5
        });
      }
    });

    // Listen to child component navigation triggers
    effect(() => {
      const nav = this.patientService.activeNavigationTrigger();
      if (nav) {
        setTimeout(() => {
          this.launchModule(nav.type, nav.label);
        }, 0);
      }
    });
  }

  isPinned(type: string): boolean {
    return this.pinnedModules.includes(type);
  }

  filteredNavItems() {
    const q = this.navSearchQuery.toLowerCase().trim();
    if (!q) return this.sideNavItems;
    return this.sideNavItems.filter(item => item.label.toLowerCase().includes(q));
  }

  activeModuleName = computed(() => {
    const activeId = this.activeTabId();
    const tabObj = this.tabs().find(t => t.id === activeId);
    return tabObj ? tabObj.title : 'HIS Console';
  });

  activeTabModule = computed(() => {
    const activeId = this.activeTabId();
    const tabObj = this.tabs().find(t => t.id === activeId);
    return tabObj ? tabObj.moduleType : 'dashboard';
  });

  launchModule(type: string, label: string) {
    const patientSpecific = [
      'referrals-create',
      'waiting-create',
      'appointment-booking',
      'alert-create',
      'documents-search',
      'clinical-notes'
    ];

    if (patientSpecific.includes(type)) {
      const activePatient = this.patientService.activePatient();
      if (!activePatient) {
        alert(`No patient selected. Please set a patient context in Patient Search before creating referrals, booking appointments, or writing notes.`);
        this.openTab('patient-search', 'Patient Search');
        return;
      }

      // Open new tab bound to this specific patient
      const title = `${label.split(' ')[0]} - ${activePatient.lastName.toUpperCase()}, ${activePatient.firstName.substring(0,1)}`;
      this.openPatientSpecificTab(type, title, activePatient);
    } else {
      // Patient-independent modules use standard single tab focusing
      this.openTab(type, label);
    }
  }

  openTab(type: string, title: string) {
    const list = this.tabs();
    const existing = list.find(t => t.moduleType === type && !t.patient);
    if (existing) {
      this.activeTabId.set(existing.id);
    } else {
      const newId = 'tab-' + Math.random().toString(36).substr(2, 9);
      const newTab = { id: newId, title, moduleType: type };
      this.tabs.update(t => [...t, newTab]);
      this.activeTabId.set(newId);
    }
  }

  openPatientSpecificTab(type: string, title: string, patient: Patient) {
    const list = this.tabs();
    const existing = list.find(t => t.moduleType === type && t.patient?.id === patient.id);
    if (existing) {
      this.activeTabId.set(existing.id);
    } else {
      const newId = 'tab-' + Math.random().toString(36).substr(2, 9);
      const newTab = { id: newId, title, moduleType: type, patient };
      this.tabs.update(t => [...t, newTab]);
      this.activeTabId.set(newId);
    }
  }

  triggerCloseTab(id: string, event: Event) {
    event.stopPropagation();
    
    // Unsaved changes confirmation dialog if form-specific tab
    const warningTabTypes = ['referrals-create', 'waiting-create', 'appointment-booking', 'alert-create', 'clinical-notes'];
    const tabObj = this.tabs().find(t => t.id === id);
    
    if (tabObj && warningTabTypes.includes(tabObj.moduleType)) {
      this.showCloseTabConfirm.set(id);
    } else {
      this.confirmCloseTab(id);
    }
  }

  confirmCloseTab(id: string) {
    this.showCloseTabConfirm.set(null);
    const list = this.tabs().filter(t => t.id !== id);
    this.tabs.set(list);

    if (this.activeTabId() === id) {
      if (list.length > 0) {
        this.activeTabId.set(list[list.length - 1].id);
      } else {
        this.activeTabId.set('dashboard');
      }
    }
  }

  onModuleSelect(event: { type: string; title: string }) {
    this.launchModule(event.type, event.title);
  }

  clearPatientContext() {
    this.patientService.activePatient.set(null);
  }

  logout() {
    this.showLogoutConfirm.set(false);
    this.clearPatientContext();
    this.tabs.set([{ id: 'dashboard', title: 'Dashboard', moduleType: 'dashboard' }]);
    this.activeTabId.set('dashboard');
    this.authService.logout();
  }

  getAge(dobString: string): number {
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}
