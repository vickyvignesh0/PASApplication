# CarePortal PAS - API Guide

This document describes the API endpoints, authorization mechanisms, request/response models, and testing procedures for the CarePortal Patient Administration System (PAS) backend services.

---

## 🔒 Authentication & Authorization

All endpoints in CarePortal PAS (except for simulated authentication) require JWT Bearer authorization.

### JWT Claims Format
When a user logs in, the API returns a JWT token containing standard security claims:
* `unique_name`: Username (e.g., `fiona_sc`).
* `role`: System security role (`ClinicalStaff`, `SystemAdmin`, or `WardManager`).
* `nhs_user_id`: Simulated practitioner smartcard ID (e.g., `NHS-SC-883921`).
* `smartcard_level`: Smartcard permission tier (1 to 4).

To access authorized endpoints, attach the JWT token in the HTTP header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 🔑 Authentication Endpoints

### 1. Post Simulated Credentials / Smartcard Scan
Exposes credential authentication or simulated NHS Smartcard validation.
* **URL**: `/api/auth/login-simulated`
* **Method**: `POST`
* **Request Payload**:
```json
{
  "username": "admin",
  "password": "any_password",
  "useSmartcard": false
}
```
* **Response Payload (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "displayName": "Dr. Fiona Gallagher (NHS Smartcard)",
  "role": "ClinicalStaff",
  "userIdentifier": "NHS-SC-883921"
}
```

---

## 🏥 Clinical Cockpit Endpoints

### 1. Waitlist & e-RS Referrals
* **GET Waiting List**: Retrieve all patients currently waiting for outpatient/inpatient treatment.
  * **URL**: `/api/clinical/waitinglist`
  * **Method**: `GET`
  * **Response (200 OK)**:
  ```json
  [
    {
      "id": "guid",
      "firstName": "Fiona",
      "lastName": "O'Connor",
      "dateOfBirth": "1982-05-14T00:00:00Z",
      "nhsNumber": "4882910293",
      "specialty": "Orthopaedics",
      "priority": "Urgent",
      "pathwayType": "Inpatient",
      "dateAdded": "2026-03-01T10:00:00Z",
      "status": "Waiting"
    }
  ]
  ```

* **Create e-RS Referral**: Submit a new GP/e-RS referral and start the RTT pathway clock.
  * **URL**: `/api/clinical/referrals`
  * **Method**: `POST`
  * **Request Payload**:
  ```json
  {
    "firstName": "Sarah",
    "lastName": "Jenkins",
    "dateOfBirth": "1994-08-22T00:00:00Z",
    "nhsNumber": "9448820192",
    "specialty": "Cardiology",
    "priority": "Routine",
    "pathwayType": "Outpatient"
  }
  ```

### 2. Clinic Booking & Bed Scheduling
* **Schedule Appointment**: Move a patient from the waitlist to a scheduled slot.
  * **URL**: `/api/clinical/bookings`
  * **Method**: `POST`
  * **Request Payload**:
  ```json
  {
    "waitingListEntryId": "guid-waitlist-entry",
    "clinicianName": "Dr. Fiona Gallagher",
    "scheduledDate": "2026-07-20T10:30:00Z",
    "location": "Outpatient Clinic B",
    "notes": "Consultation for heart murmur assessment."
  }
  ```

### 3. Emergency Department (ED)
* **Log ED Arrival**: Register a new casualty presenting at the emergency care ward.
  * **URL**: `/api/clinical/emergency/attend`
  * **Method**: `POST`
  * **Request Payload**:
  ```json
  {
    "firstName": "Robert",
    "lastName": "Smith",
    "dateOfBirth": "1975-11-05T00:00:00Z",
    "chiefComplaint": "Chest pain, radiating to left arm",
    "triageCategory": 2
  }
  ```

* **Update Triage Level**: Change a patient's Manchester Triage category based on nurse assessment.
  * **URL**: `/api/clinical/emergency/triage`
  * **Method**: `POST`
  * **Request Payload**:
  ```json
  {
    "attendanceId": "guid-attendance",
    "triageCategory": 1,
    "triageNotes": "Cardiac arrest alert. Moving to resuscitation suite."
  }
  ```

* **Discharge Patient**: Discharge a patient from the active ED board.
  * **URL**: `/api/clinical/emergency/discharge/{id}`
  * **Method**: `POST`

---

## 🛠️ Administrative Configuration Endpoints

All admin endpoints require user claims containing the `SystemAdmin` role.

### 1. User Directory
* **GET Users**: `/api/admin/users` (`GET`)
* **Register Practitioner**:
  * **URL**: `/api/admin/users`
  * **Method**: `POST`
  * **Request Payload**:
  ```json
  {
    "username": "nurse_jane",
    "displayName": "Jane Davis",
    "role": "ClinicalStaff",
    "smartcardLevel": 2,
    "isActive": true
  }
  ```

### 2. Ward Configurations
* **Update Ward Bed Limits & Isolation**:
  * **URL**: `/api/admin/wards`
  * **Method**: `POST`
  * **Request Payload**:
  ```json
  {
    "id": "guid-ward",
    "wardCode": "AMU",
    "name": "Acute Medical Unit",
    "totalBeds": 15,
    "isInfectionControlZone": true
  }
  ```
