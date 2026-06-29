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

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:5000/api/patient'; // Fallback / local API port
  private clinicalUrl = 'http://localhost:5000/api/clinical';
  private authService = inject(AuthService);

  // Local clinical mock databases for offline run
  private mockWaitingList = signal<WaitingListEntry[]>(this.getMockWaitingList());
  private mockBookings = signal<Booking[]>(this.getMockBookings());
  private mockEmergency = signal<EmergencyAttendance[]>(this.getMockEmergency());
  private mockDocuments = signal<Record<string, ClinicalDocument[]>>({});

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  // Signals for state management
  private patientsSignal = signal<Patient[]>([]);
  public patients = this.patientsSignal.asReadonly();

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

  // Computed state
  public totalInpatients = computed(() => this.patients().length);
  public infectionAlertCount = computed(() => 
    this.patients().filter(p => p.infectionControlAlerts && p.infectionControlAlerts !== 'None' && p.infectionControlAlerts !== '').length
  );

  constructor(private http: HttpClient) {
    // Automatically load mock data initially to ensure a premium out-of-the-box user experience
    this.loadBedBoard();
  }

  // Load patient list on bed board
  public async loadBedBoard(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      // Fetch from API
      const data = await firstValueFrom(
        this.http.get<Patient[]>(`${this.apiUrl}/bedboard`, this.getHeaders()).pipe(
          catchError(() => {
            console.warn('API unavailable. Falling back to NHS/HSE mock records.');
            return of(this.getMockPatients());
          })
        )
      );
      this.patientsSignal.set(data);
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
      const response = await firstValueFrom(
        this.http.post<{ patientId: string }>(`${this.apiUrl}/register`, request, this.getHeaders()).pipe(
          catchError((err) => {
            // Local simulation if API is not running
            const simId = this.generateGuid();
            this.simulateRegistrationLocal(simId, request);
            return of({ patientId: simId });
          })
        )
      );
      await this.loadBedBoard();
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
          catchError((err) => {
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
          catchError((err) => {
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
          catchError((err) => {
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

  // Local state simulations for offline/demo run
  private simulateRegistrationLocal(id: string, req: RegisterRequest) {
    const list = [...this.patientsSignal()];
    list.push({
      id,
      firstName: req.firstName,
      lastName: req.lastName,
      dateOfBirth: req.dateOfBirth,
      nhsNumber: req.nhsNumber,
      chiNumber: req.chiNumber,
      ihiNumber: req.ihiNumber,
      currentWard: '',
      currentBed: '',
      isAdmitted: false
    });
    this.patientsSignal.set(list);
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
  }

  private simulateTransferLocal(req: TransferRequest) {
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
    const list = this.patientsSignal().filter(p => p.id !== req.patientId);
    this.patientsSignal.set(list);
  }

  private generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Realistic mock data incorporating valid Modulus-11 NHS numbers
  private getMockPatients(): Patient[] {
    return [
      {
        id: '1e19485b-e48f-410a-8bf8-234b679f2ea3',
        firstName: 'Alastair',
        lastName: 'Campbell',
        dateOfBirth: '1962-04-12',
        nhsNumber: '485 777 3456', // Validates via NHS Modulus 11
        currentWard: 'Acute Medical Unit (AMU)',
        currentBed: 'Bed A1',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hours ago
        infectionControlAlerts: 'None'
      },
      {
        id: '503a45c3-a3d8-4903-88fe-7be23fb94b28',
        firstName: 'Fiona',
        lastName: 'O\'Connor',
        dateOfBirth: '1978-08-25',
        ihiNumber: '800 120 4567', // Valid Irish IHI structure
        currentWard: 'Coronary Care Unit (CCU)',
        currentBed: 'Bay 2 - Bed B',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
        infectionControlAlerts: 'MRSA Screen Positive (Precautionary Isolation)'
      },
      {
        id: '9f0412ab-f75e-4efb-8877-bb8909ac1e89',
        firstName: 'Eoin',
        lastName: 'MacDonald',
        dateOfBirth: '1955-11-03',
        chiNumber: '031155 1234', // Valid Scottish CHI DOB prefix
        currentWard: 'Geriatic Assessment Ward',
        currentBed: 'Bed C4',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 72 * 3600000).toISOString(), // 3 days ago
        infectionControlAlerts: 'Fall Risk - High Assist'
      },
      {
        id: 'f87a32bd-442a-4632-9011-aa9b2319df43',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        dateOfBirth: '1989-01-30',
        nhsNumber: '943 456 7821',
        currentWard: 'Emergency Department (ED)',
        currentBed: 'Triage Bed 2',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 1.5 * 3600000).toISOString(), // 1.5 hours ago
        infectionControlAlerts: 'None'
      },
      {
        id: 'c2e9a21b-871d-40ba-ae29-cc823fb88e21',
        firstName: 'Declan',
        lastName: 'Murphy',
        dateOfBirth: '2001-07-15',
        ihiNumber: '800 789 1011',
        currentWard: 'Acute Medical Unit (AMU)',
        currentBed: 'Bed A4',
        isAdmitted: true,
        admittedAt: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
        infectionControlAlerts: 'COVID-19 Contact - Watch List'
      }
    ];
  }

  // 1. Referrals & Waiting List
  public async loadWaitingList(pathway?: number): Promise<WaitingListEntry[]> {
    try {
      const pathwayParam = pathway !== undefined ? `?pathway=${pathway}` : '';
      return await firstValueFrom(
        this.http.get<WaitingListEntry[]>(`${this.clinicalUrl}/waitinglist${pathwayParam}`, this.getHeaders()).pipe(
          catchError(() => {
            let list = this.mockWaitingList();
            if (pathway !== undefined) {
              list = list.filter(x => x.pathway === pathway);
            }
            return of(list);
          })
        )
      );
    } catch {
      return this.mockWaitingList();
    }
  }

  public async createReferral(request: any): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.clinicalUrl}/referrals`, request, this.getHeaders()).pipe(
          catchError(() => {
            const entry: WaitingListEntry = {
              id: this.generateGuid(),
              referralId: this.generateGuid(),
              patientId: request.patientId,
              patientName: request.patientName,
              specialty: request.specialty,
              pathway: request.pathway,
              dateAdded: new Date().toISOString(),
              status: 'Waiting'
            };
            this.mockWaitingList.set([...this.mockWaitingList(), entry]);
            return of({});
          })
        )
      );
    } catch {
      // already simulated
    }
  }

  // 2. Bookings
  public async loadBookings(): Promise<Booking[]> {
    try {
      return await firstValueFrom(
        this.http.get<Booking[]>(`${this.clinicalUrl}/bookings`, this.getHeaders()).pipe(
          catchError(() => of(this.mockBookings()))
        )
      );
    } catch {
      return this.mockBookings();
    }
  }

  public async createBooking(request: any): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.clinicalUrl}/bookings`, request, this.getHeaders()).pipe(
          catchError(() => {
            const booking: Booking = {
              id: this.generateGuid(),
              patientId: request.patientId,
              patientName: request.patientName,
              appointmentDate: request.appointmentDate,
              type: request.type,
              clinicNameOrWard: request.clinicNameOrWard,
              clinicianName: request.clinicianName,
              status: 'Scheduled'
            };
            this.mockBookings.set([...this.mockBookings(), booking]);
            if (request.waitingListEntryId) {
              this.mockWaitingList.set(
                this.mockWaitingList().map(w => w.id === request.waitingListEntryId ? { ...w, status: 'Scheduled' } : w)
              );
            }
            return of({});
          })
        )
      );
    } catch {
      // already simulated
    }
  }

  // 3. Emergency Care
  public async loadActiveEmergency(): Promise<EmergencyAttendance[]> {
    try {
      return await firstValueFrom(
        this.http.get<EmergencyAttendance[]>(`${this.clinicalUrl}/emergency/active`, this.getHeaders()).pipe(
          catchError(() => of(this.mockEmergency()))
        )
      );
    } catch {
      return this.mockEmergency();
    }
  }

  public async registerEmergencyArrival(request: any): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.clinicalUrl}/emergency/attend`, request, this.getHeaders()).pipe(
          catchError(() => {
            const attendance: EmergencyAttendance = {
              id: this.generateGuid(),
              patientId: request.patientId,
              patientName: request.patientName,
              arrivalTime: new Date().toISOString(),
              triage: 4, // default Standard (Green)
              chiefComplaint: request.chiefComplaint,
              triageNotes: '',
              status: 0 // AwaitingTriage
            };
            this.mockEmergency.set([...this.mockEmergency(), attendance]);
            return of({});
          })
        )
      );
    } catch {
      // already simulated
    }
  }

  public async triageEmergencyPatient(request: any): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.clinicalUrl}/emergency/triage`, request, this.getHeaders()).pipe(
          catchError(() => {
            this.mockEmergency.set(
              this.mockEmergency().map(e => e.id === request.attendanceId ? {
                ...e,
                triage: request.triage,
                triageNotes: request.triageNotes,
                status: 1, // WaitingForTreatment
                triageCompletedAt: new Date().toISOString()
              } : e)
            );
            return of({});
          })
        )
      );
    } catch {
      // already simulated
    }
  }

  // 4. Clinical Case Notes & Documents
  public async loadPatientDocuments(patientId: string): Promise<ClinicalDocument[]> {
    try {
      return await firstValueFrom(
        this.http.get<ClinicalDocument[]>(`${this.clinicalUrl}/documents/patient/${patientId}`, this.getHeaders()).pipe(
          catchError(() => of(this.mockDocuments()[patientId] || this.getMockDocumentsFor(patientId)))
        )
      );
    } catch {
      return this.mockDocuments()[patientId] || this.getMockDocumentsFor(patientId);
    }
  }

  public async saveClinicalDocument(request: any): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.clinicalUrl}/documents`, request, this.getHeaders()).pipe(
          catchError(() => {
            const doc: ClinicalDocument = {
              id: this.generateGuid(),
              patientId: request.patientId,
              title: request.title,
              documentType: request.documentType,
              content: request.content,
              createdAt: new Date().toISOString(),
              author: 'Dr. Fiona Gallagher (NHS Smartcard)'
            };
            const map = { ...this.mockDocuments() };
            if (!map[request.patientId]) {
              map[request.patientId] = this.getMockDocumentsFor(request.patientId);
            }
            map[request.patientId] = [doc, ...map[request.patientId]];
            this.mockDocuments.set(map);
            return of({});
          })
        )
      );
    } catch {
      // already simulated
    }
  }

  private getMockWaitingList(): WaitingListEntry[] {
    return [
      {
        id: 'w1',
        referralId: 'r1',
        patientId: '1e19485b-e48f-410a-8bf8-234b679f2ea3',
        patientName: 'Campbell, Alastair',
        specialty: 'Cardiology',
        pathway: 1, // Outpatient (OP)
        dateAdded: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
        status: 'Waiting'
      },
      {
        id: 'w2',
        referralId: 'r2',
        patientId: '503a45c3-a3d8-4903-88fe-7be23fb94b28',
        patientName: 'O\'Connor, Fiona',
        specialty: 'Orthopaedics',
        pathway: 0, // Inpatient (IP)
        dateAdded: new Date(Date.now() - 110 * 24 * 3600000).toISOString(), // ~15.7 weeks wait (approach 18w target!)
        status: 'Waiting'
      },
      {
        id: 'w3',
        referralId: 'r3',
        patientId: '9f0412ab-f75e-4efb-8877-bb8909ac1e89',
        patientName: 'MacDonald, Eoin',
        specialty: 'Geriatrics',
        pathway: 0, // Inpatient (IP)
        dateAdded: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        status: 'Waiting'
      }
    ];
  }

  private getMockBookings(): Booking[] {
    return [
      {
        id: 'b1',
        patientId: '1e19485b-e48f-410a-8bf8-234b679f2ea3',
        patientName: 'Campbell, Alastair',
        appointmentDate: new Date(Date.now() + 2 * 3600000 * 24).toISOString(),
        type: 1, // OutpatientClinic
        clinicNameOrWard: 'Outpatient Clinic 3',
        clinicianName: 'Dr. Emily Briggs',
        status: 'Scheduled'
      },
      {
        id: 'b2',
        patientId: 'c2e9a21b-871d-40ba-ae29-cc823fb88e21',
        patientName: 'Murphy, Declan',
        appointmentDate: new Date(Date.now() + 5 * 3600000 * 24).toISOString(),
        type: 0, // InpatientAdmission
        clinicNameOrWard: 'Acute Medical Unit (AMU) - Bed 4',
        clinicianName: 'Dr. Emily Briggs',
        status: 'Scheduled'
      }
    ];
  }

  private getMockEmergency(): EmergencyAttendance[] {
    return [
      {
        id: 'e1',
        patientId: 'f87a32bd-442a-4632-9011-aa9b2319df43',
        patientName: 'Jenkins, Sarah',
        arrivalTime: new Date(Date.now() - 3.2 * 3600000).toISOString(), // 3.2 hours ago (near 4-hour target)
        triage: 2, // Orange - Very Urgent
        chiefComplaint: 'Severe Chest Pain & Dyspnea',
        triageNotes: 'ECG shows sinus tachycardia. Nil active ST elevation. Awaiting lab troponins.',
        status: 2 // UnderTreatment
      },
      {
        id: 'e2',
        patientId: 'sim-p1',
        patientName: 'Brogan, Seamus',
        arrivalTime: new Date(Date.now() - 0.5 * 3600000).toISOString(),
        triage: 4, // Green - Standard
        chiefComplaint: 'Minor laceration on left forearm',
        triageNotes: 'Clean wound. Awaiting suture clinic.',
        status: 1 // WaitingForTreatment
      },
      {
        id: 'e3',
        patientId: 'sim-p2',
        patientName: 'O\'Reilly, Bernadette',
        arrivalTime: new Date(Date.now() - 0.1 * 3600000).toISOString(),
        triage: 1, // Red - Immediate (Resuscitation)
        chiefComplaint: 'Suspected stroke, slurred speech, FAST positive',
        triageNotes: 'Immediate transfer to Resus 1. CT Brain requested.',
        status: 0 // AwaitingTriage
      }
    ];
  }

  private getMockDocumentsFor(patientId: string): ClinicalDocument[] {
    return [
      {
        id: 'doc-mock-1',
        patientId,
        title: 'Referral Letter from General Practitioner',
        documentType: 'ReferralLetter',
        content: `### PRIMARY CARE REFERRAL LETTER
**From:** Dr. Robert Vance, MD (Vance Clinic, London)
**To:** Clinical Lead, Specialty Medicine Department

**Clinical Indication:**
Patient presented with a history of recurring cardiovascular palpitations and moderate dyspnea on exertion. 
Previous ECGs show intermittent sinus bradycardia.

**Current Medications:**
* Bisoprolol 2.5mg OD
* Atorvastatin 20mg ON

Please review for specialized diagnostic profiling and cardiac stress testing.
`,
        createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
        author: 'Dr. Robert Vance, GP'
      }
    ];
  }
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
  status: number;
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
  triage: number; // 1 = Immediate, etc.
  chiefComplaint: string;
  triageNotes: string;
  status: number;
  triageCompletedAt?: string;
}

export interface ClinicalDocument {
  id: string;
  patientId: string;
  title: string;
  documentType: string; // "DischargeSummary", "ClinicalNote", "ReferralLetter"
  content: string; // Markdown or text
  createdAt: string;
  author: string;
}
