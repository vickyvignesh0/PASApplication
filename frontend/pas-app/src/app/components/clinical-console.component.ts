import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../services/patient.service';
import { AuthService } from '../services/auth.service';

// Standalone clinical components
import { BedBoardComponent } from './bed-board.component';
import { ReferralWaitlistComponent } from './referral-waitlist.component';
import { BookingSchedulerComponent } from './booking-scheduler.component';
import { EmergencyCareComponent } from './emergency-care.component';
import { ClinicalDocumentsComponent } from './clinical-documents.component';
import { PatientDirectoryMpiComponent } from './patient-directory-mpi.component';

export interface WorkspaceTab {
  id: string;
  title: string;
  moduleType: 'bedboard' | 'referrals' | 'booking' | 'emergency' | 'documents' | 'mpi';
  icon: string;
}

@Component({
  selector: 'app-clinical-console',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BedBoardComponent,
    ReferralWaitlistComponent,
    BookingSchedulerComponent,
    EmergencyCareComponent,
    ClinicalDocumentsComponent,
    PatientDirectoryMpiComponent
  ],
  template: `
    <div class="space-y-6 animate-fade-in pb-16">
      <!-- Clinical Browser Tab Bar Shell -->
      <div class="bg-gray-100/80 p-2 pb-0 rounded-t-2xl border border-slate-200/80 shadow-inner flex items-end justify-between gap-4 select-none">
        
        <!-- Tab List -->
        <div class="flex items-end gap-1 overflow-x-auto min-w-0 pr-4 scrollbar-none">
          @for (tab of tabs(); track tab.id) {
            <div 
              (click)="selectTab(tab.id)"
              [ngClass]="{
                'bg-white text-slate-900 border-x border-t border-slate-200 font-semibold shadow-sm z-10': tab.id === activeTabId(),
                'bg-slate-200/60 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-x border-t border-transparent cursor-pointer': tab.id !== activeTabId()
              }"
              class="px-4 py-2.5 rounded-t-xl text-xs flex items-center gap-2 flex-shrink-0 transition-all duration-150 h-10 border-b-0 relative group">
              
              <!-- Tab Bottom Overlay for Active State border seamless look -->
              @if (tab.id === activeTabId()) {
                <div class="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white z-20"></div>
                <!-- NHS Blue indicator line -->
                <div class="absolute top-0 left-0 right-0 h-[3px] bg-nhs-blue rounded-t-xl"></div>
              }

              <!-- Tab Icon -->
              <span class="flex-shrink-0 text-slate-400 group-hover:text-nhs-blue transition-colors">
                @if (tab.icon === 'bed') {
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2" /></svg>
                } @else if (tab.icon === 'clipboard-list') {
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                } @else if (tab.icon === 'calendar') {
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                } @else if (tab.icon === 'lightning-bolt') {
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                } @else if (tab.icon === 'document-text') {
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
                } @else {
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                }
              </span>

              <span class="max-w-[120px] truncate">{{ tab.title }}</span>

              <!-- Close tab button -->
              <button 
                (click)="closeTab(tab.id, $event)"
                class="h-4.5 w-4.5 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200/80 hover:text-red-500 transition-colors ml-1 focus:outline-none">
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          }

          <!-- New Tab Button -->
          <div class="relative flex-shrink-0 self-center mb-1">
            <button 
              (click)="showAddDropdown.set(!showAddDropdown())"
              class="h-7 w-7 rounded-lg bg-slate-200 hover:bg-slate-300 border border-slate-300/60 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shadow-sm focus:outline-none">
              <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>

            <!-- Launch Options Dropdown -->
            @if (showAddDropdown()) {
              <div class="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-slate-250 shadow-2xl z-50 py-2 animate-slide-in">
                <div class="text-[10px] font-bold text-slate-400 px-4 py-1.5 uppercase tracking-wider">Launch Clinical Module</div>
                @for (opt of getLaunchOptions(); track opt.type) {
                  <button 
                    (click)="addTab(opt.type, opt.name)"
                    class="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-nhs-blue transition-colors flex items-center gap-3">
                    <span class="text-slate-400">
                      @if (opt.icon === 'bed') {
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2m-12 4h14" /></svg>
                      } @else if (opt.icon === 'clipboard-list') {
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2" /></svg>
                      } @else if (opt.icon === 'calendar') {
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14" /></svg>
                      } @else if (opt.icon === 'lightning-bolt') {
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      } @else if (opt.icon === 'document-text') {
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6" /></svg>
                      } @else {
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6" /></svg>
                      }
                    </span>
                    <span>{{ opt.name }}</span>
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <!-- Quick Status indicators -->
        <div class="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-semibold mb-2 pr-2">
          <span>Active Tabs: {{ tabs().length }}</span>
          <span>•</span>
          <span class="text-nhs-blue-light font-bold">Clinical Workspace Console</span>
        </div>
      </div>

      <!-- Tab Content Frame (Preserves State by keeping active DOM elements alive) -->
      @if (tabs().length > 0) {
        <div class="bg-white rounded-b-2xl rounded-tr-2xl border-x border-b border-slate-200 p-6 shadow-xl relative min-h-[65vh]">
          @for (tab of tabs(); track tab.id) {
            <div [class.hidden]="tab.id !== activeTabId()" class="w-full animate-slide-in">
              @if (tab.moduleType === 'bedboard') {
                <app-bed-board></app-bed-board>
              } @else if (tab.moduleType === 'referrals') {
                <app-referral-waitlist></app-referral-waitlist>
              } @else if (tab.moduleType === 'booking') {
                <app-booking-scheduler></app-booking-scheduler>
              } @else if (tab.moduleType === 'emergency') {
                <app-emergency-care></app-emergency-care>
              } @else if (tab.moduleType === 'documents') {
                <app-clinical-documents></app-clinical-documents>
              } @else if (tab.moduleType === 'mpi') {
                <app-patient-directory-mpi></app-patient-directory-mpi>
              }
            </div>
          }
        </div>
      } @else {
        <!-- Empty Workspace State (Show large card selection directory) -->
        <div class="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xl text-center space-y-8 min-h-[60vh] flex flex-col justify-center items-center">
          <div class="max-w-md space-y-2">
            <div class="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner text-slate-400 flex items-center justify-center mx-auto mb-4">
              <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 tracking-tight">Workspace Session Terminated</h3>
            <p class="text-sm text-slate-500">All browser-style clinical tabs have been closed. Please choose a clinical module below to launch a new tab session.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl w-full">
            @for (opt of getLaunchOptions(); track opt.type) {
              <div 
                (click)="addTab(opt.type, opt.name)"
                class="border border-slate-200 rounded-2xl p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-nhs-blue/40 bg-slate-50/20 text-left transition-all duration-200 flex flex-col justify-between group">
                <div class="space-y-2.5">
                  <div class="h-10 w-10 rounded-xl bg-blue-50/60 text-nhs-blue flex items-center justify-center border border-blue-100/30 group-hover:bg-nhs-blue group-hover:text-white transition-colors duration-200">
                    @if (opt.icon === 'bed') {
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6" /></svg>
                    } @else if (opt.icon === 'clipboard-list') {
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2" /></svg>
                    } @else if (opt.icon === 'calendar') {
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5" /></svg>
                    } @else if (opt.icon === 'lightning-bolt') {
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7" /></svg>
                    } @else if (opt.icon === 'document-text') {
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6" /></svg>
                    } @else {
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6" /></svg>
                    }
                  </div>
                  <h4 class="font-bold text-slate-900 group-hover:text-nhs-blue transition-colors text-sm">{{ opt.name }}</h4>
                  <p class="text-xs text-slate-400 leading-relaxed">{{ opt.description }}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-nhs-blue font-semibold">
                  <span>Open Module</span>
                  <svg class="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
    .animate-slide-in {
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateY(6px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    /* Hide scrollbar for Chrome, Safari and Opera */
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    /* Hide scrollbar for IE, Edge and Firefox */
    .scrollbar-none {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
  `]
})
export class ClinicalConsoleComponent implements OnInit {
  public patientService = inject(PatientService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Active Workspace tabs
  public tabs = signal<WorkspaceTab[]>([]);
  public activeTabId = signal<string>('');
  
  public showAddDropdown = signal<boolean>(false);

  constructor() {
    // Watch for shared scheduling signals (from referrals waitlist component)
    effect(() => {
      const request = this.patientService.activeSchedulingRequest();
      if (request) {
        // Look for existing Clinic Booking tab
        const match = this.tabs().find(t => t.moduleType === 'booking');
        if (match) {
          this.selectTab(match.id);
        } else {
          // Open a new Clinic Booking tab
          this.addTab('booking', 'Booking Scheduler');
        }
      }
    });

    // Close launch options dropdown if clicked elsewhere
    window.addEventListener('click', (e: any) => {
      if (this.showAddDropdown() && !e.target.closest('.relative')) {
        this.showAddDropdown.set(false);
      }
    });
  }

  ngOnInit() {
    // Pre-populate default tabs if starting fresh
    if (this.tabs().length === 0) {
      this.openDefaultTabs();
    }

    // Monitor url routing changes to sync browser tab focus
    this.route.url.subscribe(() => {
      const urlPath = this.router.url.split('?')[0].split('/').filter(Boolean)[0];
      if (urlPath && ['bedboard', 'referrals', 'booking', 'emergency', 'documents', 'mpi'].includes(urlPath)) {
        const type = urlPath as any;
        const match = this.tabs().find(t => t.moduleType === type);
        if (match) {
          this.selectTab(match.id);
        } else {
          // Open a new tab for this module type
          this.addTab(type, this.getModuleName(type));
        }
      }
    });
  }

  private openDefaultTabs() {
    this.tabs.set([
      { id: 'tab-bedboard', title: 'Visual Bed Board', moduleType: 'bedboard', icon: 'bed' },
      { id: 'tab-referrals', title: 'GP Referrals', moduleType: 'referrals', icon: 'clipboard-list' },
      { id: 'tab-emergency', title: 'ED Casualty Log', moduleType: 'emergency', icon: 'lightning-bolt' }
    ]);
    this.activeTabId.set('tab-bedboard');
  }

  public selectTab(id: string) {
    this.activeTabId.set(id);
    this.showAddDropdown.set(false);

    // Silently sync route URL to match active tab for deep linking
    const active = this.tabs().find(t => t.id === id);
    if (active) {
      this.router.navigate([`/${active.moduleType}`], { replaceUrl: true });
    }
  }

  public addTab(type: 'bedboard' | 'referrals' | 'booking' | 'emergency' | 'documents' | 'mpi', name: string) {
    const newId = 'tab-' + Math.random().toString(36).substr(2, 9);
    const newTab: WorkspaceTab = {
      id: newId,
      title: name,
      moduleType: type,
      icon: this.getModuleIcon(type)
    };

    this.tabs.update(t => [...t, newTab]);
    this.activeTabId.set(newId);
    this.showAddDropdown.set(false);

    // Sync URL path
    this.router.navigate([`/${type}`], { replaceUrl: true });
  }

  public closeTab(id: string, event: Event) {
    event.stopPropagation(); // Avoid selecting the tab while closing it
    
    const index = this.tabs().findIndex(t => t.id === id);
    const list = this.tabs().filter(t => t.id !== id);
    this.tabs.set(list);

    if (id === this.activeTabId()) {
      if (list.length > 0) {
        const nextIndex = Math.max(0, index - 1);
        this.selectTab(list[nextIndex].id);
      } else {
        this.activeTabId.set('');
        this.router.navigate(['/workspace'], { replaceUrl: true });
      }
    }
  }

  public getLaunchOptions() {
    return [
      { type: 'bedboard', name: 'Visual Bed Board', description: 'Real-time bed allocations, occupancy levels, and ward occupancy boards.', icon: 'bed' },
      { type: 'referrals', name: 'GP Referrals', description: 'Intake referrals waitlists, priorities tracking, & NHS 18-week pathways.', icon: 'clipboard-list' },
      { type: 'booking', name: 'Booking Scheduler', description: 'Schedule consultant clinic slots & inpatient admissions calendar.', icon: 'calendar' },
      { type: 'emergency', name: 'ED Casualty Log', description: 'A&E triage monitoring log boards and treatment breach warning clocks.', icon: 'lightning-bolt' },
      { type: 'documents', name: 'Case Documents', description: 'Review medical letters, discharge documents, and write clinical notes.', icon: 'document-text' },
      { type: 'mpi', name: 'Patient Directory (MPI)', description: 'Search national directories, NHS indices, & log Caldicott overrides.', icon: 'shield-exclamation' }
    ] as const;
  }

  private getModuleName(type: string): string {
    const names: Record<string, string> = {
      bedboard: 'Visual Bed Board',
      referrals: 'GP Referrals',
      booking: 'Booking Scheduler',
      emergency: 'ED Casualty Log',
      documents: 'Case Documents',
      mpi: 'Patient Directory (MPI)'
    };
    return names[type] || 'Clinical Module';
  }

  private getModuleIcon(type: string): string {
    const icons: Record<string, string> = {
      bedboard: 'bed',
      referrals: 'clipboard-list',
      booking: 'calendar',
      emergency: 'lightning-bolt',
      documents: 'document-text',
      mpi: 'shield-exclamation'
    };
    return icons[type] || 'cube';
  }
}
