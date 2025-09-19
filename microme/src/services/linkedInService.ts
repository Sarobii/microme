import { supabase } from '../lib/supabase'

export interface LinkedInPost {
  id: string
  content: string
  createdAt: string
  likes: number
  numComments: number
  numShares: number
  media: string[]
}

export interface LinkedInProfile {
  id: string
  firstName: string
  lastName: string
  headline?: string
  profilePicture?: string
  location?: string
  connections?: number
  followers?: number
}

export interface LinkedInAuthResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
}

export interface LinkedInServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * LinkedIn integration service
 * Provides methods for OAuth authentication and profile data extraction
 */
export class LinkedInService {
  private static readonly LINKEDIN_OAUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
  private static readonly LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
  
  /**
   * Generate LinkedIn OAuth authorization URL
   */
  public static generateAuthUrl(clientId: string, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'r_liteprofile r_emailaddress',
      state: state || Math.random().toString(36).substring(7)
    })
    
    return `${this.LINKEDIN_OAUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token via Supabase Edge Function
   */
  public async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<LinkedInServiceResult<LinkedInAuthResponse>> {
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-auth', {
        body: {
          code,
          clientId,
          clientSecret,
          redirectUri
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        return {
          success: false,
          error: `Authentication failed: ${error.message}`
        }
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Authentication failed'
        }
      }

      return {
        success: true,
        data: data.data
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error during authentication: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Fetch LinkedIn posts by profile URL via web scraping
   */
  public async fetchPostsByProfileUrl(profileUrl: string): Promise<LinkedInServiceResult<LinkedInPost[]>> {
    try {
      // Validate LinkedIn profile URL format
      if (!this.isValidLinkedInProfileUrl(profileUrl)) {
        return {
          success: false,
          error: 'Invalid LinkedIn profile URL. Please ensure it follows the format: https://linkedin.com/in/username'
        }
      }

      const { data, error } = await supabase.functions.invoke('linkedin-scraper', {
        body: { profileUrl },
        headers: { 'Content-Type': 'application/json' }
      })

      if (error) {
        return {
          success: false,
          error: `Failed to fetch posts: ${error.message}`
        }
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to extract posts from profile'
        }
      }

      // Transform and validate posts data
      const posts = this.transformPostsData(data.data.posts || [])
      
      return {
        success: true,
        data: posts
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error during profile scraping: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Fetch LinkedIn profile data using access token
   */
  public async fetchProfile(accessToken: string): Promise<LinkedInServiceResult<LinkedInProfile>> {
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-profile', {
        body: { accessToken },
        headers: { 'Content-Type': 'application/json' }
      })

      if (error) {
        return {
          success: false,
          error: `Failed to fetch profile: ${error.message}`
        }
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to fetch profile data'
        }
      }

      return {
        success: true,
        data: data.data
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error during profile fetch: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Store LinkedIn posts in database
   */
  public async storePosts(posts: LinkedInPost[], userId: string): Promise<LinkedInServiceResult<number>> {
    try {
      const postsToInsert = posts.map(post => ({
        user_id: userId,
        post_id: post.id,
        content: post.content,
        post_date: post.createdAt,
        word_count: this.countWords(post.content),
        emoji_count: this.countEmojis(post.content),
        has_link: this.containsLink(post.content),
        has_media: post.media.length > 0,
        likes_count: post.likes,
        comments_count: post.numComments,
        shares_count: post.numShares
      }))

      const { data, error } = await supabase
        .from('linkedin_posts')
        .insert(postsToInsert)
        .select('id')

      if (error) {
        return {
          success: false,
          error: `Failed to store posts: ${error.message}`
        }
      }

      return {
        success: true,
        data: data?.length || 0
      }
    } catch (error) {
      return {
        success: false,
        error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Validate LinkedIn profile URL format
   */
  private isValidLinkedInProfileUrl(url: string): boolean {
    const linkedinProfileRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_.]+\/?$/
    return linkedinProfileRegex.test(url)
  }

  /**
   * Transform raw posts data into standardized format
   */
  private transformPostsData(rawPosts: any[]): LinkedInPost[] {
    return rawPosts
      .map(post => {
        try {
          return {
            id: post.id || `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: post.content || post.text || '',
            createdAt: post.createdAt || post.publishedAt || new Date().toISOString(),
            likes: parseInt(post.likes?.toString() || '0') || 0,
            numComments: parseInt(post.numComments?.toString() || post.comments?.toString() || '0') || 0,
            numShares: parseInt(post.numShares?.toString() || post.shares?.toString() || '0') || 0,
            media: Array.isArray(post.media) ? post.media : []
          }
        } catch {
          return null
        }
      })
      .filter((post): post is LinkedInPost => post !== null && post.content.length >= 10)
  }

  /**
   * Count words in text content
   */
  private countWords(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  /**
   * Count emojis in text content
   */
  private countEmojis(content: string): number {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
    const matches = content.match(emojiRegex)
    return matches ? matches.length : 0
  }

  /**
   * Check if content contains links
   */
  private containsLink(content: string): boolean {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return urlRegex.test(content)
  }
}