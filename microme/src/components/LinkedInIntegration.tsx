import React, { useState, useCallback } from 'react'
import { AlertCircle, CheckCircle, ExternalLink, Loader, UserCheck, Globe } from 'lucide-react'
import { LinkedInService, LinkedInPost } from '../services/linkedInService'
import { useAuth } from '../contexts/AuthContext'

interface LinkedInIntegrationProps {
  onPostsExtracted: (posts: LinkedInPost[]) => void
  onError: (error: string) => void
}

type IntegrationMethod = 'oauth' | 'url'
type IntegrationStatus = 'idle' | 'loading' | 'success' | 'error'

export const LinkedInIntegration: React.FC<LinkedInIntegrationProps> = ({
  onPostsExtracted,
  onError
}) => {
  const { user } = useAuth()
  const [method, setMethod] = useState<IntegrationMethod>('oauth')
  const [status, setStatus] = useState<IntegrationStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [extractedPosts, setExtractedPosts] = useState<LinkedInPost[]>([])

  const linkedInService = new LinkedInService()

  const handleOAuthIntegration = useCallback(async () => {
    if (!user) {
      onError('Please log in to connect your LinkedIn account')
      return
    }

    setStatus('loading')
    setStatusMessage('Redirecting to LinkedIn...')

    try {
      // In a real implementation, these would come from environment variables
      const clientId = process.env.VITE_LINKEDIN_CLIENT_ID || 'demo_client_id'
      const redirectUri = `${window.location.origin}/auth/linkedin/callback`
      
      if (clientId === 'demo_client_id') {
        // Demo mode - show instructions
        setStatus('error')
        setStatusMessage('LinkedIn OAuth requires developer credentials. Please use the Profile URL method below, or contact support to set up OAuth integration.')
        return
      }

      const authUrl = LinkedInService.generateAuthUrl(clientId, redirectUri)
      window.location.href = authUrl
      
    } catch (error) {
      setStatus('error')
      setStatusMessage(`OAuth setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      onError('Failed to initiate LinkedIn OAuth')
    }
  }, [user, onError])

  const handleUrlIntegration = useCallback(async () => {
    if (!profileUrl.trim()) {
      setStatus('error')
      setStatusMessage('Please enter a valid LinkedIn profile URL')
      return
    }

    setStatus('loading')
    setStatusMessage('Extracting posts from LinkedIn profile...')
    setExtractedPosts([])

    try {
      const result = await linkedInService.fetchPostsByProfileUrl(profileUrl)
      
      if (!result.success || !result.data) {
        setStatus('error')
        setStatusMessage(result.error || 'Failed to extract posts from profile')
        onError(result.error || 'Profile extraction failed')
        return
      }

      if (result.data.length === 0) {
        setStatus('error')
        setStatusMessage('No posts found on this LinkedIn profile. Please check the URL or try a different profile.')
        return
      }

      setExtractedPosts(result.data)
      setStatus('success')
      setStatusMessage(`Successfully extracted ${result.data.length} posts from LinkedIn profile!`)
      onPostsExtracted(result.data)

    } catch (error) {
      setStatus('error')
      setStatusMessage(`Profile extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      onError('Failed to extract LinkedIn posts')
    }
  }, [profileUrl, linkedInService, onPostsExtracted, onError])

  const validateLinkedInUrl = (url: string): boolean => {
    const linkedinProfileRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_.]+\/?$/
    return linkedinProfileRegex.test(url)
  }

  const isUrlValid = profileUrl ? validateLinkedInUrl(profileUrl) : true

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">LinkedIn Integration</h2>
      <p className="text-gray-600 mb-6">
        Connect your LinkedIn account to analyze your posts and get personalized content recommendations.
      </p>

      {/* Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setMethod('oauth')}
          className={`p-4 rounded-lg border-2 transition-colors text-left ${
            method === 'oauth'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <UserCheck className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold mb-1">OAuth Integration</h3>
          <p className="text-sm text-gray-600">
            Secure authentication with full API access. Requires LinkedIn developer credentials.
          </p>
        </button>
        
        <button
          onClick={() => setMethod('url')}
          className={`p-4 rounded-lg border-2 transition-colors text-left ${
            method === 'url'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Globe className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold mb-1">Profile URL</h3>
          <p className="text-sm text-gray-600">
            Extract posts using your public LinkedIn profile URL. Quick and easy setup.
          </p>
        </button>
      </div>

      {/* OAuth Integration */}
      {method === 'oauth' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">OAuth Authentication</h3>
            <p className="text-sm text-blue-800 mb-3">
              This method provides the most comprehensive access to your LinkedIn data, including private posts and detailed analytics.
            </p>
            <ul className="text-sm text-blue-800 space-y-1 mb-4">
              <li>• Full access to your LinkedIn posts and profile</li>
              <li>• Real-time data synchronization</li>
              <li>• Secure token-based authentication</li>
              <li>• Automatic data updates</li>
            </ul>
          </div>
          
          <button
            onClick={handleOAuthIntegration}
            disabled={status === 'loading'}
            className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'loading' ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Connecting to LinkedIn...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect with LinkedIn
              </>
            )}
          </button>
        </div>
      )}

      {/* URL Integration */}
      {method === 'url' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Profile URL Integration</h3>
            <p className="text-sm text-green-800 mb-3">
              Enter your LinkedIn profile URL to extract your public posts. No developer account required.
            </p>
            <ul className="text-sm text-green-800 space-y-1 mb-4">
              <li>• No authentication required</li>
              <li>• Works with public LinkedIn profiles</li>
              <li>• Quick setup and extraction</li>
              <li>• Supports most LinkedIn profile formats</li>
            </ul>
          </div>

          <div>
            <label htmlFor="profileUrl" className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              id="profileUrl"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://linkedin.com/in/your-username"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !isUrlValid ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {!isUrlValid && (
              <p className="mt-1 text-sm text-red-600">
                Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)
              </p>
            )}
          </div>

          <button
            onClick={handleUrlIntegration}
            disabled={status === 'loading' || !profileUrl.trim() || !isUrlValid}
            className="flex items-center justify-center w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'loading' ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Extracting Posts...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Extract LinkedIn Posts
              </>
            )}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {status === 'success' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-800">{statusMessage}</p>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-800">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* Posts Preview */}
      {extractedPosts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Extracted Posts Preview</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-600 mb-3">Showing first 3 posts:</p>
            {extractedPosts.slice(0, 3).map((post, index) => (
              <div key={post.id || index} className="border-b border-gray-200 pb-2 mb-2 last:border-b-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {post.content.substring(0, 120)}{post.content.length > 120 ? '...' : ''}
                </p>
                <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                  <span>Date: {new Date(post.createdAt).toLocaleDateString()}</span>
                  <span>Likes: {post.likes}</span>
                  <span>Comments: {post.numComments}</span>
                  <span>Shares: {post.numShares}</span>
                </div>
              </div>
            ))}
            {extractedPosts.length > 3 && (
              <p className="text-xs text-gray-500 mt-2">
                ...and {extractedPosts.length - 3} more posts
              </p>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• <strong>OAuth:</strong> Requires LinkedIn developer app setup. Contact support for assistance.</p>
          <p>• <strong>Profile URL:</strong> Must be a public LinkedIn profile (linkedin.com/in/username)</p>
          <p>• <strong>Privacy:</strong> Only public posts are accessible via profile URL method</p>
          <p>• <strong>Rate Limits:</strong> Please wait between extraction attempts to avoid being rate limited</p>
        </div>
      </div>
    </div>
  )
}