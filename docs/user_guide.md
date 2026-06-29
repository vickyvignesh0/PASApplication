# CarePortal PAS - User Guide

This guide is designed for clinicians, ward managers, and system administrators operating the CarePortal Patient Administration System (PAS).

---

## 🔑 Authentication Portal & Session Entry

CarePortal implements a unified login portal supporting secure access:

### 1. Smartcard Login (Clinicians & Ward Managers)
* Click **NHS CIS2 Smartcard Login**.
* The portal simulates card scanning (approx. 1.5s delay).
* Once authenticated, you will be redirected to the Clinical Cockpit dashboard as `Dr. Fiona Gallagher` (Security Level 2).

### 2. Manual Credentials Fallback
* Enter your assigned system credentials:
  * **SystemAdmin Access**: Username: `admin` (any password). Granting Level 4 access.
  * **Practitioner Access**: Username: `fiona_sc` or `ward_manager` (any password).

---

## 🎛️ Clinical Cockpit & Dynamic Workspace Tabs

The Clinical Cockpit provides a **multi-tab workspace** designed to prevent loss of clinical information during busy shifts:

* **Tab Selection Bar**: Located at the top of the interface. Tabs represent active sessions (e.g. `Emergency care`, `Waiting list`).
* **Launching Modules**: Click the **Launch Module (+)** dropdown to open a new tab session.
* **State Preservation**: Switch between tabs at any time. The system retains whatever you are working on (e.g., half-written case notes in the document writer) because components are kept alive in the DOM.
* **Closing Tabs**: Click the **`x`** icon on a tab. If all tabs are closed, you will return to the central **Workspace Deck** to select a module.

---

## 📋 Waitlist & GP Referrals

### 1. Navigating the Waitlist
Open the **Referrals & Waitlist** module. The screen is split into:
* **Outpatient Waitlist**: Patients waiting for clinic consults.
* **Inpatient Waitlist**: Patients waiting for inpatient surgeries/procedures.

### 2. Understanding the RTT Clock (Referral-to-Treatment)
Each patient shows an elapsed week wait calculated against the referral date:
* **Green**: Safe zone ($<12$ weeks).
* **Amber**: Escalation warning ($12-14$ weeks).
* **Red Pulsing (`RTT BREACH RISK`)**: High priority breach warning ($\ge 15$ weeks), requiring immediate appointment booking to comply with the NHS 18-week mandate.

### 3. Adding e-RS Referrals
Use the **GP Referral Intake Form** on the left to submit patient details (Name, DOB, NHS Number, Priority, Pathway Type). Click **Submit Referral** to instantly add the patient to the waitlist and start their RTT clock.

---

## 📅 Scheduling Appointments & Bed Bookings

1. Locate a patient in the waitlist and click **Schedule Appointment** or **Schedule Bed Booking**.
2. The workspace will automatically switch to the **Clinic Booking** tab and pre-populate the patient's name, NHS/CHI/IHI number, and referral details.
3. Select a consultation date, location clinic/room, and consultant, and click **Confirm & Book Slot**. The patient is scheduled, and their waitlist status updates to `Scheduled`.

---

## 🚨 Emergency Care & Triage Clock

The Emergency Department (ED) monitor board displays real-time casualty cards:

* **Triage Severity Color Codes**: Cards are color-coded based on severity:
  * **Red (Category 1)**: Immediate Resuscitation.
  * **Orange (Category 2)**: Very Urgent.
  * **Yellow (Category 3)**: Urgent.
  * **Green (Category 4)**: Standard.
  * **Blue (Category 5)**: Non-Urgent.
* **Monitoring the Breach Clock**:
  * Each card displays a timer tracking total elapsed minutes since check-in.
  * **Warning (Yellow Border)**: Triggered at 3 hours (180 minutes).
  * **Flashing Red (`4-HOUR BREACH`)**: Triggered at 4 hours (240 minutes), demanding immediate discharge or ward admission.
* **Triage assessment**: Click **Triage** on a patient card to update triage severity or record notes.
* **Discharge**: Click **Discharge** on a card once treatment is completed.

---

## 🛡️ Caldicott Demographics MPI Decoupling

* Access the **Patient Directory (MPI)** tab.
* By default, identifying demographic data is locked (displays Caldicott security notice).
* Click **Request Caldicott Guardian Override** to bypass the lock. The system will log a secure override ID and display the database records.

---

## ⚙️ Administrative Configuration Console

Access the separate Administrative Console (`http://localhost:4300`) to manage configurations:

### 1. Clinical User Directory
* View registered practitioners, edit active statuses, adjust smartcard security levels (1 to 4), and assign security roles.
* Click **Register User** to configure new profiles.

### 2. Ward Configurator
* Adjust total allocated bed limits for wards.
* Toggle **Infectious Isolation** on a ward. When enabled, a hotzone warning banner flashes across the ward card.

### 3. Permissions Matrix
* Define which clinical roles have access to individual modules (e.g. locking the Bed Board or Demographics Directory from specific roles).
* Click **Save Permissions Matrix** to sync permissions to the server.
