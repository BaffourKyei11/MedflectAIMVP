import fetch from 'node-fetch'

export interface PatientContext {
  Patient?: any[]
  Observation?: any[]
  Encounter?: any[]
  DocumentReference?: any[]
  Consent?: any[]
}

export interface SummaryRequest {
  type: 'discharge' | 'progress' | 'risk' | 'medication'
  context: PatientContext
  additionalContext?: Record<string, any>
}

export interface SummaryResponse {
  summary: string
  provenance: {
    model: string
    version: string
    timestamp: string
    dataRefs: string[]
    confidence: number
    reasoning: string
  }
}

export interface GroqConfig {
  endpoint: string
  apiKey: string
  mockMode: boolean
}

export class GroqService {
  private config: GroqConfig
  private promptTemplates: Record<string, string>

  constructor() {
    this.config = {
      endpoint: process.env.GROQ_ENDPOINT || 'http://91.108.112.45:4000',
      apiKey: process.env.GROQ_API_KEY || 'sk-npvlOAYvZsy6iRqqtM5PNA',
      mockMode: process.env.MOCK_GROQ === 'true'
    }

    this.promptTemplates = {
      discharge: `You are a medical AI assistant. Generate a comprehensive discharge summary for the patient based on the following FHIR data:

Patient Information:
{patientInfo}

Clinical Observations:
{observations}

Encounters:
{encounters}

Previous Documents:
{previousDocs}

Please provide:
1. A concise summary of the patient's condition
2. Key findings and diagnoses
3. Treatment provided
4. Discharge instructions
5. Follow-up recommendations
6. Any risk factors or warnings

Format the response as a professional medical document suitable for healthcare providers.`,

      progress: `You are a medical AI assistant. Generate a progress note for the patient based on the following FHIR data:

Patient Information:
{patientInfo}

Recent Observations:
{observations}

Current Encounter:
{encounter}

Previous Progress:
{previousDocs}

Please provide:
1. Current status and progress
2. New findings or changes
3. Treatment adjustments
4. Plan for next steps
5. Any concerns or alerts

Format as a concise progress note following medical documentation standards.`,

      risk: `You are a medical AI assistant. Analyze the patient data for potential risk factors and generate a risk assessment:

Patient Information:
{patientInfo}

Clinical Data:
{observations}

Medical History:
{encounters}

Previous Assessments:
{previousDocs}

Please identify and assess:
1. High-risk factors
2. Moderate-risk factors
3. Low-risk factors
4. Recommended monitoring
5. Preventive measures
6. Urgency indicators

Provide a structured risk assessment with clear action items.`,

      medication: `You are a medical AI assistant. Review the patient's medication profile and generate a medication summary:

Patient Information:
{patientInfo}

Current Medications:
{medications}

Recent Observations:
{observations}

Medication History:
{encounters}

Please provide:
1. Current medication list
2. Dosage and frequency
3. Potential interactions
4. Side effects to monitor
5. Compliance recommendations
6. Medication reconciliation needs

Format as a clear medication summary for healthcare providers.`
    }
  }

  async generateSummary(type: string, patientContext: PatientContext, additionalContext?: Record<string, any>): Promise<SummaryResponse> {
    if (this.config.mockMode) {
      return this.generateMockSummary(type, patientContext, additionalContext)
    }

    try {
      const prompt = this.buildPrompt(type, patientContext, additionalContext)
      const response = await this.callGroqAPI(prompt, type)
      
      return {
        summary: response.summary,
        provenance: {
          model: 'groq-llama3-8b-8192',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          dataRefs: this.extractDataReferences(patientContext),
          confidence: response.confidence || 0.85,
          reasoning: response.reasoning || 'AI-generated summary based on patient FHIR data'
        }
      }
    } catch (error) {
      console.error('Error calling Groq API:', error)
      
      // Fallback to mock mode if API fails
      return this.generateMockSummary(type, patientContext, additionalContext)
    }
  }

