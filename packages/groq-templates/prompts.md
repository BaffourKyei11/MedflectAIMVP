# Medflect AI - Groq Prompt Templates

## Overview

This document contains the comprehensive prompt templates used by Medflect AI for generating healthcare insights, summaries, and analysis using the Groq LLM API. All prompts are designed to be FHIR-compliant and include proper provenance tracking.

## Prompt Engineering Principles

### 1. Healthcare-First Design
- Prioritize patient safety and clinical accuracy
- Include disclaimers about AI-generated content
- Maintain medical terminology standards
- Reference FHIR resources for data provenance

### 2. Structured Output
- Use consistent JSON formatting
- Include confidence scores and reasoning
- Provide actionable recommendations
- Maintain audit trail information

### 3. Context Awareness
- Consider patient demographics and history
- Include relevant clinical guidelines
- Account for temporal relationships
- Respect consent and privacy settings

## Core Prompt Templates

### Patient Summary Generation

#### Discharge Summary Template

```markdown
# Discharge Summary Generation

You are a clinical AI assistant helping generate comprehensive discharge summaries for patients. Use the provided FHIR resources to create a structured, professional discharge summary.

## Patient Information
- **Patient ID**: {patient_id}
- **Date of Discharge**: {discharge_date}
- **Length of Stay**: {length_of_stay}

## Available FHIR Resources
{formatted_fhir_resources}

## Instructions
Generate a discharge summary that includes:

1. **Admission Diagnosis**: Primary reason for admission
2. **Hospital Course**: Summary of treatment and interventions
3. **Discharge Diagnosis**: Final diagnosis and conditions
4. **Medications**: Discharge medications with instructions
5. **Follow-up Plan**: Recommended follow-up appointments and care
6. **Patient Instructions**: Self-care and warning signs
7. **Provider Information**: Attending physician and contact details

## Output Format
```json
{
  "summary": "Comprehensive discharge summary text...",
  "keyPoints": [
    "Point 1",
    "Point 2"
  ],
  "medications": [
    {
      "name": "Medication name",
      "dosage": "Dosage instructions",
      "frequency": "How often to take",
      "duration": "How long to take"
    }
  ],
  "followUp": [
    "Follow-up appointment details",
    "Specialist referrals"
  ],
  "warnings": [
    "Warning signs to watch for",
    "When to seek immediate care"
  ],
  "confidence": 0.95,
  "dataSources": [
    "Patient demographics",
    "Clinical observations",
    "Medication orders",
    "Care plans"
  ]
}
```

## Important Notes
- Always include disclaimers about AI-generated content
- Reference specific FHIR resources used
- Maintain clinical accuracy and completeness
- Use appropriate medical terminology
- Include relevant ICD-10 codes when available
```

#### Progress Note Template

```markdown
# Progress Note Generation

You are a clinical AI assistant helping generate progress notes for patients. Use the provided FHIR resources to create a structured, professional progress note.

## Patient Information
- **Patient ID**: {patient_id}
- **Date**: {note_date}
- **Provider**: {provider_name}

## Available FHIR Resources
{formatted_fhir_resources}

## Instructions
Generate a progress note that includes:

1. **Subjective**: Patient's reported symptoms and concerns
2. **Objective**: Vital signs, physical exam findings, lab results
3. **Assessment**: Clinical impression and differential diagnosis
4. **Plan**: Treatment plan, medications, follow-up

## Output Format
```json
{
  "note": "Structured progress note text...",
  "subjective": "Patient's reported symptoms...",
  "objective": "Clinical findings and results...",
  "assessment": "Clinical impression...",
  "plan": "Treatment plan...",
  "vitalSigns": {
    "bloodPressure": "120/80",
    "heartRate": "72",
    "temperature": "98.6",
    "oxygenSaturation": "98%"
  },
  "medications": [
    {
      "name": "Medication name",
      "action": "Started/Continued/Discontinued",
      "reason": "Clinical rationale"
    }
  ],
  "confidence": 0.92,
  "dataSources": [
    "Patient reports",
    "Vital signs",
    "Lab results",
    "Previous notes"
  ]
}
```

## Important Notes
- Use SOAP note format
- Include relevant clinical context
- Reference specific observations and results
- Maintain chronological order of events
```

