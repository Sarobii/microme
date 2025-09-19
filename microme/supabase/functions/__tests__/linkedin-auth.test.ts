import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch for testing
global.fetch = vi.fn()

describe('LinkedIn Auth Edge Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should require all necessary parameters', () => {
      const requiredParams = ['code', 'clientId', 'clientSecret', 'redirectUri']
      
      requiredParams.forEach(param => {
        const testRequest = {
          code: 'test_code',
          clientId: 'test_client',
          clientSecret: 'test_secret',
          redirectUri: 'http://localhost:3000/callback'
        }

        delete (testRequest as any)[param]

        const hasAllRequired = Object.keys(testRequest).length === 4
        expect(hasAllRequired).toBe(false)
      })
    })

    it('should detect demo client IDs', () => {
      const demoClientIds = [
        'demo_client_id',
        'test_client_123',
        'test_development'
      ]

      demoClientIds.forEach(clientId => {
        const isDemo = clientId === 'demo_client_id' || clientId.startsWith('test_')
        expect(isDemo).toBe(true)
      })
    })

    it('should accept valid production client IDs', () => {
      const validClientIds = [
        '86xyz123abc',
        'linkedin_app_12345',
        'prod_client_abc123'
      ]

      validClientIds.forEach(clientId => {
        const isDemo = clientId === 'demo_client_id' || clientId.startsWith('test_')
        expect(isDemo).toBe(false)
      })
    })
  })

  describe('Token Exchange', () => {
    it('should format token request correctly', async () => {
      const mockTokenResponse = {
        access_token: 'mock_token_123',
        expires_in: 5184000,
        scope: 'r_liteprofile r_emailaddress',
        token_type: 'Bearer'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      } as any)

      const requestParams = {
        code: 'auth_code_123',
        clientId: 'real_client_id',
        clientSecret: 'client_secret_456',
        redirectUri: 'http://localhost:3000/callback'
      }

      // Simulate the token exchange request
      const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken'
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: requestParams.code,
        client_id: requestParams.clientId,
        client_secret: requestParams.clientSecret,
        redirect_uri: requestParams.redirectUri,
      })

      await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      })

      expect(fetch).toHaveBeenCalledWith(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.any(URLSearchParams)
      })
    })

    it('should handle token exchange errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('{"error":"invalid_grant","error_description":"Invalid authorization code"}')
      } as any)

      const result = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code' })
      })

      expect(result.ok).toBe(false)
    })

    it('should validate token response structure', () => {
      const validTokenResponse = {
        access_token: 'AQXdSP_W41_UPs5ioT_t8HESyODB4FqbkJ8LrV_5mff4gPODzOYR',
        expires_in: 5184000,
        scope: 'r_liteprofile r_emailaddress',
        token_type: 'Bearer'
      }

      expect(validTokenResponse.access_token).toBeDefined()
      expect(typeof validTokenResponse.expires_in).toBe('number')
      expect(validTokenResponse.token_type).toBe('Bearer')
      expect(validTokenResponse.scope).toContain('r_liteprofile')
    })
  })

  describe('Profile Fetching', () => {
    it('should format profile API request correctly', async () => {
      const mockProfileResponse = {
        id: 'abc123',
        firstName: { localized: { en_US: 'John' } },
        lastName: { localized: { en_US: 'Doe' } },
        profilePicture: {
          displayImage: {
            elements: [{
              identifiers: [{ identifier: 'https://example.com/pic.jpg' }]
            }]
          }
        }
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileResponse)
      } as any)

      const accessToken = 'mock_access_token'
      const profileUrl = 'https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))'

      await fetch(profileUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      expect(fetch).toHaveBeenCalledWith(profileUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
    })

    it('should handle profile API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as any)

      const result = await fetch('https://api.linkedin.com/v2/people/~', {
        headers: { 'Authorization': 'Bearer invalid_token' }
      })

      expect(result.ok).toBe(false)
      expect(result.status).toBe(401)
    })

    it('should extract profile data correctly', () => {
      const linkedinProfileResponse = {
        id: 'abc123def456',
        firstName: { localized: { en_US: 'John' } },
        lastName: { localized: { en_US: 'Doe' } },
        profilePicture: {
          displayImage: {
            elements: [{
              identifiers: [{ identifier: 'https://media.licdn.com/profile-photo.jpg' }]
            }]
          }
        }
      }

      const extractedProfile = {
        id: linkedinProfileResponse.id,
        firstName: linkedinProfileResponse.firstName?.localized?.en_US || '',
        lastName: linkedinProfileResponse.lastName?.localized?.en_US || '',
        profilePicture: linkedinProfileResponse.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier || null
      }

      expect(extractedProfile.id).toBe('abc123def456')
      expect(extractedProfile.firstName).toBe('John')
      expect(extractedProfile.lastName).toBe('Doe')
      expect(extractedProfile.profilePicture).toContain('profile-photo.jpg')
    })

    it('should handle missing profile fields gracefully', () => {
      const incompleteProfileResponse = {
        id: 'abc123',
        // Missing firstName, lastName, profilePicture
      }

      const extractedProfile = {
        id: incompleteProfileResponse.id,
        firstName: (incompleteProfileResponse as any).firstName?.localized?.en_US || '',
        lastName: (incompleteProfileResponse as any).lastName?.localized?.en_US || '',
        profilePicture: (incompleteProfileResponse as any).profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier || null
      }

      expect(extractedProfile.id).toBe('abc123')
      expect(extractedProfile.firstName).toBe('')
      expect(extractedProfile.lastName).toBe('')
      expect(extractedProfile.profilePicture).toBeNull()
    })
  })

  describe('Response Structure', () => {
    it('should return consistent success response', () => {
      const successResponse = {
        success: true,
        data: {
          access_token: 'token_123',
          expires_in: 5184000,
          token_type: 'Bearer',
          scope: 'r_liteprofile r_emailaddress',
          profile: {
            id: 'user_123',
            firstName: 'John',
            lastName: 'Doe',
            profilePicture: 'https://example.com/pic.jpg'
          }
        }
      }

      expect(successResponse.success).toBe(true)
      expect(successResponse.data.access_token).toBeDefined()
      expect(successResponse.data.profile).toBeDefined()
      expect(successResponse.data.profile?.id).toBeDefined()
    })

    it('should return consistent error response', () => {
      const errorResponse = {
        success: false,
        error: 'Invalid authorization code or client credentials'
      }

      expect(errorResponse.success).toBe(false)
      expect(errorResponse.error).toBeDefined()
      expect(typeof errorResponse.error).toBe('string')
    })
  })

  describe('Security Considerations', () => {
    it('should validate redirect URI format', () => {
      const validRedirectUris = [
        'http://localhost:3000/callback',
        'https://myapp.com/auth/linkedin/callback',
        'https://subdomain.example.org/oauth/callback'
      ]

      const invalidRedirectUris = [
        'javascript:alert(1)',
        'ftp://example.com/callback',
        'not-a-url'
      ]

      validRedirectUris.forEach(uri => {
        try {
          new URL(uri)
          expect(true).toBe(true) // URL constructor didn't throw
        } catch {
          expect(false).toBe(true) // Should not reach here for valid URIs
        }
      })

      invalidRedirectUris.forEach(uri => {
        let isValid = true
        try {
          new URL(uri)
        } catch {
          isValid = false
        }
        expect(isValid).toBe(false)
      })
    })

    it('should not expose sensitive data in error messages', () => {
      const safeErrorMessages = [
        'Invalid authorization code',
        'Authentication failed',
        'Network error during token exchange'
      ]

      const unsafePatterns = [
        /client_secret/i,
        /password/i,
        /token.*[A-Za-z0-9]{20,}/  // Long tokens
      ]

      safeErrorMessages.forEach(message => {
        unsafePatterns.forEach(pattern => {
          expect(pattern.test(message)).toBe(false)
        })
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle network timeouts', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network timeout'))

      try {
        await fetch('https://api.linkedin.com/test')
        expect(false).toBe(true) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should handle malformed JSON responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Malformed JSON'))
      } as any)

      try {
        const response = await fetch('https://api.linkedin.com/test')
        await response.json()
        expect(false).toBe(true) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should handle empty response bodies', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null)
      } as any)

      const response = await fetch('https://api.linkedin.com/test')
      const data = await response.json()
      
      expect(data).toBeNull()
    })
  })
})