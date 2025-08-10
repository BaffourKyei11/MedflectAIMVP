import React, { useState, useEffect } from 'react'
import { Users, Settings, Shield, Database, Activity, Code, Save, Plus, Trash2, Edit } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

interface User {
  id: string
  email: string
  role: 'admin' | 'clinician' | 'viewer'
  status: 'active' | 'inactive'
  lastLogin: string
  permissions: string[]
}

interface Rule {
  id: string
  name: string
  description: string
  conditions: any
  actions: any[]
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

interface SystemSetting {
  key: string
  value: string
  description: string
  category: 'security' | 'ai' | 'fhir' | 'general'
}

const Admin: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<User[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  // Mock data
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@medflect.ai',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-15T10:30:00Z',
      permissions: ['read', 'write', 'admin', 'rule_editor']
    },
    {
      id: '2',
      email: 'dr.smith@medflect.ai',
      role: 'clinician',
      status: 'active',
      lastLogin: '2024-01-15T09:15:00Z',
      permissions: ['read', 'write']
    },
    {
      id: '3',
      email: 'nurse.jones@medflect.ai',
      role: 'clinician',
      status: 'active',
      lastLogin: '2024-01-14T16:45:00Z',
      permissions: ['read', 'write']
    },
    {
      id: '4',
      email: 'viewer@medflect.ai',
      role: 'viewer',
      status: 'inactive',
      lastLogin: '2024-01-10T11:20:00Z',
      permissions: ['read']
    }
  ]

  const mockRules: Rule[] = [
    {
      id: '1',
      name: 'High Risk Alert',
      description: 'Automatically flag patients with high-risk conditions',
      conditions: {
        riskLevel: 'high',
        lastVisit: { operator: 'lt', value: '30d' }
      },
      actions: [
        { type: 'create_task', params: { title: 'High Risk Follow-up', priority: 'high' } },
        { type: 'send_sms', params: { message: 'Patient requires immediate follow-up' } }
      ],
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      name: 'Missing Documentation',
      description: 'Alert when required documentation is missing',
      conditions: {
        missingDocuments: ['consent_form', 'insurance_info']
      },
      actions: [
        { type: 'create_task', params: { title: 'Complete Documentation', priority: 'medium' } }
      ],
      status: 'active',
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z'
    }
  ]

  const mockSystemSettings: SystemSetting[] = [
    {
      key: 'MOCK_GROQ',
      value: 'false',
      description: 'Use mock Groq API responses for development',
      category: 'ai'
    },
    {
      key: 'MOCK_CHAIN',
      value: 'false',
      description: 'Use mock blockchain for development',
      category: 'security'
    },
    {
      key: 'MOCK_SMS',
      value: 'false',
      description: 'Use mock SMS service for development',
      category: 'general'
    },
    {
      key: 'FHIR_VALIDATION',
      value: 'true',
      description: 'Enable FHIR R4 validation',
      category: 'fhir'
    },
    {
      key: 'AUDIT_LOGGING',
      value: 'true',
      description: 'Enable comprehensive audit logging',
      category: 'security'
    }
  ]

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setUsers(mockUsers)
      setRules(mockRules)
      setSystemSettings(mockSystemSettings)
      setLoading(false)
    }, 1000)
  }, [])

  const handleSaveUser = (userData: Partial<User>) => {
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userData } : u))
      showToast('User updated successfully', 'success')
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email || '',
        role: userData.role || 'viewer',
        status: 'active',
        lastLogin: new Date().toISOString(),
        permissions: userData.permissions || ['read']
      }
      setUsers(prev => [...prev, newUser])
      showToast('User created successfully', 'success')
    }
    setShowUserModal(false)
    setEditingUser(null)
  }

  const handleSaveRule = (ruleData: Partial<Rule>) => {
    if (editingRule) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? { ...r, ...ruleData, updatedAt: new Date().toISOString() } : r))
      showToast('Rule updated successfully', 'success')
    } else {
      const newRule: Rule = {
        id: Date.now().toString(),
        name: ruleData.name || '',
        description: ruleData.description || '',
        conditions: ruleData.conditions || {},
        actions: ruleData.actions || [],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setRules(prev => [...prev, newRule])
      showToast('Rule created successfully', 'success')
    }
    setShowRuleModal(false)
    setEditingRule(null)
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId))
    showToast('User deleted successfully', 'success')
  }

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId))
    showToast('Rule deleted successfully', 'success')
  }

  const handleSettingChange = (key: string, value: string) => {
    setSystemSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
    showToast('Setting updated successfully', 'success')
  }

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'clinician': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string): string => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage users, rules, and system settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'rules', label: 'Rules Engine', icon: Code },
              { id: 'settings', label: 'System Settings', icon: Settings }
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
          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Users ({users.length})</h3>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add User</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.lastLogin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingUser(user)
                                setShowUserModal(true)
                              }}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rules Engine Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Rules ({rules.length})</h3>
                <button
                  onClick={() => setShowRuleModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Rule</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{rule.name}</h4>
                        <p className="text-gray-600">{rule.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rule.status)}`}>
                          {rule.status}
                        </span>
                        <button
                          onClick={() => {
                            setEditingRule(rule)
                            setShowRuleModal(true)
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Conditions</h5>
                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(rule.conditions, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Actions</h5>
                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(rule.actions, null, 2)}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      Created: {formatDate(rule.createdAt)} | Updated: {formatDate(rule.updatedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">System Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {systemSettings.map((setting) => (
                  <div key={setting.key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{setting.key}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        setting.category === 'security' ? 'bg-red-100 text-red-800' :
                        setting.category === 'ai' ? 'bg-blue-100 text-blue-800' :
                        setting.category === 'fhir' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {setting.category}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={setting.value}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                      <button
                        onClick={() => handleSettingChange(setting.key, setting.value === 'true' ? 'false' : 'true')}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Toggle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">
              {editingUser ? 'Edit User' : 'Add User'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={editingUser?.email}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="viewer">Viewer</option>
                  <option value="clinician">Clinician</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setEditingUser(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveUser({})}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                {editingUser ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">
              {editingRule ? 'Edit Rule' : 'Add Rule'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={editingRule?.name}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  defaultValue={editingRule?.description}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions (JSON)</label>
                <textarea
                  defaultValue={JSON.stringify(editingRule?.conditions || {}, null, 2)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actions (JSON)</label>
                <textarea
                  defaultValue={JSON.stringify(editingRule?.actions || [], null, 2)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRuleModal(false)
                  setEditingRule(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveRule({})}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                {editingRule ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin 