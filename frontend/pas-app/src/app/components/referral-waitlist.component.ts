import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PatientService, WaitingListEntry, Patient } from '../services/patient.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-referral-waitlist',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Header banner -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-5">
        <div>
          <span class="text-[10px] font-bold text-nhs-blue uppercase tracking-widest">Gateway Module</span>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Referrals & Waiting List Management</h2>
          <p class="text-xs text-slate-500">Track national 18-week Referral-to-Treatment (RTT) pathway targets for Inpatient & Outpatient queues.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- New Referral Intake Panel -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 h-fit">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div class="h-8 w-8 rounded-lg bg-blue-50 text-nhs-blue flex items-center justify-center">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 class="font-bold text-slate-950 text-sm">GP / e-RS Referral Intake</h3>
          </div>
          
          <form (submit)="submitReferral($event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase">Select Registered Patient</label>
              <select [(ngModel)]="newReferral.patientId" name="patientId" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none transition-all">
                @for (p of patients(); track p.id) {
                  <option [value]="p.id">{{ p.lastName }}, {{ p.firstName }}</option>
                }
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase">Pathway Type</label>
                <select [(ngModel)]="newReferral.pathway" name="pathway" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none">
                  <option [value]="1">Outpatient (OP)</option>
                  <option [value]="0">Inpatient (IP)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase">Priority Class</label>
                <select [(ngModel)]="newReferral.priority" name="priority" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none">
                  <option [value]="0">Routine</option>
                  <option [value]="1">Urgent</option>
                  <option [value]="2">Two-Week Wait (2WW)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase">Specialty</label>
                <input type="text" [(ngModel)]="newReferral.specialty" name="specialty" placeholder="e.g. Cardiology" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase">Referral Source</label>
                <input type="text" [(ngModel)]="newReferral.referralSource" name="referralSource" placeholder="e.g. GP Vance" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase">Clinical Indication / Reason</label>
              <textarea [(ngModel)]="newReferral.clinicalIndication" name="indication" rows="3" required placeholder="Detail clinical indication..." class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none"></textarea>
            </div>

            <button type="submit" class="w-full bg-nhs-blue hover:bg-nhs-darkBlue text-white py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-sm flex items-center justify-center space-x-2">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              <span>Accept & Route Referral</span>
            </button>
          </form>
        </div>

        <!-- Waiting Lists Tables -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Outpatient Waiting List (OP Pathway) -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div class="bg-slate-55/60 px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <div class="flex items-center space-x-2">
                <span class="h-2 w-2 rounded-full bg-nhs-blue"></span>
                <h4 class="font-bold text-slate-900 text-sm">Outpatient Waiting List (OP Pathway)</h4>
              </div>
              <span class="text-xs bg-blue-50 text-nhs-blue px-2.5 py-0.5 rounded-full font-bold">
                {{ getWaitlistByPathway(1).length }} Active Pathways
              </span>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50/50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient Name</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Specialty</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Referral Date</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">NHS RTT Progress</th>
                    <th class="px-6 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  @for (w of getWaitlistByPathway(1); track w.id) {
                    <tr class="hover:bg-slate-50/30 transition-colors duration-150">
                      <td class="px-6 py-4 font-semibold text-slate-950">{{ w.patientName }}</td>
                      <td class="px-6 py-4 text-slate-600">{{ w.specialty }}</td>
                      <td class="px-6 py-4 text-slate-500">{{ formatDate(w.dateAdded) }}</td>
                      <td class="px-6 py-4">
                        @let weeks = getRttWeeks(w.dateAdded);
                        <div class="flex items-center space-x-2">
                          <span 
                            [class]="weeks >= 15 ? 'text-nhs-emergencyRed font-bold' : weeks >= 12 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-medium'">
                            {{ weeks }} Weeks Wait
                          </span>
                          @if (weeks >= 15) {
                            <span class="text-[9px] bg-red-50 text-nhs-emergencyRed font-bold px-1.5 py-0.5 rounded-full animate-pulse border border-red-200/50">
                              RTT RISK
                            </span>
                          }
                        </div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button 
                          (click)="routeToBooking(w)"
                          class="bg-nhs-blue/10 hover:bg-nhs-blue hover:text-white text-nhs-blue px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200">
                          Schedule Appointment
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="text-center py-8 text-slate-400">No active outpatient waiting list entries.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Inpatient Waiting List (IP Pathway) -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div class="bg-slate-55/60 px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <div class="flex items-center space-x-2">
                <span class="h-2 w-2 rounded-full bg-purple-600"></span>
                <h4 class="font-bold text-slate-900 text-sm">Inpatient Waiting List (IP Pathway)</h4>
              </div>
              <span class="text-xs bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-full font-bold">
                {{ getWaitlistByPathway(0).length }} Active Pathways
              </span>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50/50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient Name</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Specialty</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">RTT Progress</th>
                    <th class="px-6 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  @for (w of getWaitlistByPathway(0); track w.id) {
                    <tr class="hover:bg-slate-50/30 transition-colors duration-150">
                      <td class="px-6 py-4 font-semibold text-slate-950">{{ w.patientName }}</td>
                      <td class="px-6 py-4 text-slate-600">{{ w.specialty }}</td>
                      <td class="px-6 py-4">
                        <span class="text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full border border-orange-100">
                          Urgent Admission
                        </span>
                      </td>
                      <td class="px-6 py-4 text-slate-500 font-medium">{{ getRttWeeks(w.dateAdded) }} Weeks Wait</td>
                      <td class="px-6 py-4 text-center">
                        <button 
                          (click)="routeToBooking(w)"
                          class="bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-600 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200">
                          Schedule Bed Booking
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="text-center py-8 text-slate-400">No active inpatient waiting list entries.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

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
export class ReferralWaitlistComponent implements OnInit {
  patientService = inject(PatientService);
  router = inject(Router);