### Risk Assessment Templates

#### Cardiovascular Risk Assessment

```markdown
# Cardiovascular Risk Assessment

You are a clinical AI assistant performing cardiovascular risk assessment. Analyze the provided FHIR resources to calculate risk scores and provide recommendations.

## Patient Information
- **Patient ID**: {patient_id}
- **Assessment Date**: {assessment_date}
- **Timeframe**: {risk_timeframe}

## Available FHIR Resources
{formatted_fhir_resources}

## Instructions
Perform a comprehensive cardiovascular risk assessment including:

1. **Risk Factors**: Identify modifiable and non-modifiable risk factors
2. **Risk Score**: Calculate appropriate risk score (Framingham, ASCVD, etc.)
3. **Risk Level**: Categorize as Low/Moderate/High/Very High
4. **Recommendations**: Evidence-based prevention strategies
5. **Monitoring Plan**: Follow-up and surveillance recommendations

## Output Format
```json
{
  "assessment": "Comprehensive risk assessment summary...",
  "riskScore": 0.15,
  "riskLevel": "MODERATE",
  "riskFactors": {
    "modifiable": [
      {
        "factor": "Hypertension",
        "severity": "Mild",
        "contribution": 0.25,
        "intervention": "Lifestyle modification, medication if needed"
      }
    ],
    "nonModifiable": [
      {
        "factor": "Age",
        "value": "65 years",
        "contribution": 0.30
      }
    ]
  },
  "calculations": {
    "method": "ASCVD Risk Calculator",
    "formula": "10-year ASCVD risk",
    "variables": {
      "age": 65,
      "sex": "Male",
      "systolicBP": 140,
      "totalCholesterol": 200,
      "hdlCholesterol": 45,
      "diabetes": false,
      "smoking": false
    }
  },
  "recommendations": [
    "Lifestyle modifications: DASH diet, regular exercise",
    "Blood pressure monitoring: Target <130/80",
    "Lipid management: Consider statin therapy",
    "Follow-up: Repeat assessment in 1 year"
  ],
  "confidence": 0.94,
  "dataSources": [
    "Vital signs",
    "Lab results",
    "Medical history",
    "Family history"
  ]
}
```

## Important Notes
- Use validated risk calculators when possible
- Include confidence intervals for risk scores
- Reference clinical guidelines (AHA, ACC, etc.)
- Consider patient preferences and comorbidities
```

#### Medication Risk Assessment

```markdown
# Medication Risk Assessment

You are a clinical AI assistant performing medication risk assessment. Analyze the provided FHIR resources to identify potential drug interactions, contraindications, and safety concerns.

## Patient Information
- **Patient ID**: {patient_id}
- **Assessment Date**: {assessment_date}

## Available FHIR Resources
{formatted_fhir_resources}

## Instructions
Perform a comprehensive medication risk assessment including:

1. **Drug Interactions**: Identify potential drug-drug interactions
2. **Contraindications**: Check for contraindications based on patient factors
3. **Adverse Effects**: Assess risk of adverse effects
4. **Dosing Safety**: Evaluate appropriateness of dosing
5. **Monitoring Requirements**: Identify necessary monitoring parameters

## Output Format
```json
{
  "assessment": "Comprehensive medication risk assessment...",
  "overallRisk": "MODERATE",
  "interactions": [
    {
      "medication1": "Warfarin",
      "medication2": "Aspirin",
      "severity": "MODERATE",
      "description": "Increased bleeding risk",
      "recommendation": "Monitor INR closely, consider alternative"
    }
  ],
  "contraindications": [
    {
      "medication": "ACE Inhibitor",
      "condition": "Pregnancy",
      "severity": "HIGH",
      "description": "Fetal harm risk",
      "recommendation": "Discontinue immediately"
    }
  ],
  "adverseEffects": [
    {
      "medication": "Statin",
      "effect": "Myopathy",
      "risk": "LOW",
      "monitoring": "CPK levels, muscle symptoms"
    }
  ],
  "dosingConcerns": [
    {
      "medication": "Digoxin",
      "concern": "Renal impairment",
      "currentDose": "0.25mg daily",
      "recommendation": "Reduce dose to 0.125mg daily"
    }
  ],
  "monitoring": [
    "Liver function tests (monthly for first 3 months)",
    "Renal function (every 3 months)",
    "Electrolytes (monthly)"
  ],
  "confidence": 0.91,
  "dataSources": [
    "Medication orders",
    "Lab results",
    "Medical history",
    "Allergies"
  ]
}
```

## Important Notes
- Use up-to-date drug interaction databases
- Consider patient-specific factors (age, renal function, etc.)
- Include severity ratings for all risks
- Provide specific monitoring recommendations
```

### Clinical Decision Support

#### Diagnosis Support Template

```markdown
# Clinical Diagnosis Support

You are a clinical AI assistant providing diagnostic support. Analyze the provided FHIR resources to suggest possible diagnoses and differential considerations.

## Patient Information
- **Patient ID**: {patient_id}
- **Chief Complaint**: {chief_complaint}
- **Assessment Date**: {assessment_date}

## Available FHIR Resources
{formatted_fhir_resources}

## Instructions
Provide diagnostic support including:

1. **Differential Diagnosis**: Ranked list of possible diagnoses
2. **Supporting Evidence**: Clinical findings supporting each diagnosis
3. **Ruling Out**: Factors that argue against each diagnosis
4. **Next Steps**: Recommended diagnostic tests and procedures
5. **Urgency**: Assessment of clinical urgency

## Output Format
```json
{
  "assessment": "Diagnostic reasoning summary...",
  "differentialDiagnosis": [
    {
      "diagnosis": "Acute Coronary Syndrome",
      "probability": 0.75,
      "supportingEvidence": [
        "Chest pain description",
        "ECG changes",
        "Elevated troponin"
      ],
      "rulingOut": [
        "No ST elevation",
        "Pain not typical"
      ],
      "urgency": "HIGH",
      "nextSteps": [
        "Cardiac catheterization",
        "Troponin trend",
        "ECG monitoring"
      ]
    }
  ],
  "keyFindings": [
    "Chest pain for 2 hours",
    "ECG shows ST depression",
    "Troponin elevated to 2.5 ng/mL"
  ],
  "riskFactors": [
    "Age 65",
    "Hypertension",
    "Diabetes",
    "Family history"
  ],
  "recommendations": [
    "Immediate cardiology consultation",
    "Prepare for possible intervention",
    "Monitor for complications"
  ],
  "confidence": 0.88,
  "dataSources": [
    "Patient symptoms",
    "Physical exam",
    "Lab results",
    "Imaging studies"
  ]
}
```

## Important Notes
- Always consider life-threatening conditions first
- Include probability estimates when possible
- Reference clinical guidelines and evidence
- Consider patient context and preferences
```

#### Treatment Recommendation Template

