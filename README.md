# CarePortal PAS - UK & Ireland Enterprise Scaffolding

This repository contains a modern, high-performance **Patient Administration System (PAS)** template designed for the **UK (NHS)** and **Ireland (HSE)** healthcare systems.

It demonstrates a robust, scalable architecture using:
* **Backend**: .NET 9/10 Web API, .NET Aspire, PostgreSQL + **Marten** (for Document Store & Event Sourcing audit logs), and **MassTransit** + **RabbitMQ** (for asynchronous events). Secured with **JWT Bearer Token Authentication** (simulating NHS CIS2 smartcard claims). Pre-populated with clinical data using an automatic **database seeder**.
* **Frontend**: Angular 19 utilizing **Experimental Zoneless change detection** (lowering CPU/memory overhead) and **Angular Signals** for reactive state management.
* **Demographics Core**: Modulus-11 validation algorithms for UK NHS Numbers, Scottish CHI Numbers, and Irish IHIs.

---

## 🏛️ Project Directory Structure

```text
PASApplication/
├── docs/                           # System architecture & design documents
│   ├── architecture.md             # Core Tech Stack, Marten Event Sourcing, & Angular Zoneless spec
│   ├── hld.md                      # Network topology, NHS CIS2 credentials, & clinical pathways (RTT)
│   └── lld.md                      # Database serialization schemas, checksums, & Signals state tree
├── src/
│   ├── Pas.sln                     # .NET Solution File
│   ├── Pas.AppHost/                # .NET Aspire Orchestration Host
│   ├── Pas.ServiceDefaults/        # Telemetry, OpenTelemetry, Health checks configuration
│   ├── Pas.Shared/                 # NHS/CHI/IHI validation logic & MassTransit Event contracts
│   └── Pas.MpiService/             # API Service (Marten, MassTransit, Jwt Auth, Seeder, Controllers)
├── frontend/
│   ├── pas-app/                    # Clinical Cockpit SPA (Zoneless Angular 19)
│   └── admin-config/               # System Administration Console SPA (Angular 19)
├── docker-compose.prod.yml         # Production container orchestrator
├── docker-compose.yml              # Local container infrastructure (PostgreSQL, RabbitMQ, Redis)
└── README.md                       # Setup, Developer Testing, and Deployment Guide
```

---

## 📄 Technical Documentation Suite

For detailed specifications, operational manuals, and design guides for the CarePortal PAS platform, please refer to the following resources:

### 1. Functional & User Manuals
* **[Clinical User Guide](file:///d:/Vignesh/PASApplication/docs/user_guide.md)**
  * Step-by-step walk-through of the Clinical Cockpit, workspace tabs, bed boards, clinic scheduling, ED triage, and administrative consoles.
* **[Functional Design Specification](file:///d:/Vignesh/PASApplication/docs/functional_design.md)**
  * Details clinical personas, NHS 18-week RTT target clocks, ED 4-hour treatment breach targets, and Caldicott demographics override audit sequences.

### 2. Architectural & Technical Specifications
* **[System Architecture Specification](file:///d:/Vignesh/PASApplication/docs/architecture.md)**
  * Outlines the three-tier ecosystem, Marten PostgreSQL event sourcing loops, and Angular Zoneless change detection performance.
* **[Technical Guide](file:///d:/Vignesh/PASApplication/docs/technical_guide.md)**
  * In-depth manual covering Marten projection lifecycles, Zoneless change detection repaints, and math equations/checksums for England/Wales, Scotland, and Ireland demographics.
* **[Low-Level Design (LLD)](file:///d:/Vignesh/PASApplication/docs/lld.md)**
  * Details JSON database document serialization schemas and Angular Signals reactive state trees.

### 3. API & Deployment Runbooks
* **[API Guide](file:///d:/Vignesh/PASApplication/docs/api_guide.md)**
  * API endpoint catalog for auth, clinical waitlists, bookings, ED logs, cases, and admin controls with JSON request/response schemas.
* **[Production Deployment Guide](file:///d:/Vignesh/PASApplication/docs/deployment_guide.md)**
  * Set up Docker Compose, configure Nginx HTML5 SPA routing, generate Kubernetes manifests with Aspirate, and implement security hardening checklists.
* **[High-Level Design (HLD)](file:///d:/Vignesh/PASApplication/docs/hld.md)**
  * Describes network topology models, component interface ports, and NHS CIS2 federation claim mappings.

---

## 🗓️ Quick Start Guide (Local Development)

To run the application locally, you have **two options**:
1. **Option A: Traditional Docker + CLI (Recommended for simple setups)**
2. **Option B: .NET Aspire Orchestrated (Cloud-Native/Telemetry Dashboard)**

---

### Option A: Traditional Docker + CLI Setup

#### Prerequisites:
* [.NET 9.0 SDK](https://dotnet.microsoft.com/en-us/download)
* [Node.js (v20+) & NPM](https://nodejs.org/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)

#### 1. Spin up the Database, Cache, and Message Broker
In the root directory of the workspace, start the docker containers:
```powershell
docker compose up -d
```
This starts PostgreSQL (on port 5432), RabbitMQ (on port 5672/15672), and Redis (on port 6379).

#### 2. Run the .NET Web API
Open a terminal and navigate to the backend directory to restore packages and run:
```powershell
cd src
dotnet restore
dotnet run --project Pas.MpiService
```
The API starts at `http://localhost:5000` (Swagger UI is available at `http://localhost:5000/swagger`). The database will be automatically seeded on launch.

#### 3. Run the Clinical Frontend
Open a new terminal and navigate to the clinical frontend directory:
```powershell
cd frontend/pas-app
npm install
npm start
```
The clinical portal is available at `http://localhost:4200/`.

#### 4. Run the Administrative Configuration Console
Open another terminal and navigate to the admin config frontend directory:
```powershell
cd frontend/admin-config
npm install
npm start
```
The admin console is available at `http://localhost:4300/`.

---

### Option B: .NET Aspire Orchestrated Setup

With .NET Aspire, Docker containers for PostgreSQL, RabbitMQ, and Redis are spun up and configured automatically.

#### Prerequisites:
* [.NET 9.0 SDK](https://dotnet.microsoft.com/en-us/download)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* Aspire workload installed (`dotnet workload install aspire`)

#### 1. Run via AppHost
Navigate to the root solution directory and run:
```powershell
cd src
dotnet run --project Pas.AppHost
```
This launches the **.NET Aspire Developer Dashboard**. The dashboard provides real-time access to logs, metrics, open telemetry traces, and URLs for all services.

---

## 🧪 Developer Testing & Verification Guide

### 1. Authentication Portal
* Access `http://localhost:4200/`. You will be redirected to the login page.
* **Smartcard Login**: Click **NHS CIS2 Smartcard Login**. It simulates a smartcard scan (1.5s delay) and redirects you to the visual bedboard as `Dr. Fiona Gallagher`.
* **Credentials Fallback**: Type `admin` (username) and any password to log in as a `SystemAdmin`.

### 2. Clinical Console Modules (Split Views)
The clinical console has been split into dedicated, high-fidelity top-level modules in the navigation bar:

* **Referrals & Waitlist (`/referrals`)**:
  * Segmented into **Outpatient Waitlist** and **Inpatient Waitlist**.
  * Shows RTT (Referral-to-Treatment) wait times calculated in weeks.
  * Note **Fiona O'Connor**'s entry (15 weeks wait): It pulses a red **`RTT BREACH RISK`** alert because it is approaching the standard **NHS 18-week pathway limit**.
  * **Test Intake**: Use the form on the left to submit a new GP/e-RS referral (Inpatient or Outpatient). It automatically adds the patient to the waitlist and starts an active RTT clock.

* **Clinic Booking (`/booking`)**:
  * Displays scheduled consultations and inpatient admissions.
  * **Test Booking**: Go to `/referrals`, click **Schedule Appointment** or **Schedule Bed Booking** on a waiting patient. It redirects you to the booking scheduler and pre-fills their details. Choose a date and location, then click **Confirm & Book Slot**. The patient will be scheduled.

* **Emergency Dept (ED) (`/emergency`)**:
  * Renders a real-time Emergency Department monitor board. Patients are color-coded by triage severity level (1-Immediate to 5-Non-Urgent).
  * Tracks check-in time: Note **Sarah Jenkins** (elapsed 3.2 hours). If a patient exceeds 240 minutes, a flashing red **`4-HOUR BREACH`** alert appears, modeling the **NHS 4-hour ED treatment limit**.
  * **Test Triage**: Click **Triage** on a patient. Use the form below to change their triage category (e.g. from Standard to Category 2 - Very Urgent) and save. Observe the triage badge and board color update instantly.
  * **Test Discharge**: Click **Discharge** on a patient. They are removed from the active ED board.

* **Case Documents (`/documents`)**:
  * Select a patient (e.g. Fiona O'Connor) from the dropdown. It loads their medical record history (GP letters, Orthopaedic discharge files with **SNOMED/ICD-11 codes**).
  * **Test Editor**: Use the Markdown editor on the right to type a consultation note. Click **Save Case Document**. The note is saved to Marten and appended to the patient's record on the left.

* **Patient Directory & MPI (`/mpi`)**:
  * Click **Patient Directory (MPI)**.
  * **Access Denied Demonstration**: Displays a secure clinical lock warning stating: **`Access Restricted: Caldicott Guardian Authorization Required (Level 4 Demographics MPI Required)`**. Displays your active smartcard session claims and authority (NHS CIS2 OIDC Provider).
  * **Caldicott Override**: Click **Request Caldicott Guardian Override (Audited)**. It logs a security audit reference code (`NHS-REQ-XXXXXX`) and notifies the guardian.

### 3. Swagger API Authorization & Testing
1. Open `http://localhost:5000/swagger`.
2. Expand `GET /api/Clinical/waitinglist` and click **Execute**. It returns a **`401 Unauthorized`** response.
3. Authenticate by sending a request to `POST /api/Auth/login-simulated`. Copy the returned JWT token.
4. Click the green **Authorize** button at the top of the Swagger page, type `Bearer <your_copied_token>` and click Authorize.
5. Re-execute the waiting list endpoint. It will now return `200 OK` and display the seeded waitlist database records.

### 4. Administrative Configuration Console
* Access `http://localhost:4300/`.
* **SystemAdmin Authentication**: Type `admin` (username) and any password, or toggle **NHS Smartcard Login** to authenticate. Since the backend checks for the `SystemAdmin` role claim, only users logged in as admin will pass the authorization filter.
* **User Directory Tab**: Manage all user profiles. View current practitioners, edit roles/levels, disable/active logins, or click **Register User** to add new users.
* **Ward Configurator Tab**: Increase or decrease bed limits for wards. Toggle **Infectious Isolation** to see the card dynamically turn into a hazard zone.
* **Permissions Grid Tab**: Assign system access modules to individual roles (`SystemAdmin`, `ClinicalStaff`, `WardManager`). Click **Save Permissions Matrix** to sync the configurations to Marten/PostgreSQL.

---

## 🚢 Production Deployment Guide

CarePortal PAS supports containerized orchestration out of the box, allowing deployment to local staging or enterprise private cloud infrastructures.

---

### 1. Full Multi-Container Docker Deployment

We provide a production-ready containerized configuration in [docker-compose.prod.yml](file:///d:/Vignesh/PASApplication/docker-compose.prod.yml). This file orchestrates 6 decoupled services on a unified internal network:
1. **Database (`pas-postgres`)**: PostgreSQL database hosting Marten JSONB tables and event streams.
2. **Broker (`pas-rabbitmq`)**: RabbitMQ broker coordinating integration events.
3. **Cache (`pas-redis`)**: Redis cache for waitlist metrics and locks.
4. **API Engine (`pas-api`)**: .NET 9 Web API backend (compiled using multi-stage Dockerfiles).
5. **Clinical Client (`pas-clinical-app`)**: Standalone Zoneless Angular 19 app served via Nginx on port `4200`.
6. **Admin Client (`pas-admin-app`)**: Standalone system configuration app served via Nginx on port `4300`.

#### Build & Launch Steps:

1. **Verify Docker Daemon**: Ensure Docker Desktop or the docker daemon is active.
2. **Build Production Images**:
   Build the production container images locally. This compiles both Angular apps in production configuration (optimizing assets) and compiles/publishes the C# API assemblies:
   ```powershell
   docker compose -f docker-compose.prod.yml build
   ```
3. **Start the Service Stack**:
   Launch the container stack in detached mode:
   ```powershell
   docker compose -f docker-compose.prod.yml up -d
   ```
4. **Monitor Startup & Health**:
   Verify that all services are online. The API and frontend services wait automatically for PostgreSQL, RabbitMQ, and Redis to report as `healthy` before booting:
   ```powershell
   docker compose -f docker-compose.prod.yml ps
   ```

#### Exposing Ports & Entrypoints:
* **Clinical Cockpit App**: Open `http://localhost:4200` in your web browser.
* **Admin Console App**: Open `http://localhost:4300` in your web browser.
* **Backend Web API (Swagger UI)**: Access `http://localhost:5000/swagger`.
* **RabbitMQ Management Dashboard**: Access `http://localhost:15672` (default credentials: `guest` / `guest`).

#### Stopping the Stack:
To tear down the container networks and retain database volumes:
```powershell
docker compose -f docker-compose.prod.yml down
```

---

### 2. Generating Kubernetes Manifests with Aspirate

Aspirate compiles Aspire configurations into Kubernetes manifest files (YAMLs) for deployment on local or cloud K8s engines:
1. Install Aspirate globally:
   ```powershell
   dotnet tool install -g Aspirate
   ```
2. Initialize and generate templates in `src/Pas.AppHost`:
   ```powershell
   cd src/Pas.AppHost
   aspirate init
   aspirate build
   ```
This generates deployment definitions for your APIs, Redis, RabbitMQ, and PostgreSQL databases, ready for deployment to private Kubernetes clusters.

