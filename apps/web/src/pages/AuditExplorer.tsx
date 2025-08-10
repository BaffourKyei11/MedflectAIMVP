import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  Activity,
  Shield,
  FileText,
  AlertTriangle
} from 'lucide-react'

// Mock audit log data
const mockAuditLogs = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    userId: 'user-001',
    userName: 'Dr. Sarah Johnson',
    action: 'VIEW_PATIENT',
    resourceType: 'Patient',
    resourceId: 'patient-123',
    details: 'Viewed patient demographics and FHIR resources',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    severity: 'INFO',
    consentGranted: true,
    blockchainHash: '0x1234...abcd'
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:25:00Z',
    userId: 'user-001',
    userName: 'Dr. Sarah Johnson',
    action: 'GENERATE_AI_SUMMARY',
    resourceType: 'DocumentReference',
    resourceId: 'doc-456',
    details: 'Generated AI summary for patient encounter using Groq LLM',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    severity: 'INFO',
    consentGranted: true,
    blockchainHash: '0x5678...efgh'
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:20:00Z',
    userId: 'user-002',
    userName: 'Dr. Michael Chen',
    action: 'CREATE_OBSERVATION',
    resourceType: 'Observation',
    resourceId: 'obs-789',
    details: 'Created new blood pressure observation',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    severity: 'INFO',
    consentGranted: true,
    blockchainHash: '0x9abc...ijkl'
  },
  {
    id: '4',
    timestamp: '2024-01-15T10:15:00Z',
    userId: 'user-003',
    userName: 'Nurse Emily Davis',
    action: 'ACCESS_DENIED',
    resourceType: 'Patient',
    resourceId: 'patient-456',
    details: 'Attempted to access patient without proper consent',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    severity: 'WARNING',
    consentGranted: false,
    blockchainHash: null
  },
  {
    id: '5',
    timestamp: '2024-01-15T10:10:00Z',
    userId: 'user-001',
    userName: 'Dr. Sarah Johnson',
    action: 'SYNC_OFFLINE_DATA',
    resourceType: 'Sync',
    resourceId: 'sync-001',
    details: 'Synced offline changes to server',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    severity: 'INFO',
    consentGranted: true,
    blockchainHash: '0xdef0...mnop'
  }
]

const AuditExplorer: React.FC = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState(mockAuditLogs)
  const [filteredLogs, setFilteredLogs] = useState(mockAuditLogs)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('ALL')
  const [selectedAction, setSelectedAction] = useState('ALL')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Filter logs based on search criteria
  useEffect(() => {
    let filtered = logs

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedSeverity !== 'ALL') {
      filtered = filtered.filter(log => log.severity === selectedSeverity)
    }

    if (selectedAction !== 'ALL') {
      filtered = filtered.filter(log => log.action === selectedAction)
    }

    if (dateRange.start) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(dateRange.start))
    }

    if (dateRange.end) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(dateRange.end))
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, selectedSeverity, selectedAction, dateRange])

  const handleViewDetails = (log: any) => {
    setSelectedLog(log)
    setShowDetails(true)
  }

  const handleExportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details', 'Severity', 'IP Address', 'Consent Granted'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.userName,
        log.action,
        log.resourceType,
        log.resourceId,
        log.details,
        log.severity,
        log.ipAddress,
        log.consentGranted ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'INFO': return 'bg-blue-100 text-blue-800'
      case 'WARNING': return 'bg-yellow-100 text-yellow-800'
      case 'ERROR': return 'bg-red-100 text-red-800'
      case 'CRITICAL': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'VIEW_PATIENT': return <Eye className="w-4 h-4" />
      case 'CREATE_OBSERVATION': return <Activity className="w-4 h-4" />
      case 'GENERATE_AI_SUMMARY': return <FileText className="w-4 h-4" />
      case 'SYNC_OFFLINE_DATA': return <Activity className="w-4 h-4" />
      case 'ACCESS_DENIED': return <AlertTriangle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Audit Explorer</h1>
          <p className="mt-2 text-gray-600">
            Monitor and explore all system activities, access patterns, and compliance events
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by user, action, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">All Severities</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="ALL">All Actions</option>
                <option value="VIEW_PATIENT">View Patient</option>
                <option value="CREATE_OBSERVATION">Create Observation</option>
                <option value="GENERATE_AI_SUMMARY">Generate AI Summary</option>
                <option value="SYNC_OFFLINE_DATA">Sync Offline Data</option>
                <option value="ACCESS_DENIED">Access Denied</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExportLogs}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Showing {filteredLogs.length} of {logs.length} logs
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Info: {filteredLogs.filter(l => l.severity === 'INFO').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Warning: {filteredLogs.filter(l => l.severity === 'WARNING').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Error: {filteredLogs.filter(l => l.severity === 'ERROR').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                          <div className="text-sm text-gray-500">{log.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm text-gray-900">{log.action.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{log.resourceType}</div>
                        <div className="text-gray-500">{log.resourceId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {log.consentGranted ? (
                          <Shield className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm ${log.consentGranted ? 'text-green-600' : 'text-red-600'}`}>
                          {log.consentGranted ? 'Granted' : 'Denied'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(log)}
                        className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* No Results */}
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or date range.</p>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.userName} ({selectedLog.userId})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Action</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedLog.severity)}`}>
                      {selectedLog.severity}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resource</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedLog.resourceType}: {selectedLog.resourceId}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Details</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.details}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IP Address</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Agent</label>
                    <p className="mt-1 text-sm text-gray-900 text-xs">{selectedLog.userAgent}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Consent Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedLog.consentGranted ? (
                        <Shield className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ${selectedLog.consentGranted ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedLog.consentGranted ? 'Granted' : 'Denied'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blockchain Hash</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">
                      {selectedLog.blockchainHash || 'Not recorded'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditExplorer 