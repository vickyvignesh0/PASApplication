import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PatientService, Booking } from '../services/patient.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-booking-scheduler',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Header -->
      <div class="border-b border-slate-150 pb-5">
        <span class="text-[10px] font-bold text-nhs-blue uppercase tracking-widest">Scheduling Module</span>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Appointment & Admission Scheduler</h2>
        <p class="text-xs text-slate-500">Schedule outpatient clinic appointments and inpatient ward admission bookings.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Booking Form -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 h-fit">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div class="h-8 w-8 rounded-lg bg-blue-50 text-nhs-blue flex items-center justify-center">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="font-bold text-slate-950 text-sm">Schedule Session Slot</h3>
          </div>

          <form (submit)="submitBooking($event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase">Selected Patient</label>
              <input 
                type="text" 
                [value]="newBooking.patientName || 'No Waitlist Selection'" 
                disabled 
                class="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 font-semibold text-slate-700" 
              />
              @if (!newBooking.patientId) {
                <span class="text-[10px] text-nhs-emergencyRed font-medium mt-1 block">
                  Select a patient from the Referrals Waitlist first to schedule.
                </span>
              }
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase">Booking Type</label>
              <select [(ngModel)]="newBooking.type" name="type" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none">
                <option [value]="1">Outpatient Clinic Appointment</option>
                <option [value]="0">Inpatient Ward Admission</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase">Appointment Date & Time</label>
              <input type="datetime-local" [(ngModel)]="newBooking.appointmentDate" name="appDate" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase">Location (Clinic / Ward)</label>
              <input type="text" [(ngModel)]="newBooking.clinicNameOrWard" name="location" placeholder="e.g. Clinic Suite 2B or AMU Bed B" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase">Responsible Consultant</label>
              <input type="text" [(ngModel)]="newBooking.clinicianName" name="clinician" placeholder="e.g. Dr. Fiona Gallagher" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none" />
            </div>

            <button 
              type="submit" 
              [disabled]="!newBooking.patientId" 
              class="w-full disabled:opacity-50 disabled:cursor-not-allowed bg-nhs-blue hover:bg-nhs-darkBlue text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              Confirm & Book Slot
            </button>
          </form>
        </div>

        <!-- Bookings List -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden h-fit">
          <div class="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h4 class="font-bold text-slate-900 text-sm">Scheduled Clinic & Admission Bookings</h4>
            <span class="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {{ bookings().length }} Active Appointments
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50/50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient Name</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Booking Type</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Location / Ward</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Consultant</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                @for (b of bookings(); track b.id) {
                  <tr class="hover:bg-slate-50/30 transition-colors">
                    <td class="px-6 py-4 font-semibold text-slate-950">{{ b.patientName }}</td>
                    <td class="px-6 py-4 text-slate-600 font-medium">{{ formatDate(b.appointmentDate) }}</td>
                    <td class="px-6 py-4">
                      @if (b.type === 0) {
                        <span class="text-xs bg-purple-50 text-purple-700 font-bold px-2.5 py-0.5 rounded-full border border-purple-100/50">Inpatient (IP)</span>
                      } @else {
                        <span class="text-xs bg-blue-50 text-nhs-blue font-bold px-2.5 py-0.5 rounded-full border border-blue-100/50">Outpatient (OP)</span>
                      }
                    </td>
                    <td class="px-6 py-4 text-slate-500">{{ b.clinicNameOrWard }}</td>
                    <td class="px-6 py-4 text-slate-950 font-medium">{{ b.clinicianName }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="text-center py-8 text-slate-400">No scheduled appointments.</td></tr>
                }
              </tbody>
            </table>
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
export class BookingSchedulerComponent implements OnInit {
  patientService = inject(PatientService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  bookings = signal<Booking[]>([]);

  newBooking = {
    patientId: '',
    patientName: '',
    appointmentDate: '',
    type: 1, // Outpatient
    clinicNameOrWard: '',
    clinicianName: '',
    waitingListEntryId: ''
  };

  constructor() {
    // Reactively watch for active scheduling requests from the waitlist
    effect(() => {
      const request = this.patientService.activeSchedulingRequest();
      if (request) {
        this.newBooking.patientId = request.patientId;
        this.newBooking.patientName = request.patientName;
        this.newBooking.type = request.pathway === 0 ? 0 : 1;
        this.newBooking.waitingListEntryId = request.entryId;
      }
    });
  }

  ngOnInit() {
    this.loadData();
    
    // Parse redirect route params from waitlist navigation
    this.route.queryParams.subscribe(params => {
      if (params['patientId']) {
        this.newBooking.patientId = params['patientId'];
        this.newBooking.patientName = params['patientName'] || '';
        this.newBooking.type = Number(params['pathway']) === 0 ? 0 : 1;
        this.newBooking.waitingListEntryId = params['entryId'] || '';
      }
    });
  }

  async loadData() {
    this.bookings.set(await this.patientService.loadBookings());
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  async submitBooking(event: Event) {
    event.preventDefault();
    if (!this.newBooking.appointmentDate || !this.newBooking.clinicNameOrWard || !this.newBooking.clinicianName) return;

    await this.patientService.createBooking({
      patientId: this.newBooking.patientId,
      patientName: this.newBooking.patientName,
      appointmentDate: new Date(this.newBooking.appointmentDate).toISOString(),
      type: Number(this.newBooking.type),
      clinicNameOrWard: this.newBooking.clinicNameOrWard,
      clinicianName: this.newBooking.clinicianName,
      waitingListEntryId: this.newBooking.waitingListEntryId || null
    });

    // Reset Booking form
    this.newBooking = {
      patientId: '',
      patientName: '',
      appointmentDate: '',
      type: 1,
      clinicNameOrWard: '',
      clinicianName: '',
      waitingListEntryId: ''
    };

    // Clear shared scheduling state
    this.patientService.activeSchedulingRequest.set(null);

    // Reload list & clear query parameters
    await this.loadData();
    this.router.navigate([], { queryParams: {} });
  }
}
