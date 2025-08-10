import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSync } from '../contexts/SyncContext'
import { useToast } from '../contexts/ToastContext'
import { 
  Home, 
  Users, 
  User, 
  Settings, 
  FileText, 
  LogOut, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Menu,
  X
} from 'lucide-react'
import ToastContainer from './ToastContainer'
import OfflineIndicator from './OfflineIndicator'

const Layout: React.FC = () => {
  const { user, signOut } = useAuth()
  const { syncStatus, isOnline } = useSync()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      addToast({
        type: 'success',
        title: 'Signed out successfully',
        message: 'You have been signed out of your account'
      })
      navigate('/login')
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Sign out failed',
        message: 'There was an error signing you out'
      })
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Admin', href: '/admin', icon: Settings },
    { name: 'Audit', href: '/audit', icon: FileText },
  ]

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const getSyncStatusIcon = () => {
    switch (syncStatus.status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600" />
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-600" />
      default:
        return <Wifi className="h-4 w-4 text-gray-600" />
    }
  }

  const getSyncStatusText = () => {
    switch (syncStatus.status) {
      case 'connected':
        return 'Connected'
      case 'syncing':
        return 'Syncing'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Offline Indicator */}
      {!isOnline && <OfflineIndicator />}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">Medflect AI</h1>
                <p className="text-xs text-neutral-500">Healthcare Insights</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  {user?.role}
                </p>
                {user?.organization && (
                  <p className="text-xs text-neutral-400 truncate">
                    {user.organization}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(item.href)
                    setSidebarOpen(false)
                  }}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActiveRoute(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              )
            })}
          </nav>

          {/* Sync Status */}
          <div className="px-6 py-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getSyncStatusIcon()}
                <span className="text-xs font-medium text-neutral-600">
                  {getSyncStatusText()}
                </span>
              </div>
              {syncStatus.pendingChanges > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {syncStatus.pendingChanges}
                </span>
              )}
            </div>
            {syncStatus.lastSync && (
              <p className="text-xs text-neutral-400 mt-1">
                Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Sign Out */}
          <div className="px-6 py-4 border-t border-neutral-200">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-neutral-400 hover:text-neutral-600"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">Medflect AI</h1>
          <div className="w-6" /> {/* Spacer for centering */}
        </div>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default Layout 