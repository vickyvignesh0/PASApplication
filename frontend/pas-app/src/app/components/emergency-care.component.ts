import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PatientService, EmergencyAttendance, Patient } from '../services/patient.service';

@Component({
  selector: 'app-emergency-care',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-5">
        <div>
          <span class="text-[10px] font-bold text-nhs-emergencyRed uppercase tracking-widest">A&E / Emergency Department</span>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Emergency Department Monitor Board</h2>
          <p class="text-xs text-slate-500">Real-time triage and target monitor board for acute admissions. Governed by the national 4-hour target.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- ED Intake Form -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 h-fit">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div class="h-8 w-8 rounded-lg bg-red-50 text-nhs-emergencyRed flex items-center justify-center">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="font-bold text-slate-950 text-sm">Log Emergency Arrival</h3>
          </div>
          
          <form (submit)="submitEmergencyArrival($event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase">Select Registered Patient</label>
              <select [(ngModel)]="newArrival.patientId" name="arrPatientId" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none">
                @for (p of patients(); track p.id) {
                  <option [value]="p.id">{{ p.lastName }}, {{ p.firstName }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase">Chief Complaint / Presentation</label>
              <textarea [(ngModel)]="newArrival.chiefComplaint" name="complaint" rows="3" required placeholder="Describe primary symptoms..." class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none"></textarea>
            </div>

            <button type="submit" class="w-full bg-nhs-emergencyRed hover:bg-red-800 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center space-x-2">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Record Arrival in A&E</span>
            </button>
          </form>
        </div>

        <!-- ED Monitor Board -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden alert-glow-red">
            <div class="bg-red-50/20 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h4 class="font-bold text-nhs-emergencyRed text-sm flex items-center space-x-2">
                <span class="h-2 w-2 rounded-full bg-nhs-emergencyRed animate-ping"></span>
                <span>Active Triage Board</span>
              </h4>
              <span class="text-xs bg-red-50 text-nhs-emergencyRed px-2.5 py-0.5 rounded-full font-bold">
                {{ activeEmergency().length }} Patients in ED
              </span>
            </div>
            
            <div class="p-6 space-y-4">
              @for (e of activeEmergency(); track e.id) {
                <div class="border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white hover:shadow-md transition-all duration-200"
                  [class.border-l-8]="true"
                  [class.border-l-red-650]="e.triage === 1"
                  [class.border-l-orange-500]="e.triage === 2"
                  [class.border-l-yellow-400]="e.triage === 3"
                  [class.border-l-emerald-500]="e.triage === 4"
                  [class.border-l-blue-400]="e.triage === 5">
                  
                  <div class="space-y-1 flex-grow">
                    <div class="flex items-center space-x-2">
                      <h5 class="font-bold text-slate-950 text-base">{{ e.patientName }}</h5>
                      <span [class]="getTriageBadgeClass(e.triage)" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">
                        {{ getTriageCategoryLabel(e.triage) }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">
                      <strong>Complaint:</strong> {{ e.chiefComplaint }}
                    </p>
                    @if (e.triageNotes) {
                      <p class="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 italic border border-slate-100">
                        <strong>Triage Note:</strong> {{ e.triageNotes }}
                      </p>
                    }
                  </div>

                  <div class="flex items-center space-x-6 justify-between md:justify-end shrink-0">
                    <div class="text-right">
                      @let mins = getElapsedMinutes(e.arrivalTime);
                      <span class="text-[10px] text-slate-400 block uppercase font-semibold">ED Arrival Clock</span>
                      <span [class]="mins >= 240 ? 'text-nhs-emergencyRed font-extrabold animate-pulse' : mins >= 180 ? 'text-amber-600 font-bold' : 'text-slate-800 font-bold'" class="text-sm">
                        {{ mins }} Mins
                      </span>
                      @if (mins >= 240) {
                        <span class="text-[9px] text-nhs-emergencyRed font-bold block">4-HOUR BREACH</span>
                      }
                    </div>

                    <div class="flex space-x-2">
                      <button 
                        (click)="openTriageForm(e)"
                        class="bg-slate-100 hover:bg-slate-250 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                        Triage
                      </button>
                      <button 
                        (click)="dischargeEdPatient(e)"
                        class="bg-emerald-50 hover:bg-nhs-green hover:text-white text-nhs-green px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150">
                        Discharge
                      </button>
                    </div>
                  </div>
                </div>
              } @empty {
                <p class="text-center text-slate-400 py-8 text-sm">Emergency Department monitor board is clear.</p>
              }
            </div>
          </div>

          <!-- Active Triage Form Drawer -->
          @if (selectedEdAttendance(); as ed) {
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4 animate-slide-in">
              <div class="flex justify-between items-center border-b border-slate-200 pb-2">
                <h4 class="font-bold text-slate-900 text-sm">Perform Triage Assessment: {{ ed.patientName }}</h4>
                <button (click)="closeTriageForm()" class="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 uppercase">Triage Severity Class</label>
                  <select [(ngModel)]="triageData.triage" name="triage" class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none">
                    <option [value]="1">Category 1 - Immediate (Red)</option>
                    <option [value]="2">Category 2 - Very Urgent (Orange)</option>
                    <option [value]="3">Category 3 - Urgent (Yellow)</option>
                    <option [value]="4">Category 4 - Standard (Green)</option>
                    <option [value]="5">Category 5 - Non-Urgent (Blue)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 uppercase">Triage Clinical Assessment</label>
                  <input type="text" [(ngModel)]="triageData.triageNotes" name="triageNotes" placeholder="Vitals, clinical assessment notes..." class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none" />
                </div>
              </div>
              <div class="flex justify-end">
                <button (click)="submitTriage()" class="bg-nhs-blue hover:bg-nhs-darkBlue text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm">
                  Log Triage Classification
                </button>
              </div>
            </div>
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
    .border-l-red-650 {
      border-left-color: #DA291C;
    }
  `]
})
export class EmergencyCareComponent implements OnInit {
  patientService = inject(PatientService);

  patients = this.patientService.patients;
  activeEmergency = signal<EmergencyAttendance[]>([]);
  selectedEdAttendance = signal<EmergencyAttendance | null>(null);

  newArrival = {
    patientId: '',
    patientName: '',
    chiefComplaint: ''
  };

  triageData = {
    attendanceId: '',
    triage: 4,
    triageNotes: ''
  };

  ngOnInit() {
    this.loadData();
    if (this.patients().length > 0) {
      this.newArrival.patientId = this.patients()[0].id;
    }
  }

  async loadData() {
    this.activeEmergency.set(await this.patientService.loadActiveEmergency());
  }

  getElapsedMinutes(isoDate: string): number {
    const elapsedMs = Date.now() - new Date(isoDate).getTime();
    return Math.floor(elapsedMs / 60000);
  }

  getTriageCategoryLabel(triage: number): string {
    switch (triage) {
      case 1: return 'Category 1 - Resus (Red)';
      case 2: return 'Category 2 - Very Urgent (Orange)';
      case 3: return 'Category 3 - Urgent (Yellow)';
      case 4: return 'Category 4 - Standard (Green)';
      case 5: return 'Category 5 - Non-Urgent (Blue)';
      default: return 'Standard';
    }
  }

  getTriageBadgeClass(triage: number): string {
    switch (triage) {
      case 1: return 'bg-red-50 border-red-200 text-nhs-emergencyRed';
      case 2: return 'bg-orange-50 border-orange-200 text-orange-700';
      case 3: return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 4: return 'bg-emerald-50 border-emerald-250 text-emerald-700';
      case 5: return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  }

  async submitEmergencyArrival(event: Event) {
    event.preventDefault();
    if (!this.newArrival.patientId || !this.newArrival.chiefComplaint) return;

    const patient = this.patients().find(x => x.id === this.newArrival.patientId);
    this.newArrival.patientName = patient ? `${patient.lastName}, ${patient.firstName}` : 'Unknown Patient';

    await this.patientService.registerEmergencyArrival({
      patientId: this.newArrival.patientId,
      patientName: this.newArrival.patientName,
      chiefComplaint: this.newArrival.chiefComplaint
    });

    this.newArrival.chiefComplaint = '';
    await this.loadData();
  }

  openTriageForm(attendance: EmergencyAttendance) {
    this.selectedEdAttendance.set(attendance);
    this.triageData = {
      attendanceId: attendance.id,
      triage: attendance.triage,
      triageNotes: attendance.triageNotes || ''
    };
  }

  closeTriageForm() {
    this.selectedEdAttendance.set(null);
  }

  async submitTriage() {
    if (!this.triageData.attendanceId) return;
    await this.patientService.triageEmergencyPatient({
      attendanceId: this.triageData.attendanceId,
      triage: Number(this.triageData.triage),
      triageNotes: this.triageData.triageNotes
    });
    this.closeTriageForm();
    await this.loadData();
  }

  async dischargeEdPatient(attendance: EmergencyAttendance) {
    await this.patientService.triageEmergencyPatient({
      attendanceId: attendance.id,
      triage: attendance.triage,
      triageNotes: 'Discharged from emergency care.',
      status: 3 // Discharged
    });
    await this.loadData();
  }
}
