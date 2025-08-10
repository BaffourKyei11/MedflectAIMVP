import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { FHIRService } from './services/fhirService'
import { GroqService } from './services/groqService'
import { AuditService } from './services/auditService'
import { ConsentService } from './services/consentService'
import { authMiddleware } from './middleware/auth'
import { validationMiddleware } from './middleware/validation'
import { errorHandler } from './middleware/errorHandler'

// Load environment variables
config()

const app = express()
const PORT = process.env.PORT || 3001

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize services
const fhirService = new FHIRService(supabase)
const groqService = new GroqService()
const auditService = new AuditService(supabase)
const consentService = new ConsentService(supabase)

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      supabase: 'connected',
      groq: process.env.MOCK_GROQ === 'true' ? 'mock' : 'connected',
      blockchain: process.env.MOCK_CHAIN === 'true' ? 'mock' : 'connected'
    }
  })
})

// FHIR API endpoints
app.use('/api/fhir', authMiddleware, validationMiddleware)

// Create FHIR resource
app.post('/api/fhir/:type', async (req, res, next) => {
  try {
    const { type } = req.params
    const resourceData = req.body
    const userId = req.user?.id

    // Validate FHIR resource
    const validationResult = await fhirService.validateResource(type, resourceData)
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid FHIR resource',
        details: validationResult.errors
      })
    }

    // Create resource
    const resource = await fhirService.createResource(type, resourceData, userId!)
    
    // Log audit event
    await auditService.logEvent({
      userId: userId!,
      action: 'CREATE',
      resourceType: type,
      resourceId: resource.id,
      details: `Created ${type} resource`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || ''
    })

    res.status(201).json({
      success: true,
      data: resource
    })
  } catch (error) {
    next(error)
  }
})

// Get FHIR resource
app.get('/api/fhir/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params
    const userId = req.user?.id

    // Check access permissions
    const hasAccess = await fhirService.checkAccess(type, id, userId!)
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      })
    }

    // Get resource
    const resource = await fhirService.getResource(type, id)
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      })
    }

    // Log audit event
    await auditService.logEvent({
      userId: userId!,
      action: 'READ',
      resourceType: type,
      resourceId: id,
      details: `Viewed ${type} resource`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || ''
    })

    res.json({
      success: true,
      data: resource
    })
  } catch (error) {
    next(error)
  }
})

// Update FHIR resource
app.put('/api/fhir/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params
    const resourceData = req.body
    const userId = req.user?.id

    // Validate FHIR resource
    const validationResult = await fhirService.validateResource(type, resourceData)
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid FHIR resource',
        details: validationResult.errors
      })
    }

    // Check access permissions
    const hasAccess = await fhirService.checkAccess(type, id, userId!)
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      })
    }

    // Update resource
    const resource = await fhirService.updateResource(type, id, resourceData, userId!)
    
    // Log audit event
    await auditService.logEvent({
      userId: userId!,
      action: 'UPDATE',
      resourceType: type,
      resourceId: id,
      details: `Updated ${type} resource`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || ''
    })

    res.json({
      success: true,
      data: resource
    })
  } catch (error) {
    next(error)
  }
})

// Delete FHIR resource
app.delete('/api/fhir/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params
    const userId = req.user?.id

    // Check access permissions
    const hasAccess = await fhirService.checkAccess(type, id, userId!)
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      })
    }

    // Delete resource
    await fhirService.deleteResource(type, id, userId!)
    
    // Log audit event
    await auditService.logEvent({
      userId: userId!,
      action: 'DELETE',
      resourceType: type,
      resourceId: id,
      details: `Deleted ${type} resource`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || ''
    })

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Search FHIR resources
app.get('/api/fhir/:type', async (req, res, next) => {
  try {
    const { type } = req.params
    const { search, filters, page = 1, limit = 20 } = req.query
    const userId = req.user?.id

    const results = await fhirService.searchResources(type, {
      search: search as string,
      filters: filters as any,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    }, userId!)

    res.json({
      success: true,
      data: results.data,
      pagination: {
        page: results.page,
        limit: results.limit,
        total: results.total,
        hasMore: results.hasMore
      }
    })
  } catch (error) {
    next(error)
  }
})

// AI Summary endpoint
app.post('/api/ai/summary/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params
    const { type = 'discharge', context } = req.body
    const userId = req.user?.id

    // Check access permissions
    const hasAccess = await fhirService.checkAccess('Patient', patientId, userId!)
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to patient data'
      })
    }

    // Get patient context
    const patientContext = await fhirService.getPatientContext(patientId)
    
    // Generate AI summary
    const summary = await groqService.generateSummary(type, patientContext, context)
    
    // Create DocumentReference
    const documentRef = await fhirService.createDocumentReference({
      resourceType: 'DocumentReference',
      status: 'current',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: type === 'discharge' ? '18842-5' : '11506-0',
          display: type === 'discharge' ? 'Discharge summary' : 'Progress note'
        }]
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/document-classcodes',
          code: 'CLINNOTE',
          display: 'Clinical Note'
        }]
      }],
      subject: {
        reference: `Patient/${patientId}`
      },
      date: new Date().toISOString(),
      author: [{
        reference: `Practitioner/${userId}`
      }],
      content: [{
        attachment: {
          contentType: 'text/plain',
          data: Buffer.from(summary.summary).toString('base64'),
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Summary`
        }
      }],
      context: {
        encounter: context?.encounterId ? [{
          reference: `Encounter/${context.encounterId}`
        }] : undefined
      },
      extension: [{
        url: 'http://medflect.ai/provenance',
        valueString: JSON.stringify(summary.provenance)
      }]
    }, userId!)

    // Log audit event
    await auditService.logEvent({
      userId: userId!,
      action: 'AI_SUMMARY',
      resourceType: 'DocumentReference',
      resourceId: documentRef.id,
      details: `Generated AI ${type} summary for patient ${patientId}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || ''
    })

    res.json({
      success: true,
      data: {
        summary: summary.summary,
        documentReference: documentRef,
        provenance: summary.provenance
      }
    })
  } catch (error) {
    next(error)
  }
})

// Consent management endpoints
app.use('/api/consent', authMiddleware)

app.post('/api/consent', async (req, res, next) => {
  try {
    const { patientId, consentType, purpose, scope, expiresAt } = req.body
    const userId = req.user?.id

    const consent = await consentService.grantConsent({
      patientId,
      consentType,
      purpose,
      scope,
      expiresAt,
      grantedBy: userId!
    })

    res.status(201).json({
      success: true,
      data: consent
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/consent/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params
    const userId = req.user?.id

    const consents = await consentService.getPatientConsents(patientId, userId!)

    res.json({
      success: true,
      data: consents
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/consent/:consentId', async (req, res, next) => {
  try {
    const { consentId } = req.params
    const userId = req.user?.id

    await consentService.revokeConsent(consentId, userId!)

    res.json({
      success: true,
      message: 'Consent revoked successfully'
    })
  } catch (error) {
    next(error)
  }
})

// Sync endpoint for offline changes
app.post('/api/sync', authMiddleware, async (req, res, next) => {
  try {
    const { changes } = req.body
    const userId = req.user?.id

    const syncResults = await fhirService.syncOfflineChanges(changes, userId!)

    res.json({
      success: true,
      data: syncResults
    })
  } catch (error) {
    next(error)
  }
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Medflect AI Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔐 Mock mode - Groq: ${process.env.MOCK_GROQ === 'true' ? 'ON' : 'OFF'}`)
  console.log(`🔐 Mock mode - Blockchain: ${process.env.MOCK_CHAIN === 'true' ? 'ON' : 'OFF'}`)
})

export default app 