import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { ClinicalConsoleComponent } from './components/clinical-console.component';
import { BedBoardComponent } from './components/bed-board.component';
import { ReferralWaitlistComponent } from './components/referral-waitlist.component';
import { BookingSchedulerComponent } from './components/booking-scheduler.component';
import { EmergencyCareComponent } from './components/emergency-care.component';
import { ClinicalDocumentsComponent } from './components/clinical-documents.component';
import { PatientDirectoryMpiComponent } from './components/patient-directory-mpi.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'workspace', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'workspace', component: ClinicalConsoleComponent, canActivate: [authGuard] },
  { path: 'bedboard', component: BedBoardComponent, canActivate: [authGuard] },
  { path: 'referrals', component: ReferralWaitlistComponent, canActivate: [authGuard] },
  { path: 'booking', component: BookingSchedulerComponent, canActivate: [authGuard] },
  { path: 'emergency', component: EmergencyCareComponent, canActivate: [authGuard] },
  { path: 'documents', component: ClinicalDocumentsComponent, canActivate: [authGuard] },
  { path: 'mpi', component: PatientDirectoryMpiComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'workspace' }
];
