# CarePortal PAS - Production Deployment Guide

This document describes the configurations, container build commands, reverse proxy settings, and security hardening procedures required to deploy CarePortal PAS to staging or enterprise production environments.

---

## 🏛️ Deployment Architecture Overview

CarePortal PAS consists of 6 containerized services orchestrated via Docker Compose:
1. **`pas-postgres`**: PostgreSQL v16 relational engine serving Marten document tables.
2. **`pas-rabbitmq`**: Message broker coordinating asynchronous integration messages.
3. **`pas-redis`**: Redis instance caching waitlist metrics.
4. **`pas-api`**: C# .NET 9 Web API backend service.
5. **`pas-clinical-app`**: Nginx container serving the Clinical Cockpit Angular application on port `4200`.
6. **`pas-admin-app`**: Nginx container serving the Admin Config Angular application on port `4300`.

---

## 📦 Docker Compose Orchestration

We supply two compose manifests:
* `docker-compose.yml`: Local infrastructure backing services (PostgreSQL, Redis, RabbitMQ) for local IDE execution.
* `docker-compose.prod.yml`: Production orchestrator compiling both frontend/backend containers.

### 1. Build and Run Commands (Staging / Production)
Navigate to the root workspace directory and run:

```powershell
# 1. Build the production images
docker compose -f docker-compose.prod.yml build

# 2. Run the container stack in detached mode
docker compose -f docker-compose.prod.yml up -d

# 3. Check health statuses
docker compose -f docker-compose.prod.yml ps
```

The system configures container dependencies dynamically. Frontend SPAs and API backend containers wait automatically for backing services (`pas-postgres`, `pas-rabbitmq`, and `pas-redis`) to pass internal health checks before starting.

### 2. Environment Variables & Connection Strings
Production credentials and host overrides are passed to the `pas-api` container via environment variables in `docker-compose.prod.yml`:
* `ConnectionStrings__pasdb`: `Host=pas-db;Port=5432;Database=pasdb;Username=postgres;Password=postgres;` (Points to internal Docker Postgres container).
* `ConnectionStrings__rabbitmq`: `rabbitmq://pas-rabbitmq` (Points to internal Docker RabbitMQ container).

---

## 🛜 Nginx Configuration & Single Page Routing

To support deep links and HTML5 history routing (preventing 404 errors when users refresh URLs like `/emergency` or `/workspace`), we deploy custom Nginx web configurations inside both Angular containers.

The shared [nginx.conf](file:///d:/Vignesh/PASApplication/frontend/nginx.conf) is defined as:

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```
* **`try_files $uri $uri/ /index.html;`** redirects any unmatched URL requests back to `index.html`, allowing the client Angular router to handle path rendering.

---

## ☸️ Kubernetes Deployment via Aspirate

Aspirate compiles .NET Aspire configuration manifests directly into Kubernetes resources:

### 1. Installation
Install the Aspirate tool globally on your builder machine:
```powershell
dotnet tool install -g Aspirate
```

### 2. Initialization and Generation
Navigate to the Aspire AppHost directory to compile manifests and build container images:
```powershell
cd src/Pas.AppHost

# Initialize Aspirate settings
aspirate init

# Compile Aspire configuration and build deployment manifests
aspirate build
```
This generates standard Kubernetes deployment YAML definitions (deployments, services, persistent volumes) inside the output folder, ready to be applied to private K8s clusters (e.g. AKS, EKS, or on-prem Rancher).

---

## 🛡️ Production Hardening Checklist

When deploying to live hospital networks, complete the following security configurations:

1. **CORS Configuration**:
   * In `Pas.MpiService/Program.cs`, restrict the CORS policy to allow requests *only* from verified clinical client domains instead of wildcard permissions.
2. **JWT Signing Key Rotation**:
   * Replace the default testing HMAC key in `Program.cs` with a secure, high-entropy key managed via safe vault environments (e.g. Azure Key Vault or AWS Secrets Manager).
3. **Database Volume Encryption**:
   * Ensure that the volume mapped to `pas-db-data` utilizes disk-level encryption (BitLocker, LUKS) to secure health data.
4. **SSL/TLS Termination**:
   * Force HTTPS traffic. Deploy Nginx edge gateways or load balancers with SSL certificates to encrypt all data in transit.
