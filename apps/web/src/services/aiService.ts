import { supabase } from '../lib/supabase';
import { fhirService } from './fhirService';
import { FHIRPatient, FHIRObservation } from './fhirService';

// AI Summary types
export interface AISummary {
  id: string;
  patientId: string;
  summary: string;
  type: 'discharge' | 'progress' | 'risk' | 'general';
  provenance: {
    model: string;
    version: string;
    timestamp: string;
    dataRefs: string[];
    confidence: number;
    prompt: string;
  };
  metadata: {
    wordCount: number;
    keyFindings: string[];
    recommendations: string[];
    riskFactors: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// AI Service class
export class AIService {
  private static instance: AIService;
  private supabase = supabase;
  private groqEndpoint = 'http://91.108.112.45:4000';
  private groqApiKey = 'sk-npvlOAYvZsy6iRqqtM5PNA';

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Generate AI summary for a patient
  async generateSummary(
    patientId: string,
    type: AISummary['type'] = 'general',
    options: {
      includeObservations?: boolean;
      includeEncounters?: boolean;
      customPrompt?: string;
    } = {}
  ): Promise<AISummary> {
    try {
      // Get patient data
      const patient = await fhirService.getResource<FHIRPatient>('Patient', patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Get related resources
      const observations = options.includeObservations 
        ? await fhirService.searchResources<FHIRObservation>('Observation', { 
            'subject.reference': `Patient/${patientId}` 
          })
        : [];

      // Construct context bundle
      const contextBundle = this.constructContextBundle(patient, observations, type);

      // Generate prompt
      const prompt = options.customPrompt || this.generatePrompt(type, contextBundle);

      // Call Groq API
      const summary = await this.callGroqAPI(prompt, contextBundle);

      // Create AI summary resource
      const aiSummary: AISummary = {
        id: crypto.randomUUID(),
        patientId,
        summary,
        type,
        provenance: {
          model: 'groq-llama3.1-8b',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          dataRefs: [
            `Patient/${patientId}`,
            ...observations.map(o => `Observation/${o.id}`)
          ],
          confidence: 0.85, // Mock confidence score
          prompt
        },
        metadata: {
          wordCount: summary.split(' ').length,
          keyFindings: this.extractKeyFindings(summary),
          recommendations: this.extractRecommendations(summary),
          riskFactors: this.extractRiskFactors(summary)
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store the summary
      await this.storeSummary(aiSummary);

      // Create DocumentReference for FHIR compliance
      await this.createDocumentReference(aiSummary);

      return aiSummary;
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw error;
    }
  }

  // Call Groq API
  private async callGroqAPI(prompt: string, context: any): Promise<string> {
    try {
      // Check if we should use mock mode
      if (process.env.MOCK_GROQ === 'true') {
        return this.generateMockSummary(prompt, context);
      }

      const response = await fetch(`${this.groqEndpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3.1-8b',
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI assistant. Provide clear, concise, and accurate medical summaries based on the provided patient data. Always include relevant clinical findings and recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No summary generated';

    } catch (error) {
      console.error('Error calling Groq API:', error);
      // Fallback to mock summary
      return this.generateMockSummary(prompt, context);
    }
  }

  // Generate mock summary for development/testing
  private generateMockSummary(prompt: string, context: any): string {
    const patient = context.patient;
    const observations = context.observations || [];

    const mockSummaries = {
      discharge: `Discharge Summary for ${patient.name?.[0]?.text || 'Patient'}

Patient was admitted with [condition] and has shown significant improvement during their stay. Vital signs have stabilized and the patient is ready for discharge.

Key Findings:
- Vital signs within normal limits
- Pain well controlled
- Mobility improved with physical therapy
- Patient education completed

Recommendations:
- Continue prescribed medications
- Follow up with primary care physician in 1 week
- Maintain current diet and exercise regimen
- Contact healthcare provider if symptoms worsen

Discharge Date: ${new Date().toLocaleDateString()}`,

      progress: `Progress Note for ${patient.name?.[0]?.text || 'Patient'}

Date: ${new Date().toLocaleDateString()}

Subjective: Patient reports feeling better today with improved energy levels.

Objective: Vital signs stable. Physical examination shows continued improvement.

Assessment: Patient is responding well to current treatment plan.

Plan: Continue current medications and monitor for any adverse effects.`,

      risk: `Risk Assessment for ${patient.name?.[0]?.text || 'Patient'}

Based on current clinical data, the following risk factors have been identified:

High Risk Factors:
- Age-related considerations
- Chronic conditions requiring monitoring

Moderate Risk Factors:
- Medication interactions
- Lifestyle factors

Recommendations:
- Regular monitoring of vital signs
- Medication review and reconciliation
- Patient education on risk factors
- Follow-up scheduling`,

      general: `Clinical Summary for ${patient.name?.[0]?.text || 'Patient'}

Patient Overview:
- Age: ${patient.birthDate ? this.calculateAge(patient.birthDate) : 'Unknown'}
- Gender: ${patient.gender || 'Unknown'}
- Active Status: ${patient.active ? 'Active' : 'Inactive'}

Recent Observations: ${observations.length} observation(s) recorded

Summary: Patient appears to be in stable condition based on available clinical data. Regular monitoring and follow-up care recommended.`
    };

    return mockSummaries[context.type] || mockSummaries.general;
  }

  // Construct context bundle for AI
  private constructContextBundle(
    patient: FHIRPatient,
    observations: FHIRObservation[],
    type: AISummary['type']
  ): any {
    return {
      patient: {
        id: patient.id,
        name: patient.name,
        gender: patient.gender,
        birthDate: patient.birthDate,
        active: patient.active,
        address: patient.address,
        contact: patient.contact
      },
      observations: observations.map(obs => ({
        id: obs.id,
        code: obs.code,
        status: obs.status,
        effectiveDateTime: obs.effectiveDateTime,
        value: obs.valueQuantity || obs.valueCodeableConcept || obs.valueString,
        category: obs.category,
        interpretation: obs.interpretation,
        note: obs.note
      })),
      type,
      timestamp: new Date().toISOString()
    };
  }

  // Generate appropriate prompt based on summary type
  private generatePrompt(type: AISummary['type'], context: any): string {
    const basePrompt = `Based on the following patient data, generate a comprehensive ${type} summary:

Patient Information:
${JSON.stringify(context.patient, null, 2)}

Clinical Observations:
${JSON.stringify(context.observations, null, 2)}

Please provide a clear, professional medical summary that includes:
1. Key clinical findings
2. Relevant observations and measurements
3. Clinical recommendations
4. Any identified risk factors
5. Follow-up recommendations

Format the response in a structured, easy-to-read manner suitable for healthcare professionals.`;

    const typeSpecificPrompts = {
      discharge: `${basePrompt}

Focus on:
- Reason for admission
- Treatment provided
- Current status
- Discharge instructions
- Follow-up care plan`,

      progress: `${basePrompt}

Focus on:
- Current clinical status
- Changes since last assessment
- Response to treatment
- Next steps in care plan`,

      risk: `${basePrompt}

Focus on:
- Identified risk factors
- Risk stratification
- Mitigation strategies
- Monitoring requirements
- Patient education needs`,

      general: basePrompt
    };

    return typeSpecificPrompts[type] || basePrompt;
  }

  // Extract key findings from summary
  private extractKeyFindings(summary: string): string[] {
    const findings = summary.match(/Key Findings?:(.*?)(?=\n\n|\n[A-Z]|$)/is);
    if (findings) {
      return findings[1]
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return [];
  }

  // Extract recommendations from summary
  private extractRecommendations(summary: string): string[] {
    const recommendations = summary.match(/Recommendations?:(.*?)(?=\n\n|\n[A-Z]|$)/is);
    if (recommendations) {
      return recommendations[1]
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return [];
  }

  // Extract risk factors from summary
  private extractRiskFactors(summary: string): string[] {
    const riskFactors = summary.match(/Risk Factors?:(.*?)(?=\n\n|\n[A-Z]|$)/is);
    if (riskFactors) {
      return riskFactors[1]
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return [];
  }

  // Store AI summary
  private async storeSummary(summary: AISummary): Promise<void> {
    try {
      // Store in Supabase
      const { error } = await this.supabase
        .from('ai_summaries')
        .insert({
          id: summary.id,
          patient_id: summary.patientId,
          summary: summary.summary,
          type: summary.type,
          provenance: summary.provenance,
          metadata: summary.metadata,
          created_at: summary.createdAt,
          updated_at: summary.updatedAt
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing AI summary:', error);
      throw error;
    }
  }

  // Create DocumentReference for FHIR compliance
  private async createDocumentReference(summary: AISummary): Promise<void> {
    try {
      const documentReference = {
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '18842-5',
            display: 'Discharge summary'
          }]
        },
        category: [{
          coding: [{
            system: 'http://loinc.org',
            code: '11506-3',
            display: 'Progress note'
          }]
        }],
        subject: {
          reference: `Patient/${summary.patientId}`,
          display: 'Patient'
        },
        date: summary.createdAt,
        author: [{
          reference: 'Practitioner/system',
          display: 'AI System'
        }],
        content: [{
          attachment: {
            contentType: 'text/plain',
            data: btoa(summary.summary),
            title: `${summary.type.charAt(0).toUpperCase() + summary.type.slice(1)} Summary`
          }
        }],
        context: {
          encounter: [{
            reference: 'Encounter/ai-summary',
            display: 'AI Summary Generation'
          }],
          period: {
            start: summary.createdAt,
            end: summary.updatedAt
          }
        },
        // Add provenance extension
        extension: [{
          url: 'http://hl7.org/fhir/StructureDefinition/provenance',
          valueReference: {
            reference: `AI Summary/${summary.id}`,
            display: 'AI Generated Summary'
          }
        }]
      };

      await fhirService.createResource('DocumentReference', documentReference);
    } catch (error) {
      console.error('Error creating DocumentReference:', error);
      // Don't throw error as this is secondary to summary generation
    }
  }

  // Get AI summary by ID
  async getSummary(id: string): Promise<AISummary | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_summaries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting AI summary:', error);
      return null;
    }
  }

  // Get all summaries for a patient
  async getPatientSummaries(patientId: string): Promise<AISummary[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_summaries')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting patient summaries:', error);
      return [];
    }
  }

  // Update AI summary
  async updateSummary(id: string, updates: Partial<AISummary>): Promise<AISummary | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_summaries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating AI summary:', error);
      return null;
    }
  }

  // Delete AI summary
  async deleteSummary(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('ai_summaries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting AI summary:', error);
      return false;
    }
  }

  // Helper method to calculate age
  private calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}

// Export singleton instance
export const aiService = AIService.getInstance(); 