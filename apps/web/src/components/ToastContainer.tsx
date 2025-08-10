import React from 'react'
import { useToast } from '../contexts/ToastContext'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast()

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-start space-x-3 p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out
            ${getToastStyles(toast.type)}
            animate-in slide-in-from-right-full
          `}
        >
          <div className="flex-shrink-0">
            {getToastIcon(toast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">{toast.title}</h4>
            {toast.message && (
              <p className="text-sm mt-1 opacity-90">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer 