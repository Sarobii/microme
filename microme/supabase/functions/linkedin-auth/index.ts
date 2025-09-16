import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface LinkedInAuthRequest {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, clientId, clientSecret, redirectUri }: LinkedInAuthRequest = await req.json()

    if (!code || !clientId || !clientSecret || !redirectUri) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required parameters: code, clientId, clientSecret, redirectUri' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if this is a demo/test client ID
    if (clientId === 'demo_client_id' || clientId.startsWith('test_')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Demo client ID detected. Please configure a real LinkedIn application client ID and secret for OAuth integration.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri)

    if (!tokenResponse.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: tokenResponse.error || 'Failed to exchange authorization code for access token' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch user profile information
    const profileResponse = await fetchLinkedInProfile(tokenResponse.data!.access_token)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          access_token: tokenResponse.data!.access_token,
          expires_in: tokenResponse.data!.expires_in,
          token_type: tokenResponse.data!.token_type,
          scope: tokenResponse.data!.scope,
          profile: profileResponse.success ? profileResponse.data : null
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('LinkedIn auth error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error during LinkedIn authentication' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ success: boolean; data?: LinkedInTokenResponse; error?: string }> {
  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('LinkedIn token exchange failed:', errorData)
      return {
        success: false,
        error: 'Invalid authorization code or client credentials'
      }
    }

    const tokenData = await response.json() as LinkedInTokenResponse
    
    return {
      success: true,
      data: tokenData
    }
  } catch (error) {
    console.error('Token exchange error:', error)
    return {
      success: false,
      error: 'Network error during token exchange'
    }
  }
}

async function fetchLinkedInProfile(accessToken: string) {
  try {
    const response = await fetch('https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to fetch LinkedIn profile'
      }
    }

    const profileData = await response.json()
    
    return {
      success: true,
      data: {
        id: profileData.id,
        firstName: profileData.firstName?.localized?.en_US || '',
        lastName: profileData.lastName?.localized?.en_US || '',
        profilePicture: profileData.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier || null
      }
    }
  } catch (error) {
    console.error('Profile fetch error:', error)
    return {
      success: false,
      error: 'Network error during profile fetch'
    }
  }
}