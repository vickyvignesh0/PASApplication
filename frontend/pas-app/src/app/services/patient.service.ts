import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nhsNumber?: string;
  chiNumber?: string;
  ihiNumber?: string;
  currentWard: string;
  currentBed: string;
  isAdmitted: boolean;
  admittedAt?: string;
  infectionControlAlerts?: string;
  gender: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nhsNumber?: string;
  chiNumber?: string;
  ihiNumber?: string;
  gpCode: string;
  addressLine1: string;
  postcode: string;
}

export interface AdmitRequest {
  patientId: string;
  wardCode: string;
  bedNumber: string;
  admittingConsultant: string;
  infectionControlAlerts: string;
}

export interface TransferRequest {
  admissionId: string;
  patientId: string;
  toWardCode: string;
  toBedNumber: string;
}

export interface DischargeRequest {
  admissionId: string;
  patientId: string;
  dischargeSummary: string;
  clinicalCodingCode: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  status: string; // Active, On Leave, Clinic
}

export interface Ward {
  name: string;
  type: string;
  capacity: number;
  occupiedBeds: number;
  availableBeds: number;
  nurseStation: string;
  status: string; // Fully Operational, ICU Restricted
  beds: Bed[];
  staffAssigned: string[];
}

export interface Bed {
  bedNumber: string;
  status: 'Occupied' | 'Available' | 'Cleaning';
  occupiedBy?: string; // Patient name
  patientId?: string;
  admissionDate?: string;
  expectedDischarge?: string;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  referralSource: string;
  specialty: string;
  pathway: number; // 0 = Inpatient, 1 = Outpatient
  priority: number; // 0 = Routine, 1 = Urgent, 2 = TwoWeekWait
  referralDate: string;
  status: string;
  clinicalIndication: string;
}

export interface WaitingListEntry {
  id: string;
  referralId: string;
  patientId: string;
  patientName: string;
  specialty: string;
  pathway: number; // 0 = Inpatient, 1 = Outpatient
  dateAdded: string;
  status: string;
}

export interface Booking {
  id: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  type: number; // 0 = InpatientAdmission, 1 = OutpatientClinic
  clinicNameOrWard: string;
  clinicianName: string;
  status: string;
}

export interface EmergencyAttendance {
  id: string;
  patientId: string;
  patientName: string;
  arrivalTime: string;
  triage: number; // 1 = Immediate, 2 = Very Urgent, 3 = Urgent, 4 = Standard
  chiefComplaint: string;
  triageNotes: string;
  status: number; // 0 = AwaitingTriage, 1 = WaitingForTreatment, 2 = UnderTreatment, 3 = Discharged
}

export interface ClinicalDocument {
  id: string;
  patientId: string;
  title: string;
  documentType: string; // "DischargeSummary", "ClinicalNote", "ReferralLetter", "ConsentForm", "LabReport"
  content: string;
  createdAt: string;
  author: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:5000/api/patient';
  private clinicalUrl = 'http://localhost:5000/api/clinical';
  private authService = inject(AuthService);

  // In-Memory Master Database Collections
  public allWards: Ward[] = [];
  public allDoctors: Doctor[] = [];
  public allBookings: Booking[] = [];
  public allWaitingList: WaitingListEntry[] = [];
  public allDocumentsMap: Record<string, ClinicalDocument[]> = {};
  public allEmergency: EmergencyAttendance[] = [];

  // Signals for state management
  private patientsSignal = signal<Patient[]>([]);
  public patients = this.patientsSignal.asReadonly();
  public activePatient = signal<Patient | null>(null);

  private loadingSignal = signal<boolean>(false);
  public loading = this.loadingSignal.asReadonly();

  private errorSignal = signal<string | null>(null);
  public error = this.errorSignal.asReadonly();

  // Shared state for inter-module scheduling
  public activeSchedulingRequest = signal<{
    patientId: string;
    patientName: string;
    pathway: number;
    entryId: string;
  } | null>(null);

