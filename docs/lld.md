# CarePortal PAS - Low-Level Design (LLD)

This document provides detailed class maps, database serialization schemas, validation algorithms, and Angular Signals reactive state specifications.

---

## 💾 Domain Models & Marten Serialization Schemas

All model classes are stored as JSONB document structures inside PostgreSQL. Marten prefixes document tables with `mt_doc_`.

### 1. UserProfile (Administrative Directory)
* **Table**: `mt_doc_userprofile`
* **Schema**:
```json
{
  "id": "guid (primary key)",
  "username": "string (unique index)",
  "displayName": "string",
  "role": "string (ClinicalStaff | SystemAdmin | WardManager)",
  "smartcardLevel": "int (1 to 4)",
  "isActive": "boolean",
  "createdAt": "date-time"
}
```

### 2. WardConfig (ADT Ward Bed Limits)
* **Table**: `mt_doc_wardconfig`
* **Schema**:
```json
{
  "id": "guid",
  "wardCode": "string",
  "name": "string",
  "totalBeds": "int",
  "isInfectionControlZone": "boolean"
}
```

### 3. Patient Aggregate (Event Sourced Projection)
* **Table**: `mt_doc_patient` (Inline snapshot projected table built from `mt_events`)
* **Schema**:
```json
{
  "id": "guid",
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "date-time",
  "nhsNumber": "string (nullable)",
  "chiNumber": "string (nullable)",
  "ihiNumber": "string (nullable)",
  "currentWard": "string (nullable)",
  "currentBed": "string (nullable)",
  "isAdmitted": "boolean",
  "admittedAt": "date-time (nullable)",
  "infectionControlAlerts": "string (nullable)"
}
```

---

## 🧮 National Demographics Checksum Algorithms

CarePortal implements strict validation algorithms for the three national patient identifier systems in the UK and Ireland.

### 1. UK NHS Number Modulus 11 Checksum (England & Wales)
* **Format**: 10-digit numeric string.
* **Algorithm**:
  1. Multiply each of the first 9 digits by a descending weight factor from 10 to 2.
  2. Sum the products:
     $$\text{Sum} = \sum_{i=1}^{9} d_i \times (11 - i)$$
  3. Calculate the modulus remainder:
     $$\text{Remainder} = \text{Sum} \pmod{11}$$
  4. Subtract remainder from 11 to calculate checksum digit:
     $$\text{CheckDigit} = 11 - \text{Remainder}$$
  5. **Rules**:
     * If `CheckDigit == 11`, the actual checksum is `0`.
     * If `CheckDigit == 10`, the number is invalid (NHS numbers cannot end in 10).
     * Otherwise, verify that `CheckDigit` matches the 10th digit.

### 2. Scottish CHI Number Checksum
* **Format**: 10-digit numeric string containing date of birth (`DDMMYY`), a 3-digit sequence (odd for males, even for females), and 1 checksum digit.
* **Algorithm**:
  1. Parse the first 6 digits to verify a valid date.
  2. Compute products using weights: `10, 9, 8, 7, 6, 5, 4, 3, 2`.
  3. Sum products and find remainder:
     $$\text{Remainder} = \left( \sum_{i=1}^{9} d_i \times (11 - i) \right) \pmod{11}$$
  4. Calculate check digit:
     $$\text{CheckDigit} = 11 - \text{Remainder}$$
     * If `CheckDigit == 11`, checksum is `0`.
     * If `CheckDigit == 10`, the CHI number is invalid.

### 3. Irish Individual Health Identifier (IHI) Checksum
* **Format**: 10-digit numeric string starting with `800` (e.g. `800 120 4567`).
* **Algorithm**:
  * Employs a standard Modulus 11 checksum calculation using weights: `10, 9, 8, 7, 6, 5, 4, 3, 2`.

---

## 🌲 Angular Signals State Tree

The clinical cockpit manages the tab browser interface and service connections using fine-grained Signals:

### 1. Workspace Tab State ([clinical-console.component.ts](file:///d:/Vignesh/PASApplication/frontend/pas-app/src/app/components/clinical-console.component.ts))
* **State Tree**:
  * `tabs = signal<WorkspaceTab[]>([])`: Holds the list of currently opened browser-style tabs.
  * `activeTabId = signal<string>('')`: The ID of the currently selected active tab.
  * `showAddDropdown = signal<boolean>(false)`: Visibility toggle for the "Launch Module" menu.
* **Computed/Derived State**:
  * Deep links route URLs sync automatically with `activeTabId` changes using `router.navigate()`.

### 2. Global Clinical State ([patient.service.ts](file:///d:/Vignesh/PASApplication/frontend/pas-app/src/app/services/patient.service.ts))
* **State Tree**:
  * `patientsSignal = signal<Patient[]>([])`: Loaded inpatient array.
  * `loadingSignal = signal<boolean>(false)`: API HTTP connection progress status.
  * `errorSignal = signal<string | null>(null)`: API error state.
  * `activeSchedulingRequest = signal<SchedulingRequest | null>(null)`: Shared state holding waitlist details to pass to the Booking tab.
* **Computed/Derived State**:
  * `totalInpatients = computed(() => this.patients().length)`: Computes active inpatients.
  * `infectionAlertCount = computed(() => this.patients().filter(p => p.infectionControlAlerts && p.infectionControlAlerts !== 'None').length)`: Active isolation count.
