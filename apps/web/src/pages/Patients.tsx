import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Plus, User, Calendar, Phone, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { Patient, SearchFilters } from '../types'

const Patients: React.FC = () => {
  const { user } = useAuth()
  const { syncStatus } = useSync()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    const mockPatients: Patient[] = [
      {
        resourceType: 'Patient',
        id: '1',
        identifier: [
          { system: 'MRN', value: 'MRN001' }
        ],
        name: [
          { family: 'Smith', given: ['John', 'Michael'] }
        ],
        gender: 'male',
        birthDate: '1985-03-15',
        address: [
          {
            line: ['123 Main St'],
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'US'
          }
        ],
        telecom: [
          { system: 'phone', value: '+1-555-0123', use: 'home' },
          { system: 'email', value: 'john.smith@email.com', use: 'home' }
        ]
      },
      {
        resourceType: 'Patient',
        id: '2',
        identifier: [
          { system: 'MRN', value: 'MRN002' }
        ],
        name: [
          { family: 'Johnson', given: ['Sarah', 'Elizabeth'] }
        ],
        gender: 'female',
        birthDate: '1992-07-22',
        address: [
          {
            line: ['456 Oak Ave'],
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'US'
          }
        ],
        telecom: [
          { system: 'phone', value: '+1-555-0456', use: 'mobile' },
          { system: 'email', value: 'sarah.johnson@email.com', use: 'home' }
        ]
      },
      {
        resourceType: 'Patient',
        id: '3',
        identifier: [
          { system: 'MRN', value: 'MRN003' }
        ],
        name: [
          { family: 'Williams', given: ['Robert', 'David'] }
        ],
        gender: 'male',
        birthDate: '1978-11-08',
        address: [
          {
            line: ['789 Pine Rd'],
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'US'
          }
        ],
        telecom: [
          { system: 'phone', value: '+1-555-0789', use: 'work' },
          { system: 'email', value: 'robert.williams@email.com', use: 'work' }
        ]
      }
    ]

    // Simulate API call
    setTimeout(() => {
      setPatients(mockPatients)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.some(name => 
      name.family.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.given.some(given => given.toLowerCase().includes(searchTerm.toLowerCase())) ||
      patient.identifier?.some(id => id.value.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true
      // Add filter logic here
      return true
    })

    return matchesSearch && matchesFilters
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">Manage patient records and information</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${
              syncStatus.status === 'connected' ? 'bg-green-500' :
              syncStatus.status === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="capitalize">{syncStatus.status}</span>
          </div>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Patient
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
              placeholder="Search patients by name, MRN, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border flex items-center space-x-2 ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={filters.gender || ''}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
              <select
                value={filters.ageRange || ''}
                onChange={(e) => setFilters({ ...filters, ageRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="0-18">0-18</option>
                <option value="19-30">19-30</option>
                <option value="31-50">31-50</option>
                <option value="51-65">51-65</option>
                <option value="65+">65+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={filters.location || ''}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="springfield">Springfield</option>
                <option value="chicago">Chicago</option>
                <option value="peoria">Peoria</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {filteredPatients.length} Patient{filteredPatients.length !== 1 ? 's' : ''}
            </h3>
            <div className="text-sm text-gray-600">
              Showing {filteredPatients.length} of {patients.length}
            </div>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first patient.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <Link
                key={patient.id}
                to={`/patients/${patient.id}`}
                className="block hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {patient.name[0].given.join(' ')} {patient.name[0].family}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(patient.birthDate || '')} ({calculateAge(patient.birthDate || '')} years)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="capitalize">{patient.gender}</span>
                          </div>
                          {patient.identifier?.[0] && (
                            <div className="flex items-center space-x-1">
                              <span>MRN: {patient.identifier[0].value}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {patient.telecom?.map((contact, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          {contact.system === 'phone' ? (
                            <Phone className="w-4 h-4" />
                          ) : contact.system === 'email' ? (
                            <Mail className="w-4 h-4" />
                          ) : null}
                          <span>{contact.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {patient.address?.[0] && (
                    <div className="mt-3 text-sm text-gray-600">
                      📍 {patient.address[0].line?.join(', ')}, {patient.address[0].city}, {patient.address[0].state} {patient.address[0].postalCode}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Patients 