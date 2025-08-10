import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, FileText, Activity, Calendar, MapPin, Phone, Mail, Brain, Download, Share2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { useToast } from '../contexts/ToastContext'
import { Patient, FHIRResource, AISummary } from '../types'

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isOnline, syncStatus } = useSync()
  const { showToast } = useToast()
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [fhirResources, setFhirResources] = useState<FHIRResource[]>([])
  const [aiSummaries, setAiSummaries] = useState<AISummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  // Mock patient data
  const mockPatient: Patient = {
    id: id || '1',
    name: 'John Smith',
    dateOfBirth: '1985-03-15',
    gender: 'male',
    status: 'active',
    lastVisit: '2024-01-15',
    riskLevel: 'low',
    demographics: {
      address: '123 Main St, Anytown, USA',
      phone: '+1-555-0123',
      email: 'john.smith@email.com'
    }
  }

  // Mock FHIR resources
  const mockFhirResources: FHIRResource[] = [
    {
      id: 'obs-1',
      resourceType: 'Observation',
      status: 'final',
      category: [{ text: 'vital-signs' }],
      code: { text: 'Blood Pressure' },
      effectiveDateTime: '2024-01-15T10:30:00Z',
      valueQuantity: { value: 120, unit: 'mmHg' },
      component: [
        { code: { text: 'Systolic' }, valueQuantity: { value: 120, unit: 'mmHg' } },
        { code: { text: 'Diastolic' }, valueQuantity: { value: 80, unit: 'mmHg' } }
      ]
    },
    {
      id: 'obs-2',
      resourceType: 'Observation',
      status: 'final',
      category: [{ text: 'vital-signs' }],
      code: { text: 'Heart Rate' },
      effectiveDateTime: '2024-01-15T10:30:00Z',
      valueQuantity: { value: 72, unit: 'beats/min' }
    },
    {
      id: 'enc-1',
      resourceType: 'Encounter',
      status: 'finished',
      class: { code: 'AMB', display: 'Ambulatory' },
      period: {
        start: '2024-01-15T09:00:00Z',
        end: '2024-01-15T10:30:00Z'
      },
      reasonCode: [{ text: 'Annual checkup' }]
    }
  ]

  // Mock AI summaries
  const mockAiSummaries: AISummary[] = [
    {
      id: 'summary-1',
      type: 'discharge_summary',
      content: 'Patient presented for annual checkup. Vital signs within normal limits. Blood pressure 120/80 mmHg, heart rate 72 bpm. No acute concerns identified. Recommended follow-up in 1 year.',
      generatedAt: '2024-01-15T11:00:00Z',
      model: 'groq-llama3-8b',
      version: '1.0.0',
      dataRefs: ['obs-1', 'obs-2', 'enc-1'],
      provenance: {
        model: 'groq-llama3-8b',
        version: '1.0.0',
        timestamp: '2024-01-15T11:00:00Z',
        dataRefs: ['obs-1', 'obs-2', 'enc-1']
      }
    }
  ]

  useEffect(() => {
    // Simulate loading patient data
    setTimeout(() => {
      setPatient(mockPatient)
      setFhirResources(mockFhirResources)
      setAiSummaries(mockAiSummaries)
      setLoading(false)
    }, 1000)
  }, [id])

  const handleGenerateSummary = async () => {
    if (!isOnline) {
      showToast('Cannot generate summary while offline', 'error')
      return
    }

    setGeneratingSummary(true)
    
    try {
      // Simulate API call to generate summary
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const newSummary: AISummary = {
        id: `summary-${Date.now()}`,
        type: 'progress_note',
        content: 'AI-generated progress note based on current patient data and recent observations. Patient continues to show stable vital signs with no significant changes from previous visit.',
        generatedAt: new Date().toISOString(),
        model: 'groq-llama3-8b',
        version: '1.0.0',
        dataRefs: fhirResources.map(r => r.id),
        provenance: {
          model: 'groq-llama3-8b',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          dataRefs: fhirResources.map(r => r.id)
        }
      }
      
      setAiSummaries(prev => [newSummary, ...prev])
      showToast('AI summary generated successfully', 'success')
      setShowSummaryModal(false)
    } catch (error) {
      showToast('Failed to generate summary', 'error')
    } finally {
      setGeneratingSummary(false)
    }
  }

  const getAge = (dateOfBirth: string): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Patient not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-gray-600">Patient ID: {patient.id}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <button
            onClick={() => setShowSummaryModal(true)}
            disabled={!isOnline || generatingSummary}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Brain className="w-4 h-4" />
            <span>Generate Summary</span>
          </button>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium">{formatDate(patient.dateOfBirth)} ({getAge(patient.dateOfBirth)} years)</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Risk Level</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(patient.riskLevel)}`}>
                {patient.riskLevel} risk
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{patient.demographics.address}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{patient.demographics.phone}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{patient.demographics.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'fhir', label: 'FHIR Resources', icon: Activity },
              { id: 'ai', label: 'AI Summaries', icon: Brain }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Recent Activity</h3>
                  <p className="text-blue-700 text-sm">Last visit: {formatDate(patient.lastVisit)}</p>
                  <p className="text-blue-700 text-sm">Status: {patient.status}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Vital Signs</h3>
                  <p className="text-green-700 text-sm">Blood Pressure: 120/80 mmHg</p>
                  <p className="text-green-700 text-sm">Heart Rate: 72 bpm</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">AI Insights</h3>
                  <p className="text-purple-700 text-sm">{aiSummaries.length} summaries generated</p>
                  <p className="text-purple-700 text-sm">Last: {aiSummaries[0] ? formatDate(aiSummaries[0].generatedAt) : 'None'}</p>
                </div>
              </div>
            </div>
          )}

          {/* FHIR Resources Tab */}
          {activeTab === 'fhir' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">FHIR Resources ({fhirResources.length})</h3>
                <button className="text-primary-600 hover:text-primary-700 text-sm">
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Resource
                </button>
              </div>
              
              <div className="space-y-3">
                {fhirResources.map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{resource.resourceType}: {resource.code?.text || resource.id}</h4>
                      <span className="text-sm text-gray-500">{formatDate(resource.effectiveDateTime || '')}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {resource.resourceType === 'Observation' && resource.valueQuantity && (
                        <p>Value: {resource.valueQuantity.value} {resource.valueQuantity.unit}</p>
                      )}
                      {resource.resourceType === 'Encounter' && resource.reasonCode && (
                        <p>Reason: {resource.reasonCode[0]?.text}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summaries Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">AI Summaries ({aiSummaries.length})</h3>
                <button
                  onClick={() => setShowSummaryModal(true)}
                  disabled={!isOnline}
                  className="text-primary-600 hover:text-primary-700 text-sm disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Generate New
                </button>
              </div>
              
              <div className="space-y-4">
                {aiSummaries.map((summary) => (
                  <div key={summary.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                          {summary.type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(summary.generatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{summary.content}</p>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><strong>Model:</strong> {summary.provenance.model} v{summary.provenance.version}</p>
                      <p><strong>Data Sources:</strong> {summary.provenance.dataRefs.join(', ')}</p>
                      <p><strong>Generated:</strong> {formatDate(summary.provenance.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">Generate AI Summary</h3>
            <p className="text-gray-600 mb-6">
              Generate an AI-powered summary based on the patient's current data and recent observations.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {generatingSummary ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDetail 