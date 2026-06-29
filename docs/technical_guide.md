# CarePortal PAS - Technical Guide

This document details the core technical stack, design patterns, Marten event sourcing lifecycles, Zoneless rendering mechanics, and national demographic checksum algorithms implemented in CarePortal PAS.

---

## 🏛️ Architecture & System Topography

CarePortal utilizes a decoupled architecture split into three distinct tiers:

1. **Presentation Tier**: Standalone Single Page Applications (SPAs) built with Angular 19.
   * **Clinical Cockpit (`frontend/pas-app`)**: Operational portal served via Nginx on port `4200`.
   * **Admin Config App (`frontend/admin-config`)**: Configuration console served via Nginx on port `4300`.
2. **Application Tier**: A modular C# Web API built on `.NET 9` (`Pas.MpiService` running on port `5000`).
3. **Data & Integration Tier**: Backing services supporting database operations, cache, and messaging:
   * **PostgreSQL + Marten**: Document database and event store.
   * **Redis**: Used for distributed waitlist KPI metrics and session cache.
   * **RabbitMQ**: The integration message broker executing event-driven micro-service updates via MassTransit.

---

## 🔄 Marten Event Sourcing & CQRS

CarePortal PAS handles core patient operations (Admissions, Transfers, Discharges, Demographic edits) using **Event Sourcing** instead of traditional CRUD patterns.

### 1. The Write Model (Event Store)
Every clinical event is appended as an immutable record in PostgreSQL inside the `mt_events` table. 
The database stores events under a dedicated *Stream* identified by a unique `PatientId` GUID.
* **`PatientRegisteredEvent`**: Registers demographic details (NHS Number, DOB, names).
* **`PatientAdmittedEvent`**: Records ward code, admitting doctor, and infection risks.
* **`PatientTransferredEvent`**: Records ward changes and bed updates.
* **`PatientDischargedEvent`**: Records discharge time and clinical codes.

### 2. The Read Model (Inline Projections)
To keep query times sub-millisecond, Marten creates and maintains a compiled snapshot projection. 
In `Program.cs`, we register an inline projection for the `Patient` document:

```csharp
options.Projections.Snapshot<Patient>(SnapshotLifecycle.Inline);
```

Whenever an event is appended to a patient stream, Marten synchronously reads the current snapshot, applies the new event details, and writes the updated JSON document to the `mt_doc_patient` table. All search queries (e.g. "Find active inpatients in AMU") target this read-optimized table directly.

---

## ⚡ Zoneless Angular 19 & Signals Reactivity

Traditional Angular applications rely on `zone.js` to patch asynchronous browser APIs (such as `setTimeout`, clicks, and HTTP requests) and trigger global component-tree change-detection cycles. On high-density hospital dashboards with multiple ticking timers (e.g. ED breach clocks), this causes continuous repaint cycles.

In CarePortal, `zone.js` is completely removed:
1. **Bootstrapping**: Bootstrapped in `main.ts` using `provideExperimentalZonelessChangeDetection()`.
2. **Rendering Lifecycle**: 
   * Templates bind directly to Angular **Signals** (`signal`, `computed`).
   * When a signal changes, Angular schedules a microtask to repaint *only* the specific DOM elements bound to that signal.
   * This reduces CPU overhead to near-zero during idle ticks.

---

## 🧮 National Demographics Checksum Algorithms

CarePortal implements strict validation algorithms to prevent input errors on patient identifiers.

### 1. England & Wales: NHS Number
* **Format**: 10-digit numeric string.
* **Algorithm**: Modulus 11 checksum calculation.
  1. Multiply each of the first 9 digits by a descending weight factor from 10 to 2:
     $$\text{Sum} = \sum_{i=1}^{9} d_i \times (11 - i)$$
  2. Calculate the modulus remainder:
     $$\text{Remainder} = \text{Sum} \pmod{11}$$
  3. Subtract the remainder from 11 to obtain the checksum digit:
     $$\text{CheckDigit} = 11 - \text{Remainder}$$
  4. **Rules**:
     * If `CheckDigit == 11`, the actual check digit is `0`.
     * If `CheckDigit == 10`, the number is invalid (NHS numbers cannot end in 10).
     * Verify that `CheckDigit` matches the 10th digit.

### 2. Scotland: CHI Number (Community Health Index)
* **Format**: 10-digit numeric string containing date of birth (`DDMMYY`), a 3-digit sequence (odd for males, even for females), and 1 checksum digit.
* **Algorithm**:
  1. Validate the first 6 digits represent a calendar date.
  2. Compute products using weights: `10, 9, 8, 7, 6, 5, 4, 3, 2`.
  3. Sum products and find remainder:
     $$\text{Remainder} = \left( \sum_{i=1}^{9} d_i \times (11 - i) \right) \pmod{11}$$
  4. Calculate check digit:
     $$\text{CheckDigit} = 11 - \text{Remainder}$$
     * If `CheckDigit == 11`, checksum is `0`.
     * If `CheckDigit == 10`, the CHI number is invalid.

### 3. Ireland: Individual Health Identifier (IHI)
* **Format**: 10-digit numeric string starting with `800` (e.g. `800 120 4567`).
* **Algorithm**: Modulus 11 calculation using descending weight factors: `10, 9, 8, 7, 6, 5, 4, 3, 2`.
