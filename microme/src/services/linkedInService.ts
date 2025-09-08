/**
 * LinkedIn Integration Service
 * Provides both OAuth and URL-based LinkedIn data access
 */

export interface LinkedInPost {
  id: string
  content: string
  createdAt: string
  likes: number
  comments: number
  shares: number
  media?: {
    type: 'image' | 'video' | 'document'
    url: string
  }[]
  author: {
    name: string
    profileUrl: string
    headline?: string
  }
}

export interface LinkedInProfile {
  id: string
  name: string
  headline: string
  profileUrl: string
  location?: string
  connections?: number
  followers?: number
}

export interface LinkedInAuthConfig {
  clientId?: string
  redirectUri: string
  scope: string[]
}

export class LinkedInService {
  private static instance: LinkedInService
  private config: LinkedInAuthConfig
  private accessToken: string | null = null

  constructor() {
    this.config = {
      redirectUri: `${window.location.origin}/auth/linkedin/callback`,
      scope: [
        'r_liteprofile',
        'r_emailaddress', 
        'w_member_social'  // For accessing posts
      ]
    }
  }

  public static getInstance(): LinkedInService {
    if (!LinkedInService.instance) {
      LinkedInService.instance = new LinkedInService()
    }
    return LinkedInService.instance
  }

  /**
   * Method 1: LinkedIn OAuth Integration
   * Initiates OAuth flow for users to connect their LinkedIn account
   */
  public initiateOAuthFlow(): void {
    // Since we don't want to require developer credentials from users,
    // we'll implement a proxy approach through our backend
    const authUrl = this.buildAuthUrl()
    window.location.href = authUrl
  }

  private buildAuthUrl(): string {
    // For MVP, we'll use a simpler approach that doesn't require LinkedIn API keys
    // This will redirect to our own backend endpoint that handles LinkedIn OAuth
    const params = new URLSearchParams({
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      state: this.generateState()
    })

    // This would normally be: `https://www.linkedin.com/oauth/v2/authorization?${params}`
    // But since we don't want to require API keys, we'll use our Supabase function
    return `/functions/v1/linkedin-auth?${params}`
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  /**
   * Handle OAuth callback and exchange code for access token
   */
  public async handleOAuthCallback(code: string, state: string): Promise<boolean> {
    try {
      // Exchange code for access token through our Supabase function
      const response = await fetch('/functions/v1/linkedin-auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state })
      })

      if (!response.ok) {
        throw new Error('Failed to exchange code for token')
      }

      const data = await response.json()
      this.accessToken = data.access_token
      
      // Store token securely (you might want to store in Supabase user profile)
      localStorage.setItem('linkedin_token', data.access_token)
      
      return true
    } catch (error) {
      console.error('OAuth callback error:', error)
      return false
    }
  }

  /**
   * Fetch LinkedIn posts using the access token
   */
  public async fetchUserPosts(limit: number = 50): Promise<LinkedInPost[]> {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.')
    }

    try {
      // Use our Supabase function to fetch posts
      const response = await fetch('/functions/v1/linkedin-posts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch LinkedIn posts')
      }

