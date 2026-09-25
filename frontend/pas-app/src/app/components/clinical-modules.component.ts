import { Component, OnInit, signal, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, Patient, WaitingListEntry, Booking, ClinicalDocument, Ward, Bed, Doctor } from '../services/patient.service';

// --- 1. DASHBOARD HOME ---
@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">Enterprise Patient Administration (PAS)</h2>
          <p class="text-xs text-slate-500 mt-1">Hospital Information System Gateway • Choose a workspace module.</p>
        </div>
        <div class="flex space-x-3 text-xs">
          <div class="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg font-bold text-blue-700">
            🏥 Inpatients: {{ patientService.totalInpatients() }}
          </div>
          <div class="bg-teal-50 border border-teal-200 px-4 py-2 rounded-lg font-bold text-teal-700">
            🧑‍🤝‍🧑 Outpatients: {{ patientService.totalOutpatients() }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        @for (card of cards; track card.type) {
          <div 
            (click)="selectModule(card.type, card.title)"
            class="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group h-[145px]">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-2xl" [ngClass]="card.iconColor">{{ card.icon }}</span>
                <span class="text-[10px] uppercase font-bold text-slate-400 group-hover:text-blue-500 tracking-wider">Launch</span>
              </div>
              <h3 class="font-bold text-slate-900 text-sm mt-3">{{ card.title }}</h3>
              <p class="text-[11px] text-slate-400 mt-1 leading-tight">{{ card.desc }}</p>
            </div>
            <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Quick Action</span>
              <span class="text-blue-500 font-bold group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class DashboardHomeComponent {
  patientService = inject(PatientService);
  @Output() onModuleSelect = new EventEmitter<{ type: string; title: string }>();

  cards = [
    { type: 'patient-search', title: 'Patient Search', desc: 'Find patients across the demographic registry.', icon: '👤', iconColor: 'text-blue-500' },
    { type: 'patient-registration', title: 'Patient Registration', desc: 'Register new outpatient/inpatient records.', icon: '📝', iconColor: 'text-indigo-500' },
    { type: 'referrals-search', title: 'Referral Search', desc: 'Lookup GP, internal, and e-RS pathways.', icon: '📋', iconColor: 'text-teal-500' },
    { type: 'referrals-create', title: 'Referral Create', desc: 'Log new specialty outpatient referrals.', icon: '➕', iconColor: 'text-cyan-500' },
    { type: 'waiting-search', title: 'Waiting List Search', desc: 'Search active IP/OP waiting lists.', icon: '📅', iconColor: 'text-purple-500' },
    { type: 'waiting-create', title: 'Waiting List Create', desc: 'Schedule patient waiting list allocations.', icon: '🛏', iconColor: 'text-rose-500' },
    { type: 'appointment-search', title: 'Appointment Search', desc: 'Search consultant clinics and admissions.', icon: '📆', iconColor: 'text-amber-500' },
    { type: 'appointment-booking', title: 'Appointment Booking', desc: 'Book outpatient slots and inpatient beds.', icon: '✔', iconColor: 'text-emerald-500' },
    { type: 'ward-management', title: 'Ward Management', desc: 'Allocate beds, manage occupancy & discharges.', icon: '🏢', iconColor: 'text-blue-600' },
    { type: 'alert-create', title: 'Alert Create', desc: 'Log clinical warnings and infection controls.', icon: '⚠', iconColor: 'text-red-500' },
    { type: 'documents-search', title: 'Documents Search', desc: 'Search clinical notes and medical records.', icon: '📄', iconColor: 'text-slate-500' },
    { type: 'clinical-notes', title: 'Clinical Notes', desc: 'Add progress letters and daily ward notes.', icon: '🗒️', iconColor: 'text-yellow-600' },
    { type: 'reports-statistics', title: 'Reports & Statistics', desc: 'Review executive hospital KPIs and trends.', icon: '📊', iconColor: 'text-indigo-600' }
  ];

  selectModule(type: string, title: string) {
    this.onModuleSelect.emit({ type, title });
  }
}

// --- 2. PATIENT SEARCH ---
@Component({
  selector: 'app-patient-search-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
      <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900 tracking-tight">Patient Demographics Search</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Filter the master registry of over 100+ active clinical files.</p>
        </div>
      </div>

      <!-- Quick stats summary card row -->
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Master Directory</span>
          <p class="text-lg font-bold text-slate-800">{{ patientService.patients().length }} Records</p>
        </div>
        <div class="bg-blue-50/30 border border-blue-150 p-3 rounded-lg text-center">
          <span class="text-[10px] font-bold text-blue-500 uppercase">Admitted Inpatients</span>
          <p class="text-lg font-bold text-blue-700">{{ patientService.totalInpatients() }}</p>
        </div>
        <div class="bg-teal-50/30 border border-teal-150 p-3 rounded-lg text-center">
          <span class="text-[10px] font-bold text-teal-500 uppercase">Registered Outpatients</span>
          <p class="text-lg font-bold text-teal-700">{{ patientService.totalOutpatients() }}</p>
        </div>
        <div class="bg-red-50/30 border border-red-150 p-3 rounded-lg text-center">
          <span class="text-[10px] font-bold text-red-500 uppercase">Infection Flags</span>
          <p class="text-lg font-bold text-red-700">{{ patientService.infectionAlertCount() }}</p>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-150">
        <div class="relative w-full max-w-md">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (ngModelChange)="currentPage = 1"
            placeholder="Search by name, ID, or NHS number..."
            class="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <span class="absolute left-3 top-2 text-slate-400">🔍</span>
        </div>
        
        <!-- Quick Filters -->
        <div class="flex space-x-1.5 text-xs">
          <button (click)="filterStatus = 'All'" [class.bg-blue-600]="filterStatus === 'All'" [class.text-white]="filterStatus === 'All'" class="border border-slate-300 px-3 py-1.5 rounded-lg bg-white font-semibold">All</button>
          <button (click)="filterStatus = 'Inpatient'" [class.bg-blue-600]="filterStatus === 'Inpatient'" [class.text-white]="filterStatus === 'Inpatient'" class="border border-slate-300 px-3 py-1.5 rounded-lg bg-white font-semibold">Admitted</button>
          <button (click)="filterStatus = 'Outpatient'" [class.bg-blue-600]="filterStatus === 'Outpatient'" [class.text-white]="filterStatus === 'Outpatient'" class="border border-slate-300 px-3 py-1.5 rounded-lg bg-white font-semibold">Outpatient</button>
        </div>

        <div class="ml-auto text-xs flex items-center space-x-2">
          <span>Sort By:</span>
          <select [(ngModel)]="sortBy" class="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="lastName">Last Name</option>
            <option value="firstName">First Name</option>
            <option value="dob">Date of Birth</option>
          </select>
        </div>
      </div>

      <!-- Patient Table -->
      <div class="overflow-x-auto border border-slate-200 rounded-lg">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <th class="p-3">Patient Name</th>
              <th class="p-3">Date of Birth</th>
              <th class="p-3">Gender</th>
              <th class="p-3">NHS / CHI / IHI</th>
              <th class="p-3">Current Location</th>
              <th class="p-3">Infection Alert</th>
              <th class="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (p of paginatedPatients(); track p.id) {
              <tr 
                [ngClass]="{
                  'bg-amber-50 border-l-4 border-l-amber-550 animate-pulse font-semibold': p.id === patientService.lastCreatedRecordId()
                }"
                class="border-b border-slate-150 hover:bg-slate-50/50 transition-colors">
                <td class="p-3 font-bold text-slate-800 uppercase">{{ p.lastName }}, {{ p.firstName }}</td>
                <td class="p-3 text-slate-500">{{ p.dateOfBirth }}</td>
                <td class="p-3 text-slate-500">{{ p.gender }}</td>
                <td class="p-3 font-mono text-[11px] text-slate-655">
                  {{ p.nhsNumber || p.ihiNumber || p.chiNumber || 'N/A' }}
                </td>
                <td class="p-3 font-medium">
                  @if (p.isAdmitted) {
                    <span class="text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-[10px]">
                      {{ p.currentWard }} ({{ p.currentBed }})
                    </span>
                  } @else {
                    <span class="text-slate-400 italic">Outpatient</span>
                  }
                </td>
                <td class="p-3">
                  @if (p.infectionControlAlerts && p.infectionControlAlerts !== 'None' && p.infectionControlAlerts !== '') {
                    <span class="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100 truncate max-w-[150px] inline-block" [title]="p.infectionControlAlerts">
                      ⚠️ {{ p.infectionControlAlerts }}
                    </span>
                  } @else {
                    <span class="text-slate-450">None</span>
                  }
                </td>
                <td class="p-3 text-right">
                  <button 
                    (click)="selectPatient(p)"
                    class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded text-[11px] font-bold border border-blue-200 transition-colors">
                    Set Context
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination bar -->
      <div class="flex items-center justify-between text-xs border-t border-slate-100 pt-4">
        <span class="text-slate-450">
          Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ min(currentPage * pageSize, totalRecords()) }} of {{ totalRecords() }} entries
        </span>
        <div class="flex space-x-1">
          <button [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1" class="border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-50">Previous</button>
          <button [disabled]="currentPage * pageSize >= totalRecords()" (click)="currentPage = currentPage + 1" class="border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  `
})
export class PatientSearchViewComponent implements OnInit {
  patientService = inject(PatientService);
  searchQuery = '';
  filterStatus = 'All';
  sortBy = 'lastName';
  currentPage = 1;
  pageSize = 10;

