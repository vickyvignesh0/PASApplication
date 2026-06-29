import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  displayName: string;
  role: string;
  userIdentifier: string;
}

export interface AuthResponse {
  token: string;
  displayName: string;
  role: string;
  userIdentifier: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authUrl = 'http://localhost:5000/api/auth';
  private router = inject(Router);
  private http = inject(HttpClient);

  // Auth Signals
  private currentUserSignal = signal<User | null>(null);
  public currentUser = this.currentUserSignal.asReadonly();
  public isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    this.restoreSession();
  }

  // Retrieve current token
  public getToken(): string | null {
    return localStorage.getItem('pas_auth_token');
  }

  // Simulated Login or Standard Login
  public async login(username?: string, password?: string, useSmartcard: boolean = false): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.authUrl}/login-simulated`, {
          username,
          password,
          useSmartcard
        }).pipe(
          catchError(() => {
            console.warn('Auth API offline. Simulating local auth session.');
            // Offline fallback simulation
            const mockToken = 'mock_jwt_token_for_pas_clinical_system';
            const mockUser: User = useSmartcard ? {
              displayName: 'Dr. Fiona Gallagher (NHS Smartcard)',
              role: 'ClinicalStaff',
              userIdentifier: 'NHS-SC-883921'
            } : {
              displayName: username || 'Clinical Staff Member',
              role: username?.toLowerCase() === 'admin' ? 'SystemAdmin' : 'ClinicalStaff',
              userIdentifier: 'CLINICAL-023'
            };
            return of({
              token: mockToken,
              ...mockUser
            });
          })
        )
      );

      localStorage.setItem('pas_auth_token', response.token);
      localStorage.setItem('pas_auth_user', JSON.stringify({
        displayName: response.displayName,
        role: response.role,
        userIdentifier: response.userIdentifier
      }));

      this.currentUserSignal.set({
        displayName: response.displayName,
        role: response.role,
        userIdentifier: response.userIdentifier
      });

      return true;
    } catch (err) {
      console.error('Login error', err);
      return false;
    }
  }

  public logout(): void {
    localStorage.removeItem('pas_auth_token');
    localStorage.removeItem('pas_auth_user');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  private restoreSession(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem('pas_auth_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.currentUserSignal.set(user);
      } catch {
        this.logout();
      }
    }
  }
}
