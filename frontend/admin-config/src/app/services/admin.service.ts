import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  role: string;
  smartcardLevel: number;
  isActive: boolean;
  createdAt: string;
}

export interface WardConfig {
  id: string;
  wardCode: string;
  name: string;
  totalBeds: number;
  isInfectionControlZone: boolean;
}

export interface RolePermission {
  id: string;
  role: string;
  allowedModules: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private adminUrl = 'http://localhost:5000/api/admin';
  private http = inject(HttpClient);

  // Signals for state
  public users = signal<UserProfile[]>([]);
  public Wards = signal<WardConfig[]>([]);
  public permissions = signal<RolePermission[]>([]);

  // Retrieve JWT from local storage (shared with pas-app)
  private getHeaders() {
    const token = localStorage.getItem('pas_auth_token') || 'mock_jwt_token_for_admin_run';
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  // User Management
  public async loadUsers(): Promise<void> {
    try {
      const list = await firstValueFrom(
        this.http.get<UserProfile[]>(`${this.adminUrl}/users`, this.getHeaders()).pipe(
          catchError(() => of(this.getMockUsers()))
        )
      );
      this.users.set(list);
    } catch {
      this.users.set(this.getMockUsers());
    }
  }

  public async saveUser(user: UserProfile): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.adminUrl}/users`, user, this.getHeaders()).pipe(
          catchError(() => {
            const list = this.users().map(u => u.id === user.id ? user : u);
            if (!this.users().some(u => u.id === user.id)) {
              list.push(user);
            }
            this.users.set(list);
            return of({});
          })
        )
      );
    } catch {
      // simulated
    }
  }

  // Wards Configuration
  public async loadWards(): Promise<void> {
    try {
      const list = await firstValueFrom(
        this.http.get<WardConfig[]>(`${this.adminUrl}/wards`, this.getHeaders()).pipe(
          catchError(() => of(this.getMockWards()))
        )
      );
      this.Wards.set(list);
    } catch {
      this.Wards.set(this.getMockWards());
    }
  }

  public async saveWard(ward: WardConfig): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.adminUrl}/wards`, ward, this.getHeaders()).pipe(
          catchError(() => {
            const list = this.Wards().map(w => w.id === ward.id ? ward : w);
            if (!this.Wards().some(w => w.id === ward.id)) {
              list.push(ward);
            }
            this.Wards.set(list);
            return of({});
          })
        )
      );
    } catch {
      // simulated
    }
  }

  // Permissions Matrix
  public async loadPermissions(): Promise<void> {
    try {
      const list = await firstValueFrom(
        this.http.get<RolePermission[]>(`${this.adminUrl}/permissions`, this.getHeaders()).pipe(
          catchError(() => of(this.getMockPermissions()))
        )
      );
      this.permissions.set(list);
    } catch {
      this.permissions.set(this.getMockPermissions());
    }
  }

  public async savePermission(perm: RolePermission): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<any>(`${this.adminUrl}/permissions`, perm, this.getHeaders()).pipe(
          catchError(() => {
            const list = this.permissions().map(p => p.id === perm.id ? perm : p);
            this.permissions.set(list);
            return of({});
          })
        )
      );
    } catch {
      // simulated
    }
  }

  // Mock initializers
  private getMockUsers(): UserProfile[] {
    return [
      { id: 'usr-1', username: 'admin', displayName: 'System Administrator', role: 'SystemAdmin', smartcardLevel: 4, isActive: true, createdAt: new Date().toISOString() },
      { id: 'usr-2', username: 'fiona_sc', displayName: 'Dr. Fiona Gallagher (NHS Smartcard)', role: 'ClinicalStaff', smartcardLevel: 2, isActive: true, createdAt: new Date().toISOString() },
      { id: 'usr-3', username: 'emily_br', displayName: 'Dr. Emily Briggs', role: 'ClinicalStaff', smartcardLevel: 3, isActive: true, createdAt: new Date().toISOString() }
    ];
  }

  private getMockWards(): WardConfig[] {
    return [
      { id: 'w-1', wardCode: 'AMU', name: 'Acute Medical Unit (AMU)', totalBeds: 24, isInfectionControlZone: false },
      { id: 'w-2', wardCode: 'CCU', name: 'Coronary Care Unit (CCU)', totalBeds: 8, isInfectionControlZone: true },
      { id: 'w-3', wardCode: 'GER', name: 'Geriatic Assessment Ward', totalBeds: 16, isInfectionControlZone: false },
      { id: 'w-4', wardCode: 'ED', name: 'Emergency Department (ED)', totalBeds: 30, isInfectionControlZone: false }
    ];
  }

  private getMockPermissions(): RolePermission[] {
    return [
      { id: 'p-1', role: 'SystemAdmin', allowedModules: ['BedBoard', 'Referrals', 'Booking', 'Emergency', 'Documents', 'MpiDirectory', 'AdminConfig'] },
      { id: 'p-2', role: 'ClinicalStaff', allowedModules: ['BedBoard', 'Referrals', 'Booking', 'Emergency', 'Documents'] }
    ];
  }
}
