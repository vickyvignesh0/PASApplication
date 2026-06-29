import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { ClinicalConsoleComponent } from './components/clinical-console.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'workspace', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'workspace', component: ClinicalConsoleComponent, canActivate: [authGuard] },
  { path: 'bedboard', component: ClinicalConsoleComponent, canActivate: [authGuard] },
  { path: 'referrals', component: ClinicalConsoleComponent, canActivate: [authGuard] },
  { path: 'booking', component: ClinicalConsoleComponent, canActivate: [authGuard] },
  { path: 'emergency', component: ClinicalConsoleComponent, canActivate: [authGuard] },
  { path: 'documents', component: ClinicalConsoleComponent, canActivate: [authGuard] },
  { path: 'mpi', component: ClinicalConsoleComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'workspace' }
];