  // Tracks the ID of the last created record for highlighting and auto-selection
  public lastCreatedRecordId = signal<string | null>(null);

  // Decoupled redirection trigger for child component tab switching
  public activeNavigationTrigger = signal<{ type: string; label: string } | null>(null);

  // Computed totals
  public totalInpatients = computed(() => this.patients().filter(p => p.isAdmitted).length);
  public totalOutpatients = computed(() => this.patients().filter(p => !p.isAdmitted).length);
  public infectionAlertCount = computed(() => 
    this.patients().filter(p => p.infectionControlAlerts && p.infectionControlAlerts !== 'None' && p.infectionControlAlerts !== '').length
  );

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  constructor(private http: HttpClient) {
    this.initializeMockDatabase();
    this.loadBedBoard();
  }

  // Load patient list on bed board
  public async loadBedBoard(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const data = (await firstValueFrom(
        this.http.get<Patient[]>(`${this.apiUrl}/bedboard`, this.getHeaders()).pipe(
          catchError(() => {
            console.warn('API unavailable. Falling back to local programmatically generated registry.');
            return of(this.patientsSignal());
          })
        )
      )) as any;
      
      const dbPatients = (data || []) as Patient[];
      const currentPatients = this.patientsSignal();
      const merged = [...dbPatients];
      
      currentPatients.forEach(cp => {
        const exists = dbPatients.some(dp => dp.id === cp.id || (dp.nhsNumber && dp.nhsNumber === cp.nhsNumber));
        if (!exists) {
          merged.push(cp);
        }
      });
      
      this.patientsSignal.set(merged);
    } catch (err: any) {
      this.errorSignal.set('Failed to retrieve patient registry');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Register a new patient
  public async registerPatient(request: RegisterRequest): Promise<string> {
    this.loadingSignal.set(true);
    try {
      const response = (await firstValueFrom(
        this.http.post<{ patientId: string }>(`${this.apiUrl}/register`, request, this.getHeaders()).pipe(
          catchError(() => {
            const simId = this.generateGuid();
            this.simulateRegistrationLocal(simId, request);
            return of({ patientId: simId });
          })
        )
      )) as any;
      await this.loadBedBoard();
      this.lastCreatedRecordId.set(response.patientId);
      return response.patientId;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Admit a patient to a ward
  public async admitPatient(request: AdmitRequest): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/admit`, request, this.getHeaders()).pipe(
          catchError(() => {
            this.simulateAdmissionLocal(request);
            return of({});
          })
        )
      );
      await this.loadBedBoard();
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Transfer a patient to another ward/bed
  public async transferPatient(request: TransferRequest): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/transfer`, request, this.getHeaders()).pipe(
          catchError(() => {
            this.simulateTransferLocal(request);
            return of({});
          })
        )
      );
      await this.loadBedBoard();
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Discharge a patient
  public async dischargePatient(request: DischargeRequest): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/discharge`, request, this.getHeaders()).pipe(
          catchError(() => {
            this.simulateDischargeLocal(request);
            return of({});
          })
        )
      );
      await this.loadBedBoard();
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Waiting List
  public async loadWaitingList(pathway?: number): Promise<WaitingListEntry[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (pathway !== undefined) {
          resolve(this.allWaitingList.filter(w => w.pathway === pathway));
        } else {
          resolve(this.allWaitingList);
        }
      }, 100);
    });
  }

  public async createReferral(request: any): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.clinicalUrl}/referral`, request, this.getHeaders()).pipe(
          catchError(() => {
            const entry: WaitingListEntry = {
              id: 'w-' + Math.floor(Math.random() * 900000 + 100000),
              referralId: 'ref-' + Math.floor(Math.random() * 900000 + 100000),
              patientId: request.patientId,
              patientName: request.patientName,
              specialty: request.specialty,
              pathway: request.pathway,
              dateAdded: new Date().toISOString(),
              status: 'Waiting'
            };
            this.allWaitingList.push(entry);
            this.lastCreatedRecordId.set(entry.id);
            return of({});
          })
        )
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Appointments
  public async loadBookings(): Promise<Booking[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.allBookings);
      }, 100);
    });
  }

  public async createBooking(request: any): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.clinicalUrl}/booking`, request, this.getHeaders()).pipe(
          catchError(() => {
            const b: Booking = {
              id: 'b-' + Math.floor(Math.random() * 900000 + 100000),
              patientId: request.patientId,
              patientName: request.patientName,
              appointmentDate: request.appointmentDate,
              type: request.type,
              clinicNameOrWard: request.clinicNameOrWard,
              clinicianName: request.clinicianName,
              status: 'Booked'
            };
            this.allBookings.push(b);
            this.lastCreatedRecordId.set(b.id);

            // If it's a scheduled waitlist booking, mark the waitlist entry as Scheduled
            if (this.activeSchedulingRequest()?.patientId === request.patientId) {
              const entryId = this.activeSchedulingRequest()?.entryId;
              const entry = this.allWaitingList.find(w => w.id === entryId);
              if (entry) {
                entry.status = 'Scheduled';
              }
              this.activeSchedulingRequest.set(null);
            }
            return of({});
          })
        )
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Emergency Care Caseload
  public async loadActiveEmergency(): Promise<EmergencyAttendance[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.allEmergency.filter(e => e.status !== 3));
      }, 100);
    });
  }

  public async registerEmergencyArrival(request: any): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.clinicalUrl}/emergency/arrival`, request, this.getHeaders()).pipe(
          catchError(() => {
            const att: EmergencyAttendance = {
              id: 'e-' + Math.floor(Math.random() * 900000 + 100000),
              patientId: request.patientId,
              patientName: request.patientName,
              arrivalTime: new Date().toISOString(),
              triage: 4, // Green - Standard default
              chiefComplaint: request.chiefComplaint,
              triageNotes: '',
              status: 0 // AwaitingTriage
            };
            this.allEmergency.push(att);
            return of({});
          })
        )
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  public async triageEmergencyPatient(request: any): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.clinicalUrl}/emergency/triage`, request, this.getHeaders()).pipe(
          catchError(() => {
            const att = this.allEmergency.find(e => e.id === request.attendanceId);
            if (att) {
              att.triage = request.triagePriority;
              att.triageNotes = request.triageNotes;
              att.status = 1; // WaitingForTreatment
            }
            return of({});
          })
        )
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Case Documents
  public async loadPatientDocuments(patientId: string): Promise<ClinicalDocument[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.allDocumentsMap[patientId] || []);
      }, 100);
    });
  }

  public async saveClinicalDocument(request: any): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.clinicalUrl}/documents`, request, this.getHeaders()).pipe(
          catchError(() => {
            const doc: ClinicalDocument = {
              id: 'doc-' + Math.floor(Math.random() * 900000 + 100000),
              patientId: request.patientId,
              title: request.title,
              documentType: request.documentType,
              content: request.content,
              createdAt: new Date().toISOString(),
              author: request.author || 'Logged Practitioner'
            };
            if (!this.allDocumentsMap[request.patientId]) {
              this.allDocumentsMap[request.patientId] = [];
            }
            this.allDocumentsMap[request.patientId].unshift(doc);
            return of({});
          })
        )
      );
    } finally {
      this.loadingSignal.set(false);
    }
  }


  // Wards bed cleaning & availability
  public cleanBed(wardName: string, bedNumber: string) {
    const ward = this.allWards.find(w => w.name === wardName);
    if (ward) {
      const bed = ward.beds.find(b => b.bedNumber === bedNumber);
      if (bed) {
        if (bed.status === 'Occupied') {
          // Can't clean occupied bed
          return;
        }
        bed.status = 'Cleaning';
      }
    }
  }

  public releaseBed(wardName: string, bedNumber: string) {
    const ward = this.allWards.find(w => w.name === wardName);
    if (ward) {
      const bed = ward.beds.find(b => b.bedNumber === bedNumber);
      if (bed) {
        bed.status = 'Available';
        bed.occupiedBy = undefined;
        bed.patientId = undefined;
        bed.admissionDate = undefined;
        bed.expectedDischarge = undefined;
      }
    }
  }

  // Local state simulations for offline/demo run
  private simulateRegistrationLocal(id: string, req: RegisterRequest) {
    const list = [...this.patientsSignal()];
    const patientObj = {
      id,
      firstName: req.firstName,
      lastName: req.lastName,
      dateOfBirth: req.dateOfBirth,
      nhsNumber: req.nhsNumber,
      chiNumber: req.chiNumber,
      ihiNumber: req.ihiNumber,
      currentWard: '',
      currentBed: '',
      isAdmitted: false,
      gender: 'Male'
    };
    list.push(patientObj);
    this.patientsSignal.set(list);

    // Seed document structure
    this.allDocumentsMap[id] = [
      {
        id: `doc-${id}-1`,
        patientId: id,
        title: 'Initial GP Assessment Letter',
        documentType: 'ReferralLetter',
        author: 'Dr. Robert Vance, GP',
        createdAt: new Date().toISOString(),
        content: 'GP registration summary completed.'
      }
    ];
  }

  private simulateAdmissionLocal(req: AdmitRequest) {
    const list = this.patientsSignal().map(p => {
      if (p.id === req.patientId) {
        return {
          ...p,
          isAdmitted: true,
          currentWard: req.wardCode,
          currentBed: req.bedNumber,
          admittedAt: new Date().toISOString(),
          infectionControlAlerts: req.infectionControlAlerts
        };
      }
      return p;
    });
    this.patientsSignal.set(list);

    // Update in-memory ward bed
    const ward = this.allWards.find(w => w.name === req.wardCode);
    const pat = this.patientsSignal().find(p => p.id === req.patientId);
    if (ward && pat) {
      const bed = ward.beds.find(b => b.bedNumber === req.bedNumber);
      if (bed) {
        bed.status = 'Occupied';
        bed.occupiedBy = `${pat.lastName}, ${pat.firstName}`;
        bed.patientId = pat.id;
        bed.admissionDate = new Date().toISOString();
        bed.expectedDischarge = new Date(Date.now() + 5 * 24 * 3600000).toISOString();
        ward.occupiedBeds++;
        ward.availableBeds--;
      }
    }
  }

  private simulateTransferLocal(req: TransferRequest) {
    const pat = this.patientsSignal().find(p => p.id === req.patientId);
    if (!pat) return;

    const oldWardName = pat.currentWard;
    const oldBedNumber = pat.currentBed;

    // Release old bed
    const oldWard = this.allWards.find(w => w.name === oldWardName);
    if (oldWard) {
      const oldBed = oldWard.beds.find(b => b.bedNumber === oldBedNumber);
      if (oldBed) {
        oldBed.status = 'Cleaning';
        oldBed.occupiedBy = undefined;
        oldBed.patientId = undefined;
        oldWard.occupiedBeds--;
        oldWard.availableBeds++;
      }
    }

    // Occupy new bed
    const newWard = this.allWards.find(w => w.name === req.toWardCode);
    if (newWard && pat) {
      const newBed = newWard.beds.find(b => b.bedNumber === req.toBedNumber);
      if (newBed) {
        newBed.status = 'Occupied';
        newBed.occupiedBy = `${pat.lastName}, ${pat.firstName}`;
        newBed.patientId = pat.id;
        newBed.admissionDate = new Date().toISOString();
        newBed.expectedDischarge = new Date(Date.now() + 4 * 24 * 3600000).toISOString();
        newWard.occupiedBeds++;
        newWard.availableBeds--;
      }
    }

    const list = this.patientsSignal().map(p => {
      if (p.id === req.patientId) {
        return {
          ...p,
          currentWard: req.toWardCode,
          currentBed: req.toBedNumber
        };
      }
      return p;
    });
    this.patientsSignal.set(list);
  }

  private simulateDischargeLocal(req: DischargeRequest) {
    const pat = this.patientsSignal().find(p => p.id === req.patientId);
    if (pat) {
      const ward = this.allWards.find(w => w.name === pat.currentWard);
      if (ward) {
        const bed = ward.beds.find(b => b.bedNumber === pat.currentBed);
        if (bed) {
          bed.status = 'Cleaning';
          bed.occupiedBy = undefined;
          bed.patientId = undefined;
          ward.occupiedBeds--;
          ward.availableBeds++;
        }
      }
    }

    // Change patient to outpatient status instead of removing them from registry
    const list = this.patientsSignal().map(p => {
      if (p.id === req.patientId) {
        return {
          ...p,
          isAdmitted: false,
          currentWard: '',
          currentBed: ''
        };
      }
      return p;
    });
    this.patientsSignal.set(list);
  }

  private generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private initializeMockDatabase() {
    if (this.allWards.length > 0) return;

    // 1. Initialize 6 Wards
    const wardNames = [
      { name: 'Medical Ward', type: 'General Medicine', cap: 20, nurse: 'Station A' },
      { name: 'Surgical Ward', type: 'General Surgery', cap: 15, nurse: 'Station B' },
      { name: 'ICU', type: 'Intensive Care', cap: 8, nurse: 'ICU Desk' },
      { name: 'HDU', type: 'High Dependency', cap: 8, nurse: 'HDU Desk' },
      { name: 'Maternity', type: 'Obstetrics', cap: 12, nurse: 'Maternity Desk' },
      { name: 'Pediatrics', type: 'Pediatric Care', cap: 10, nurse: 'Pediatrics Desk' }
    ];

    this.allWards = wardNames.map(w => {
      const beds: Bed[] = [];
      for (let i = 1; i <= w.cap; i++) {
        beds.push({
          bedNumber: `${w.name.substring(0, 2).toUpperCase()}-${i.toString().padStart(2, '0')}`,
          status: 'Available'
        });
      }
      return {
        name: w.name,
        type: w.type,
        capacity: w.cap,
        occupiedBeds: 0,
        availableBeds: w.cap,
        nurseStation: w.nurse,
        status: w.name === 'ICU' ? 'ICU Restricted' : 'Fully Operational',
        beds,
        staffAssigned: ['Charge Nurse J. Doe', 'Staff Nurse A. Smith']
      };
    });

    // 2. Initialize 35 Doctors
    const specialties = ['Cardiology', 'Oncology', 'Neurology', 'Orthopaedics', 'General Medicine', 'Emergency', 'ICU', 'Pediatrics'];
    const docFirsts = ['Gregory', 'Fiona', 'Beverly', 'Julian', 'James', 'Alistair', 'Emily', 'Robert', 'Sarah', 'William', 'Benjamin', 'Sophia', 'Charlotte', 'Oliver', 'Noah', 'Elijah'];
    const docLasts = ['House', 'Gallagher', 'Crusher', 'Bashir', 'Wilson', 'Graham', 'Briggs', 'Vance', 'Connor', 'McCoy', 'Cuddy', 'Foreman', 'Chase', 'Cameron', 'Taub', 'Kutner'];

    this.allDoctors = [];
    for (let i = 0; i < 35; i++) {
      const spec = specialties[i % specialties.length];
      const name = `Dr. ${docFirsts[i % docFirsts.length]} ${docLasts[(i + 3) % docLasts.length]}`;
      this.allDoctors.push({
        id: `doc-${1000 + i}`,
        name,
        specialty: spec,
        department: spec,
        status: i % 7 === 0 ? 'On Leave' : (i % 5 === 0 ? 'Clinic' : 'Active')
      });
    }

    // 3. Generate 110 programmatically generated patients
    const patientFirsts = ['Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Mason', 'Michael', 'Ethan', 'Logan', 'Daniel', 'Sophia', 'Olivia', 'Emma', 'Amelia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Harper', 'Evelyn', 'Abigail', 'Emily', 'Ella', 'Elizabeth', 'Connor', 'Caitlin', 'Niall', 'Aoife', 'Siobhan', 'Sean', 'Patrick', 'Darragh', 'Roisin', 'Maeve'];
    const patientLasts = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Murphy', 'Kelly', 'O\'Sullivan', 'Walsh', 'O\'Brien', 'Ryan', 'O\'Connor', 'Byrne', 'O\'Neill', 'Doyle'];
    const alertsList = ['None', 'None', 'None', 'Penicillin Allergy', 'MRSA Screen Positive (Precautionary Isolation)', 'Fall Risk - High Assist', 'COVID-19 Contact - Watch List', 'C. Difficile Positive Isolation', 'LaTeX Allergy'];

    const patientsList: Patient[] = [...this.getMockPatients()];

    for (let i = 0; i < 110; i++) {
      const id = this.generateGuid();
      const fn = patientFirsts[i % patientFirsts.length];
      const ln = patientLasts[(i + 4) % patientLasts.length];
      const birthYear = 1940 + (i * 7) % 80;
      const birthMonth = 1 + (i * 3) % 12;
      const birthDay = 1 + (i * 5) % 28;
      const dobStr = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
      const nhs = `485 ${(100 + i * 7).toString()} ${(1000 + i * 3).toString()}`;
      const gender = i % 2 === 0 ? 'Male' : 'Female';
      const alert = alertsList[i % alertsList.length];

      patientsList.push({
        id,
        firstName: fn,
        lastName: ln,
        dateOfBirth: dobStr,
        nhsNumber: nhs,
        currentWard: '',
        currentBed: '',
        isAdmitted: false,
        infectionControlAlerts: alert,
        gender
      });
    }

    // 4. Allocate 45 patients to beds in wards
    let patientIdx = 0;
    this.allWards.forEach(w => {
      w.beds.forEach(b => {
        if (Math.random() < 0.65 && patientIdx < patientsList.length) {
          const pat = patientsList[patientIdx];
          if (!pat.isAdmitted) {
            pat.isAdmitted = true;
            pat.currentWard = w.name;
            pat.currentBed = b.bedNumber;
            pat.admittedAt = new Date(Date.now() - (Math.random() * 5 * 24 * 3600000)).toISOString();

            b.status = 'Occupied';
            b.occupiedBy = `${pat.lastName}, ${pat.firstName}`;
            b.patientId = pat.id;
            b.admissionDate = pat.admittedAt;
            b.expectedDischarge = new Date(Date.now() + (Math.random() * 6 * 24 * 3600000)).toISOString();

            w.occupiedBeds++;
            w.availableBeds--;
          }
          patientIdx++;
        }
      });
    });

    this.patientsSignal.set(patientsList);

    // 5. Generate 180 Appointments
    this.allBookings = [];
    const clinicNames = ['Suite A', 'Clinic B', 'Cardiology Outpatients', 'Oncology Suite', 'Neurology Bay', 'General OPD', 'Pediatrics OPD'];
    for (let i = 0; i < 185; i++) {
      const pat = patientsList[i % patientsList.length];
      const doc = this.allDoctors[i % this.allDoctors.length];
      const daysAhead = -10 + (i * 3) % 28; // past and future
      const date = new Date(Date.now() + daysAhead * 24 * 3600000 + (i % 8) * 3600000);
      const bookingType = i % 3 === 0 ? 0 : 1; // IP or OP
      const location = bookingType === 0 ? `${pat.currentWard || 'Medical Ward'} Bed ${pat.currentBed || 'A1'}` : clinicNames[i % clinicNames.length];
      
      this.allBookings.push({
        id: `b-${2000 + i}`,
        patientId: pat.id,
        patientName: `${pat.lastName}, ${pat.firstName}`,
        appointmentDate: date.toISOString(),
        type: bookingType,
        clinicNameOrWard: location,
        clinicianName: doc.name,
        status: daysAhead < 0 ? (i % 15 === 0 ? 'No Show' : 'Completed') : (i % 20 === 0 ? 'Cancelled' : 'Booked')
      });
    }

    // 6. Generate 55GP/Specialist Referrals
    this.allWaitingList = [];
    for (let i = 0; i < 55; i++) {
      const pat = patientsList[(i + 20) % patientsList.length];
      const daysAgo = 1 + (i * 4) % 90;
      const dateAdded = new Date(Date.now() - daysAgo * 24 * 3600000).toISOString();
      this.allWaitingList.push({
        id: `w-${3000 + i}`,
        referralId: `ref-${4000 + i}`,
        patientId: pat.id,
        patientName: `${pat.lastName}, ${pat.firstName}`,
        specialty: specialties[i % specialties.length],
        pathway: i % 2 === 0 ? 0 : 1, // IP or OP
        dateAdded,
        status: i % 8 === 0 ? 'Scheduled' : 'Waiting'
      });
    }

    // 7. Seed clinical case documents
    patientsList.forEach(p => {
      this.allDocumentsMap[p.id] = [
        {
          id: `doc-${p.id}-1`,
          patientId: p.id,
          title: 'Initial GP Assessment Letter',
          documentType: 'ReferralLetter',
          author: 'Dr. Robert Vance, GP',
          createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
          content: `### PRIMARY CARE REFERRAL LETTER
Patient: **${p.lastName}, ${p.firstName}** (DOB: ${p.dateOfBirth})
GP Code: G83047

Referred for outpatient diagnostics due to persistent indicators of metabolic/cardiovascular dysregulation. 
No known drug interactions except as logged. Please register for specialized triage pathway.`
        },
        {
          id: `doc-${p.id}-2`,
          patientId: p.id,
          title: 'Admitting Clinical Assessment Note',
          documentType: 'ClinicalNote',
          author: 'Dr. Emily Briggs, Consultant',
          createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
          content: `### CLINICAL WARD PROGRESS NOTE
Checked vitals. Alert status logged.
Temp: 37.2 C. BP: 125/80. HR: 72 bpm.
Lungs clear on auscultation. Awaiting laboratory results.`
        }
      ];
    });

    // 8. Seed Emergency Caseload
    this.allEmergency = [
      {
        id: 'e1',
        patientId: patientsList[5].id,
        patientName: `${patientsList[5].lastName}, ${patientsList[5].firstName}`,
        arrivalTime: new Date(Date.now() - 3.2 * 3600000).toISOString(),
        triage: 2,
        chiefComplaint: 'Severe Chest Pain & Dyspnea',
        triageNotes: 'ECG shows sinus tachycardia. Nil active ST elevation. Awaiting lab troponins.',
        status: 2
      },
      {
        id: 'e2',
        patientId: patientsList[6].id,
        patientName: `${patientsList[6].lastName}, ${patientsList[6].firstName}`,
        arrivalTime: new Date(Date.now() - 0.5 * 3600000).toISOString(),
        triage: 4,
        chiefComplaint: 'Minor laceration on left forearm',
        triageNotes: 'Clean wound. Awaiting suture clinic.',
        status: 1
      },
      {
        id: 'e3',
        patientId: patientsList[7].id,
        patientName: `${patientsList[7].lastName}, ${patientsList[7].firstName}`,
        arrivalTime: new Date(Date.now() - 0.1 * 3600000).toISOString(),
        triage: 1,
        chiefComplaint: 'Suspected stroke, FAST positive',
        triageNotes: 'Immediate transfer to Resus 1. CT Brain requested.',
        status: 0
      }
    ];
  }

  private getMockPatients(): Patient[] {
    return [
      {
        id: '1e19485b-e48f-410a-8bf8-234b679f2ea3',
        firstName: 'Alastair',
        lastName: 'Campbell',
        dateOfBirth: '1962-04-12',
        nhsNumber: '485 777 3456',
        currentWard: 'Medical Ward',
        currentBed: 'ME-01',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        infectionControlAlerts: 'None',
        gender: 'Male'
      },
      {
        id: '503a45c3-a3d8-4903-88fe-7be23fb94b28',
        firstName: 'Fiona',
        lastName: 'O\'Connor',
        dateOfBirth: '1978-08-25',
        ihiNumber: '800 120 4567',
        currentWard: 'Surgical Ward',
        currentBed: 'SU-01',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        infectionControlAlerts: 'MRSA Screen Positive (Precautionary Isolation)',
        gender: 'Female'
      },
      {
        id: '9f0412ab-f75e-4efb-8877-bb8909ac1e89',
        firstName: 'Eoin',
        lastName: 'MacDonald',
        dateOfBirth: '1955-11-03',
        chiNumber: '031155 1234',
        currentWard: 'Medical Ward',
        currentBed: 'ME-02',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
        infectionControlAlerts: 'Fall Risk - High Assist',
        gender: 'Male'
      },
      {
        id: 'f87a32bd-442a-4632-9011-aa9b2319df43',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        dateOfBirth: '1989-01-30',
        nhsNumber: '943 456 7821',
        currentWard: 'ICU',
        currentBed: 'IC-01',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
        infectionControlAlerts: 'None',
        gender: 'Female'
      },
      {
        id: 'c2e9a21b-871d-40ba-ae29-cc823fb88e21',
        firstName: 'Declan',
        lastName: 'Murphy',
        dateOfBirth: '2001-07-15',
        ihiNumber: '800 789 1011',
        currentWard: 'Medical Ward',
        currentBed: 'ME-03',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        infectionControlAlerts: 'COVID-19 Contact - Watch List',
        gender: 'Male'
      },
      {
        id: '5eb91a4b-88b1-4091-a201-cf92cbb88319',
        firstName: 'Seamus',
        lastName: 'Brogan',
        dateOfBirth: '1984-05-20',
        nhsNumber: '419 881 3322',
        currentWard: 'HDU',
        currentBed: 'HD-01',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 0.5 * 3600000).toISOString(),
        infectionControlAlerts: 'None',
        gender: 'Male'
      },
      {
        id: '8d839212-fc39-4d8b-9021-aa021cbbd210',
        firstName: 'Bernadette',
        lastName: 'O\'Reilly',
        dateOfBirth: '1947-09-08',
        ihiNumber: '800 234 5678',
        currentWard: 'ICU',
        currentBed: 'IC-02',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 0.1 * 3600000).toISOString(),
        infectionControlAlerts: 'Infection Alert - Triage Isolation',
        gender: 'Female'
      },
      {
        id: 'd9e2a14b-229b-432a-bc90-99c82df09e13',
        firstName: 'Timothy',
        lastName: 'Smith',
        dateOfBirth: '1980-01-01',
        nhsNumber: '555 667 7443',
        currentWard: 'Medical Ward',
        currentBed: 'ME-04',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
        infectionControlAlerts: 'Penicillin Allergy',
        gender: 'Male'
      },
      {
        id: '44b2a890-ee82-44df-9118-efbc92e0129a',
        firstName: 'Catherine',
        lastName: 'Higgins',
        dateOfBirth: '1969-12-05',
        nhsNumber: '888 123 9988',
        currentWard: 'Surgical Ward',
        currentBed: 'SU-02',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
        infectionControlAlerts: 'None',
        gender: 'Female'
      },
      {
        id: 'a9e102bc-bb89-40ea-9021-fe88a101bce2',
        firstName: 'David',
        lastName: 'Gillespie',
        dateOfBirth: '1952-06-18',
        chiNumber: '180652 9987',
        currentWard: 'Medical Ward',
        currentBed: 'ME-05',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 96 * 3600000).toISOString(),
        infectionControlAlerts: 'C. Difficile Positive Isolation',
        gender: 'Male'
      }
    ];
  }
}