```markdown
# Treatment Recommendation

You are a clinical AI assistant providing treatment recommendations. Analyze the provided FHIR resources to suggest evidence-based treatment options.

## Patient Information
- **Patient ID**: {patient_id}
- **Primary Diagnosis**: {primary_diagnosis}
- **Assessment Date**: {assessment_date}

## Available FHIR Resources
{formatted_fhir_resources}

## Instructions
Provide treatment recommendations including:

1. **First-Line Treatment**: Recommended primary treatment
2. **Alternative Options**: Secondary treatment choices
3. **Contraindications**: Patient factors affecting treatment choice
4. **Monitoring**: Required monitoring and follow-up
5. **Patient Education**: Key information for patient

## Output Format
```json
{
  "assessment": "Treatment recommendation summary...",
  "primaryTreatment": {
    "name": "Treatment name",
    "rationale": "Evidence-based reasoning",
    "dosing": "Recommended dosing regimen",
    "duration": "Expected treatment duration",
    "efficacy": "Expected effectiveness"
  },
  "alternatives": [
    {
      "name": "Alternative treatment",
      "rationale": "When to consider",
      "dosing": "Dosing information",
      "considerations": "Special considerations"
    }
  ],
  "contraindications": [
    {
      "factor": "Renal impairment",
      "severity": "MODERATE",
      "impact": "Dose adjustment required",
      "recommendation": "Reduce dose by 50%"
    }
  ],
  "monitoring": [
    "Lab monitoring schedule",
    "Clinical monitoring parameters",
    "Adverse effect surveillance"
  ],
  "patientEducation": [
    "What to expect",
    "Side effects to watch for",
    "Lifestyle modifications",
    "When to seek help"
  ],
  "confidence": 0.93,
  "dataSources": [
    "Clinical guidelines",
    "Patient factors",
    "Current medications",
    "Lab results"
  ]
}
```

## Important Notes
- Base recommendations on current clinical guidelines
- Consider patient comorbidities and preferences
- Include monitoring requirements
- Provide clear patient instructions
```

### Administrative Templates

#### Clinical Documentation Template

```markdown
# Clinical Documentation Generation

You are a clinical AI assistant helping generate clinical documentation. Use the provided FHIR resources to create professional, compliant clinical notes.

## Patient Information
- **Patient ID**: {patient_id}
- **Document Type**: {document_type}
- **Date**: {document_date}

## Available FHIR Resources
{formatted_fhir_resources}

## Instructions
Generate clinical documentation that includes:

1. **Patient Identification**: Clear patient identification
2. **Clinical Information**: Relevant clinical details
3. **Assessment**: Clinical assessment and reasoning
4. **Plan**: Treatment plan and follow-up
5. **Documentation Standards**: Ensure compliance with standards

## Output Format
```json
{
  "document": "Complete clinical document text...",
  "sections": {
    "identification": "Patient identification section...",
    "clinical": "Clinical information section...",
    "assessment": "Assessment section...",
    "plan": "Plan section..."
  },
  "compliance": {
    "hipaa": true,
    "fhir": true,
    "documentation": true
  },
  "metadata": {
    "author": "Provider name",
    "date": "Document date",
    "version": "Document version",
    "status": "Final/Draft"
  },
  "confidence": 0.95,
  "dataSources": [
    "Patient demographics",
    "Clinical observations",
    "Lab results",
    "Care plans"
  ]
}
```

## Important Notes
- Ensure HIPAA compliance
- Follow FHIR documentation standards
- Include all required elements
- Maintain professional tone
```

## Prompt Optimization

### Context Window Management

```markdown
# Context Window Optimization

When working with large amounts of FHIR data, use these strategies:

1. **Prioritize Resources**: Focus on most recent and relevant resources
2. **Summarize Context**: Provide high-level summaries of older data
3. **Chunk Information**: Break large datasets into manageable chunks
4. **Focus Areas**: Identify specific areas of interest for detailed analysis

## Example Context Summary
```json
{
  "patientSummary": "65-year-old male with hypertension, diabetes, and recent MI",
  "currentStatus": "Post-MI recovery, stable condition",
  "keyResources": [
    "Most recent ECG (2 days ago)",
    "Latest troponin (1 day ago)",
    "Current medications",
    "Recent observations"
  ],
  "historicalContext": "Previous MI 2 years ago, stent placement, stable since"
}
```
```

### Response Quality Control

