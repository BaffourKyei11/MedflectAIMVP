import { SupabaseClient } from '@supabase/supabase-js'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { v4 as uuidv4 } from 'uuid'

// FHIR R4 JSON schemas for validation
const fhirSchemas = {
  Patient: {
    type: 'object',
    required: ['resourceType', 'id'],
    properties: {
      resourceType: { type: 'string', const: 'Patient' },
      id: { type: 'string' },
      identifier: { type: 'array' },
      active: { type: 'boolean' },
      name: { type: 'array' },
      gender: { type: 'string', enum: ['male', 'female', 'other', 'unknown'] },
      birthDate: { type: 'string', format: 'date' },
      deceasedBoolean: { type: 'boolean' },
      deceasedDateTime: { type: 'string', format: 'date-time' },
      address: { type: 'array' },
      contact: { type: 'array' },
      communication: { type: 'array' },
      generalPractitioner: { type: 'array' },
      managingOrganization: { type: 'object' },
      link: { type: 'array' }
    }
  },
  Observation: {
    type: 'object',
    required: ['resourceType', 'id', 'status', 'code', 'subject'],
    properties: {
      resourceType: { type: 'string', const: 'Observation' },
      id: { type: 'string' },
      identifier: { type: 'array' },
      status: { type: 'string', enum: ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'] },
      category: { type: 'array' },
      code: { type: 'object' },
      subject: { type: 'object' },
      encounter: { type: 'object' },
      effectiveDateTime: { type: 'string', format: 'date-time' },
      issued: { type: 'string', format: 'date-time' },
      performer: { type: 'array' },
      valueQuantity: { type: 'object' },
      valueCodeableConcept: { type: 'object' },
      valueString: { type: 'string' },
      valueBoolean: { type: 'boolean' },
      valueInteger: { type: 'integer' },
      valueRange: { type: 'object' },
      valueRatio: { type: 'object' },
      valueSampledData: { type: 'object' },
      valueTime: { type: 'string', format: 'time' },
      valueDateTime: { type: 'string', format: 'date-time' },
      valuePeriod: { type: 'object' },
      dataAbsentReason: { type: 'object' },
      interpretation: { type: 'array' },
      note: { type: 'array' },
      bodySite: { type: 'object' },
      method: { type: 'object' },
      specimen: { type: 'object' },
      device: { type: 'object' },
      referenceRange: { type: 'array' },
      hasMember: { type: 'array' },
      derivedFrom: { type: 'array' },
      component: { type: 'array' }
    }
  },
  Encounter: {
    type: 'object',
    required: ['resourceType', 'id', 'status', 'class', 'subject'],
    properties: {
      resourceType: { type: 'string', const: 'Encounter' },
      id: { type: 'string' },
      identifier: { type: 'array' },
      status: { type: 'string', enum: ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown'] },
      statusHistory: { type: 'array' },
      class: { type: 'object' },
      classHistory: { type: 'array' },
      type: { type: 'array' },
      serviceType: { type: 'object' },
      priority: { type: 'object' },
      subject: { type: 'object' },
      episodeOfCare: { type: 'array' },
      basedOn: { type: 'array' },
      participant: { type: 'array' },
      appointment: { type: 'array' },
      period: { type: 'object' },
      length: { type: 'object' },
      reasonCode: { type: 'array' },
      reasonReference: { type: 'array' },
      diagnosis: { type: 'array' },
      account: { type: 'array' },
      hospitalization: { type: 'object' },
      location: { type: 'array' },
      serviceProvider: { type: 'object' },
      partOf: { type: 'object' }
    }
  },
  DocumentReference: {
    type: 'object',
    required: ['resourceType', 'id', 'status', 'type', 'subject', 'content'],
    properties: {
      resourceType: { type: 'string', const: 'DocumentReference' },
      id: { type: 'string' },
      identifier: { type: 'array' },
      status: { type: 'string', enum: ['current', 'superseded', 'entered-in-error'] },
      docStatus: { type: 'string', enum: ['preliminary', 'final', 'amended', 'entered-in-error'] },
      type: { type: 'object' },
      category: { type: 'array' },
      subject: { type: 'object' },
      date: { type: 'string', format: 'date-time' },
      author: { type: 'array' },
      authenticator: { type: 'object' },
      custodian: { type: 'object' },
      relatesTo: { type: 'array' },
      description: { type: 'string' },
      securityLabel: { type: 'array' },
      content: { type: 'array' },
      context: { type: 'object' },
      extension: { type: 'array' }
    }
  },
  Consent: {
    type: 'object',
    required: ['resourceType', 'id', 'status', 'scope', 'category', 'patient', 'dateTime', 'performer'],
    properties: {
      resourceType: { type: 'string', const: 'Consent' },
      id: { type: 'string' },
      identifier: { type: 'array' },
      status: { type: 'string', enum: ['draft', 'proposed', 'active', 'rejected', 'inactive', 'entered-in-error'] },
      scope: { type: 'object' },
      category: { type: 'array' },
      patient: { type: 'object' },
      dateTime: { type: 'string', format: 'date-time' },
      performer: { type: 'array' },
      organization: { type: 'array' },
      sourceAttachment: { type: 'object' },
      sourceReference: { type: 'object' },
      policy: { type: 'array' },
      policyRule: { type: 'object' },
      verification: { type: 'array' },
      provision: { type: 'object' }
    }
  }
}

export interface FHIRResource {
  id: string
  resourceType: string
  resourceJson: any
  meta: {
    createdAt: string
    updatedAt: string
    createdBy: string
    version: number
  }
}

export interface SearchParams {
  search?: string
  filters?: Record<string, any>
  page: number
  limit: number
}

export interface SearchResults {
  data: FHIRResource[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors?: string[]
}

export class FHIRService {
  private supabase: SupabaseClient
  private ajv: Ajv

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
    this.ajv = new Ajv({ allErrors: true })
    addFormats(this.ajv)
    
    // Add FHIR schemas to validator
    Object.entries(fhirSchemas).forEach(([resourceType, schema]) => {
      this.ajv.addSchema(schema, resourceType)
    })
  }

  async validateResource(resourceType: string, resourceData: any): Promise<ValidationResult> {
    try {
      // Check if resource type is supported
      if (!fhirSchemas[resourceType as keyof typeof fhirSchemas]) {
        return {
          isValid: false,
          errors: [`Unsupported resource type: ${resourceType}`]
        }
      }

      // Validate against FHIR schema
      const isValid = this.ajv.validate(resourceType, resourceData)
      
      if (!isValid) {
        return {
          isValid: false,
          errors: this.ajv.errors?.map(err => `${err.instancePath} ${err.message}`) || []
        }
      }

      return { isValid: true }
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error}`]
      }
    }
  }

  async createResource(resourceType: string, resourceData: any, userId: string): Promise<FHIRResource> {
    const id = resourceData.id || uuidv4()
    const now = new Date().toISOString()
    
    const resource: FHIRResource = {
      id,
      resourceType,
      resourceJson: {
        ...resourceData,
        id,
        meta: {
          versionId: '1',
          lastUpdated: now,
          source: `#${userId}`
        }
      },
      meta: {
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        version: 1
      }
    }

    const { data, error } = await this.supabase
      .from('patient_data')
      .insert(resource)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create ${resourceType} resource: ${error.message}`)
    }

    return data
  }

  async getResource(resourceType: string, id: string): Promise<FHIRResource | null> {
    const { data, error } = await this.supabase
      .from('patient_data')
      .select()
      .eq('resourceType', resourceType)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Resource not found
      }
      throw new Error(`Failed to get ${resourceType} resource: ${error.message}`)
    }

    return data
  }

  async updateResource(resourceType: string, id: string, resourceData: any, userId: string): Promise<FHIRResource> {
    const existing = await this.getResource(resourceType, id)
    if (!existing) {
      throw new Error(`${resourceType} resource with id ${id} not found`)
    }

    const now = new Date().toISOString()
    const updatedResource: FHIRResource = {
      ...existing,
      resourceJson: {
        ...resourceData,
        id,
        meta: {
          versionId: (existing.meta.version + 1).toString(),
          lastUpdated: now,
          source: `#${userId}`
        }
      },
      meta: {
        ...existing.meta,
        updatedAt: now,
        version: existing.meta.version + 1
      }
    }

    const { data, error } = await this.supabase
      .from('patient_data')
      .update(updatedResource)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update ${resourceType} resource: ${error.message}`)
    }

    return data
  }

  async deleteResource(resourceType: string, id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('patient_data')
      .delete()
      .eq('resourceType', resourceType)
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete ${resourceType} resource: ${error.message}`)
    }
  }

  async searchResources(resourceType: string, params: SearchParams, userId: string): Promise<SearchResults> {
    let query = this.supabase
      .from('patient_data')
      .select('*', { count: 'exact' })
      .eq('resourceType', resourceType)

    // Apply search filter
    if (params.search) {
      query = query.or(`resourceJson->>name.ilike.%${params.search}%,resourceJson->>identifier.value.ilike.%${params.search}%`)
    }

    // Apply additional filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(`resourceJson->>${key}`, value)
        }
      })
    }

    // Apply pagination
    const offset = (params.page - 1) * params.limit
    query = query.range(offset, offset + params.limit - 1)
    query = query.order('meta.createdAt', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to search ${resourceType} resources: ${error.message}`)
    }

    return {
      data: data || [],
      page: params.page,
      limit: params.limit,
      total: count || 0,
      hasMore: (count || 0) > offset + params.limit
    }
  }

  async checkAccess(resourceType: string, resourceId: string, userId: string): Promise<boolean> {
    // For now, implement basic access control
    // In production, this would check user roles, patient assignments, etc.
    try {
      const resource = await this.getResource(resourceType, resourceId)
      if (!resource) return false
      
      // Check if user has access to this resource
      // This is a simplified implementation - in production you'd have proper RBAC
      return true
    } catch {
      return false
    }
  }

  async getPatientContext(patientId: string): Promise<any> {
    // Get all resources related to a patient
    const { data, error } = await this.supabase
      .from('patient_data')
      .select()
      .or(`resourceJson->>id.eq.${patientId},resourceJson->>subject.reference.eq.Patient/${patientId}`)

    if (error) {
      throw new Error(`Failed to get patient context: ${error.message}`)
    }

    // Group resources by type
    const context: Record<string, any[]> = {}
    data?.forEach(resource => {
      if (!context[resource.resourceType]) {
        context[resource.resourceType] = []
      }
      context[resource.resourceType].push(resource.resourceJson)
    })

    return context
  }

  async syncOfflineChanges(changes: any[], userId: string): Promise<any[]> {
    const results = []
    
    for (const change of changes) {
      try {
        switch (change.operation) {
          case 'CREATE':
            const created = await this.createResource(change.resourceType, change.resourceData, userId)
            results.push({ success: true, operation: 'CREATE', resource: created })
            break
          case 'UPDATE':
            const updated = await this.updateResource(change.resourceType, change.resourceId, change.resourceData, userId)
            results.push({ success: true, operation: 'UPDATE', resource: updated })
            break
          case 'DELETE':
            await this.deleteResource(change.resourceType, change.resourceId, userId)
            results.push({ success: true, operation: 'DELETE', resourceId: change.resourceId })
            break
          default:
            results.push({ success: false, error: `Unknown operation: ${change.operation}` })
        }
      } catch (error) {
        results.push({ 
          success: false, 
          operation: change.operation, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return results
  }
} 