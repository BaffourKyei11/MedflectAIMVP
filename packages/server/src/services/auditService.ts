import { SupabaseClient } from '@supabase/supabase-js'

export interface AuditEvent {
  id?: string
  userId: string
  action: string
  resourceType?: string
  resourceId?: string
  details: string
  ipAddress?: string
  userAgent?: string
  timestamp?: string
  metadata?: Record<string, any>
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  outcome?: 'SUCCESS' | 'FAILURE' | 'PARTIAL'
}

export interface AuditQuery {
  userId?: string
  action?: string
  resourceType?: string
  resourceId?: string
  startDate?: string
  endDate?: string
  severity?: string
  outcome?: string
  page?: number
  limit?: number
}

export interface AuditResults {
  events: AuditEvent[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export class AuditService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async logEvent(event: AuditEvent): Promise<AuditEvent> {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      severity: event.severity || 'LOW',
      outcome: event.outcome || 'SUCCESS'
    }

    const { data, error } = await this.supabase
      .from('audit_logs')
      .insert(auditEvent)
      .select()
      .single()

    if (error) {
      console.error('Failed to log audit event:', error)
      // Don't throw error for audit failures to avoid breaking main operations
      // In production, you might want to queue these or use a more robust logging system
    }

    return data || auditEvent
  }

  async logAccess(userId: string, resourceType: string, resourceId: string, action: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      action: `ACCESS_${action.toUpperCase()}`,
      resourceType,
      resourceId,
      details: `User ${userId} accessed ${resourceType} ${resourceId}`,
      ipAddress,
      userAgent,
      severity: 'LOW',
      outcome: 'SUCCESS'
    })
  }

  async logModification(userId: string, resourceType: string, resourceId: string, action: string, details: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      action: `MODIFY_${action.toUpperCase()}`,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      severity: 'MEDIUM',
      outcome: 'SUCCESS'
    })
  }

  async logSecurityEvent(userId: string, action: string, details: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      action: `SECURITY_${action.toUpperCase()}`,
      details,
      ipAddress,
      userAgent,
      severity,
      outcome: 'SUCCESS'
    })
  }

  async logError(userId: string, action: string, error: string, resourceType?: string, resourceId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      action: `ERROR_${action.toUpperCase()}`,
      resourceType,
      resourceId,
      details: `Error during ${action}: ${error}`,
      ipAddress,
      userAgent,
      severity: 'HIGH',
      outcome: 'FAILURE'
    })
  }

  async logConsentEvent(userId: string, patientId: string, action: string, consentType: string, details: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      action: `CONSENT_${action.toUpperCase()}`,
      resourceType: 'Consent',
      resourceId: patientId,
      details: `Consent ${action} for ${consentType}: ${details}`,
      ipAddress,
      userAgent,
      severity: 'MEDIUM',
      outcome: 'SUCCESS',
      metadata: {
        consentType,
        patientId
      }
    })
  }

  async logAIEvent(userId: string, action: string, patientId: string, summaryType: string, details: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      action: `AI_${action.toUpperCase()}`,
      resourceType: 'DocumentReference',
      resourceId: patientId,
      details: `AI ${action} for ${summaryType}: ${details}`,
      ipAddress,
      userAgent,
      severity: 'MEDIUM',
      outcome: 'SUCCESS',
      metadata: {
        summaryType,
        patientId,
        aiGenerated: true
      }
    })
  }

  async queryAuditLogs(query: AuditQuery): Promise<AuditResults> {
    let supabaseQuery = this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })

    // Apply filters
    if (query.userId) {
      supabaseQuery = supabaseQuery.eq('userId', query.userId)
    }
    if (query.action) {
      supabaseQuery = supabaseQuery.eq('action', query.action)
    }
    if (query.resourceType) {
      supabaseQuery = supabaseQuery.eq('resourceType', query.resourceType)
    }
    if (query.resourceId) {
      supabaseQuery = supabaseQuery.eq('resourceId', query.resourceId)
    }
    if (query.severity) {
      supabaseQuery = supabaseQuery.eq('severity', query.severity)
    }
    if (query.outcome) {
      supabaseQuery = supabaseQuery.eq('outcome', query.outcome)
    }
    if (query.startDate) {
      supabaseQuery = supabaseQuery.gte('timestamp', query.startDate)
    }
    if (query.endDate) {
      supabaseQuery = supabaseQuery.lte('timestamp', query.endDate)
    }

    // Apply pagination
    const page = query.page || 1
    const limit = query.limit || 50
    const offset = (page - 1) * limit

    supabaseQuery = supabaseQuery
      .range(offset, offset + limit - 1)
      .order('timestamp', { ascending: false })

    const { data, error, count } = await supabaseQuery

    if (error) {
      throw new Error(`Failed to query audit logs: ${error.message}`)
    }

    return {
      events: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit
    }
  }

  async getUserActivity(userId: string, days: number = 30): Promise<AuditEvent[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('userId', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error(`Failed to get user activity: ${error.message}`)
    }

    return data || []
  }

  async getResourceAuditTrail(resourceType: string, resourceId: string): Promise<AuditEvent[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('resourceType', resourceType)
      .eq('resourceId', resourceId)
      .order('timestamp', { ascending: true })

    if (error) {
      throw new Error(`Failed to get resource audit trail: ${error.message}`)
    }

    return data || []
  }

  async getSecurityEvents(severity: 'HIGH' | 'CRITICAL' = 'HIGH', days: number = 7): Promise<AuditEvent[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .in('severity', [severity, 'CRITICAL'])
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error(`Failed to get security events: ${error.message}`)
    }

    return data || []
  }

  async getAuditStats(days: number = 30): Promise<{
    totalEvents: number
    eventsByAction: Record<string, number>
    eventsBySeverity: Record<string, number>
    eventsByOutcome: Record<string, number>
    topUsers: Array<{ userId: string; count: number }>
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total events
    const { count: totalEvents } = await this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .gte('timestamp', startDate.toISOString())

    // Get events by action
    const { data: actionStats } = await this.supabase
      .from('audit_logs')
      .select('action')
      .gte('timestamp', startDate.toISOString())

    // Get events by severity
    const { data: severityStats } = await this.supabase
      .from('audit_logs')
      .select('severity')
      .gte('timestamp', startDate.toISOString())

    // Get events by outcome
    const { data: outcomeStats } = await this.supabase
      .from('audit_logs')
      .select('outcome')
      .gte('timestamp', startDate.toISOString())

    // Get top users
    const { data: userStats } = await this.supabase
      .from('audit_logs')
      .select('userId')
      .gte('timestamp', startDate.toISOString())

    // Process statistics
    const eventsByAction: Record<string, number> = {}
    const eventsBySeverity: Record<string, number> = {}
    const eventsByOutcome: Record<string, number> = {}
    const userCounts: Record<string, number> = {}

    actionStats?.forEach(event => {
      eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1
    })

    severityStats?.forEach(event => {
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
    })

    outcomeStats?.forEach(event => {
      eventsByOutcome[event.outcome] = (eventsByOutcome[event.outcome] || 0) + 1
    })

    userStats?.forEach(event => {
      userCounts[event.userId] = (userCounts[event.userId] || 0) + 1
    })

    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalEvents: totalEvents || 0,
      eventsByAction,
      eventsBySeverity,
      eventsByOutcome,
      topUsers
    }
  }

  async exportAuditLogs(query: AuditQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    const results = await this.queryAuditLogs({ ...query, limit: 10000 }) // Large limit for export

    if (format === 'csv') {
      return this.convertToCSV(results.events)
    }

    return JSON.stringify(results.events, null, 2)
  }

  private convertToCSV(events: AuditEvent[]): string {
    if (events.length === 0) return ''

    const headers = ['Timestamp', 'User ID', 'Action', 'Resource Type', 'Resource ID', 'Details', 'Severity', 'Outcome', 'IP Address']
    const rows = events.map(event => [
      event.timestamp || '',
      event.userId || '',
      event.action || '',
      event.resourceType || '',
      event.resourceId || '',
      event.details || '',
      event.severity || '',
      event.outcome || '',
      event.ipAddress || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }
} 