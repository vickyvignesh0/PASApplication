import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PatientService } from '../services/patient.service';

@Component({
  selector: 'app-clinical-console',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8 animate-fade-in pb-16">
      <!-- Dashboard Header -->
      <div class="border-b border-slate-200 pb-5">
        <span class="text-[10px] font-bold text-nhs-blue uppercase tracking-widest">Workspace Home</span>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Clinical Dashboard</h2>
        <p class="text-xs text-slate-500">Overview of active patient pathways, ward allocations, and clinic bookings.</p>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Inpatients -->
        <div (click)="router.navigate(['/bedboard'])" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-blue-205 cursor-pointer transition-all duration-205">
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Inpatients</p>
            <h3 class="text-3xl font-bold text-slate-955 mt-1">{{ patientService.totalInpatients() }}</h3>
          </div>
          <div class="h-11 w-11 rounded-lg bg-blue-50 text-nhs-blue flex items-center justify-center border border-blue-100/30">
            <svg class="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
            </svg>
          </div>
        </div>

        <!-- Infection Control -->
        <div (click)="router.navigate(['/bedboard'])" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-red-200 cursor-pointer transition-all duration-205">
          <div>
            <p class="text-xs font-semibold text-red-500 uppercase tracking-wider">Infection Warnings</p>
            <h3 class="text-3xl font-bold text-red-600 mt-1">{{ patientService.infectionAlertCount() }}</h3>
          </div>
          <div class="h-11 w-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100/30">
            <svg class="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <!-- Active Referrals -->
        <div (click)="router.navigate(['/referrals'])" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-amber-200 cursor-pointer transition-all duration-205">
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Referrals</p>
            <h3 class="text-3xl font-bold text-slate-950 mt-1">{{ referralsCount() }}</h3>
          </div>
          <div class="h-11 w-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/30">
            <svg class="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
          </div>
        </div>

        <!-- Bookings -->
        <div (click)="router.navigate(['/booking'])" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md hover:border-teal-200 cursor-pointer transition-all duration-205">
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider font-bold">Today's Clinic Slots</p>
            <h3 class="text-3xl font-bold text-slate-950 mt-1">{{ bookingsCount() }}</h3>
          </div>
          <div class="h-11 w-11 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/30">
            <svg class="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Quick Action shortcuts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Shortcut Cards panel -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 class="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <svg class="h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Clinical Module Shortcuts
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (opt of getLaunchOptions(); track opt.type) {
              <div 
                (click)="router.navigate(['/' + opt.type])"
                class="border border-slate-150 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-nhs-blue/40 bg-slate-50/10 text-left transition-all duration-150 flex flex-col justify-between group">
                <div class="space-y-1.5">
                  <h4 class="font-bold text-slate-900 group-hover:text-nhs-blue transition-colors text-[13px]">{{ opt.name }}</h4>
                  <p class="text-[11px] text-slate-400 leading-normal">{{ opt.description }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Alert Feed panel -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm h-fit">
          <h3 class="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <svg class="h-4.5 w-4.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Active Incident / ED Triage Alerts
          </h3>
          <div class="space-y-3">
            @for (item of emergencyArrivals(); track item.id) {
              <div class="p-3 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col gap-1">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-xs text-slate-900">{{ item.patientName }}</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase"
                        [ngClass]="{
                          'bg-red-50 text-red-750 border border-red-200/50': item.triage === 1,
                          'bg-amber-50 text-amber-700 border border-amber-200/50': item.triage === 2,
                          'bg-blue-50 text-blue-700 border border-blue-200/50': item.triage === 3,
                          'bg-emerald-50 text-emerald-700 border border-emerald-200/50': item.triage >= 4
                        }">
                    Triage {{ item.triage }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5 italic">"{{ item.chiefComplaint }}"</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClinicalConsoleComponent implements OnInit {
  public patientService = inject(PatientService);
  public router = inject(Router);

  referralsCount = signal<number>(0);
  bookingsCount = signal<number>(0);
  emergencyArrivals = signal<any[]>([]);

  ngOnInit() {
    this.loadStats();
  }

  async loadStats() {
    const list = await this.patientService.loadWaitingList();
    this.referralsCount.set(list.filter(x => x.status === 'Waiting').length);

    const bookings = await this.patientService.loadBookings();
    this.bookingsCount.set(bookings.length);

    const activeEmergency = await this.patientService.loadActiveEmergency();
    this.emergencyArrivals.set(activeEmergency.slice(0, 3));
  }

  public getLaunchOptions() {
    return [
      { type: 'bedboard', name: 'Visual Bed Board', description: 'Real-time bed allocations, occupancy levels, and ward occupancy boards.' },
      { type: 'referrals', name: 'GP Referrals', description: 'Intake referrals waitlists, priorities tracking, & NHS 18-week pathways.' },
      { type: 'booking', name: 'Booking Scheduler', description: 'Schedule consultant clinic slots & inpatient admissions calendar.' },
      { type: 'emergency', name: 'ED Casualty Log', description: 'A&E triage monitoring log boards and treatment breach warning clocks.' },
      { type: 'documents', name: 'Case Documents', description: 'Review medical letters, discharge documents, and write clinical notes.' },
      { type: 'mpi', name: 'Patient Directory (MPI)', description: 'Search national directories, NHS indices, & log Caldicott overrides.' }
    ] as const;
  }
}