  ngOnInit() {
    // If there is a lastCreatedRecordId, highlight and focus it
    const lastId = this.patientService.lastCreatedRecordId();
    if (lastId) {
      const found = this.patientService.patients().find(p => p.id === lastId);
      if (found) {
        this.patientService.activePatient.set(found);
      }
      setTimeout(() => {
        if (this.patientService.lastCreatedRecordId() === lastId) {
          this.patientService.lastCreatedRecordId.set(null);
        }
      }, 7000);
    }
  }

  min(a: number, b: number) { return Math.min(a, b); }

  totalRecords() {
    return this.filteredList().length;
  }

  filteredList() {
    let list = this.patientService.patients();
    
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.firstName.toLowerCase().includes(q) || 
        p.lastName.toLowerCase().includes(q) ||
        (p.nhsNumber && p.nhsNumber.includes(q))
      );
    }

    if (this.filterStatus === 'Inpatient') {
      list = list.filter(p => p.isAdmitted);
    } else if (this.filterStatus === 'Outpatient') {
      list = list.filter(p => !p.isAdmitted);
    }

    list.sort((a, b) => {
      if (this.sortBy === 'lastName') return a.lastName.localeCompare(b.lastName);
      if (this.sortBy === 'firstName') return a.firstName.localeCompare(b.firstName);
      if (this.sortBy === 'dob') return a.dateOfBirth.localeCompare(b.dateOfBirth);
      return 0;
    });

    return list;
  }

  paginatedPatients() {
    const list = this.filteredList();
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  selectPatient(p: Patient) {
    this.patientService.activePatient.set(p);
  }
}

// --- 3. PATIENT REGISTRATION ---
@Component({
  selector: 'app-patient-registration-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm max-w-2xl">
      <div class="border-b border-slate-100 pb-3">
        <h3 class="text-sm font-bold text-slate-900 tracking-tight">Register New Inpatient/Outpatient</h3>
        <p class="text-[11px] text-slate-400 mt-0.5">Initialize a new patient record in the demographic registry with clinical audits.</p>
      </div>

      <form (submit)="register($event)" class="space-y-4 text-xs">
        @if (successMessage()) {
          <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 font-semibold animate-fade-in">
            {{ successMessage() }}
          </div>
        }

        @if (valError()) {
          <div class="bg-red-50 border border-red-200 p-3 rounded-lg text-red-700 font-semibold animate-fade-in">
            {{ valError() }}
          </div>
        }

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">First Name</label>
            <input type="text" [(ngModel)]="newPatient.firstName" name="firstName" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Last Name</label>
            <input type="text" [(ngModel)]="newPatient.lastName" name="lastName" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Date of Birth</label>
            <input type="date" [(ngModel)]="newPatient.dateOfBirth" name="dateOfBirth" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Gender</label>
            <select [(ngModel)]="newPatient.gender" name="gender" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">NHS or IHI Number</label>
            <input type="text" [(ngModel)]="newPatient.nhsNumber" name="nhsNumber" placeholder="e.g. 485 777 3456" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Primary GP Practice</label>
            <input type="text" [(ngModel)]="newPatient.gpPractice" name="gpPractice" placeholder="Vance Clinic" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Telephone Contact</label>
            <input type="text" [(ngModel)]="newPatient.phone" name="phone" required placeholder="e.g. +44 7700 900077" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Email Address</label>
            <input type="email" [(ngModel)]="newPatient.email" name="email" required placeholder="patient@nhs.net" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Marital Status</label>
            <select [(ngModel)]="newPatient.maritalStatus" name="maritalStatus" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Preferred Language</label>
            <input type="text" [(ngModel)]="newPatient.preferredLanguage" name="preferredLanguage" placeholder="English" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Interpreter Required</label>
            <select [(ngModel)]="newPatient.interpreterRequired" name="interpreter" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option [ngValue]="false">No</option>
              <option [ngValue]="true">Yes</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Next of Kin Name</label>
            <input type="text" [(ngModel)]="newPatient.nokName" name="nokName" required placeholder="Emergency Contact Name" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Next of Kin Phone</label>
            <input type="text" [(ngModel)]="newPatient.nokPhone" name="nokPhone" required placeholder="Kin Contact Telephone" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Address</label>
            <input type="text" [(ngModel)]="newPatient.addressLine1" name="addressLine1" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Postcode</label>
            <input type="text" [(ngModel)]="newPatient.postcode" name="postcode" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <button 
          type="submit"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
          Register Patient
        </button>
      </form>
    </div>
  `
})
export class PatientRegistrationViewComponent {
  patientService = inject(PatientService);
  successMessage = signal<string>('');
  valError = signal<string>('');

  newPatient = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    nhsNumber: '',
    gpCode: 'G83047',
    gpPractice: '',
    phone: '',
    email: '',
    maritalStatus: 'Single',
    preferredLanguage: 'English',
    interpreterRequired: false,
    nokName: '',
    nokPhone: '',
    addressLine1: '',
    postcode: ''
  };

  async register(event: Event) {
    event.preventDefault();
    this.valError.set('');

    // Telephone validation
    const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
    if (!phoneRegex.test(this.newPatient.phone)) {
      this.valError.set('Invalid telephone number. Format must be 7-15 digits.');
      return;
    }

    // Email validation
    const emailRegex = /.+@.+\..+/;
    if (!emailRegex.test(this.newPatient.email)) {
      this.valError.set('Invalid email address.');
      return;
    }

    const pid = await this.patientService.registerPatient(this.newPatient);
    
    const patientObj = this.patientService.patients().find(p => p.id === pid);
    if (patientObj) {
      patientObj.gender = this.newPatient.gender;
      this.patientService.activePatient.set(patientObj);
    }
    
    this.successMessage.set(`Successfully registered patient ${this.newPatient.firstName} ${this.newPatient.lastName}. Redirection initialized...`);
    
    setTimeout(() => {
      this.successMessage.set('');
      this.patientService.activeNavigationTrigger.set({ type: 'patient-search', label: 'Patient Search' });
    }, 1500);
  }
}

// --- 4. REFERRAL SEARCH ---
@Component({
  selector: 'app-referral-search-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
      <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900 tracking-tight">GP & Specialty Outpatient Referrals</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Search active external, internal, and e-RS pathways.</p>
        </div>
      </div>

      <div class="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-150">
        <div class="relative w-full max-w-md">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            placeholder="Filter by patient name or specialty..."
            class="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <span class="absolute left-3 top-2 text-slate-400">🔍</span>
        </div>
        
        <div class="flex space-x-1.5 text-xs">
          <button (click)="filterPathway = 'All'" [class.bg-blue-600]="filterPathway === 'All'" [class.text-white]="filterPathway === 'All'" class="border border-slate-300 px-3 py-1.5 rounded-lg bg-white font-semibold">All Pathways</button>
          <button (click)="filterPathway = 'Inpatient'" [class.bg-blue-600]="filterPathway === 'Inpatient'" [class.text-white]="filterPathway === 'Inpatient'" class="border border-slate-300 px-3 py-1.5 rounded-lg bg-white font-semibold">Inpatient (IP)</button>
          <button (click)="filterPathway = 'Outpatient'" [class.bg-blue-600]="filterPathway === 'Outpatient'" [class.text-white]="filterPathway === 'Outpatient'" class="border border-slate-300 px-3 py-1.5 rounded-lg bg-white font-semibold">Outpatient (OP)</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div class="lg:col-span-2 overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th class="p-3">Patient Name</th>
                <th class="p-3">Specialty</th>
                <th class="p-3">Priority</th>
                <th class="p-3">Date Added</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (ref of filteredReferrals(); track ref.id) {
                <tr 
                  (click)="selectedReferral.set(ref)"
                  [ngClass]="{
                    'bg-amber-50 border-l-4 border-l-amber-550 animate-pulse font-semibold': ref.id === patientService.lastCreatedRecordId(),
                    'bg-blue-50/30': selectedReferral()?.id === ref.id
                  }"
                  class="border-b border-slate-150 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td class="p-3 font-bold text-slate-800 uppercase">{{ ref.patientName }}</td>
                  <td class="p-3 text-slate-650 font-medium">{{ ref.specialty }}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold border"
                          [ngClass]="{
                            'bg-red-50 text-red-700 border-red-200': ref.pathway === 0,
                            'bg-blue-50 text-blue-700 border-blue-200': ref.pathway === 1
                          }">
                      {{ ref.pathway === 0 ? 'Inpatient (IP)' : 'Outpatient (OP)' }}
                    </span>
                  </td>
                  <td class="p-3 text-slate-500">{{ ref.dateAdded | date:'dd MMM yyyy' }}</td>
                  <td class="p-3 text-right">
                    <button class="text-blue-600 font-bold hover:underline">Select</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Right Side: Referral Detail View -->
        <div class="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          @if (selectedReferral(); as r) {
            <div class="space-y-3">
              <div class="border-b border-slate-200 pb-2">
                <span class="text-[9px] uppercase font-bold text-blue-500">e-RS Pathway Record</span>
                <h4 class="font-bold text-slate-900 text-sm mt-0.5">{{ r.patientName }}</h4>
                <span class="text-[10px] text-slate-400 font-mono">REF: {{ r.id.toUpperCase() }}</span>
              </div>

              <div class="space-y-2 text-[11px] text-slate-600">
                <div>
                  <span class="text-slate-400 block text-[9px] uppercase font-bold">Priority Status</span>
                  <span class="font-bold text-slate-800">Routine NHS Waitlist</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px] uppercase font-bold">Specialty Service</span>
                  <span class="font-bold text-slate-800">{{ r.specialty }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px] uppercase font-bold">GP Clinical Notes</span>
                  <p class="text-slate-700 bg-white p-2.5 border rounded mt-1 font-mono leading-relaxed whitespace-pre-wrap">{{ r.status }}</p>
                </div>
              </div>
            </div>
          } @else {
            <div class="flex flex-col justify-center items-center h-full text-slate-400 min-h-[150px]">
              <span class="text-2xl">📋</span>
              <p class="mt-2 text-center">Click a GP Referral pathway row to view full clinical details.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ReferralSearchViewComponent implements OnInit {
  patientService = inject(PatientService);
  referrals = signal<WaitingListEntry[]>([]);
  selectedReferral = signal<WaitingListEntry | null>(null);

  searchQuery = '';
  filterPathway = 'All';

  ngOnInit() {
    this.load();
  }

  async load() {
    const list = await this.patientService.loadWaitingList();
    this.referrals.set(list);

    const lastId = this.patientService.lastCreatedRecordId();
    if (lastId) {
      const found = list.find(r => r.id === lastId);
      if (found) {
        this.selectedReferral.set(found);
      }
      setTimeout(() => {
        if (this.patientService.lastCreatedRecordId() === lastId) {
          this.patientService.lastCreatedRecordId.set(null);
        }
      }, 7000);
    } else if (list.length > 0) {
      this.selectedReferral.set(list[0]);
    }
  }

  filteredReferrals() {
    let list = this.referrals();
    
    const query = this.searchQuery.toLowerCase().trim();
    if (query) {
      list = list.filter(r => 
        r.patientName.toLowerCase().includes(query) ||
        r.specialty.toLowerCase().includes(query)
      );
    }

    if (this.filterPathway === 'Inpatient') {
      list = list.filter(r => r.pathway === 0);
    } else if (this.filterPathway === 'Outpatient') {
      list = list.filter(r => r.pathway === 1);
    }

    return list;
  }
}

// --- 5. REFERRAL CREATE ---
@Component({
  selector: 'app-referral-create-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm max-w-xl animate-fade-in">
      <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900 tracking-tight">Create Specialty Outpatient Referral</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Initialize a clinical referral pathway under NHS/e-RS standards.</p>
        </div>
        @if (patient) {
          <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
            Locked Context: {{ patient.lastName }}, {{ patient.firstName }}
          </span>
        }
      </div>

      @if (!patient) {
        <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800">
          ⚠️ <strong>No Patient Context Bound:</strong> Please launch this module from the Dashboard with a selected patient, or set context in Patient Search.
        </div>
      } @else {
        <form (submit)="submitReferral($event)" class="space-y-4 text-xs">
          @if (successMessage()) {
            <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 font-semibold animate-fade-in">
              {{ successMessage() }}
            </div>
          }

          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Patient Name</label>
            <input type="text" disabled [value]="patientName()" class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 mt-1 font-bold text-slate-700" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Target Specialty</label>
              <select [(ngModel)]="referral.specialty" name="specialty" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopaedics">Orthopaedics</option>
                <option value="Geriatrics">Geriatrics</option>
                <option value="General Surgery">General Surgery</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Neurology">Neurology</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Clinical Priority Pathway</label>
              <select [(ngModel)]="referral.priority" name="priority" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="Two Week Wait">Two Week Wait (Suspected Cancer)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Referring Clinician Name</label>
              <input type="text" [(ngModel)]="referral.clinician" name="clinician" placeholder="e.g. Dr. Robert Vance, GP" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Referral Source Interface</label>
              <select [(ngModel)]="referral.source" name="source" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="e-RS Portal">e-RS Digital Portal</option>
                <option value="GP Written Letter">GP Written Letter</option>
                <option value="Internal Consultation">Internal consultation transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Clinical Indication & Diagnosis notes</label>
            <textarea [(ngModel)]="referral.indication" name="indication" rows="4" placeholder="Enter GP diagnostic notes and observations..." class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
          </div>

          <button 
            type="submit"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
            Create Referral
          </button>
        </form>
      }
    </div>
  `
})
export class ReferralCreateViewComponent {
  @Input() patient?: Patient;
  patientService = inject(PatientService);
  successMessage = signal<string>('');

  referral = {
    specialty: 'Cardiology',
    priority: 'Routine',
    clinician: 'Dr. Robert Vance, GP',
    source: 'e-RS Portal',
    indication: ''
  };

  patientName() {
    return this.patient ? `${this.patient.lastName}, ${this.patient.firstName}` : '';
  }

  async submitReferral(event: Event) {
    event.preventDefault();
    if (!this.patient) return;

    await this.patientService.createReferral({
      patientId: this.patient.id,
      patientName: `${this.patient.lastName}, ${this.patient.firstName}`,
      specialty: this.referral.specialty,
      pathway: 1, // Outpatient
      status: `[Referring: ${this.referral.clinician} via ${this.referral.source}] Priority: ${this.referral.priority}\nNotes: ${this.referral.indication || 'Referred for specialist assessment'}`
    });

    this.successMessage.set('Referral logged successfully. Redirecting to Search...');
    
    setTimeout(() => {
      this.successMessage.set('');
      this.patientService.activeNavigationTrigger.set({ type: 'referrals-search', label: 'Referral Search' });
    }, 1500);
  }
}

// --- 6. WAITING LIST SEARCH ---
@Component({
  selector: 'app-waiting-list-search-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
      <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900 tracking-tight">Active Inpatient & Outpatient Waitlist (RTT)</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Review patients under the NHS 18-week pathway tracker.</p>
        </div>
      </div>

      <div class="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-150">
        <input 
          type="text" 
          [(ngModel)]="searchQuery"
          placeholder="Search by patient name..."
          class="w-full max-w-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <select [(ngModel)]="filterSpecialty" class="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="All">All Specialties</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Orthopaedics">Orthopaedics</option>
          <option value="Geriatrics">Geriatrics</option>
          <option value="General Surgery">General Surgery</option>
          <option value="Pediatrics">Pediatrics</option>
        </select>
        <span class="text-xs text-slate-550 ml-auto font-bold">{{ filteredWaitlist().length }} Patients Waiting</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div class="lg:col-span-2 overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-55 border-b border-slate-200 text-slate-500 font-semibold">
                <th class="p-3">Patient</th>
                <th class="p-3">Specialty</th>
                <th class="p-3">Date Added</th>
                <th class="p-3">RTT Weeks</th>
                <th class="p-3">Status</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of filteredWaitlist(); track entry.id) {
                <tr 
                  (click)="selectedEntry.set(entry)"
                  [ngClass]="{
                    'bg-amber-50 border-l-4 border-l-amber-550 animate-pulse font-semibold': entry.id === patientService.lastCreatedRecordId(),
                    'bg-blue-50/30': selectedEntry()?.id === entry.id
                  }"
                  class="border-b border-slate-150 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td class="p-3 font-bold text-slate-800 uppercase">{{ entry.patientName }}</td>
                  <td class="p-3 text-slate-650 font-medium">{{ entry.specialty }}</td>
                  <td class="p-3 text-slate-500">{{ entry.dateAdded | date:'dd/MM/yyyy' }}</td>
                  <td class="p-3 font-mono font-bold" [ngClass]="calculateRTTWeeks(entry.dateAdded) > 12 ? 'text-red-650' : 'text-slate-600'">
                    {{ calculateRTTWeeks(entry.dateAdded) }} weeks
                  </td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
                          [ngClass]="{
                            'bg-slate-100 text-slate-650 border-slate-200': entry.status === 'Waiting',
                            'bg-emerald-50 text-emerald-700 border-emerald-200': entry.status === 'Scheduled'
                          }">
                      {{ entry.status }}
                    </span>
                  </td>
                  <td class="p-3 text-right">
                    @if (entry.status === 'Waiting') {
                      <button 
                        (click)="scheduleAppointment(entry); $event.stopPropagation()"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-[10px] font-bold transition-all shadow-sm">
                        Book Slot
                      </button>
                    } @else {
                      <span class="text-slate-400 italic">No action</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Right: Waitlist Detail view -->
        <div class="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          @if (selectedEntry(); as e) {
            <div class="space-y-3">
              <div class="border-b border-slate-200 pb-2">
                <span class="text-[9px] uppercase font-bold text-blue-500">Waitlist RTT pathway</span>
                <h4 class="font-bold text-slate-900 text-sm mt-0.5">{{ e.patientName }}</h4>
                <span class="text-[10px] text-slate-400 font-mono">ID: {{ e.id.toUpperCase() }}</span>
              </div>

              <div class="space-y-2 text-[11px] text-slate-600">
                <div>
                  <span class="text-slate-400 block text-[9px] uppercase font-bold">Planned Procedure Code</span>
                  <span class="font-bold text-slate-800">OP-102 (General Outpatient consultation)</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px] uppercase font-bold">RTT Clock Weeks</span>
                  <span class="font-bold text-slate-800">{{ calculateRTTWeeks(e.dateAdded) }} Weeks Waiting</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px] uppercase font-bold">Expected Length of Stay</span>
                  <span class="font-bold text-slate-850">Day Case Booking</span>
                </div>
              </div>
            </div>
          } @else {
            <div class="flex flex-col justify-center items-center h-full text-slate-400 min-h-[150px]">
              <span class="text-2xl">🛏</span>
              <p class="mt-2 text-center">Click a Waitlist pathway row to view RTT clock details.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class WaitingListSearchViewComponent implements OnInit {
  patientService = inject(PatientService);
  waitlist = signal<WaitingListEntry[]>([]);
  selectedEntry = signal<WaitingListEntry | null>(null);

  searchQuery = '';
  filterSpecialty = 'All';

  ngOnInit() {
    this.load();
  }

  async load() {
    const list = await this.patientService.loadWaitingList();
    this.waitlist.set(list);

    const lastId = this.patientService.lastCreatedRecordId();
    if (lastId) {
      const found = list.find(w => w.id === lastId);
      if (found) {
        this.selectedEntry.set(found);
      }
      setTimeout(() => {
        if (this.patientService.lastCreatedRecordId() === lastId) {
          this.patientService.lastCreatedRecordId.set(null);
        }
      }, 7000);
    } else if (list.length > 0) {
      this.selectedEntry.set(list[0]);
    }
  }

  filteredWaitlist() {
    let list = this.waitlist();

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(w => w.patientName.toLowerCase().includes(q));
    }

    if (this.filterSpecialty !== 'All') {
      list = list.filter(w => w.specialty === this.filterSpecialty);
    }

    return list;
  }

  calculateRTTWeeks(dateStr: string): number {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  }

  scheduleAppointment(entry: WaitingListEntry) {
    this.patientService.activeSchedulingRequest.set({
      patientId: entry.patientId,
      patientName: entry.patientName,
      pathway: entry.pathway,
      entryId: entry.id
    });
    this.patientService.activeNavigationTrigger.set({ type: 'appointment-booking', label: 'Appointment Booking' });
  }
}

// --- 7. WAITING LIST CREATE ---
@Component({
  selector: 'app-waiting-list-create-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm max-w-xl animate-fade-in">
      <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900 tracking-tight">Allocate Patient to RTT Waiting List</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Create a pathway waitlist entry for diagnostic or inpatient surgery.</p>
        </div>
        @if (patient) {
          <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
            Locked Context: {{ patient.lastName }}, {{ patient.firstName }}
          </span>
        }
      </div>

      @if (!patient) {
        <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800">
          ⚠️ <strong>No Patient Context Bound:</strong> Please launch this module from the Dashboard with a selected patient, or set context in Patient Search.
        </div>
      } @else {
        <form (submit)="submitWaitingList($event)" class="space-y-4 text-xs">
          @if (successMessage()) {
            <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 font-semibold animate-fade-in">
              {{ successMessage() }}
            </div>
          }

          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Patient Name</label>
            <input type="text" disabled [value]="patientName()" class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 mt-1 font-bold text-slate-700" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Target Specialty</label>
              <select [(ngModel)]="entry.specialty" name="specialty" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopaedics">Orthopaedics</option>
                <option value="Geriatrics">Geriatrics</option>
                <option value="General Surgery">General Surgery</option>
                <option value="Pediatrics">Pediatrics</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Pathway Allocation</label>
              <select [(ngModel)]="entry.pathway" name="pathway" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option [ngValue]="0">Inpatient Admission (IP)</option>
                <option [ngValue]="1">Outpatient Clinic (OP)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Planned Procedure Code</label>
              <select [(ngModel)]="entry.procedureCode" name="procedure" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="OP-102">OP-102 General Outpatient Consultation</option>
                <option value="IP-943">IP-943 Knee Arthroplasty Surgery</option>
                <option value="IP-111">IP-111 CABG Cardiac Surgery</option>
                <option value="OP-882">OP-882 Cardiac Stress Echocardiogram</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Expected Length of Stay</label>
              <select [(ngModel)]="entry.expectedStay" name="stay" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="Day Case">Day Case Booking</option>
                <option value="1-2 Days">1-2 Days Inpatient</option>
                <option value="3-5 Days">3-5 Days Inpatient</option>
                <option value="1+ Weeks">1+ Weeks Inpatient</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
            Add to Waiting List
          </button>
        </form>
      }
    </div>
  `
})
export class WaitingListCreateViewComponent {
  @Input() patient?: Patient;
  patientService = inject(PatientService);
  successMessage = signal<string>('');

  entry = {
    specialty: 'Cardiology',
    pathway: 0,
    procedureCode: 'OP-102',
    expectedStay: 'Day Case'
  };

  patientName() {
    return this.patient ? `${this.patient.lastName}, ${this.patient.firstName}` : '';
  }

  async submitWaitingList(event: Event) {
    event.preventDefault();
    if (!this.patient) return;

    await this.patientService.createReferral({
      patientId: this.patient.id,
      patientName: `${this.patient.lastName}, ${this.patient.firstName}`,
      specialty: this.entry.specialty,
      pathway: this.entry.pathway,
      status: `[Procedure: ${this.entry.procedureCode}] Est Length of Stay: ${this.entry.expectedStay} - RTT Clock Running`
    });

    this.successMessage.set('Patient successfully allocated to RTT pathway. Redirecting to Waitlist search...');
    
    setTimeout(() => {
      this.successMessage.set('');
      this.patientService.activeNavigationTrigger.set({ type: 'waiting-search', label: 'Waiting List Search' });
    }, 1500);
  }
}

// --- 8. APPOINTMENT SEARCH ---
@Component({
  selector: 'app-appointment-search-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
      <div class="border-b border-slate-100 pb-3">
        <h3 class="text-sm font-bold text-slate-900 tracking-tight">Active Appointments & Inpatient Admissions</h3>
        <p class="text-[11px] text-slate-400 mt-0.5">Search upcoming consultant slots and scheduled hospital bookings.</p>
      </div>

      <!-- Filters panel -->
      <div class="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-150">
        <input 
          type="text" 
          [(ngModel)]="searchQuery"
          placeholder="Filter by patient or doctor..."
          class="w-full max-w-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <select [(ngModel)]="filterType" class="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="All">All Types</option>
          <option value="IP">Inpatient Admissions</option>
          <option value="OP">Outpatient Clinics</option>
        </select>
        <span class="text-xs text-slate-550 ml-auto font-bold">{{ filteredBookings().length }} Appointments Found</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div class="lg:col-span-2 overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-55 border-b border-slate-200 text-slate-500 font-semibold">
                <th class="p-3">Patient Name</th>
                <th class="p-3">Appointment Date</th>
                <th class="p-3">Type</th>
                <th class="p-3">Clinic / Ward</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (b of filteredBookings(); track b.id) {
                <tr 
                  (click)="selectedBooking.set(b)"
                  [ngClass]="{
                    'bg-amber-50 border-l-4 border-l-amber-550 animate-pulse font-semibold': b.id === patientService.lastCreatedRecordId(),
                    'bg-blue-50/30': selectedBooking()?.id === b.id
                  }"
                  class="border-b border-slate-150 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td class="p-3 font-bold text-slate-800 uppercase">{{ b.patientName }}</td>
                  <td class="p-3 text-slate-500">{{ b.appointmentDate | date:'dd MMM yyyy HH:mm' }}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold border"
                          [ngClass]="{
                            'bg-indigo-50 text-indigo-700 border-indigo-200': b.type === 0,
                            'bg-teal-50 text-teal-700 border-teal-200': b.type === 1
                          }">
                      {{ b.type === 0 ? 'Inpatient Admission' : 'Outpatient Clinic' }}
                    </span>
                  </td>
                  <td class="p-3 text-slate-650 font-medium">{{ b.clinicNameOrWard }}</td>
                  <td class="p-3 text-right">
                    <button class="text-blue-600 font-bold hover:underline">Select</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Right Side: Details Pane -->
        <div class="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          @if (selectedBooking(); as b) {
            <div class="space-y-3">
              <div class="border-b border-slate-200 pb-2">
                <span class="text-[9px] uppercase font-bold text-blue-500">Active Admission Booking</span>
                <h4 class="font-bold text-slate-900 text-sm mt-0.5">{{ b.patientName }}</h4>
                <span class="text-[10px] text-slate-400 font-mono">ID: {{ b.id.toUpperCase() }}</span>
              </div>

              <div class="space-y-2 text-[11px] text-slate-600 font-medium">
                <div>
                  <span class="text-slate-400 block text-[9px] uppercase font-bold">Consultant</span>
                  <span class="text-slate-850 font-bold">{{ b.clinicianName }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px] uppercase font-bold">Location Suite</span>
                  <span class="text-slate-850 font-bold">{{ b.clinicNameOrWard }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[9px] uppercase font-bold">Encounter Code</span>
                  <span class="text-slate-800 font-mono">ENC-{{ b.id.toUpperCase() }}</span>
                </div>
              </div>
            </div>
          } @else {
            <div class="flex flex-col justify-center items-center h-full text-slate-400 min-h-[150px]">
              <span class="text-2xl">📆</span>
              <p class="mt-2 text-center">Click a booked slot row to review appointment details.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AppointmentSearchViewComponent implements OnInit {
  patientService = inject(PatientService);
  bookings = signal<Booking[]>([]);
  selectedBooking = signal<Booking | null>(null);

  searchQuery = '';
  filterType = 'All';

  ngOnInit() {
    this.load();
  }

  async load() {
    const list = await this.patientService.loadBookings();
    this.bookings.set(list);

    const lastId = this.patientService.lastCreatedRecordId();
    if (lastId) {
      const found = list.find(b => b.id === lastId);
      if (found) {
        this.selectedBooking.set(found);
      }
      setTimeout(() => {
        if (this.patientService.lastCreatedRecordId() === lastId) {
          this.patientService.lastCreatedRecordId.set(null);
        }
      }, 7000);
    } else if (list.length > 0) {
      this.selectedBooking.set(list[0]);
    }
  }

  filteredBookings() {
    let list = this.bookings();

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(b => 
        b.patientName.toLowerCase().includes(q) || 
        b.clinicianName.toLowerCase().includes(q)
      );
    }

    if (this.filterType === 'IP') {
      list = list.filter(b => b.type === 0);
    } else if (this.filterType === 'OP') {
      list = list.filter(b => b.type === 1);
    }

    list.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

    return list;
  }
}

// --- 9. APPOINTMENT BOOKING ---
@Component({
  selector: 'app-appointment-booking-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm max-w-xl animate-fade-in">
      <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900 tracking-tight">Book Consultant Clinic Slot / Ward Admission</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Schedule clinic times and allocate admitting beds.</p>
        </div>
        @if (patient) {
          <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
            Locked Context: {{ patient.lastName }}, {{ patient.firstName }}
          </span>
        }
      </div>

      @if (!patient) {
        <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800">
          ⚠️ <strong>No Patient Context Bound:</strong> Please launch this module from the Dashboard with a selected patient, or set context in Patient Search.
        </div>
      } @else {
        @if (patientService.activeSchedulingRequest(); as req) {
          <div class="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-800 font-semibold">
            🔗 Scheduling linked RTT waitlist entry for specialty clinic.
          </div>
        }

        <form (submit)="book($event)" class="space-y-4 text-xs">
          @if (successMessage()) {
            <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 font-semibold animate-fade-in">
              {{ successMessage() }}
            </div>
          }

          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Patient Name</label>
            <input type="text" disabled [value]="patientName()" class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 mt-1 font-bold text-slate-705" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Appointment Type</label>
              <select [(ngModel)]="booking.type" name="type" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option [ngValue]="1">Outpatient Clinic</option>
                <option [ngValue]="0">Inpatient Admission</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Consultant / Clinician</label>
              <select [(ngModel)]="booking.clinician" name="clinician" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                @for (doc of patientService.allDoctors; track doc.id) {
                  <option [value]="doc.name">{{ doc.name }} ({{ doc.specialty }})</option>
                }
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Appointment Date/Time</label>
              <input type="datetime-local" [(ngModel)]="booking.dateTime" name="dateTime" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Clinic Location or Admitting Ward</label>
              <input type="text" [(ngModel)]="booking.location" name="location" placeholder="e.g. Clinic Suite 3B / Medical Ward" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Clinical Reason for Visit</label>
              <input type="text" [(ngModel)]="booking.reason" name="reason" placeholder="Routine checkup / post-op review" required class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Insurance / Billing category</label>
              <select [(ngModel)]="booking.billingCategory" name="billing" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="NHS Funded">NHS Funded</option>
                <option value="Private Health Ins">Private Health Insurance</option>
                <option value="Self-Funded">Self-Funded Billing</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
            Book Appointment
          </button>
        </form>
      }
    </div>
  `
})
export class AppointmentBookingViewComponent {
  @Input() patient?: Patient;
  patientService = inject(PatientService);
  successMessage = signal<string>('');

  booking = {
    type: 1,
    clinician: 'Dr. Gregory House',
    dateTime: '',
    location: '',
    reason: '',
    billingCategory: 'NHS Funded'
  };

  patientName() {
    return this.patient ? `${this.patient.lastName}, ${this.patient.firstName}` : '';
  }

  async book(event: Event) {
    event.preventDefault();
    if (!this.patient) return;

    await this.patientService.createBooking({
      patientId: this.patient.id,
      patientName: `${this.patient.lastName}, ${this.patient.firstName}`,
      appointmentDate: this.booking.dateTime,
      type: this.booking.type,
      clinicNameOrWard: this.booking.location,
      clinicianName: this.booking.clinician
    });

    this.successMessage.set('Clinic slot booked successfully. Redirecting to Search...');
    
    setTimeout(() => {
      this.successMessage.set('');
      this.patientService.activeNavigationTrigger.set({ type: 'appointment-search', label: 'Appointment Search' });
    }, 1500);
  }
}

// --- 10. WARD MANAGEMENT ---
@Component({
  selector: 'app-ward-management-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-xl font-bold text-slate-900 tracking-tight">Ward Capacity & Bed Occupancy Management</h2>
        <p class="text-xs text-slate-500 mt-1">Manage inpatient admissions, patient ward transfers, bed cleaning cycles, and discharges.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        
        <!-- Left: Ward List Grid -->
        <div class="lg:col-span-1 space-y-4">
          <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 class="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Active Wards</h3>
            
            <div class="space-y-2.5">
              @for (w of patientService.allWards; track w.name) {
                <div 
                  (click)="selectedWard.set(w)"
                  class="p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors flex flex-col gap-1.5"
                  [ngClass]="selectedWard()?.name === w.name ? 'border-blue-300 bg-blue-50/10' : 'border-slate-250'">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-850 text-sm">{{ w.name }}</span>
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          [ngClass]="w.status === 'Fully Operational' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'">
                      {{ w.status }}
                    </span>
                  </div>
                  
                  <span class="text-[10px] text-slate-450 block">{{ w.type }} • Staff Station: {{ w.nurseStation }}</span>
                  
                  <div class="mt-2 space-y-1">
                    <div class="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Beds: {{ w.occupiedBeds }}/{{ w.capacity }} Occupied</span>
                      <span>{{ w.availableBeds }} Available</span>
                    </div>
                    <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div class="bg-blue-600 h-full rounded-full" [style.width.%]="(w.occupiedBeds/w.capacity)*100"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Center/Right: Ward Details & Bed Grid -->
        <div class="lg:col-span-2 space-y-4">
          @if (selectedWard(); as ward) {
            <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div class="border-b border-slate-150 pb-3 flex justify-between items-center">
                <div>
                  <h3 class="text-base font-bold text-slate-900">{{ ward.name }} Bed Board Layout</h3>
                  <span class="text-[10px] text-slate-400 font-semibold block mt-0.5">Charge Station: {{ ward.nurseStation }}</span>
                </div>
                <div class="flex space-x-1.5">
                  <span class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[10px]">Beds Free: {{ ward.availableBeds }}</span>
                </div>
              </div>

              <!-- Beds Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
                @for (bed of ward.beds; track bed.bedNumber) {
                  <div 
                    (click)="selectedBed.set(bed)"
                    [ngClass]="{
                      'border-emerald-300 bg-emerald-50/10': bed.status === 'Available',
                      'border-red-300 bg-red-50/10': bed.status === 'Occupied',
                      'border-amber-300 bg-amber-50/10': bed.status === 'Cleaning',
                      'ring-2 ring-blue-500': selectedBed()?.bedNumber === bed.bedNumber
                    }"
                    class="border rounded-xl p-3 cursor-pointer flex flex-col justify-between h-[100px] hover:shadow-sm transition-all select-none">
                    
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-xs text-slate-800">{{ bed.bedNumber }}</span>
                      <span class="h-2 w-2 rounded-full"
                            [ngClass]="{
                              'bg-emerald-500': bed.status === 'Available',
                              'bg-red-500': bed.status === 'Occupied',
                              'bg-amber-500': bed.status === 'Cleaning'
                            }"></span>
                    </div>

                    <div class="mt-2 text-left">
                      @if (bed.status === 'Occupied') {
                        <p class="font-bold text-slate-900 uppercase text-[10px] leading-tight truncate" [title]="bed.occupiedBy">
                          {{ bed.occupiedBy }}
                        </p>
                        <span class="text-[9px] text-slate-455 block mt-0.5">Admitted: {{ bed.admissionDate | date:'dd/MM' }}</span>
                      } @else {
                        <p class="text-slate-400 italic text-[10px]">{{ bed.status }}</p>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Selected Bed Action Details Panel -->
              @if (selectedBed(); as bed) {
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 space-y-4 animate-fade-in">
                  <div class="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span class="font-bold text-slate-850">Bed Details: {{ bed.bedNumber }}</span>
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                          [ngClass]="{
                            'bg-emerald-100 text-emerald-800': bed.status === 'Available',
                            'bg-red-100 text-red-800': bed.status === 'Occupied',
                            'bg-amber-100 text-amber-800': bed.status === 'Cleaning'
                          }">
                      {{ bed.status }}
                    </span>
                  </div>

                  @if (bed.status === 'Occupied') {
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] text-slate-605 font-medium">
                      <div>
                        <span class="text-slate-450 block">Patient Allocated</span>
                        <strong class="text-slate-900 uppercase">{{ bed.occupiedBy }}</strong>
                      </div>
                      <div>
                        <span class="text-slate-455 block">Admission Date</span>
                        <strong class="text-slate-900">{{ bed.admissionDate | date:'dd MMM yyyy HH:mm' }}</strong>
                      </div>
                      <div>
                        <span class="text-slate-455 block">Expected Discharge</span>
                        <strong class="text-slate-900">{{ bed.expectedDischarge | date:'dd MMM yyyy' }}</strong>
                      </div>
                    </div>

                    <!-- Occupied Bed Actions -->
                    <div class="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      <button 
                        (click)="dischargeBedPatient(ward.name, bed)"
                        class="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded">
                        Discharge Patient
                      </button>
                      
                      <div class="flex items-center space-x-1.5">
                        <select [(ngModel)]="transferTargetWard" class="bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none">
                          <option value="">Select Ward...</option>
                          @for (w of patientService.allWards; track w.name) {
                            <option [value]="w.name">{{ w.name }}</option>
                          }
                        </select>
                        <button 
                          (click)="transferBedPatient(ward.name, bed)"
                          [disabled]="!transferTargetWard"
                          class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded disabled:opacity-50">
                          Transfer
                        </button>
                      </div>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between text-xs">
                      <p class="text-slate-500">This bed is currently vacant. You can change cleaning statuses or admit from the demographic search.</p>
                      
                      <div class="flex space-x-2">
                        @if (bed.status === 'Cleaning') {
                          <button 
                            (click)="makeBedAvailable(ward.name, bed)"
                            class="bg-emerald-650 hover:bg-emerald-755 text-white font-bold px-3 py-1.5 rounded">
                            Mark Available
                          </button>
                        } @else {
                          <button 
                            (click)="markBedCleaning(ward.name, bed)"
                            class="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded">
                            Mark Cleaning
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <span class="text-4xl">🏢</span>
              <h3 class="font-bold text-slate-800 text-sm mt-3">No Ward Selected</h3>
              <p class="text-xs text-slate-400 mt-1">Select a ward from the directory listing to view active beds layout.</p>
            </div>
          }
        </div>

      </div>
    </div>
  `
})
export class WardManagementViewComponent implements OnInit {
  patientService = inject(PatientService);

  selectedWard = signal<Ward | null>(null);
  selectedBed = signal<Bed | null>(null);

  transferTargetWard = '';

  ngOnInit() {
    if (this.patientService.allWards.length > 0) {
      this.selectedWard.set(this.patientService.allWards[0]);
    }
  }

  markBedCleaning(wardName: string, bed: Bed) {
    this.patientService.cleanBed(wardName, bed.bedNumber);
    this.selectedBed.set({ ...bed, status: 'Cleaning' });
  }

  makeBedAvailable(wardName: string, bed: Bed) {
    this.patientService.releaseBed(wardName, bed.bedNumber);
    this.selectedBed.set({ ...bed, status: 'Available' });
  }

  async dischargeBedPatient(wardName: string, bed: Bed) {
    if (!bed.patientId) return;

    await this.patientService.dischargePatient({
      admissionId: 'adm-mock',
      patientId: bed.patientId,
      dischargeSummary: 'Routine hospital discharge completed.',
      clinicalCodingCode: 'Z54.0'
    });

    bed.status = 'Cleaning';
    bed.occupiedBy = undefined;
    bed.patientId = undefined;
    this.selectedBed.set(null);

    const ward = this.patientService.allWards.find(w => w.name === wardName);
    if (ward) {
      this.selectedWard.set({ ...ward });
    }
  }

  async transferBedPatient(wardName: string, bed: Bed) {
    if (!bed.patientId || !this.transferTargetWard) return;

    const targetWard = this.patientService.allWards.find(w => w.name === this.transferTargetWard);
    if (!targetWard) return;

    const targetBed = targetWard.beds.find(b => b.status === 'Available');
    if (!targetBed) {
      alert('No available beds in the selected target ward.');
      return;
    }

    await this.patientService.transferPatient({
      admissionId: 'adm-mock',
      patientId: bed.patientId,
      toWardCode: this.transferTargetWard,
      toBedNumber: targetBed.bedNumber
    });

    this.selectedBed.set(null);
    this.transferTargetWard = '';

    const ward = this.patientService.allWards.find(w => w.name === wardName);
    if (ward) {
      this.selectedWard.set({ ...ward });
    }
  }
}

// --- 11. ALERT CREATE ---
@Component({
  selector: 'app-alert-create-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm max-w-xl animate-fade-in">
      <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900 tracking-tight">Create Clinical Alert / Infection Warning</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Log MRSA flags, high fall risks, or critical allergy restrictions.</p>
        </div>
        @if (patient) {
          <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
            Locked Context: {{ patient.lastName }}, {{ patient.firstName }}
          </span>
        }
      </div>

      @if (!patient) {
        <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800">
          ⚠️ <strong>No Patient Context Bound:</strong> Please launch this module from the Dashboard with a selected patient, or set context in Patient Search.
        </div>
      } @else {
        <form (submit)="createAlert($event)" class="space-y-4 text-xs">
          @if (successMessage()) {
            <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 font-semibold animate-fade-in">
              {{ successMessage() }}
            </div>
          }

          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Patient Name</label>
            <input type="text" disabled [value]="patientName()" class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 mt-1 font-bold text-slate-700" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Alert Category</label>
              <select [(ngModel)]="alert.type" name="type" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="MRSA Screen Positive (Precautionary Isolation)">MRSA Screen Positive</option>
                <option value="Fall Risk - High Assist">Fall Risk - High Assist</option>
                <option value="COVID-19 Contact - Watch List">COVID-19 Contact</option>
                <option value="Penicillin Allergy">Penicillin Allergy</option>
                <option value="C. Difficile Positive Isolation">C. Difficile Isolation</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Severity Warning Level</label>
              <select [(ngModel)]="alert.severity" name="severity" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="Mild Warning">Mild Precaution</option>
                <option value="Moderate Warning">Moderate Risk</option>
                <option value="Severe Critical">Severe Critical Allergy</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Additional Diagnostic Notes</label>
            <textarea [(ngModel)]="alert.description" name="description" rows="3" required placeholder="Log patient reaction severity or isolation directives..." class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
          </div>

          <button 
            type="submit"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
            Create Alert
          </button>
        </form>
      }
    </div>
  `
})
export class AlertCreateViewComponent {
  @Input() patient?: Patient;
  patientService = inject(PatientService);
  successMessage = signal<string>('');

  alert = {
    type: 'MRSA Screen Positive (Precautionary Isolation)',
    severity: 'Moderate Warning',
    description: ''
  };

  patientName() {
    return this.patient ? `${this.patient.lastName}, ${this.patient.firstName}` : '';
  }

  async createAlert(event: Event) {
    event.preventDefault();
    if (!this.patient) return;

    this.patient.infectionControlAlerts = this.alert.type;
    this.patientService.activePatient.set({ ...this.patient });

    const list = this.patientService.patients().map(p => {
      if (p.id === this.patient?.id) {
        return { ...p, infectionControlAlerts: this.alert.type };
      }
      return p;
    });
    this.patientService.loadBedBoard();

    this.successMessage.set('Clinical alert logged. Redirecting to Search context...');
    
    setTimeout(() => {
      this.successMessage.set('');
      this.patientService.activeNavigationTrigger.set({ type: 'patient-search', label: 'Patient Search' });
    }, 1500);
  }
}

// --- 11. DOCUMENTS SEARCH ---
@Component({
  selector: 'app-documents-search-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fade-in">
      <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900 tracking-tight">Clinical Case Documents Index</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Access GP referral letters, case notes, and discharge notes.</p>
        </div>
        @if (patient) {
          <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
            Locked Context: {{ patient.lastName }}, {{ patient.firstName }}
          </span>
        }
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <!-- Left panel lists files -->
        <div class="lg:col-span-1 space-y-3">
          <label class="block font-semibold text-slate-450 uppercase text-[10px]">Select Patient</label>
          <select [(ngModel)]="selectedPatientId" (change)="onPatientChange()" [disabled]="!!patient" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            @for (p of patientService.patients(); track p.id) {
              <option [value]="p.id">{{ p.lastName }}, {{ p.firstName }}</option>
            }
          </select>

          <hr class="border-slate-150" />

          <div class="space-y-2">
            <h4 class="font-semibold text-slate-400 uppercase text-[9px]">Document Index</h4>
            @for (doc of documents(); track doc.id) {
              <div 
                (click)="activeDoc.set(doc)"
                class="p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors flex flex-col gap-1"
                [ngClass]="activeDoc()?.id === doc.id ? 'border-blue-300 bg-blue-50/10' : 'border-slate-200'">
                <span class="font-bold text-slate-800 leading-tight">{{ doc.title }}</span>
                <span class="text-[10px] text-slate-400">{{ doc.documentType }} • {{ doc.author }}</span>
              </div>
            } @empty {
              <p class="text-slate-455 italic py-2">No documents found for this patient.</p>
            }
          </div>
        </div>

        <!-- Right panel displays content -->
        <div class="lg:col-span-2 bg-slate-50/50 border border-slate-200 rounded-xl p-5 h-full min-h-[300px]">
          @if (activeDoc(); as doc) {
            <div class="space-y-4">
              <div class="border-b border-slate-200 pb-2 flex justify-between items-center">
                <div>
                  <span class="text-[9px] uppercase font-bold text-blue-500">{{ doc.documentType }}</span>
                  <h4 class="text-sm font-bold text-slate-900 leading-snug mt-0.5">{{ doc.title }}</h4>
                  <p class="text-[10px] text-slate-400 mt-1">Authored by {{ doc.author }} on {{ doc.createdAt | date:'dd MMM yyyy HH:mm' }}</p>
                </div>
                <button class="border border-slate-300 hover:bg-white text-slate-600 px-2 py-1 rounded font-bold text-[10px]">Print/Export</button>
              </div>
              <div class="text-slate-700 leading-relaxed font-mono whitespace-pre-wrap text-[11px] bg-white p-4 border border-slate-150 rounded-lg">
                {{ doc.content }}
              </div>
            </div>
          } @else {
            <div class="flex flex-col justify-center items-center h-full text-slate-400 min-h-[250px]">
              <span class="text-3xl">📄</span>
              <p class="mt-2">Select a document from the file directory to view details.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class DocumentsSearchViewComponent implements OnInit {
  @Input() patient?: Patient;
  patientService = inject(PatientService);
  selectedPatientId = '';
  documents = signal<ClinicalDocument[]>([]);
  activeDoc = signal<ClinicalDocument | null>(null);

  ngOnInit() {
    if (this.patient) {
      this.selectedPatientId = this.patient.id;
    } else if (this.patientService.patients().length > 0) {
      this.selectedPatientId = this.patientService.patients()[0].id;
    }
    this.onPatientChange();
  }

  async onPatientChange() {
    if (!this.selectedPatientId) return;
    const list = await this.patientService.loadPatientDocuments(this.selectedPatientId);
    this.documents.set(list);
    this.activeDoc.set(list.length > 0 ? list[0] : null);
  }
}

// --- 11. CLINICAL NOTES VIEW (PATIENT SPECIFIC) ---
@Component({
  selector: 'app-clinical-notes-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm max-w-2xl animate-fade-in">
      <div class="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-bold text-slate-900 tracking-tight">Clinical Case Notes & Progress Logs</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Author diagnostic profiles and ward consultant notes.</p>
        </div>
        @if (patient) {
          <span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
            Locked Context: {{ patient.lastName }}, {{ patient.firstName }}
          </span>
        }
      </div>

      @if (!patient) {
        <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800">
          ⚠️ <strong>No Patient Context Bound:</strong> Please launch this module from the Dashboard with a selected patient, or set context in Patient Search.
        </div>
      } @else {
        <form (submit)="saveNote($event)" class="space-y-4 text-xs">
          @if (successMessage()) {
            <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 font-semibold animate-fade-in">
              {{ successMessage() }}
            </div>
          }

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Document Title</label>
              <input type="text" [(ngModel)]="note.title" name="title" required placeholder="e.g. Day 3 Post-Op Ward Visit" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Note Category</label>
              <select [(ngModel)]="note.type" name="type" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="ClinicalNote">Consultant Progress Note (SOAP)</option>
                <option value="DischargeSummary">Discharge Summary Letter</option>
                <option value="ConsentForm">Consent Form Note</option>
                <option value="LabReport">Laboratory Diagnostics Summary</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Consultation Type</label>
              <select [(ngModel)]="note.consultationType" name="consultType" class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="Ward Round">Daily Ward Round Visit</option>
                <option value="Initial Intake">Initial Ward Intake Note</option>
                <option value="Specialist Consult">Consultant Specialist Review</option>
                <option value="Discharge Review">Discharge Readiness Review</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-500 uppercase text-[10px]">Authoring Practitioner</label>
              <input type="text" disabled value="Dr. Gregory House, MD" class="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 mt-1 font-bold text-slate-700" />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-500 uppercase text-[10px]">Clinical Progress notes (SOAP Structure)</label>
            <textarea [(ngModel)]="note.content" name="content" required rows="6" placeholder="SUBJECTIVE: Patient reporting...\nOBJECTIVE: Temp 37 C...\nASSESSMENT: Patient recovering...\nPLAN: Complete lab tests..." class="w-full bg-slate-55 border border-slate-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-[11px] leading-relaxed"></textarea>
          </div>

          <button 
            type="submit"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm">
            Save Case Note
          </button>
        </form>
      }
    </div>
  `
})
export class ClinicalNotesViewComponent {
  @Input() patient?: Patient;
  patientService = inject(PatientService);
  successMessage = signal<string>('');

  note = {
    title: '',
    type: 'ClinicalNote',
    consultationType: 'Ward Round',
    content: ''
  };

  async saveNote(event: Event) {
    event.preventDefault();
    if (!this.patient) return;

    await this.patientService.saveClinicalDocument({
      patientId: this.patient.id,
      title: `[${this.note.consultationType}] ${this.note.title}`,
      documentType: this.note.type,
      content: this.note.content,
      author: 'Dr. Gregory House'
    });

    this.successMessage.set('Clinical case note successfully saved. Redirecting to Case Documents dossier...');
    this.note.title = '';
    this.note.content = '';
    
    setTimeout(() => {
      this.successMessage.set('');
      this.patientService.activeNavigationTrigger.set({ type: 'documents-search', label: 'Documents Search' });
    }, 1500);
  }
}

// --- 12. REPORTS & STATISTICS DASHBOARD ---
@Component({
  selector: 'app-reports-statistics-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 class="text-xl font-bold text-slate-900 tracking-tight">Clinical & Operational Executive Reports</h2>
        <p class="text-xs text-slate-500 mt-1">Review live hospital KPI statistics, ward occupancy percentages, and patient pathways.</p>
      </div>

      <!-- KPI Widgets Row 1 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span class="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Today's OP Clinics</span>
          <p class="text-2xl font-bold text-slate-800 mt-1">45 Visits</p>
          <span class="text-emerald-650 text-[10px] font-bold mt-2">↑ 8% vs yesterday</span>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span class="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Today's Admissions</span>
          <p class="text-2xl font-bold text-slate-800 mt-1">14 Patients</p>
          <span class="text-slate-400 text-[10px] mt-2">On track with average</span>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span class="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Today's Discharges</span>
          <p class="text-2xl font-bold text-slate-800 mt-1">11 Discharges</p>
          <span class="text-emerald-650 text-[10px] font-bold mt-2">Target met</span>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span class="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Average RTT waiting Time</span>
          <p class="text-2xl font-bold text-slate-800 mt-1">9.2 Weeks</p>
          <span class="text-emerald-650 text-[10px] font-bold mt-2">↓ 0.5 weeks this month</span>
        </div>
      </div>

      <!-- KPI Widgets Row 2 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span class="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Active GP Referrals</span>
          <p class="text-2xl font-bold text-slate-800 mt-1">55 Pathways</p>
          <span class="text-amber-600 text-[10px] font-bold mt-2">5 awaiting triage</span>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span class="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Inpatients Admitted</span>
          <p class="text-2xl font-bold text-slate-800 mt-1">{{ patientService.totalInpatients() }} Beds</p>
          <span class="text-slate-400 text-[10px] mt-2">Capacity: 73 total beds</span>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span class="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Critical Alerts Active</span>
          <p class="text-2xl font-bold text-red-650 mt-1">{{ patientService.infectionAlertCount() }} Alerts</p>
          <span class="text-red-500 text-[10px] font-bold mt-2">Isolation precautionary measures active</span>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <span class="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Outpatient Clinic Bookings</span>
          <p class="text-2xl font-bold text-slate-800 mt-1">128 Booked</p>
          <span class="text-emerald-650 text-[10px] font-bold mt-2">4 no-shows today</span>
        </div>
      </div>

      <!-- Trend Charts and occupancy layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        
        <!-- OP Trend Chart -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 class="font-bold text-slate-850 text-sm">Admissions & OP Visits Trend (Weekly)</h3>
          
          <div class="flex items-end justify-between h-[150px] pt-4 border-b border-slate-200 relative">
            <div class="flex flex-col items-center w-12 group">
              <div class="bg-blue-600 w-6 rounded-t transition-all group-hover:bg-blue-750" style="height: 60px"></div>
              <span class="text-[9px] text-slate-400 mt-1.5 font-bold">Mon</span>
            </div>
            <div class="flex flex-col items-center w-12 group">
              <div class="bg-blue-600 w-6 rounded-t transition-all group-hover:bg-blue-750" style="height: 95px"></div>
              <span class="text-[9px] text-slate-400 mt-1.5 font-bold">Tue</span>
            </div>
            <div class="flex flex-col items-center w-12 group">
              <div class="bg-blue-600 w-6 rounded-t transition-all group-hover:bg-blue-750" style="height: 80px"></div>
              <span class="text-[9px] text-slate-400 mt-1.5 font-bold">Wed</span>
            </div>
            <div class="flex flex-col items-center w-12 group">
              <div class="bg-blue-600 w-6 rounded-t transition-all group-hover:bg-blue-750" style="height: 120px"></div>
              <span class="text-[9px] text-slate-400 mt-1.5 font-bold">Thu</span>
            </div>
            <div class="flex flex-col items-center w-12 group">
              <div class="bg-blue-600 w-6 rounded-t transition-all group-hover:bg-blue-750" style="height: 110px"></div>
              <span class="text-[9px] text-slate-400 mt-1.5 font-bold">Fri</span>
            </div>
            <div class="flex flex-col items-center w-12 group">
              <div class="bg-blue-600 w-6 rounded-t transition-all group-hover:bg-blue-750" style="height: 35px"></div>
              <span class="text-[9px] text-slate-400 mt-1.5 font-bold">Sat</span>
            </div>
            <div class="flex flex-col items-center w-12 group">
              <div class="bg-blue-600 w-6 rounded-t transition-all group-hover:bg-blue-750" style="height: 20px"></div>
              <span class="text-[9px] text-slate-400 mt-1.5 font-bold">Sun</span>
            </div>
          </div>
        </div>

        <!-- Ward Bed Occupancy Breakdown -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 class="font-bold text-slate-850 text-sm">Ward Bed Occupancy Breakdown</h3>
          
          <div class="space-y-3">
            @for (ward of patientService.allWards; track ward.name) {
              <div>
                <div class="flex justify-between text-[11px] font-bold text-slate-650 mb-1">
                  <span>{{ ward.name }}</span>
                  <span>{{ ward.occupiedBeds }} / {{ ward.capacity }} Beds ({{ getPercent(ward.occupiedBeds, ward.capacity) }}%)</span>
                </div>
                <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    [ngClass]="(ward.occupiedBeds/ward.capacity) > 0.8 ? 'bg-red-500' : 'bg-blue-600'"
                    class="h-full rounded-full" 
                    [style.width.%]="(ward.occupiedBeds/ward.capacity)*100">
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `
})
export class ReportsStatisticsViewComponent {
  patientService = inject(PatientService);

  getPercent(occupied: number, capacity: number): number {
    return Math.round((occupied / capacity) * 100);
  }
}