  patients = this.patientService.patients;
  waitlist = signal<WaitingListEntry[]>([]);

  newReferral = {
    patientId: '',
    patientName: '',
    referralSource: '',
    specialty: '',
    pathway: 1, // Outpatient
    priority: 0, // Routine
    clinicalIndication: ''
  };

  ngOnInit() {
    this.loadData();
    if (this.patients().length > 0) {
      this.newReferral.patientId = this.patients()[0].id;
    }
  }

  async loadData() {
    this.waitlist.set(await this.patientService.loadWaitingList());
  }

  getWaitlistByPathway(pathway: number): WaitingListEntry[] {
    return this.waitlist().filter(x => x.pathway === pathway && x.status === 'Waiting');
  }

  getRttWeeks(isoDate: string): number {
    const elapsedMs = Date.now() - new Date(isoDate).getTime();
    return Math.floor(elapsedMs / (7 * 24 * 3600000));
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  routeToBooking(entry: WaitingListEntry) {
    // Set shared state for the active scheduling request
    this.patientService.activeSchedulingRequest.set({
      patientId: entry.patientId,
      patientName: entry.patientName,
      pathway: entry.pathway,
      entryId: entry.id
    });
    // Navigate to /booking (the router maps to the unified workspace which will scroll to and expand the booking card)
    this.router.navigate(['/booking']);
  }

  async submitReferral(event: Event) {
    event.preventDefault();
    if (!this.newReferral.patientId || !this.newReferral.specialty || !this.newReferral.referralSource) return;

    const patient = this.patients().find(x => x.id === this.newReferral.patientId);
    this.newReferral.patientName = patient ? `${patient.lastName}, ${patient.firstName}` : 'Unknown Patient';

    await this.patientService.createReferral({
      patientId: this.newReferral.patientId,
      patientName: this.newReferral.patientName,
      referralSource: this.newReferral.referralSource,
      specialty: this.newReferral.specialty,
      pathway: Number(this.newReferral.pathway),
      priority: Number(this.newReferral.priority),
      clinicalIndication: this.newReferral.clinicalIndication
    });

    this.newReferral.clinicalIndication = '';
    await this.loadData();
  }
}
