import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the hash fragment from the URL
      const hashFragment = window.location.hash

      if (hashFragment && hashFragment.length > 0) {
        try {
          // Exchange the auth code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment)

          if (error) {
            console.error('Error exchanging code for session:', error.message)
            navigate('/auth?error=' + encodeURIComponent(error.message))
            return
          }

          if (data.session) {
            // Successfully signed in, redirect to app
            navigate('/app')
            return
          }
        } catch (err) {
          console.error('Auth callback error:', err)
        }
      }

      // If we get here, something went wrong
      navigate('/auth?error=No session found')
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}