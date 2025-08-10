# Medflect AI API Reference

## Overview

The Medflect AI API provides comprehensive healthcare data management with FHIR R4 compliance, AI-powered insights, and blockchain-based audit trails. All endpoints are secured with JWT authentication and implement Row Level Security (RLS).

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Authentication

All API endpoints require authentication using JWT tokens obtained from Supabase Auth.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Flow

1. **Login**: POST `/auth/login`
2. **OTP Verification**: POST `/auth/verify-otp`
3. **Use JWT Token**: Include in Authorization header

## API Endpoints

### Authentication

#### POST /auth/login

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to email",
  "session": {
    "id": "session_id",
    "expires_at": "2024-01-01T12:00:00Z"
  }
}
```

#### POST /auth/verify-otp

Verify OTP and complete authentication.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "clinician",
    "permissions": ["patients:read", "patients:write"]
  }
}
```

### FHIR Resources

#### GET /api/fhir/:resourceType

List FHIR resources of specified type.

**Parameters:**
- `resourceType`: FHIR resource type (Patient, Observation, etc.)
- `_count`: Number of resources to return (default: 20)
- `_offset`: Number of resources to skip (default: 0)
- `_sort`: Sort field (default: _lastUpdated)
- `_order`: Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 100,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "patient_id",
        "identifier": [{"value": "MRN123"}],
        "name": [{"text": "John Doe"}],
        "birthDate": "1990-01-01"
      }
    }
  ]
}
```

#### GET /api/fhir/:resourceType/:id

Retrieve a specific FHIR resource.

**Response:**
```json
{
  "resourceType": "Patient",
  "id": "patient_id",
  "identifier": [{"value": "MRN123"}],
  "name": [{"text": "John Doe"}],
  "birthDate": "1990-01-01",
  "gender": "male",
  "address": [
    {
      "text": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "postalCode": "12345"
    }
  ]
}
```

#### POST /api/fhir/:resourceType

Create a new FHIR resource.

**Request Body:**
```json
{
  "resourceType": "Patient",
  "identifier": [{"value": "MRN124"}],
  "name": [{"text": "Jane Smith"}],
  "birthDate": "1985-05-15",
  "gender": "female"
}
```

**Response:**
```json
{
  "success": true,
  "resource": {
    "resourceType": "Patient",
    "id": "new_patient_id",
    "identifier": [{"value": "MRN124"}],
    "name": [{"text": "Jane Smith"}],
    "birthDate": "1985-05-15",
    "gender": "female",
    "meta": {
      "versionId": "1",
      "lastUpdated": "2024-01-01T12:00:00Z"
    }
  }
}
```

#### PUT /api/fhir/:resourceType/:id

Update an existing FHIR resource.

**Request Body:**
```json
{
  "resourceType": "Patient",
  "id": "patient_id",
  "identifier": [{"value": "MRN124"}],
  "name": [{"text": "Jane Smith Updated"}],
  "birthDate": "1985-05-15",
  "gender": "female"
}
```

**Response:**
```json
{
  "success": true,
  "resource": {
    "resourceType": "Patient",
    "id": "patient_id",
    "identifier": [{"value": "MRN124"}],
    "name": [{"text": "Jane Smith Updated"}],
    "birthDate": "1985-05-15",
    "gender": "female",
    "meta": {
      "versionId": "2",
      "lastUpdated": "2024-01-01T12:30:00Z"
    }
  }
}
```

#### DELETE /api/fhir/:resourceType/:id

Delete a FHIR resource (soft delete).

**Response:**
```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

### AI Services

#### POST /api/ai/summary/:patientId

Generate AI-powered patient summary.

**Request Body:**
```json
{
  "summaryType": "discharge_summary",
  "includeObservations": true,
  "includeEncounters": true,
  "maxLength": 500
}
```

**Response:**
```json
{
  "success": true,
  "summary": "Patient John Doe was admitted on 2024-01-01 with chest pain...",
  "provenance": {
    "model": "groq-llama3-8b-8192",
    "version": "1.0.0",
    "timestamp": "2024-01-01T12:00:00Z",
    "dataReferences": [
      {
        "resourceType": "Patient",
        "id": "patient_id",
        "lastUpdated": "2024-01-01T10:00:00Z"
      },
      {
        "resourceType": "Observation",
        "id": "obs_id",
        "lastUpdated": "2024-01-01T11:00:00Z"
      }
    ]
  },
  "documentReference": {
    "id": "doc_ref_id",
    "status": "current",
    "content": [{"attachment": {"url": "/api/documents/doc_ref_id"}}]
  }
}
```

#### POST /api/ai/risk-assessment/:patientId

Generate risk assessment for patient.

**Request Body:**
```json
{
  "assessmentType": "cardiovascular_risk",
  "timeframe": "1_year",
  "includeFactors": true
}
```

**Response:**
```json
{
  "success": true,
  "riskScore": 0.75,
  "riskLevel": "HIGH",
  "factors": [
    {
      "factor": "Age",
      "contribution": 0.3,
      "description": "Patient is 65 years old"
    },
    {
      "factor": "Hypertension",
      "contribution": 0.25,
      "description": "Blood pressure consistently above 140/90"
    }
  ],
  "recommendations": [
    "Monitor blood pressure weekly",
    "Consider medication adjustment",
    "Schedule follow-up in 3 months"
  ]
}
```

### Consent Management

#### GET /api/consent/:patientId

Get patient consent status.

**Response:**
```json
{
  "success": true,
  "consents": [
    {
      "id": "consent_id",
      "patientId": "patient_id",
      "type": "data_sharing",
      "status": "active",
      "grantedAt": "2024-01-01T10:00:00Z",
      "expiresAt": "2025-01-01T10:00:00Z",
      "blockchainHash": "0x123...",
      "grantedBy": "user_id"
    }
  ]
}
```

#### POST /api/consent/:patientId

Grant consent for patient.

**Request Body:**
```json
{
  "type": "data_sharing",
  "scope": ["read", "write"],
  "expiresAt": "2025-01-01T10:00:00Z",
  "purpose": "Clinical care and treatment"
}
```

**Response:**
```json
{
  "success": true,
  "consent": {
    "id": "new_consent_id",
    "patientId": "patient_id",
    "type": "data_sharing",
    "status": "active",
    "grantedAt": "2024-01-01T12:00:00Z",
    "expiresAt": "2025-01-01T10:00:00Z",
    "blockchainHash": "0x456...",
    "grantedBy": "user_id"
  }
}
```

#### DELETE /api/consent/:consentId

Revoke patient consent.

**Response:**
```json
{
  "success": true,
  "message": "Consent revoked successfully",
  "blockchainHash": "0x789..."
}
```

### Audit & Compliance

#### GET /api/audit/logs

Get audit logs with filtering.

**Query Parameters:**
- `startDate`: Start date for filtering (ISO 8601)
- `endDate`: End date for filtering (ISO 8601)
- `userId`: Filter by user ID
- `action`: Filter by action type
- `resourceType`: Filter by resource type
- `_count`: Number of logs to return (default: 50)
- `_offset`: Number of logs to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_id",
      "userId": "user_id",
      "action": "CREATE",
      "resourceType": "Patient",
      "resourceId": "patient_id",
      "details": "Created new patient record",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-01T12:00:00Z",
      "blockchainHash": "0xabc..."
    }
  ],
  "total": 1000,
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalPages": 20
  }
}
```

#### GET /api/audit/compliance

Get compliance report.

**Response:**
```json
{
  "success": true,
  "report": {
    "timestamp": "2024-01-01T12:00:00Z",
    "overall": "PASS",
    "checks": [
      {
        "name": "Encryption at Rest",
        "status": "PASS",
        "details": "All data encrypted with AES-256"
      },
      {
        "name": "Access Controls",
        "status": "PASS",
        "details": "RLS policies properly configured"
      },
      {
        "name": "Audit Logging",
        "status": "PASS",
        "details": "All actions logged and blockchain-verified"
      }
    ]
  }
}
```

### Sync & Offline

#### POST /api/sync

Sync offline changes with server.

**Request Body:**
```json
{
  "changes": [
    {
      "id": "change_id",
      "type": "CREATE",
      "resourceType": "Observation",
      "resource": {
        "resourceType": "Observation",
        "status": "final",
        "code": {"text": "Blood Pressure"},
        "valueQuantity": {
          "value": 120,
          "unit": "mmHg"
        }
      },
      "timestamp": "2024-01-01T11:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "synced": 1,
  "failed": 0,
  "results": [
    {
      "changeId": "change_id",
      "status": "SUCCESS",
      "resourceId": "new_obs_id",
      "message": "Observation created successfully"
    }
  ]
}
```

#### GET /api/sync/status

Get sync status and pending changes.

**Response:**
```json
{
  "success": true,
  "status": "SYNCING",
  "lastSync": "2024-01-01T11:30:00Z",
  "pendingChanges": 5,
  "syncProgress": 0.6,
  "estimatedTimeRemaining": "00:02:30"
}
```

### Admin & Management

#### GET /api/admin/users

Get all users (admin only).

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "role": "clinician",
      "status": "active",
      "lastLogin": "2024-01-01T10:00:00Z",
      "permissions": ["patients:read", "patients:write"]
    }
  ]
}
```

#### POST /api/admin/users/:userId/role

Update user role (admin only).

**Request Body:**
```json
{
  "role": "admin",
  "permissions": ["*"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "user": {
    "id": "user_id",
    "role": "admin",
    "permissions": ["*"]
  }
}
```

#### GET /api/admin/analytics

Get system analytics (admin only).

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalUsers": 150,
    "totalPatients": 2500,
    "totalObservations": 15000,
    "aiSummariesGenerated": 500,
    "consentGrants": 1200,
    "auditLogs": 50000,
    "storageUsed": "2.5GB",
    "uptime": "99.9%"
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid FHIR resource",
    "details": [
      "Missing required field: resourceType",
      "Invalid date format for birthDate"
    ],
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_123"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | JWT token missing or invalid |
| `AUTHORIZATION_DENIED` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error occurred |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **FHIR endpoints**: 100 requests per minute
- **AI endpoints**: 20 requests per minute
- **Admin endpoints**: 50 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination using the `_count` and `_offset` parameters:

```http
GET /api/fhir/Patient?_count=20&_offset=40
```

Response includes pagination metadata:

```json
{
  "pagination": {
    "page": 3,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": true
  }
}
```

## Filtering & Search

### FHIR Search Parameters

FHIR endpoints support standard search parameters:

```http
GET /api/fhir/Patient?name=John&birthdate=gt1990-01-01
```

### Custom Search

Custom search endpoints provide advanced filtering:

```http
GET /api/search/patients?query=diabetes&dateRange=last30days&riskLevel=high
```

## Webhooks

### Webhook Configuration

Configure webhooks for real-time notifications:

```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["patient.created", "observation.updated", "consent.granted"],
  "secret": "webhook_secret"
}
```

### Webhook Payload

```json
{
  "event": "patient.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "resourceType": "Patient",
    "id": "patient_id",
    "name": [{"text": "John Doe"}]
  },
  "signature": "sha256=..."
}
```

## SDK & Libraries

### JavaScript/TypeScript

```typescript
import { MedflectClient } from '@medflect/sdk';

const client = new MedflectClient({
  baseUrl: 'https://api.medflect.ai',
  apiKey: 'your_api_key'
});

// Create patient
const patient = await client.fhir.create('Patient', {
  resourceType: 'Patient',
  name: [{'text': 'John Doe'}],
  birthDate: '1990-01-01'
});

// Generate AI summary
const summary = await client.ai.generateSummary(patient.id, {
  summaryType: 'discharge_summary'
});
```

### Python

```python
from medflect import MedflectClient

client = MedflectClient(
    base_url="https://api.medflect.ai",
    api_key="your_api_key"
)

# Create patient
patient = client.fhir.create("Patient", {
    "resourceType": "Patient",
    "name": [{"text": "John Doe"}],
    "birthDate": "1990-01-01"
})

# Generate AI summary
summary = client.ai.generate_summary(patient.id, {
    "summaryType": "discharge_summary"
})
```

## Testing

### Test Environment

Use the test environment for development and testing:

- **Base URL**: `https://test-api.medflect.ai`
- **Test Data**: Automatically cleaned every 24 hours
- **Rate Limits**: Higher limits for testing

### Test Credentials

```json
{
  "testUser": {
    "email": "test@medflect.ai",
    "password": "test123",
    "role": "admin"
  },
  "testPatient": {
    "id": "test-patient-001",
    "mrn": "TEST001"
  }
}
```

## Support

### Documentation

- **API Reference**: This document
- **SDK Documentation**: [docs.medflect.ai/sdk](https://docs.medflect.ai/sdk)
- **FHIR Guide**: [docs.medflect.ai/fhir](https://docs.medflect.ai/fhir)

### Contact

- **Technical Support**: support@medflect.ai
- **API Issues**: api-issues@medflect.ai
- **Security Issues**: security@medflect.ai

### Status Page

Check API status at [status.medflect.ai](https://status.medflect.ai) 