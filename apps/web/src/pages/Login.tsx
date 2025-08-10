import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Mail, Lock, Smartphone, ArrowRight, Eye, EyeOff } from 'lucide-react'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { signIn, sendOTP, verifyOTP } = useAuth()
  const { addToast } = useToast()
  
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      addToast({
        type: 'error',
        title: 'Missing information',
        message: 'Please enter both email and password'
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        addToast({
          type: 'error',
          title: 'Login failed',
          message: error
        })
      } else {
        addToast({
          type: 'success',
          title: 'Welcome back!',
          message: 'You have been successfully signed in'
        })
        navigate('/dashboard')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Login failed',
        message: 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      addToast({
        type: 'error',
        title: 'Missing email',
        message: 'Please enter your email address'
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await sendOTP(email)
      if (error) {
        addToast({
          type: 'error',
          title: 'OTP failed',
          message: error
        })
      } else {
        setOtpSent(true)
        addToast({
          type: 'success',
          title: 'OTP sent',
          message: 'Check your email for the one-time password'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'OTP failed',
        message: 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !otp) {
      addToast({
        type: 'error',
        title: 'Missing information',
        message: 'Please enter both email and OTP'
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await verifyOTP(email, otp)
      if (error) {
        addToast({
          type: 'error',
          title: 'OTP verification failed',
          message: error
        })
      } else {
        addToast({
          type: 'success',
          title: 'Welcome back!',
          message: 'You have been successfully signed in'
        })
        navigate('/dashboard')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'OTP verification failed',
        message: 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setOtp('')
    setOtpSent(false)
    setAuthMode('password')
  }

  return (
    <div className="min-h-screen flex items-center justify-center healthcare-gradient py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-neutral-900">
            Welcome to Medflect AI
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Sign in to access your healthcare insights
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex rounded-lg border border-neutral-200 bg-white p-1">
          <button
            onClick={() => {
              setAuthMode('password')
              resetForm()
            }}
            className={`
              flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200
              ${authMode === 'password'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
              }
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Password</span>
            </div>
          </button>
          <button
            onClick={() => {
              setAuthMode('otp')
              resetForm()
            }}
            className={`
              flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200
              ${authMode === 'otp'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
              }
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <span>OTP</span>
            </div>
          </button>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg border border-neutral-200 p-8">
          {authMode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="otp-email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="otp-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={otpSent}
                    className="input-field pl-10 disabled:bg-neutral-50"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-neutral-700 mb-2">
                    One-time password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Smartphone className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      autoComplete="one-time-code"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">
                    We've sent a 6-digit code to your email
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>{otpSent ? 'Verify OTP' : 'Send OTP'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false)
                    setOtp('')
                  }}
                  className="w-full text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
                >
                  Use different email
                </button>
              )}
            </form>
          )}

          {/* Demo Account Info */}
          <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-900 mb-2">Demo Account</h3>
            <p className="text-xs text-neutral-600 mb-2">
              For demonstration purposes, you can use:
            </p>
            <div className="text-xs font-mono text-neutral-700 space-y-1">
              <div>Email: demo@medflect.ai</div>
              <div>Password: demo123</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login 