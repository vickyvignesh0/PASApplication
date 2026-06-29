import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PatientService, ClinicalDocument, Patient } from '../services/patient.service';

@Component({
  selector: 'app-clinical-documents',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Header -->
      <div class="border-b border-slate-150 pb-5">
        <span class="text-[10px] font-bold text-nhs-blue uppercase tracking-widest">Medical Records Module</span>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Clinical Case Notes & Documents</h2>
        <p class="text-xs text-slate-500">Record, compile, and review electronic medical documents and case files.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Patient Documents directory index -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 h-fit">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div class="h-8 w-8 rounded-lg bg-blue-50 text-nhs-blue flex items-center justify-center">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2" />
              </svg>
            </div>
            <h3 class="font-bold text-slate-950 text-sm">Medical Record Index</h3>
          </div>
          
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase">Select Active Patient</label>
            <select [(ngModel)]="documentPatientId" name="docPatientId" (change)="onPatientDocChange()" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none">
              @for (p of patients(); track p.id) {
                <option [value]="p.id">{{ p.lastName }}, {{ p.firstName }}</option>
              }
            </select>
          </div>

          <hr class="border-slate-150" />

          <div class="space-y-3">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clinical Case Documents</h4>
            @for (d of documents(); track d.id) {
              <div 
                (click)="selectedDocument.set(d)"
                [class]="'p-3 border rounded-xl cursor-pointer hover:bg-slate-50/50 transition-all duration-150 ' + (selectedDocument()?.id === d.id ? 'border-nhs-blue bg-blue-50/10' : 'border-slate-150')">
                <span class="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full float-right border border-slate-200/50">
                  {{ d.documentType }}
                </span>
                <h5 class="font-bold text-slate-950 text-sm leading-tight truncate pr-16">{{ d.title }}</h5>
                <span class="text-[10px] text-slate-400 block mt-1">Author: {{ d.author }} • {{ formatDate(d.createdAt) }}</span>
              </div>
            } @empty {
              <p class="text-xs text-slate-400 py-3 italic">No medical records on file for this patient.</p>
            }
          </div>
        </div>

        <!-- Right: Document viewer / Case Note writer -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Document Reader Panel -->
          @if (selectedDocument(); as doc) {
            <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 animate-slide-in">
              <div class="flex justify-between items-start border-b border-slate-150 pb-3">
                <div>
                  <span class="text-[10px] font-bold tracking-widest text-nhs-blue uppercase">{{ doc.documentType }}</span>
                  <h3 class="text-xl font-bold text-slate-950 mt-0.5">{{ doc.title }}</h3>
                  <p class="text-xs text-slate-400">Authored by {{ doc.author }} on {{ formatDate(doc.createdAt) }}</p>
                </div>
                <button (click)="selectedDocument.set(null)" class="text-xs text-slate-500 hover:text-slate-700 font-semibold border border-slate-350 px-2 py-1 rounded-md">
                  Close File
                </button>
              </div>
              
              <!-- Clinical Text Body -->
              <div class="text-slate-800 font-sans leading-relaxed whitespace-pre-wrap mt-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100 font-mono text-xs">
                {{ doc.content }}
              </div>
            </div>
          }

          <!-- Case Note Writer -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div class="h-8 w-8 rounded-lg bg-blue-50 text-nhs-blue flex items-center justify-center">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 class="font-bold text-slate-950 text-sm">Write Clinical Case Notes</h3>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase">Document Title</label>
                <input type="text" [(ngModel)]="newDoc.title" name="docTitle" placeholder="e.g. Ward Consultation Note" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase">Document Type</label>
                <select [(ngModel)]="newDoc.documentType" name="docType" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none">
                  <option value="ClinicalNote">Clinical Note</option>
                  <option value="DischargeSummary">Discharge Summary</option>
                  <option value="ReferralLetter">Referral Letter</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase">Findings & Treatment Plan</label>
              <textarea [(ngModel)]="newDoc.content" name="docContent" rows="6" placeholder="Enter findings, clinical coding details (ICD-11/SNOMED CT)..." class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs mt-1 focus:ring-2 focus:ring-nhs-blue focus:outline-none font-mono"></textarea>
            </div>

            <div class="flex justify-end">
              <button 
                (click)="submitDocument()"
                [disabled]="!documentPatientId"
                class="bg-nhs-blue hover:bg-nhs-darkBlue disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-250 shadow-sm">
                Save Case Document
              </button>
            </div>
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
export class ClinicalDocumentsComponent implements OnInit {
  patientService = inject(PatientService);

  patients = this.patientService.patients;
  documents = signal<ClinicalDocument[]>([]);
  selectedDocument = signal<ClinicalDocument | null>(null);

  documentPatientId = '';

  newDoc = {
    title: '',
    documentType: 'ClinicalNote',
    content: ''
  };

  ngOnInit() {
    if (this.patients().length > 0) {
      this.documentPatientId = this.patients()[0].id;
      this.onPatientDocChange();
    }
  }

  async onPatientDocChange() {
    if (!this.documentPatientId) return;
    this.documents.set(await this.patientService.loadPatientDocuments(this.documentPatientId));
    this.selectedDocument.set(null);
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  async submitDocument() {
    if (!this.documentPatientId || !this.newDoc.title || !this.newDoc.content) return;

    await this.patientService.saveClinicalDocument({
      patientId: this.documentPatientId,
      title: this.newDoc.title,
      documentType: this.newDoc.documentType,
      content: this.newDoc.content
    });

    this.newDoc.title = '';
    this.newDoc.content = '';
    
    await this.onPatientDocChange();
  }
}
