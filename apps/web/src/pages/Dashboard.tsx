import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Filter, User, Calendar, Activity } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { useToast } from '../contexts/ToastContext'
import { Patient, FHIRResource } from '../types'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isOnline, syncStatus } = useSync()
  const { showToast } = useToast()
  
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    ageGroup: 'all',
    lastVisit: 'all'
  })

  // Mock patient data for development
  const mockPatients: Patient[] = [
    {
      id: '1',
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
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      dateOfBirth: '1992-07-22',
      gender: 'female',
      status: 'active',
      lastVisit: '2024-01-10',
      riskLevel: 'medium',
      demographics: {
        address: '456 Oak Ave, Somewhere, USA',
        phone: '+1-555-0456',
        email: 'sarah.johnson@email.com'
      }
    },
    {
      id: '3',
      name: 'Michael Brown',
      dateOfBirth: '1978-11-08',
      gender: 'male',
      status: 'inactive',
      lastVisit: '2023-12-20',
      riskLevel: 'high',
      demographics: {
        address: '789 Pine Rd, Elsewhere, USA',
        phone: '+1-555-0789',
        email: 'michael.brown@email.com'
      }
    }
  ]

  useEffect(() => {
    // Simulate loading patients from API
    setTimeout(() => {
      setPatients(mockPatients)
      setFilteredPatients(mockPatients)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    // Filter patients based on search and filters
    let filtered = patients.filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           patient.demographics.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = selectedFilters.status === 'all' || patient.status === selectedFilters.status
      const matchesAgeGroup = selectedFilters.ageGroup === 'all' || 
        (selectedFilters.ageGroup === 'young' && getAge(patient.dateOfBirth) < 30) ||
        (selectedFilters.ageGroup === 'middle' && getAge(patient.dateOfBirth) >= 30 && getAge(patient.dateOfBirth) < 60) ||
        (selectedFilters.ageGroup === 'senior' && getAge(patient.dateOfBirth) >= 60)
      
      return matchesSearch && matchesStatus && matchesAgeGroup
    })
    
    setFilteredPatients(filtered)
  }, [patients, searchTerm, selectedFilters])

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePatientClick = (patientId: string) => {
    navigate(`/patient/${patientId}`)
  }

  const handleNewPatient = () => {
    showToast('New patient functionality coming soon', 'info')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your patient population</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <button
            onClick={handleNewPatient}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Patient</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Options */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={selectedFilters.status}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Age Group:</label>
            <select
              value={selectedFilters.ageGroup}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, ageGroup: e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="young">Young (&lt;30)</option>
              <option value="middle">Middle (30-59)</option>
              <option value="senior">Senior (60+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Patients ({filteredPatients.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => handlePatientClick(patient.id)}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{getAge(patient.dateOfBirth)} years old</span>
                      <span>•</span>
                      <span className="capitalize">{patient.gender}</span>
                      <span>•</span>
                      <span>{patient.demographics.email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Last visit: {patient.lastVisit}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(patient.riskLevel)}`}>
                      {patient.riskLevel} risk
                    </span>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="px-6 py-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard 