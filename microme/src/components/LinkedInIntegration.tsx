import React, { useState, useEffect } from 'react'
import { 
  Linkedin, 
  ExternalLink, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Zap,
  Users,
  TrendingUp,
  Link as LinkIcon
} from 'lucide-react'
import { linkedInService, LinkedInPost } from '../services/linkedInService'

interface LinkedInIntegrationProps {
  onPostsExtracted: (posts: LinkedInPost[]) => void
  onError: (error: string) => void
}

export const LinkedInIntegration: React.FC<LinkedInIntegrationProps> = ({
  onPostsExtracted,
  onError
}) => {
  const [method, setMethod] = useState<'oauth' | 'url'>('oauth')
  const [profileUrl, setProfileUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(linkedInService.isAuthenticated())
  }, [])

  const handleOAuthLogin = async () => {
    setLoading(true)
    setStatus('idle')
    
    try {
      // For MVP, we'll guide users to use URL method since OAuth requires API keys
      setMethod('url')
      setStatus('error')
      setStatusMessage('LinkedIn OAuth requires developer credentials. Please use the LinkedIn URL method below for now.')
      
      // In a full implementation:
      // linkedInService.initiateOAuthFlow()
      
    } catch (error: any) {
      setStatus('error')
      setStatusMessage(error.message)
      onError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlExtraction = async () => {
    if (!profileUrl.trim()) {
      setStatus('error')
      setStatusMessage('Please enter your LinkedIn profile URL')
      return
    }

    setLoading(true)
    setStatus('idle')
    setStatusMessage('Extracting posts from your LinkedIn profile...')

    try {
      const posts = await linkedInService.fetchPostsByProfileUrl(profileUrl)
      
      if (posts.length === 0) {
        setStatus('error')
        setStatusMessage('No posts found. Make sure your profile has public posts and try again.')
        return
      }

      setStatus('success')
      setStatusMessage(`Successfully extracted ${posts.length} posts from your LinkedIn profile!`)
      onPostsExtracted(posts)
      
    } catch (error: any) {
      setStatus('error')
      setStatusMessage(error.message || 'Failed to extract posts from LinkedIn profile')
      onError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const validateLinkedInUrl = (url: string): boolean => {
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9\-_%]+\/?(\?.*)?$/
    return linkedinRegex.test(url)
  }

  const isUrlValid = profileUrl ? validateLinkedInUrl(profileUrl) : true

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setMethod('oauth')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            method === 'oauth'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-2 rounded-lg ${method === 'oauth' ? 'bg-blue-600' : 'bg-gray-400'}`}>
              <Linkedin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Connect LinkedIn Account</h3>
              <p className="text-sm text-gray-600">Secure OAuth integration</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Real-time data access</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Complete engagement metrics</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-orange-500">
              <AlertCircle className="w-4 h-4" />
              <span>Coming soon (MVP uses URL method)</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => setMethod('url')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            method === 'url'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-2 rounded-lg ${method === 'url' ? 'bg-blue-600' : 'bg-gray-400'}`}>
              <LinkIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">LinkedIn Profile URL</h3>
              <p className="text-sm text-gray-600">Quick profile analysis</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>No login required</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Instant setup</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Zap className="w-4 h-4" />
              <span>Recommended for getting started</span>
            </div>
          </div>
        </button>
      </div>

      {/* OAuth Method */}
      {method === 'oauth' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Linkedin className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Connect Your LinkedIn Account
              </h3>
              <p className="text-gray-600 mb-4">
                Securely connect your LinkedIn account for complete post analytics and real-time insights.
              </p>
            </div>

            {!isAuthenticated ? (
              <button
                onClick={handleOAuthLogin}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Linkedin className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Connecting...' : 'Connect with LinkedIn'}
              </button>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg mb-4">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  LinkedIn account connected
                </div>
                <button
                  onClick={() => linkedInService.fetchUserPosts()}
                  className="block mx-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Import My LinkedIn Posts
                </button>
              </div>
            )}

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <strong>Coming Soon:</strong> Direct LinkedIn OAuth integration requires API credentials. 
                  For now, please use the LinkedIn URL method below for instant access to your profile analysis.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* URL Method */}
      {method === 'url' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Enter Your LinkedIn Profile URL
              </h3>
              <p className="text-gray-600">
                We'll analyze your public LinkedIn posts and extract insights for your persona analysis.
              </p>
            </div>

            {/* URL Input */}
            <div>
              <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <input
                  id="linkedin-url"
                  type="url"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/yourname"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !isUrlValid ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {profileUrl && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {isUrlValid ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {!isUrlValid && profileUrl && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/yourname)
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How to find your LinkedIn URL:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to your LinkedIn profile page</li>
                <li>Click on your profile picture or "View profile" button</li>
                <li>Copy the URL from your browser's address bar</li>
                <li>Paste it in the field above</li>
              </ol>
            </div>

            {/* Extract Button */}
            <button
              onClick={handleUrlExtraction}
              disabled={loading || !profileUrl || !isUrlValid}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Extracting Posts...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Extract My LinkedIn Posts
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <p className="text-green-800">{statusMessage}</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-800">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">What you'll get:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-gray-900">Persona Analysis</h5>
              <p className="text-sm text-gray-600">Deep insights into your professional voice and content themes</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-gray-900">Engagement Patterns</h5>
              <p className="text-sm text-gray-600">Understand what content resonates with your audience</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-gray-900">Content Strategy</h5>
              <p className="text-sm text-gray-600">AI-powered recommendations for better content performance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Privacy First:</strong> We only access your public LinkedIn posts for analysis. 
            Your data is processed securely and you maintain full control over your information.
          </div>
        </div>
      </div>
    </div>
  )
}