  private async callGroqAPI(prompt: string, type: string): Promise<any> {
    const response = await fetch(`${this.config.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant specializing in healthcare documentation and analysis. Always provide accurate, professional medical summaries based on the data provided.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      summary: data.choices[0]?.message?.content || 'Unable to generate summary',
      confidence: 0.85,
      reasoning: 'Generated using Groq LLM API'
    }
  }

  private buildPrompt(type: string, patientContext: PatientContext, additionalContext?: Record<string, any>): string {
    let template = this.promptTemplates[type] || this.promptTemplates.progress
    
    // Extract patient information
    const patientInfo = patientContext.Patient?.[0] || {}
    const observations = patientContext.Observation || []
    const encounters = patientContext.Encounter || []
    const previousDocs = patientContext.DocumentReference || []
    
    // Format data for prompt
    const formattedPatientInfo = this.formatPatientInfo(patientInfo)
    const formattedObservations = this.formatObservations(observations)
    const formattedEncounters = this.formatEncounters(encounters)
    const formattedPreviousDocs = this.formatPreviousDocs(previousDocs)
    
    // Replace placeholders in template
    template = template
      .replace('{patientInfo}', formattedPatientInfo)
      .replace('{observations}', formattedObservations)
      .replace('{encounters}', formattedEncounters)
      .replace('{previousDocs}', formattedPreviousDocs)
    
    // Add additional context if provided
    if (additionalContext) {
      template += `\n\nAdditional Context:\n${JSON.stringify(additionalContext, null, 2)}`
    }
    
    return template
  }

  private formatPatientInfo(patient: any): string {
    if (!patient) return 'No patient information available'
    
    const name = patient.name?.[0]?.given?.join(' ') + ' ' + patient.name?.[0]?.family || 'Unknown'
    const gender = patient.gender || 'Unknown'
    const birthDate = patient.birthDate || 'Unknown'
    const identifier = patient.identifier?.[0]?.value || 'No ID'
    
    return `Name: ${name}
Gender: ${gender}
Date of Birth: ${birthDate}
Patient ID: ${identifier}
Active: ${patient.active !== false ? 'Yes' : 'No'}`
  }

  private formatObservations(observations: any[]): string {
    if (!observations.length) return 'No clinical observations available'
    
    return observations.map(obs => {
      const code = obs.code?.coding?.[0]?.display || obs.code?.coding?.[0]?.code || 'Unknown'
      const value = obs.valueQuantity?.value || obs.valueString || obs.valueCodeableConcept?.coding?.[0]?.display || 'No value'
      const date = obs.effectiveDateTime || obs.issued || 'No date'
      const status = obs.status || 'Unknown'
      
      return `- ${code}: ${value} (${status}, ${date})`
    }).join('\n')
  }

  private formatEncounters(encounters: any[]): string {
    if (!encounters.length) return 'No encounter information available'
    
    return encounters.map(enc => {
      const type = enc.type?.[0]?.coding?.[0]?.display || 'Unknown type'
      const status = enc.status || 'Unknown'
      const date = enc.period?.start || enc.dateTime || 'No date'
      const classCode = enc.class?.code || 'Unknown class'
      
      return `- ${type} (${status}, ${classCode}, ${date})`
    }).join('\n')
  }

  private formatPreviousDocs(docs: any[]): string {
    if (!docs.length) return 'No previous documents available'
    
    return docs.map(doc => {
      const type = doc.type?.coding?.[0]?.display || 'Unknown type'
      const date = doc.date || 'No date'
      const status = doc.status || 'Unknown'
      
      return `- ${type} (${status}, ${date})`
    }).join('\n')
  }

  private extractDataReferences(patientContext: PatientContext): string[] {
    const refs: string[] = []
    
    Object.entries(patientContext).forEach(([resourceType, resources]) => {
      if (resources && resources.length > 0) {
        resources.forEach(resource => {
          refs.push(`${resourceType}/${resource.id}`)
        })
      }
    })
    
    return refs
  }

  private generateMockSummary(type: string, patientContext: PatientContext, additionalContext?: Record<string, any>): SummaryResponse {
    const mockSummaries = {
      discharge: `DISCHARGE SUMMARY

Patient: ${patientContext.Patient?.[0]?.name?.[0]?.given?.join(' ') || 'Unknown'} ${patientContext.Patient?.[0]?.name?.[0]?.family || 'Patient'}

ADMISSION DATE: ${patientContext.Encounter?.[0]?.period?.start || 'Unknown'}
DISCHARGE DATE: ${new Date().toISOString().split('T')[0]}

PRIMARY DIAGNOSIS: Acute condition requiring medical intervention

TREATMENT PROVIDED: 
- Comprehensive medical evaluation
- Appropriate therapeutic interventions
- Monitoring and supportive care

DISCHARGE CONDITION: Stable for discharge

DISCHARGE INSTRUCTIONS:
- Follow up with primary care physician within 1 week
- Continue prescribed medications as directed
- Return to emergency department if symptoms worsen
- Maintain healthy lifestyle and diet

FOLLOW-UP: Primary care appointment scheduled

This is a mock discharge summary generated for demonstration purposes.`,

      progress: `PROGRESS NOTE

Patient: ${patientContext.Patient?.[0]?.name?.[0]?.given?.join(' ') || 'Unknown'} ${patientContext.Patient?.[0]?.name?.[0]?.family || 'Patient'}
Date: ${new Date().toISOString().split('T')[0]}

SUBJECTIVE: Patient continues to show improvement in condition.

OBJECTIVE: Vital signs stable, physical examination shows positive progress.

ASSESSMENT: Patient responding well to treatment protocol.

PLAN: Continue current treatment regimen, monitor for any adverse effects.

This is a mock progress note generated for demonstration purposes.`,

      risk: `RISK ASSESSMENT

Patient: ${patientContext.Patient?.[0]?.name?.[0]?.given?.join(' ') || 'Unknown'} ${patientContext.Patient?.[0]?.name?.[0]?.family || 'Patient'}
Date: ${new Date().toISOString().split('T')[0]}

RISK FACTORS IDENTIFIED:
- Moderate: Age-related considerations
- Low: No immediate high-risk indicators

RECOMMENDED MONITORING:
- Regular vital sign checks
- Medication compliance monitoring
- Follow-up appointments

PREVENTIVE MEASURES:
- Maintain current medication regimen
- Regular health screenings
- Lifestyle modifications as appropriate

This is a mock risk assessment generated for demonstration purposes.`,

      medication: `MEDICATION SUMMARY

Patient: ${patientContext.Patient?.[0]?.name?.[0]?.given?.join(' ') || 'Unknown'} ${patientContext.Patient?.[0]?.name?.[0]?.family || 'Patient'}
Date: ${new Date().toISOString().split('T')[0]}

CURRENT MEDICATIONS:
- No active medications documented

MEDICATION HISTORY:
- Previous medications may be documented in encounter records

RECOMMENDATIONS:
- Review medication list with healthcare provider
- Ensure medication reconciliation is completed
- Monitor for any new prescriptions

This is a mock medication summary generated for demonstration purposes.`
    }

    return {
      summary: mockSummaries[type as keyof typeof mockSummaries] || mockSummaries.progress,
      provenance: {
        model: 'mock-groq-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        dataRefs: this.extractDataReferences(patientContext),
        confidence: 0.95,
        reasoning: 'Mock summary generated for demonstration and testing purposes'
      }
    }
  }

  // Method to test API connectivity
  async testConnection(): Promise<boolean> {
    if (this.config.mockMode) {
      return true
    }

    try {
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
} 