      const data = await response.json()
      return this.transformLinkedInPosts(data.elements || [])
    } catch (error) {
      console.error('Error fetching LinkedIn posts:', error)
      throw error
    }
  }

  /**
   * Method 2: LinkedIn URL Profile Scraping (Fallback)
   * Extract posts from LinkedIn profile URL using web scraping
   */
  public async fetchPostsByProfileUrl(profileUrl: string): Promise<LinkedInPost[]> {
    try {
      // Validate LinkedIn URL
      if (!this.isValidLinkedInUrl(profileUrl)) {
        throw new Error('Please provide a valid LinkedIn profile URL')
      }

      // Use Supabase client for function calls
      const { supabase } = await import('../lib/supabase')
      
      const { data: response, error } = await supabase.functions.invoke('linkedin-scraper', {
        body: { profileUrl },
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to scrape LinkedIn profile')
      }

      return this.transformScrapedPosts(response.posts || [])
    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error)
      throw error
    }
  }

  private isValidLinkedInUrl(url: string): boolean {
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9\-]+\/?$/
    return linkedinRegex.test(url)
  }

  /**
   * Transform LinkedIn API response to our standard format
   */
  private transformLinkedInPosts(apiPosts: any[]): LinkedInPost[] {
    return apiPosts.map((post: any) => ({
      id: post.id || `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: this.extractPostText(post),
      createdAt: this.parseLinkedInDate(post.createdAt || post.createdTime),
      likes: this.extractEngagementCount(post, 'LIKE'),
      comments: this.extractEngagementCount(post, 'COMMENT'),  
      shares: this.extractEngagementCount(post, 'SHARE'),
      media: this.extractMedia(post),
      author: {
        name: post.author?.localizedName || 'LinkedIn User',
        profileUrl: post.author?.profileUrl || '',
        headline: post.author?.headline
      }
    }))
  }

  /**
   * Transform scraped data to our standard format
   */
  private transformScrapedPosts(scrapedPosts: any[]): LinkedInPost[] {
    return scrapedPosts.map((post: any, index: number) => ({
      id: post.id || `scraped_${Date.now()}_${index}`,
      content: post.text || post.content || '',
      createdAt: this.parseScrapedDate(post.date),
      likes: parseInt(post.likes || '0', 10),
      comments: parseInt(post.comments || '0', 10),
      shares: parseInt(post.shares || post.reposts || '0', 10),
      media: post.media ? [{
        type: post.media.type || 'image',
        url: post.media.url
      }] : undefined,
      author: {
        name: post.author || 'LinkedIn User',
        profileUrl: post.profileUrl || '',
        headline: post.headline
      }
    }))
  }

  private extractPostText(post: any): string {
    // LinkedIn API can have text in different locations
    return post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text ||
           post.commentary?.text ||
           post.text ||
           post.content ||
           ''
  }

  private parseLinkedInDate(dateStr: string): string {
    try {
      // LinkedIn typically returns timestamps in milliseconds
      const date = new Date(parseInt(dateStr, 10))
      return date.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  private parseScrapedDate(dateStr: string): string {
    try {
      if (!dateStr) return new Date().toISOString()
      
      // Handle various date formats from scraping
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  private extractEngagementCount(post: any, type: 'LIKE' | 'COMMENT' | 'SHARE'): number {
    try {
      const socialDetail = post.socialDetail
      if (!socialDetail) return 0

      switch (type) {
        case 'LIKE':
          return socialDetail.totalSocialActivityCounts?.numLikes || 0
        case 'COMMENT':
          return socialDetail.totalSocialActivityCounts?.numComments || 0
        case 'SHARE':
          return socialDetail.totalSocialActivityCounts?.numShares || 0
        default:
          return 0
      }
    } catch {
      return 0
    }
  }

  private extractMedia(post: any): LinkedInPost['media'] {
    try {
      const content = post.specificContent?.['com.linkedin.ugc.ShareContent']
      if (!content?.media) return undefined

      return content.media.map((item: any) => ({
        type: this.determineMediaType(item),
        url: item.originalUrl || item.url || ''
      }))
    } catch {
      return undefined
    }
  }

  private determineMediaType(mediaItem: any): 'image' | 'video' | 'document' {
    const mediaType = mediaItem.mediaType || mediaItem.type || ''
    if (mediaType.includes('IMAGE') || mediaType.includes('image')) return 'image'
    if (mediaType.includes('VIDEO') || mediaType.includes('video')) return 'video'
    return 'document'
  }

  /**
   * Get stored access token
   */
  public getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('linkedin_token')
    }
    return this.accessToken
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  /**
   * Clear authentication
   */
  public logout(): void {
    this.accessToken = null
    localStorage.removeItem('linkedin_token')
  }

  /**
   * Fetch user profile information
   */
  public async fetchUserProfile(): Promise<LinkedInProfile | null> {
    if (!this.accessToken) return null

    try {
      const response = await fetch('/functions/v1/linkedin-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) return null

      const profile = await response.json()
      return {
        id: profile.id,
        name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        headline: profile.headline?.localized?.en_US || '',
        profileUrl: profile.profileUrl || '',
        location: profile.location?.name,
        connections: profile.numConnections,
        followers: profile.numFollowers
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }
}

export const linkedInService = LinkedInService.getInstance()