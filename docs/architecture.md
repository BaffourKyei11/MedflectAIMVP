# Medflect AI Architecture

## Overview

Medflect AI is a comprehensive healthcare PWA that combines modern web technologies with AI-powered insights, FHIR R4 compliance, and blockchain-based audit trails. The system is designed with offline-first capabilities, ensuring healthcare providers can continue working even when connectivity is limited.

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        PWA[PWA Web App]
        Mobile[Mobile App]
        SW[Service Worker]
        IDB[IndexedDB]
    end
    
    subgraph "API Gateway"
        Supabase[Supabase Edge Functions]
        Auth[Authentication]
        RLS[Row Level Security]
    end
    
    subgraph "Data Layer"
        Postgres[(PostgreSQL)]
        FHIR[FHIR Resources]
        Audit[Audit Logs]
        Users[User Management]
    end
    
    subgraph "AI Services"
        Groq[Groq LLM API]
        Templates[Prompt Templates]
        Provenance[Provenance Tracking]
    end
    
    subgraph "Blockchain"
        SmartContracts[Smart Contracts]
        Ganache[Local Network]
        AuditChain[Audit Chain]
    end
    
    subgraph "External Services"
        SMS[SMS Service]
        Email[Email Service]
        FHIRAPI[FHIR APIs]
    end
    
    PWA --> Supabase
    Mobile --> Supabase
    SW --> IDB
    Supabase --> Postgres
    Supabase --> Groq
    Supabase --> SmartContracts
    SmartContracts --> Ganache
    Supabase --> SMS
    Supabase --> Email
    Supabase --> FHIRAPI
```

## Component Architecture

### Frontend (PWA)

```mermaid
graph LR
    subgraph "React Components"
        App[App.tsx]
        Layout[Layout.tsx]
        Pages[Pages]
        Components[Components]
    end
    
    subgraph "State Management"
        AuthContext[Auth Context]
        SyncContext[Sync Context]
        ToastContext[Toast Context]
    end
    
    subgraph "Services"
        FHIRService[FHIR Service]
        AIService[AI Service]
        OfflineStorage[Offline Storage]
    end
    
    subgraph "PWA Features"
        ServiceWorker[Service Worker]
        Manifest[Web App Manifest]
        BackgroundSync[Background Sync]
    end
    
    App --> Layout
    Layout --> Pages
    Layout --> Components
    App --> AuthContext
    App --> SyncContext
    App --> ToastContext
    Pages --> FHIRService
    Pages --> AIService
    Components --> OfflineStorage
    App --> ServiceWorker
    App --> Manifest
    ServiceWorker --> BackgroundSync
```

### Backend Services

```mermaid
graph TB
    subgraph "Supabase Edge Functions"
        FHIRAPI[FHIR API]
        AIProxy[AI Proxy]
        SyncAPI[Sync API]
        AuditAPI[Audit API]
    end
    
    subgraph "Database Schema"
        Users[Users Table]
        Patients[Patients Table]
        FHIRResources[FHIR Resources Table]
        AuditLogs[Audit Logs Table]
        Consents[Consents Table]
    end
    
    subgraph "Security"
        RLS[Row Level Security]
        Policies[RLS Policies]
        JWT[JWT Tokens]
    end
    
    subgraph "External Integrations"
        GroqAPI[Groq API]
        Blockchain[Blockchain]
        SMSService[SMS Service]
    end
    
    FHIRAPI --> Users
    FHIRAPI --> Patients
    FHIRAPI --> FHIRResources
    AIProxy --> GroqAPI
    AIProxy --> FHIRResources
    SyncAPI --> FHIRResources
    AuditAPI --> AuditLogs
    AuditAPI --> Blockchain
    RLS --> Policies
    Policies --> Users
    Policies --> Patients
    Policies --> FHIRResources
```

## Data Flow

### Patient Data Flow

```mermaid
sequenceDiagram
    participant Clinician
    participant PWA
    participant ServiceWorker
    participant IndexedDB
    participant Supabase
    participant Database
    participant AI
    participant Blockchain
    
    Clinician->>PWA: Create Patient
    PWA->>ServiceWorker: Store Offline
    ServiceWorker->>IndexedDB: Save to Local DB
    
    Note over PWA: When Online
    
    PWA->>Supabase: Sync Patient Data
    Supabase->>Database: Store FHIR Resource
    Supabase->>Blockchain: Log Consent
    Blockchain-->>Supabase: Transaction Hash
    
    Clinician->>PWA: Request AI Summary
    PWA->>Supabase: Call AI Proxy
    Supabase->>Database: Fetch Patient Data
    Supabase->>AI: Generate Summary
    AI-->>Supabase: AI Response + Provenance
    Supabase->>Database: Store DocumentReference
    Supabase->>Blockchain: Log Access
    Supabase-->>PWA: AI Summary
