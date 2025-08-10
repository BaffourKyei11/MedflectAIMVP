import React from 'react'
import { WifiOff } from 'lucide-react'

const OfflineIndicator: React.FC = () => {
  return (
    <div className="offline-indicator">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          You are currently offline. Some features may be limited.
        </span>
      </div>
    </div>
  )
}

export default OfflineIndicator 