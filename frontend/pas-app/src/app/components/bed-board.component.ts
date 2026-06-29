import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PatientService, Patient, RegisterRequest, AdmitRequest, TransferRequest, DischargeRequest } from '../services/patient.service';

@Component({
  selector: 'app-bed-board',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Title & Action Section -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Visual Bed Board</h2>
          <p class="text-sm text-gray-500">Real-time status of all ward occupancy and patient flows.</p>
        </div>
        <div class="flex space-x-3">
          <button 
            (click)="openRegisterModal()"
            class="bg-nhs-blue hover:bg-nhs-darkBlue text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 flex items-center space-x-2">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Register & Admit Patient</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Card 1: Total Admitted -->
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Inpatients</p>
            <h3 class="text-3xl font-bold text-gray-950 mt-1">{{ patientService.totalInpatients() }}</h3>
          </div>
          <div class="h-12 w-12 rounded-lg bg-blue-50 text-nhs-blue flex items-center justify-center">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        <!-- Card 2: Active Wards -->
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Wards</p>
            <h3 class="text-3xl font-bold text-gray-950 mt-1">3</h3>
          </div>
          <div class="h-12 w-12 rounded-lg bg-emerald-50 text-nhs-green flex items-center justify-center">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        </div>

        <!-- Card 3: Infection Alerts -->
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-200 alert-glow-red">
          <div>
            <p class="text-xs font-semibold text-nhs-emergencyRed uppercase tracking-wider">Infection Warnings</p>
            <h3 class="text-3xl font-bold text-nhs-emergencyRed mt-1">{{ patientService.infectionAlertCount() }}</h3>
          </div>
          <div class="h-12 w-12 rounded-lg bg-red-50 text-nhs-emergencyRed flex items-center justify-center">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <!-- Card 4: Occupancy Rate -->
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow duration-200">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Occupancy Rate</p>
            <h3 class="text-3xl font-bold text-gray-950 mt-1">62.5%</h3>
          </div>
          <div class="h-12 w-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Filters Panel -->
      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="w-full md:w-96 relative">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            placeholder="Search patient name or identifier (NHS/CHI/IHI)..."
            class="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nhs-blue focus:border-nhs-blue transition-all"
          />
          <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div class="flex items-center space-x-6 w-full md:w-auto justify-end">
          <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              [(ngModel)]="filterInfectionAlerts"
              class="h-4 w-4 text-nhs-blue border-gray-300 rounded focus:ring-nhs-blue"
            />
            <span>Infection Warnings Only</span>
          </label>
          <button 
            (click)="patientService.loadBedBoard()"
            class="text-xs text-nhs-blue hover:text-nhs-darkBlue font-semibold flex items-center space-x-1">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
            </svg>
            <span>Refresh Board</span>
          </button>
        </div>
      </div>

      <!-- Wards Grid -->
      <div class="space-y-8">
        @for (ward of wards; track ward) {
          @if (getPatientsInWard(ward).length > 0) {
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <!-- Ward Header -->
              <div class="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div class="flex items-center space-x-3">
                  <span class="h-3 w-3 rounded-full bg-nhs-blue"></span>
                  <h3 class="font-bold text-gray-950 text-base">{{ ward }}</h3>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 bg-gray-200/60 text-gray-700 rounded-full">
                  {{ getPatientsInWard(ward).length }} Patient(s)
                </span>
              </div>

              <!-- Ward Beds -->
              <div class="p-6">
                <div class="bed-board-grid">
                  @for (patient of getPatientsInWard(ward); track patient.id) {
                    <!-- Patient Bed Card -->
                    <div 
                      (click)="selectPatient(patient)"
                      class="border rounded-xl p-4 flex flex-col justify-between h-40 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-200 bg-white"
                      [class.border-red-300]="patient.infectionControlAlerts && patient.infectionControlAlerts !== 'None'"
                      [class.bg-red-50]="patient.infectionControlAlerts && patient.infectionControlAlerts !== 'None'"
                      [class.border-gray-200]="!patient.infectionControlAlerts || patient.infectionControlAlerts === 'None'">
                      
                      <div class="space-y-1">
                        <div class="flex justify-between items-start">
                          <span class="text-[10px] font-bold text-gray-400 uppercase">{{ patient.currentBed }}</span>
                          @if (patient.infectionControlAlerts && patient.infectionControlAlerts !== 'None') {
                            <span class="h-2 w-2 rounded-full bg-nhs-emergencyRed animate-ping"></span>
                          }
                        </div>
                        <h4 class="font-bold text-gray-950 text-sm leading-tight mt-1 truncate">
                          {{ patient.lastName }}, {{ patient.firstName }}
                        </h4>
                        <p class="text-[11px] text-gray-500">
                          DOB: {{ patient.dateOfBirth }}
                        </p>
                      </div>

                      <div class="mt-4 pt-3 border-t border-gray-100 flex flex-col space-y-1">
                        @if (patient.nhsNumber) {
                          <span class="text-[10px] font-mono text-gray-500">NHS: {{ patient.nhsNumber }}</span>
                        } @else if (patient.chiNumber) {
                          <span class="text-[10px] font-mono text-gray-500">CHI: {{ patient.chiNumber }}</span>
                        } @else if (patient.ihiNumber) {
                          <span class="text-[10px] font-mono text-gray-500">IHI: {{ patient.ihiNumber }}</span>
                        }
                        
                        @if (patient.infectionControlAlerts && patient.infectionControlAlerts !== 'None') {
                          <span class="text-[9px] font-semibold text-nhs-emergencyRed truncate">
                            ⚠️ {{ patient.infectionControlAlerts }}
                          </span>
                        } @else {
                          <span class="text-[9px] font-medium text-emerald-600 truncate">
                            ✓ No Alert
                          </span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        }
      </div>

      <!-- Patient Detail Slide-Over (Clinical Audit Timeline) -->
      @if (selectedPatient(); as patient) {
        <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div class="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-in">
            <!-- Detail Header -->
            <div class="bg-gradient-to-r from-nhs-darkBlue to-nhs-blue text-white px-6 py-5 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold tracking-widest uppercase text-blue-200">Patient File & Timeline</span>
                <h3 class="text-xl font-bold mt-1">{{ patient.lastName }}, {{ patient.firstName }}</h3>
              </div>
              <button (click)="closeDetail()" class="text-white hover:text-blue-200 transition-colors">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Detail Content -->
            <div class="flex-grow overflow-y-auto p-6 space-y-6">
              <!-- Clinical Meta Card -->
              <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Demographic Details</h4>
                <div class="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div>
                    <span class="text-xs text-gray-500 block">Date of Birth</span>
                    <span class="font-medium text-gray-900">{{ patient.dateOfBirth }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-gray-500 block">Current Location</span>
                    <span class="font-medium text-gray-900">{{ patient.currentWard }} • {{ patient.currentBed }}</span>
                  </div>
                  @if (patient.nhsNumber) {
                    <div>
                      <span class="text-xs text-gray-500 block">NHS Number (ENG/WAL)</span>
                      <span class="font-mono font-medium text-gray-900">{{ patient.nhsNumber }}</span>
                    </div>
                  }
                  @if (patient.chiNumber) {
                    <div>
                      <span class="text-xs text-gray-500 block">CHI Number (SCO)</span>
                      <span class="font-mono font-medium text-gray-900">{{ patient.chiNumber }}</span>
                    </div>
                  }
                  @if (patient.ihiNumber) {
                    <div>
                      <span class="text-xs text-gray-500 block">Irish IHI (IRL)</span>
                      <span class="font-mono font-medium text-gray-900">{{ patient.ihiNumber }}</span>
                    </div>
                  }
                  <div>
                    <span class="text-xs text-gray-500 block">Admitted At</span>
                    <span class="font-medium text-gray-900">{{ formatDate(patient.admittedAt) }}</span>
                  </div>
                </div>

                @if (patient.infectionControlAlerts && patient.infectionControlAlerts !== 'None') {
                  <div class="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center space-x-2 text-nhs-emergencyRed mt-2">
                    <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span class="text-xs font-semibold">Infection Warning: {{ patient.infectionControlAlerts }}</span>
                  </div>
                }
              </div>

              <!-- Quick Clinical Actions -->
              <div class="border border-gray-200 rounded-xl p-4 space-y-3">
                <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Patient Transfer / Discharge Flow</h4>
                <div class="grid grid-cols-2 gap-3">
                  <button 
                    (click)="openTransferModal(patient)"
                    class="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Ward Transfer</span>
                  </button>
                  <button 
                    (click)="openDischargeModal(patient)"
                    class="bg-nhs-emergencyRed hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Clinical Discharge</span>
                  </button>
                </div>
              </div>

              <!-- Chronological Audit Timeline -->
              <div class="space-y-4">
                <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Marten Event Store History (Traceable Audit Trail)</h4>
                
                <div class="relative pl-6 border-l-2 border-blue-100 space-y-6">
                  <!-- Timeline Node 3 (Discharge / Transfer) -->
                  @if (patient.isAdmitted) {
                    <div class="relative">
                      <span class="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-blue-500 border-4 border-white"></span>
                      <p class="text-xs font-semibold text-gray-900">Patient Admitted</p>
                      <p class="text-[11px] text-gray-500">Event: PatientAdmittedEvent • Aggregated Live</p>
                      <span class="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full inline-block mt-1 font-medium">
                        Ward: {{ patient.currentWard }} • Bed: {{ patient.currentBed }}
                      </span>
                    </div>
                  }

                  <!-- Timeline Node 2: Registration -->
                  <div class="relative">
                    <span class="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-emerald-500 border-4 border-white"></span>
                    <p class="text-xs font-semibold text-gray-900">Patient Registered</p>
                    <p class="text-[11px] text-gray-500">Event: PatientRegisteredEvent • Version 1</p>
                    <p class="text-xs text-gray-600 mt-1">Single Source of Truth record established. GP Link configured.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Detail Footer -->
            <div class="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
              <button (click)="closeDetail()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal: Register & Admit -->
      @if (showRegisterModal()) {
        <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-zoom-in">
            <div class="bg-gradient-to-r from-nhs-darkBlue to-nhs-blue text-white px-6 py-4 flex items-center justify-between">
              <h3 class="text-lg font-bold">Register & Admit Patient</h3>
              <button (click)="closeRegisterModal()" class="text-white hover:text-blue-200">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form (submit)="submitRegistration($event)" class="p-6 space-y-6">
              <!-- Grid sections -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase">First Name</label>
                  <input type="text" [(ngModel)]="newPatient.firstName" name="firstName" required class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase">Last Name</label>
                  <input type="text" [(ngModel)]="newPatient.lastName" name="lastName" required class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase">Date of Birth</label>
                  <input type="date" [(ngModel)]="newPatient.dateOfBirth" name="dateOfBirth" required class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase">Country Registry</label>
                  <select [(ngModel)]="countryRegistry" name="countryRegistry" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue">
                    <option value="ENG">England & Wales (NHS Number)</option>
                    <option value="SCO">Scotland (CHI Number)</option>
                    <option value="IRL">Ireland (IHI Number)</option>
                  </select>
                </div>
              </div>

              <!-- Identifier fields -->
              <div>
                @if (countryRegistry === 'ENG') {
                  <label class="block text-xs font-semibold text-gray-500 uppercase">NHS Number (England/Wales)</label>
                  <input type="text" [(ngModel)]="newPatient.nhsNumber" name="nhsNumber" placeholder="e.g. 485 777 3456" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue" />
                  <span class="text-[10px] text-gray-400 mt-1 block">Validated using the Modulus 11 algorithm.</span>
                }
                @if (countryRegistry === 'SCO') {
                  <label class="block text-xs font-semibold text-gray-500 uppercase">CHI Number (Scotland)</label>
                  <input type="text" [(ngModel)]="newPatient.chiNumber" name="chiNumber" placeholder="e.g. 031155 1234" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue" />
                }
                @if (countryRegistry === 'IRL') {
                  <label class="block text-xs font-semibold text-gray-500 uppercase">Individual Health Identifier (IHI)</label>
                  <input type="text" [(ngModel)]="newPatient.ihiNumber" name="ihiNumber" placeholder="e.g. 800 120 4567" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue" />
                }
              </div>

              <hr class="border-gray-200" />

              <h4 class="font-bold text-gray-900 text-sm">Admission Destination</h4>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase">Ward Selection</label>
                  <select [(ngModel)]="admissionData.wardCode" name="wardCode" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue">
                    @for (w of wards; track w) {
                      <option [value]="w">{{ w }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase">Bed Code</label>
                  <input type="text" [(ngModel)]="admissionData.bedNumber" name="bedNumber" placeholder="e.g. Bed B3" required class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase">Admitting Consultant</label>
                  <input type="text" [(ngModel)]="admissionData.admittingConsultant" name="admittingConsultant" placeholder="e.g. Dr. Emily Briggs" required class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase">Infection / Clinical Alerts</label>
                  <select [(ngModel)]="admissionData.infectionControlAlerts" name="infectionControlAlerts" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue">
                    <option value="None">None</option>
                    <option value="MRSA Screen Positive">MRSA Screen Positive</option>
                    <option value="COVID-19 Positive">COVID-19 Positive</option>
                    <option value="Fall Risk - High Assist">Fall Risk - High Assist</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-end space-x-3 pt-4 border-t border-gray-150">
                <button type="button" (click)="closeRegisterModal()" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" class="bg-nhs-blue hover:bg-nhs-darkBlue text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                  Admit Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal: Transfer -->
      @if (showTransferModal()) {
        <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-zoom-in">
            <div class="bg-gradient-to-r from-nhs-darkBlue to-nhs-blue text-white px-6 py-4 flex items-center justify-between">
              <h3 class="text-lg font-bold">Transfer Patient</h3>
              <button (click)="closeTransferModal()" class="text-white hover:text-blue-200">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form (submit)="submitTransfer($event)" class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Destination Ward</label>
                <select [(ngModel)]="transferData.toWardCode" name="toWard" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue">
                  @for (w of wards; track w) {
                    <option [value]="w">{{ w }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Destination Bed</label>
                <input type="text" [(ngModel)]="transferData.toBedNumber" name="toBed" required class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue" />
              </div>

              <div class="flex justify-end space-x-3 pt-4 border-t border-gray-150">
                <button type="button" (click)="closeTransferModal()" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" class="bg-nhs-blue hover:bg-nhs-darkBlue text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                  Complete Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal: Discharge -->
      @if (showDischargeModal()) {
        <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-zoom-in">
            <div class="bg-gradient-to-r from-nhs-darkBlue to-nhs-blue text-white px-6 py-4 flex items-center justify-between">
              <h3 class="text-lg font-bold">Discharge Patient</h3>
              <button (click)="closeDischargeModal()" class="text-white hover:text-blue-200">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form (submit)="submitDischarge($event)" class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Clinical Coding (ICD-11 / SNOMED CT)</label>
                <input type="text" [(ngModel)]="dischargeData.clinicalCodingCode" name="coding" placeholder="e.g. SNOMED: 386661006" required class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase">Discharge Summary</label>
                <textarea [(ngModel)]="dischargeData.dischargeSummary" name="summary" rows="3" required placeholder="Outline follow-up and GP notifications..." class="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-nhs-blue"></textarea>
              </div>

              <div class="flex justify-end space-x-3 pt-4 border-t border-gray-150">
                <button type="button" (click)="closeDischargeModal()" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" class="bg-nhs-emergencyRed hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                  Discharge
                </button>
              </div>
            </form>
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
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-zoom-in {
      animation: zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class BedBoardComponent {
  patientService = inject(PatientService);

  // Wards to display
  wards = [
    'Emergency Department (ED)',
    'Acute Medical Unit (AMU)',
    'Coronary Care Unit (CCU)',
    'Geriatic Assessment Ward'
  ];

  // Search and Filter states (represented as ordinary TS fields because Zoneless picks up changes bound in templates)
  searchQuery = '';
  filterInfectionAlerts = false;

  // Selected patient for side-drawer
  selectedPatient = signal<Patient | null>(null);

  // Modals visibility
  showRegisterModal = signal<boolean>(false);
  showTransferModal = signal<boolean>(false);
  showDischargeModal = signal<boolean>(false);

  // Form binding objects
  countryRegistry = 'ENG';
  newPatient: Partial<RegisterRequest> = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nhsNumber: '',
    chiNumber: '',
    ihiNumber: '',
    gpCode: 'G83047',
    addressLine1: '42 High Street',
    postcode: 'SW1A 1AA'
  };

  admissionData: Partial<AdmitRequest> = {
    wardCode: 'Acute Medical Unit (AMU)',
    bedNumber: '',
    admittingConsultant: '',
    infectionControlAlerts: 'None'
  };

  transferData: Partial<TransferRequest> = {
    toWardCode: 'Acute Medical Unit (AMU)',
    toBedNumber: ''
  };

  dischargeData: Partial<DischargeRequest> = {
    dischargeSummary: '',
    clinicalCodingCode: ''
  };

  // Retrieve patients matching filters in a specific ward
  getPatientsInWard(ward: string): Patient[] {
    return this.patientService.patients().filter(p => {
      if (p.currentWard !== ward) return false;
      
      // Filter by infection warnings
      if (this.filterInfectionAlerts && (!p.infectionControlAlerts || p.infectionControlAlerts === 'None')) {
        return false;
      }

      // Filter by search query
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        const matchesName = p.firstName.toLowerCase().includes(query) || p.lastName.toLowerCase().includes(query);
        const matchesIds = (p.nhsNumber && p.nhsNumber.replace(/\s+/g, '').includes(query)) || 
                           (p.chiNumber && p.chiNumber.toLowerCase().includes(query)) ||
                           (p.ihiNumber && p.ihiNumber.toLowerCase().includes(query));
        return matchesName || matchesIds;
      }

      return true;
    });
  }

  // Formatting helpers
  formatDate(isoString?: string): string {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Selection actions
  selectPatient(patient: Patient) {
    this.selectedPatient.set(patient);
  }

  closeDetail() {
    this.selectedPatient.set(null);
  }

  // Registration modal actions
  openRegisterModal() {
    this.showRegisterModal.set(true);
  }

  closeRegisterModal() {
    this.showRegisterModal.set(false);
  }

  async submitRegistration(event: Event) {
    event.preventDefault();
    if (!this.newPatient.firstName || !this.newPatient.lastName || !this.newPatient.dateOfBirth) return;

    try {
      // 1. Register Patient
      const patientId = await this.patientService.registerPatient(this.newPatient as RegisterRequest);

      // 2. Admit immediately
      const admitReq: AdmitRequest = {
        patientId,
        wardCode: this.admissionData.wardCode || 'Acute Medical Unit (AMU)',
        bedNumber: this.admissionData.bedNumber || 'Bed X',
        admittingConsultant: this.admissionData.admittingConsultant || 'Dr. Self',
        infectionControlAlerts: this.admissionData.infectionControlAlerts || 'None'
      };
      await this.patientService.admitPatient(admitReq);

      // Reset & Close
      this.newPatient = {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nhsNumber: '',
        chiNumber: '',
        ihiNumber: '',
        gpCode: 'G83047',
        addressLine1: '42 High Street',
        postcode: 'SW1A 1AA'
      };
      this.closeRegisterModal();
    } catch (err: any) {
      alert('Error registering patient');
    }
  }

  // Transfer modal actions
  openTransferModal(patient: Patient) {
    this.transferData = {
      patientId: patient.id,
      admissionId: this.generateGuid(), // simulated admission ID
      toWardCode: patient.currentWard,
      toBedNumber: patient.currentBed
    };
    this.showTransferModal.set(true);
  }

  closeTransferModal() {
    this.showTransferModal.set(false);
  }

  async submitTransfer(event: Event) {
    event.preventDefault();
    if (!this.transferData.toWardCode || !this.transferData.toBedNumber) return;

    try {
      await this.patientService.transferPatient(this.transferData as TransferRequest);
      this.closeTransferModal();
      this.closeDetail(); // Close detail stream
    } catch (err) {
      alert('Error transferring patient');
    }
  }

  // Discharge modal actions
  openDischargeModal(patient: Patient) {
    this.dischargeData = {
      patientId: patient.id,
      admissionId: this.generateGuid(),
      dischargeSummary: '',
      clinicalCodingCode: 'SNOMED: 386661006' // standard clinical coding for fever/respiratory evaluation
    };
    this.showDischargeModal.set(true);
  }

  closeDischargeModal() {
    this.showDischargeModal.set(false);
  }

  async submitDischarge(event: Event) {
    event.preventDefault();
    if (!this.dischargeData.dischargeSummary || !this.dischargeData.clinicalCodingCode) return;

    try {
      await this.patientService.dischargePatient(this.dischargeData as DischargeRequest);
      this.closeDischargeModal();
      this.closeDetail();
    } catch (err) {
      alert('Error discharging patient');
    }
  }

  private generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
