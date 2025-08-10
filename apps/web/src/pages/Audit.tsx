import React, { useState, useEffect } from 'react'
import { Search, Filter, Download, Eye, Shield, Clock, User, Activity } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'

interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  resourceType: string
  resourceId: string
  details: string
  ipAddress: string
  userAgent: string
  blockchainTxHash?: string
  consentStatus?: 'granted' | 'revoked' | 'expired'
}

interface ConsentRecord {
  id: string
  patientId: string
  patientName: string
  consentType: string
  grantedAt: string
  expiresAt?: string
  status: 'active' | 'expired' | 'revoked'
  blockchainHash: string
  grantedBy: string
  purpose: string
  scope: string[]
}

const Audit: React.FC = () => {
  const { user } = useAuth()
  const { syncStatus } = useSync()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'audit' | 'consent'>('audit')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    action: '',
    resourceType: '',
    userId: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    const mockAuditLogs: AuditLog[] = [
      {
        id: '1',
        timestamp: '2024-01-15T10:30:00Z',
        userId: 'user1',
        userName: 'Dr. Sarah Johnson',
        action: 'READ',
        resourceType: 'Patient',
        resourceId: 'patient123',
        details: 'Viewed patient demographics',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '2',
        timestamp: '2024-01-15T09:15:00Z',
        userId: 'user2',
        userName: 'Dr. Michael Chen',
        action: 'CREATE',
        resourceType: 'Observation',
        resourceId: 'obs456',
        details: 'Created blood pressure reading',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        id: '3',
        timestamp: '2024-01-15T08:45:00Z',
        userId: 'user1',
        userName: 'Dr. Sarah Johnson',
        action: 'UPDATE',
        resourceType: 'Patient',
        resourceId: 'patient123',
        details: 'Updated patient contact information',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '4',
        timestamp: '2024-01-14T16:20:00Z',
        userId: 'user3',
        userName: 'Nurse Emily Davis',
        action: 'READ',
        resourceType: 'Encounter',
        resourceId: 'enc789',
        details: 'Viewed encounter details',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        id: '5',
        timestamp: '2024-01-14T14:10:00Z',
        userId: 'user1',
        userName: 'Dr. Sarah Johnson',
        action: 'AI_SUMMARY',
        resourceType: 'DocumentReference',
        resourceId: 'doc101',
        details: 'Generated AI-powered discharge summary',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ]

    const mockConsentRecords: ConsentRecord[] = [
      {
        id: 'consent1',
        patientId: 'patient123',
        patientName: 'John Smith',
        consentType: 'Treatment',
        grantedAt: '2024-01-10T09:00:00Z',
        expiresAt: '2025-01-10T09:00:00Z',
        status: 'active',
        blockchainHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        grantedBy: 'Dr. Sarah Johnson',
        purpose: 'Standard medical treatment and care',
        scope: ['demographics', 'medical_history', 'treatment_plans', 'lab_results']
      },
      {
        id: 'consent2',
        patientId: 'patient456',
        patientName: 'Maria Garcia',
        consentType: 'Research',
        grantedAt: '2024-01-08T14:30:00Z',
        expiresAt: '2026-01-08T14:30:00Z',
        status: 'active',
        blockchainHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        grantedBy: 'Dr. Michael Chen',
        purpose: 'Clinical research participation',
        scope: ['demographics', 'medical_history', 'treatment_outcomes']
      },
      {
        id: 'consent3',
        patientId: 'patient789',
        patientName: 'Robert Wilson',
        consentType: 'Treatment',
        grantedAt: '2023-12-15T11:00:00Z',
        expiresAt: '2024-12-15T11:00:00Z',
        status: 'expired',
        blockchainHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        grantedBy: 'Dr. Emily Davis',
        purpose: 'Standard medical treatment and care',
        scope: ['demographics', 'medical_history', 'treatment_plans']
      }
    ]

    // Simulate API call
    setTimeout(() => {
      setAuditLogs(mockAuditLogs)
      setConsentRecords(mockConsentRecords)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilters = 
      (!filters.dateFrom || log.timestamp >= filters.dateFrom) &&
      (!filters.dateTo || log.timestamp <= filters.dateTo) &&
      (!filters.action || log.action === filters.action) &&
      (!filters.resourceType || log.resourceType === filters.resourceType) &&
      (!filters.userId || log.userId === filters.userId)

    return matchesSearch && matchesFilters
  })

  const filteredConsentRecords = consentRecords.filter(consent => {
    const matchesSearch = 
      consent.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consent.consentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consent.grantedBy.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800'
      case 'READ': return 'bg-blue-100 text-blue-800'
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      case 'AI_SUMMARY': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'revoked': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Audit & Compliance</h1>
          <p className="text-gray-600">Monitor access logs and consent management</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${
              syncStatus.status === 'connected' ? 'bg-green-500' :
              syncStatus.status === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="capitalize">{syncStatus.status}</span>
          </div>
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Audit Logs
            </button>
            <button
              onClick={() => setActiveTab('consent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'consent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Consent Records
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'audit' ? 'audit logs' : 'consent records'}...`}
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

            {showFilters && activeTab === 'audit' && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <select
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="READ">Read</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="AI_SUMMARY">AI Summary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                  <select
                    value={filters.resourceType}
                    onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="Patient">Patient</option>
                    <option value="Observation">Observation</option>
                    <option value="Encounter">Encounter</option>
                    <option value="DocumentReference">Document Reference</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <select
                    value={filters.userId}
                    onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Users</option>
                    <option value="user1">Dr. Sarah Johnson</option>
                    <option value="user2">Dr. Michael Chen</option>
                    <option value="user3">Nurse Emily Davis</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          {activeTab === 'audit' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {filteredAuditLogs.length} Audit Log{filteredAuditLogs.length !== 1 ? 's' : ''}
                </h3>
                <div className="text-sm text-gray-600">
                  Showing {filteredAuditLogs.length} of {auditLogs.length}
                </div>
              </div>

              {filteredAuditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAuditLogs.map((log) => (
                    <div key={log.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                            <span className="text-sm text-gray-600">
                              {log.resourceType}: {log.resourceId}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 mb-2">{log.details}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{log.userName}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(log.timestamp)}</span>
                            </span>
                            <span>IP: {log.ipAddress}</span>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {filteredConsentRecords.length} Consent Record{filteredConsentRecords.length !== 1 ? 's' : ''}
                </h3>
                <div className="text-sm text-gray-600">
                  Showing {filteredConsentRecords.length} of {consentRecords.length}
                </div>
              </div>

              {filteredConsentRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No consent records found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredConsentRecords.map((consent) => (
                    <div key={consent.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(consent.status)}`}>
                              {consent.status.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600">
                              {consent.consentType}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{consent.patientName}</h4>
                          <p className="text-sm text-gray-600 mb-2">{consent.purpose}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>Granted by: {consent.grantedBy}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Granted: {formatDate(consent.grantedAt)}</span>
                            </span>
                            {consent.expiresAt && (
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Expires: {formatDate(consent.expiresAt)}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Scope:</span> {consent.scope.join(', ')}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="font-medium">Blockchain Hash:</span> {consent.blockchainHash.substring(0, 20)}...
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Audit 