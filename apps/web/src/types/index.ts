// User and Authentication Types
export interface User {
  id: string
  email: string
  role: 'clinician' | 'admin' | 'patient'
  firstName: string
  lastName: string
  organization?: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// FHIR Resource Types
export interface FHIRResource {
  resourceType: string
  id: string
  meta?: {
    versionId: string
    lastUpdated: string
    profile?: string[]
  }
  [key: string]: any
}

export interface Patient extends FHIRResource {
  resourceType: 'Patient'
  identifier?: Array<{
    system: string
    value: string
  }>
  name: Array<{
    use?: string
    text?: string
    family: string
    given: string[]
  }>
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
  address?: Array<{
    use?: string
    type?: string
    text?: string
    line?: string[]
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }>
  telecom?: Array<{
    system: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other'
    value: string
    use?: string
  }>
}

export interface Observation extends FHIRResource {
  resourceType: 'Observation'
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown'
  category?: Array<{
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }>
  code: {
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }
  subject: {
    reference: string
  }
  effectiveDateTime?: string
  valueQuantity?: {
    value: number
    unit: string
    system?: string
    code?: string
  }
  valueString?: string
  valueBoolean?: boolean
  interpretation?: Array<{
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }>
}

export interface Encounter extends FHIRResource {
  resourceType: 'Encounter'
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown'
  class: {
    system: string
    code: string
    display: string
  }
  type?: Array<{
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }>
  subject: {
    reference: string
  }
  period?: {
    start?: string
    end?: string
  }
  reasonCode?: Array<{
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }>
}

export interface DocumentReference extends FHIRResource {
  resourceType: 'DocumentReference'
  status: 'current' | 'superseded' | 'entered-in-error'
  type?: {
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }>
  category?: Array<{
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }>
  subject?: {
    reference: string
  }
  date?: string
  author?: Array<{
    reference: string
  }>
  content: Array<{
    attachment: {
      contentType: string
      data?: string
      url?: string
      size?: number
      hash?: string
      title?: string
    }
  }>
  context?: {
    encounter?: Array<{
      reference: string
    }>
    period?: {
      start?: string
      end?: string
    }
  }
  extension?: Array<{
    url: string
    valueString?: string
    valueReference?: {
      reference: string
    }
    [key: string]: any
  }>
}

export interface Consent extends FHIRResource {
  resourceType: 'Consent'
  status: 'draft' | 'proposed' | 'active' | 'rejected' | 'inactive' | 'entered-in-error'
  scope: {
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }
  category: Array<{
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }>
  patient: {
    reference: string
  }
  dateTime?: string
  performer?: Array<{
    reference: string
  }>
  organization?: Array<{
    reference: string
  }>
  sourceAttachment?: {
    contentType: string
    data?: string
    url?: string
  }
  provision?: {
    type?: 'deny' | 'permit'
    period?: {
      start?: string
      end?: string
    }
    actor?: Array<{
      role: {
        coding: Array<{
          system: string
          code: string
          display: string
        }>
      }
      reference: {
        reference: string
      }
    }>
    action?: Array<{
      coding: Array<{
        system: string
        code: string
        display: string
      }>
    }>
    resource?: Array<{
      coding: Array<{
        system: string
        code: string
        display: string
      }>
    }>
  }
}

// AI Summary Types
export interface AISummary {
  id: string
  patientId: string
  summary: string
  type: 'discharge' | 'progress' | 'risk' | 'patient-facing'
  provenance: {
    modelName: string
    modelVersion: string
    timestamp: string
    dataRefs: string[]
    promptHash: string
  }
  status: 'draft' | 'final' | 'archived'
  createdAt: string
  updatedAt: string
}

// Sync and Offline Types
export interface SyncStatus {
  status: 'connected' | 'syncing' | 'offline'
  lastSync?: string
  pendingChanges: number
}

export interface OfflineChange {
  id: string
  type: 'create' | 'update' | 'delete'
  resourceType: string
  resourceId?: string
  data?: any
  timestamp: string
  synced: boolean
}

// UI Component Types
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export interface SearchFilters {
  resourceType?: string
  dateFrom?: string
  dateTo?: string
  status?: string
  category?: string
}

// API Response Types
export interface APIResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
} 