```

### Offline Sync Flow

```mermaid
sequenceDiagram
    participant PWA
    participant ServiceWorker
    participant IndexedDB
    participant Supabase
    participant Database
    
    Note over PWA: Offline Mode
    PWA->>ServiceWorker: Store Changes
    ServiceWorker->>IndexedDB: Queue for Sync
    
    Note over PWA: Online Mode
    ServiceWorker->>Supabase: Check Connectivity
    Supabase-->>ServiceWorker: Online Status
    
    ServiceWorker->>IndexedDB: Get Pending Changes
    ServiceWorker->>Supabase: Sync Changes
    Supabase->>Database: Apply Changes
    Database-->>Supabase: Success Response
    Supabase-->>ServiceWorker: Sync Complete
    ServiceWorker->>IndexedDB: Clear Pending
    ServiceWorker->>PWA: Update UI
```

## Security Architecture

### Authentication & Authorization

```mermaid
graph TB
    subgraph "Authentication Flow"
        Login[Login Form]
        OTP[OTP Verification]
        JWTToken[JWT Token]
        Refresh[Refresh Token]
    end
    
    subgraph "Authorization"
        UserRole[User Role]
        RLS[Row Level Security]
        Policies[Access Policies]
        Audit[Audit Logging]
    end
    
    subgraph "Security Measures"
        HTTPS[HTTPS Only]
        CORS[CORS Policy]
        RateLimit[Rate Limiting]
        InputValidation[Input Validation]
    end
    
    Login --> OTP
    OTP --> JWTToken
    JWTToken --> UserRole
    UserRole --> RLS
    RLS --> Policies
    Policies --> Audit
    HTTPS --> CORS
    CORS --> RateLimit
    RateLimit --> InputValidation
```

### Data Protection

```mermaid
graph LR
    subgraph "Data Encryption"
        AtRest[Encryption at Rest]
        InTransit[TLS Encryption]
        FieldLevel[Field Level Encryption]
    end
    
    subgraph "Access Control"
        RBAC[Role Based Access]
        MFA[Multi-Factor Auth]
        SessionMgmt[Session Management]
    end
    
    subgraph "Audit & Compliance"
        AuditLogs[Audit Logs]
        Blockchain[Blockchain Audit]
        Compliance[FHIR Compliance]
    end
    
    AtRest --> RBAC
    InTransit --> MFA
    FieldLevel --> SessionMgmt
    RBAC --> AuditLogs
    MFA --> Blockchain
    SessionMgmt --> Compliance
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + ShadCN/Radix UI
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **PWA**: Workbox + Service Worker
- **Offline Storage**: IndexedDB + localforage

### Backend
- **Platform**: Supabase (PostgreSQL + Edge Functions)
- **Database**: PostgreSQL 15 with JSONB support
- **Authentication**: Supabase Auth with JWT
- **API**: RESTful APIs with FHIR compliance
- **Security**: Row Level Security (RLS)

### AI & External Services
- **LLM**: Groq API with custom prompts
- **Blockchain**: Ethereum smart contracts (Hardhat)
- **SMS**: Twilio/Africa's Talking integration
- **Email**: Supabase built-in email service

### Development & Deployment
- **Package Manager**: npm workspaces
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

## Performance Considerations

### PWA Optimization
- Service Worker caching strategies
- Lazy loading of components
- Code splitting with dynamic imports
- Optimized bundle sizes
- Background sync for offline operations

### Database Optimization
- Indexed JSONB columns for FHIR queries
- Connection pooling
- Query optimization with proper indexes
- Read replicas for scaling

### AI Response Optimization
- Prompt template caching
- Response streaming for long summaries
- Fallback to cached responses
- Rate limiting and cost optimization

## Scalability

### Horizontal Scaling
- Supabase auto-scaling capabilities
- Edge Functions distributed globally
- CDN for static assets
- Load balancing for high traffic

### Vertical Scaling
- Database instance upgrades
- Memory and CPU optimization
- Connection pool tuning
- Cache layer implementation

## Monitoring & Observability

### Application Metrics
- Performance monitoring (Core Web Vitals)
- Error tracking and alerting
- User behavior analytics
- API response times

### Infrastructure Metrics
- Database performance
- Edge Function execution times
- Blockchain transaction monitoring
- External API health checks

### Audit Trail
- Comprehensive logging
- Blockchain-based audit trail
- Compliance reporting
- Data lineage tracking

## Disaster Recovery

### Backup Strategy
- Automated database backups
- Point-in-time recovery
- Cross-region replication
- Offline data backup

### Business Continuity
- Multi-region deployment
- Failover procedures
- Data recovery processes
- Communication protocols

## Compliance & Governance

### FHIR Compliance
- FHIR R4 resource validation
- Standard FHIR operations
- Extensions for custom fields
- Terminology binding

### Healthcare Regulations
- HIPAA compliance measures
- Data privacy protection
- Consent management
- Audit trail requirements

### Blockchain Governance
- Smart contract upgrades
- Multi-signature requirements
- Governance token mechanisms
- Community voting systems 