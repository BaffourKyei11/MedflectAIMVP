import React, { createContext, useContext, useEffect, useState } from 'react'
import localforage from 'localforage'
import { SyncStatus, OfflineChange } from '../types'

interface SyncContextType {
  syncStatus: SyncStatus
  pendingChanges: OfflineChange[]
  addOfflineChange: (change: Omit<OfflineChange, 'id' | 'timestamp' | 'synced'>) => void
  syncChanges: () => Promise<void>
  clearPendingChanges: () => void
  isOnline: boolean
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export const useSync = () => {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}

interface SyncProviderProps {
  children: React.ReactNode
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'offline',
    pendingChanges: 0,
    lastSync: undefined
  })
  const [pendingChanges, setPendingChanges] = useState<OfflineChange[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Initialize localforage
  useEffect(() => {
    localforage.config({
      name: 'medflect-ai',
      storeName: 'offline-changes'
    })
  }, [])

  // Load pending changes from IndexedDB
  useEffect(() => {
    const loadPendingChanges = async () => {
      try {
        const changes = await localforage.getItem('pendingChanges') as OfflineChange[] || []
        setPendingChanges(changes)
        setSyncStatus(prev => ({ ...prev, pendingChanges: changes.length }))
      } catch (error) {
        console.error('Error loading pending changes:', error)
      }
    }

    loadPendingChanges()
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncStatus(prev => ({ ...prev, status: 'connected' }))
      // Attempt to sync when coming back online
      syncChanges()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus(prev => ({ ...prev, status: 'offline' }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial status
    if (navigator.onLine) {
      setSyncStatus(prev => ({ ...prev, status: 'connected' }))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Add offline change
  const addOfflineChange = async (change: Omit<OfflineChange, 'id' | 'timestamp' | 'synced'>) => {
    const newChange: OfflineChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      synced: false
    }

    const updatedChanges = [...pendingChanges, newChange]
    setPendingChanges(updatedChanges)
    setSyncStatus(prev => ({ ...prev, pendingChanges: updatedChanges.length }))

    // Save to IndexedDB
    try {
      await localforage.setItem('pendingChanges', updatedChanges)
    } catch (error) {
      console.error('Error saving offline change:', error)
    }

    // If online, attempt to sync immediately
    if (isOnline) {
      syncChanges()
    }
  }

  // Sync changes with server
  const syncChanges = async () => {
    if (!isOnline || pendingChanges.length === 0) {
      return
    }

    try {
      setSyncStatus(prev => ({ ...prev, status: 'syncing' }))

      const unsyncedChanges = pendingChanges.filter(change => !change.synced)
      
      for (const change of unsyncedChanges) {
        try {
          // Attempt to sync each change
          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(change)
          })

          if (response.ok) {
            // Mark as synced
            const updatedChanges = pendingChanges.map(c => 
              c.id === change.id ? { ...c, synced: true } : c
            )
            setPendingChanges(updatedChanges)
            setSyncStatus(prev => ({ 
              ...prev, 
              pendingChanges: updatedChanges.filter(c => !c.synced).length,
              lastSync: new Date().toISOString()
            }))

            // Update IndexedDB
            await localforage.setItem('pendingChanges', updatedChanges)
          } else {
            console.error(`Failed to sync change ${change.id}:`, response.statusText)
          }
        } catch (error) {
          console.error(`Error syncing change ${change.id}:`, error)
        }
      }

      setSyncStatus(prev => ({ ...prev, status: 'connected' }))
    } catch (error) {
      console.error('Error during sync:', error)
      setSyncStatus(prev => ({ ...prev, status: 'offline' }))
    }
  }

  // Clear pending changes (after successful sync or manual cleanup)
  const clearPendingChanges = async () => {
    const syncedChanges = pendingChanges.filter(change => change.synced)
    setPendingChanges(syncedChanges)
    setSyncStatus(prev => ({ ...prev, pendingChanges: syncedChanges.length }))

    try {
      await localforage.setItem('pendingChanges', syncedChanges)
    } catch (error) {
      console.error('Error clearing pending changes:', error)
    }
  }

  // Auto-sync when online and there are pending changes
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      const syncInterval = setInterval(() => {
        syncChanges()
      }, 30000) // Sync every 30 seconds when online

      return () => clearInterval(syncInterval)
    }
  }, [isOnline, pendingChanges.length])

  const value: SyncContextType = {
    syncStatus,
    pendingChanges,
    addOfflineChange,
    syncChanges,
    clearPendingChanges,
    isOnline
  }

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  )
} 