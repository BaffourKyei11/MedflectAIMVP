import { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export interface Consent {
  id?: string
  patientId: string
  consentType: string
  purpose: string
  scope: string
  status: 'active' | 'expired' | 'revoked' | 'pending'
  grantedBy: string
  grantedAt: string
  expiresAt?: string
  metadata?: Record<string, any>
  blockchainHash?: string
  blockchainTxId?: string
}

export interface ConsentQuery {
  patientId?: string
  consentType?: string
  status?: string
  grantedBy?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface ConsentResults {
  consents: Consent[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ConsentGrantRequest {
  patientId: string
  consentType: string
  purpose: string
  scope: string
  expiresAt?: string
  grantedBy: string
  metadata?: Record<string, any>
}

export class ConsentService {
  private supabase: SupabaseClient
  private mockMode: boolean

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
    this.mockMode = process.env.MOCK_CHAIN === 'true'
  }

  async grantConsent(request: ConsentGrantRequest): Promise<Consent> {
    const now = new Date().toISOString()
    
    const consent: Consent = {
      patientId: request.patientId,
      consentType: request.consentType,
      purpose: request.purpose,
      scope: request.scope,
      status: 'active',
      grantedBy: request.grantedBy,
      grantedAt: now,
      expiresAt: request.expiresAt,
      metadata: request.metadata || {}
    }

    // Generate blockchain hash for consent
    const consentHash = this.generateConsentHash(consent)
    consent.blockchainHash = consentHash

    // If not in mock mode, attempt blockchain integration
    if (!this.mockMode) {
      try {
        const txId = await this.recordConsentOnChain(consent)
        consent.blockchainTxId = txId
      } catch (error) {
        console.error('Failed to record consent on blockchain:', error)
        // Continue with local storage even if blockchain fails
      }
    }

    const { data, error } = await this.supabase
      .from('consents')
      .insert(consent)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to grant consent: ${error.message}`)
    }

    return data
  }

  async getPatientConsents(patientId: string, userId: string): Promise<Consent[]> {
    const { data, error } = await this.supabase
      .from('consents')
      .select('*')
      .eq('patientId', patientId)
      .order('grantedAt', { ascending: false })

    if (error) {
      throw new Error(`Failed to get patient consents: ${error.message}`)
    }

    // Filter out expired consents
    const now = new Date()
    return (data || []).filter(consent => {
      if (consent.status === 'revoked') return false
      if (consent.expiresAt && new Date(consent.expiresAt) < now) {
        // Mark as expired
        this.updateConsentStatus(consent.id!, 'expired')
        return false
      }
      return true
    })
  }

  async checkConsent(patientId: string, consentType: string, purpose: string): Promise<boolean> {
    const consents = await this.getPatientConsents(patientId, 'system')
    
    const validConsent = consents.find(consent => 
      consent.consentType === consentType &&
      consent.status === 'active' &&
      consent.purpose === purpose
    )

    return !!validConsent
  }

  async revokeConsent(consentId: string, userId: string): Promise<void> {
    // Get the consent first
    const { data: consent, error: fetchError } = await this.supabase
      .from('consents')
      .select('*')
      .eq('id', consentId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch consent: ${fetchError.message}`)
    }

    if (!consent) {
      throw new Error('Consent not found')
    }

    // Update status to revoked
    const { error: updateError } = await this.supabase
      .from('consents')
      .update({ 
        status: 'revoked',
        metadata: {
          ...consent.metadata,
          revokedBy: userId,
          revokedAt: new Date().toISOString()
        }
      })
      .eq('id', consentId)

    if (updateError) {
      throw new Error(`Failed to revoke consent: ${updateError.message}`)
    }

    // If not in mock mode, attempt blockchain update
    if (!this.mockMode) {
      try {
        await this.revokeConsentOnChain(consent)
      } catch (error) {
        console.error('Failed to revoke consent on blockchain:', error)
        // Continue with local revocation even if blockchain fails
      }
    }
  }

  async queryConsents(query: ConsentQuery): Promise<ConsentResults> {
    let supabaseQuery = this.supabase
      .from('consents')
      .select('*', { count: 'exact' })

    // Apply filters
    if (query.patientId) {
      supabaseQuery = supabaseQuery.eq('patientId', query.patientId)
    }
    if (query.consentType) {
      supabaseQuery = supabaseQuery.eq('consentType', query.consentType)
    }
    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status)
    }
    if (query.grantedBy) {
      supabaseQuery = supabaseQuery.eq('grantedBy', query.grantedBy)
    }
    if (query.startDate) {
      supabaseQuery = supabaseQuery.gte('grantedAt', query.startDate)
    }
    if (query.endDate) {
      supabaseQuery = supabaseQuery.lte('grantedAt', query.endDate)
    }

    // Apply pagination
    const page = query.page || 1
    const limit = query.limit || 50
    const offset = (page - 1) * limit

    supabaseQuery = supabaseQuery
      .range(offset, offset + limit - 1)
      .order('grantedAt', { ascending: false })

    const { data, error, count } = await supabaseQuery

    if (error) {
      throw new Error(`Failed to query consents: ${error.message}`)
    }

    return {
      consents: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit
    }
  }

  async getConsentById(consentId: string): Promise<Consent | null> {
    const { data, error } = await this.supabase
      .from('consents')
      .select('*')
      .eq('id', consentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Consent not found
      }
      throw new Error(`Failed to get consent: ${error.message}`)
    }

    return data
  }

  async updateConsentStatus(consentId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('consents')
      .update({ status })
      .eq('id', consentId)

    if (error) {
      throw new Error(`Failed to update consent status: ${error.message}`)
    }
  }

  async getConsentStats(days: number = 30): Promise<{
    totalConsents: number
    activeConsents: number
    expiredConsents: number
    revokedConsents: number
    consentsByType: Record<string, number>
    consentsByStatus: Record<string, number>
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total consents
    const { count: totalConsents } = await this.supabase
      .from('consents')
      .select('*', { count: 'exact' })
      .gte('grantedAt', startDate.toISOString())

    // Get consents by status
    const { data: statusStats } = await this.supabase
      .from('consents')
      .select('status')
      .gte('grantedAt', startDate.toISOString())

    // Get consents by type
    const { data: typeStats } = await this.supabase
      .from('consents')
      .select('consentType')
      .gte('grantedAt', startDate.toISOString())

    // Process statistics
    const consentsByStatus: Record<string, number> = {}
    const consentsByType: Record<string, number> = {}

    statusStats?.forEach(consent => {
      consentsByStatus[consent.status] = (consentsByStatus[consent.status] || 0) + 1
    })

    typeStats?.forEach(consent => {
      consentsByType[consent.consentType] = (consentsByType[consent.consentType] || 0) + 1
    })

    return {
      totalConsents: totalConsents || 0,
      activeConsents: consentsByStatus.active || 0,
      expiredConsents: consentsByStatus.expired || 0,
      revokedConsents: consentsByStatus.revoked || 0,
      consentsByType,
      consentsByStatus
    }
  }

  async exportConsents(query: ConsentQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    const results = await this.queryConsents({ ...query, limit: 10000 }) // Large limit for export

    if (format === 'csv') {
      return this.convertToCSV(results.consents)
    }

    return JSON.stringify(results.consents, null, 2)
  }

  private generateConsentHash(consent: Consent): string {
    const consentData = {
      patientId: consent.patientId,
      consentType: consent.consentType,
      purpose: consent.purpose,
      scope: consent.scope,
      grantedBy: consent.grantedBy,
      grantedAt: consent.grantedAt,
      expiresAt: consent.expiresAt
    }

    const dataString = JSON.stringify(consentData, Object.keys(consentData).sort())
    return crypto.createHash('sha256').update(dataString).digest('hex')
  }

  private async recordConsentOnChain(consent: Consent): Promise<string> {
    if (this.mockMode) {
      return `mock-tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // In production, this would integrate with a real blockchain
    // For now, we'll simulate the blockchain interaction
    try {
      // This would be a call to your blockchain service
      // const txId = await blockchainService.recordConsent(consent)
      // return txId
      
      // Mock blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate network delay
      return `chain-tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    } catch (error) {
      throw new Error(`Blockchain integration failed: ${error}`)
    }
  }

  private async revokeConsentOnChain(consent: Consent): Promise<void> {
    if (this.mockMode) {
      return
    }

    try {
      // This would be a call to your blockchain service
      // await blockchainService.revokeConsent(consent)
      
      // Mock blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate network delay
    } catch (error) {
      throw new Error(`Blockchain revocation failed: ${error}`)
    }
  }

  private convertToCSV(consents: Consent[]): string {
    if (consents.length === 0) return ''

    const headers = ['ID', 'Patient ID', 'Consent Type', 'Purpose', 'Scope', 'Status', 'Granted By', 'Granted At', 'Expires At', 'Blockchain Hash']
    const rows = consents.map(consent => [
      consent.id || '',
      consent.patientId || '',
      consent.consentType || '',
      consent.purpose || '',
      consent.scope || '',
      consent.status || '',
      consent.grantedBy || '',
      consent.grantedAt || '',
      consent.expiresAt || '',
      consent.blockchainHash || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  // Method to validate consent data
  validateConsentData(consent: Partial<Consent>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!consent.patientId) {
      errors.push('Patient ID is required')
    }
    if (!consent.consentType) {
      errors.push('Consent type is required')
    }
    if (!consent.purpose) {
      errors.push('Purpose is required')
    }
    if (!consent.scope) {
      errors.push('Scope is required')
    }
    if (!consent.grantedBy) {
      errors.push('Granted by is required')
    }

    if (consent.expiresAt) {
      const expiryDate = new Date(consent.expiresAt)
      if (isNaN(expiryDate.getTime())) {
        errors.push('Invalid expiry date format')
      }
      if (expiryDate <= new Date()) {
        errors.push('Expiry date must be in the future')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
} 