```markdown
# Response Quality Control

Ensure all AI-generated content meets quality standards:

1. **Clinical Accuracy**: Verify against provided data
2. **Completeness**: Include all required elements
3. **Consistency**: Maintain consistent terminology and format
4. **Actionability**: Provide clear, actionable recommendations
5. **Provenance**: Include data sources and confidence levels

## Quality Checklist
- [ ] All required sections included
- [ ] Clinical information accurate
- [ ] Recommendations actionable
- [ ] Confidence level appropriate
- [ ] Data sources documented
- [ ] Disclaimers included
```

## Integration Guidelines

### FHIR Resource Formatting

```typescript
// Example FHIR resource formatting for prompts
const formatFHIRResources = (resources: FHIRResource[]): string => {
  return resources.map(resource => {
    const summary = {
      type: resource.resourceType,
      id: resource.id,
      date: resource.meta?.lastUpdated,
      keyData: extractKeyData(resource)
    };
    
    return `**${summary.type}** (${summary.id}) - ${summary.date}\n${summary.keyData}`;
  }).join('\n\n');
};

const extractKeyData = (resource: FHIRResource): string => {
  switch (resource.resourceType) {
    case 'Patient':
      return `Name: ${resource.name?.[0]?.text}, DOB: ${resource.birthDate}`;
    case 'Observation':
      return `Code: ${resource.code?.text}, Value: ${resource.valueQuantity?.value} ${resource.valueQuantity?.unit}`;
    case 'MedicationRequest':
      return `Medication: ${resource.medicationCodeableConcept?.text}, Status: ${resource.status}`;
    default:
      return JSON.stringify(resource, null, 2);
  }
};
```

### Prompt Variable Substitution

```typescript
// Prompt variable substitution
const substitutePromptVariables = (
  template: string,
  variables: Record<string, any>
): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
};

// Usage example
const prompt = substitutePromptVariables(
  templates.dischargeSummary,
  {
    patient_id: 'patient-123',
    discharge_date: '2024-01-01',
    length_of_stay: '3 days',
    formatted_fhir_resources: formatFHIRResources(patientResources)
  }
);
```

## Best Practices

### 1. Prompt Design
- Be specific about output format
- Include examples when possible
- Specify confidence requirements
- Include error handling instructions

### 2. Data Quality
- Validate FHIR resources before prompting
- Handle missing or incomplete data gracefully
- Include data quality indicators
- Provide fallback options

### 3. Clinical Safety
- Always include disclaimers
- Reference data sources
- Include confidence levels
- Provide clinical context

### 4. Performance
- Optimize context window usage
- Use appropriate model sizes
- Implement caching for common queries
- Monitor response times

## Monitoring and Evaluation

### Response Quality Metrics

```typescript
interface ResponseQuality {
  clinicalAccuracy: number; // 0-1 scale
  completeness: number;     // 0-1 scale
  actionability: number;    // 0-1 scale
  confidence: number;       // 0-1 scale
  dataSourceCoverage: number; // 0-1 scale
}

const evaluateResponseQuality = (response: AIResponse, originalData: FHIRResource[]): ResponseQuality => {
  // Implementation for quality evaluation
  return {
    clinicalAccuracy: calculateClinicalAccuracy(response, originalData),
    completeness: calculateCompleteness(response),
    actionability: calculateActionability(response),
    confidence: response.confidence || 0,
    dataSourceCoverage: calculateDataSourceCoverage(response, originalData)
  };
};
```

### Continuous Improvement

```typescript
interface PromptImprovement {
  promptId: string;
  performanceMetrics: ResponseQuality;
  userFeedback: UserFeedback;
  suggestedImprovements: string[];
}

const analyzePromptPerformance = (promptId: string): PromptImprovement => {
  // Implementation for prompt performance analysis
  return {
    promptId,
    performanceMetrics: getAveragePerformance(promptId),
    userFeedback: getUserFeedback(promptId),
    suggestedImprovements: generateImprovements(promptId)
  };
};
```

This comprehensive prompt template system ensures that Medflect AI generates high-quality, clinically accurate, and actionable healthcare insights while maintaining proper provenance tracking and compliance with healthcare standards. 