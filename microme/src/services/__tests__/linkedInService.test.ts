import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LinkedInService } from '../linkedInService'
import { mockLinkedInPosts, mockLinkedInAuthResponse, mockLinkedInProfile } from '../../test/fixtures/linkedinData'

// Mock supabase module with factory function
vi.mock('../../lib/supabase', () => {
  const mockSupabaseInvoke = vi.fn()
  const mockSupabaseFrom = vi.fn()
  const mockSupabaseInsert = vi.fn()
  const mockSupabaseSelect = vi.fn()
  
  // Setup mock chain
  mockSupabaseSelect.mockResolvedValue({ data: [], error: null })
  mockSupabaseInsert.mockReturnValue({ select: mockSupabaseSelect })
  mockSupabaseFrom.mockReturnValue({ insert: mockSupabaseInsert })
  
  return {
    supabase: {
      functions: {
        invoke: mockSupabaseInvoke
      },
      from: mockSupabaseFrom
    },
    // Export mocks for test access
    mockSupabaseInvoke,
    mockSupabaseFrom,
    mockSupabaseInsert,
    mockSupabaseSelect
  }
})

describe('LinkedInService', () => {
  let linkedInService: LinkedInService
  let mockSupabaseInvoke: any
  let mockSupabaseFrom: any
  let mockSupabaseInsert: any
  let mockSupabaseSelect: any

  beforeEach(async () => {
    linkedInService = new LinkedInService()
    
    // Get mocks from the mocked module
    const supabaseMocks = await import('../../lib/supabase')
    mockSupabaseInvoke = (supabaseMocks as any).mockSupabaseInvoke
    mockSupabaseFrom = (supabaseMocks as any).mockSupabaseFrom
    mockSupabaseInsert = (supabaseMocks as any).mockSupabaseInsert
    mockSupabaseSelect = (supabaseMocks as any).mockSupabaseSelect
    
    vi.clearAllMocks()
    
    // Setup default mock chain for database operations
    mockSupabaseSelect.mockResolvedValue({ data: [], error: null })
    mockSupabaseInsert.mockReturnValue({ select: mockSupabaseSelect })
    mockSupabaseFrom.mockReturnValue({ insert: mockSupabaseInsert })
  })

  describe('generateAuthUrl', () => {
    it('should generate a valid LinkedIn OAuth URL', () => {
      const clientId = 'test_client_id'
      const redirectUri = 'http://localhost:3000/callback'
      const state = 'test_state'

      const authUrl = LinkedInService.generateAuthUrl(clientId, redirectUri, state)

      expect(authUrl).toContain('https://www.linkedin.com/oauth/v2/authorization')
      expect(authUrl).toContain(`client_id=${clientId}`)
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`)
      expect(authUrl).toContain(`state=${state}`)
      expect(authUrl).toContain('response_type=code')
      expect(authUrl).toContain('scope=r_liteprofile') // URL encoding may vary (+%20)
    })

    it('should generate a random state if none provided', () => {
      const clientId = 'test_client_id'
      const redirectUri = 'http://localhost:3000/callback'

      const authUrl1 = LinkedInService.generateAuthUrl(clientId, redirectUri)
      const authUrl2 = LinkedInService.generateAuthUrl(clientId, redirectUri)

      const state1 = new URL(authUrl1).searchParams.get('state')
      const state2 = new URL(authUrl2).searchParams.get('state')

      expect(state1).toBeTruthy()
      expect(state2).toBeTruthy()
      expect(state1).not.toBe(state2)
    })
  })

  describe('exchangeCodeForToken', () => {
    it('should successfully exchange auth code for token', async () => {
      mockSupabaseInvoke.mockResolvedValue({
        data: {
          success: true,
          data: mockLinkedInAuthResponse
        },
        error: null
      })

      const result = await linkedInService.exchangeCodeForToken(
        'valid_auth_code',
        'client_id',
        'client_secret',
        'redirect_uri'
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockLinkedInAuthResponse)
      expect(mockSupabaseInvoke).toHaveBeenCalledWith('linkedin-auth', {
        body: {
          code: 'valid_auth_code',
          clientId: 'client_id',
          clientSecret: 'client_secret',
          redirectUri: 'redirect_uri'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should handle Supabase function errors', async () => {
      mockSupabaseInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Function execution failed' }
      })

      const result = await linkedInService.exchangeCodeForToken(
        'invalid_code',
        'client_id',
        'client_secret',
        'redirect_uri'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Authentication failed')
    })

    it('should handle API response errors', async () => {
      mockSupabaseInvoke.mockResolvedValue({
        data: {
          success: false,
          error: 'Invalid authorization code'
        },
        error: null
      })

      const result = await linkedInService.exchangeCodeForToken(
        'invalid_code',
        'client_id',
        'client_secret',
        'redirect_uri'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid authorization code')
    })

    it('should handle network errors', async () => {
      mockSupabaseInvoke.mockRejectedValue(new Error('Network error'))

      const result = await linkedInService.exchangeCodeForToken(
        'code',
        'client_id',
        'client_secret',
        'redirect_uri'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error during authentication')
    })
  })

  describe('fetchPostsByProfileUrl', () => {
    it('should successfully fetch posts by profile URL', async () => {
      mockSupabaseInvoke.mockResolvedValue({
        data: {
          success: true,
          data: { posts: mockLinkedInPosts }
        },
        error: null
      })

      const result = await linkedInService.fetchPostsByProfileUrl('https://linkedin.com/in/johndoe')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(mockLinkedInPosts.length)
      expect(result.data?.[0]).toMatchObject({
        id: mockLinkedInPosts[0].id,
        content: mockLinkedInPosts[0].content,
        createdAt: mockLinkedInPosts[0].createdAt
      })
    })

    it('should validate LinkedIn profile URL format', async () => {
      const invalidUrls = [
        'https://facebook.com/profile',
        'https://linkedin.com/company/test',
        'not-a-url',
        'https://linkedin.com/in/',
        'linkedin.com/in/test' // missing https
      ]

      for (const url of invalidUrls) {
        const result = await linkedInService.fetchPostsByProfileUrl(url)
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid LinkedIn profile URL')
      }
    })

    it('should accept valid LinkedIn profile URL formats', async () => {
      const validUrls = [
        'https://linkedin.com/in/johndoe',
        'https://www.linkedin.com/in/johndoe/',
        'https://linkedin.com/in/john-doe-123',
        'https://linkedin.com/in/johndoe_2024'
      ]

      mockSupabaseInvoke.mockResolvedValue({
        data: { success: true, data: { posts: [] } },
        error: null
      })

      for (const url of validUrls) {
        const result = await linkedInService.fetchPostsByProfileUrl(url)
        expect(result.success).toBe(true)
      }
    })

    it('should handle empty posts response', async () => {
      mockSupabaseInvoke.mockResolvedValue({
        data: {
          success: true,
          data: { posts: [] }
        },
        error: null
      })

      const result = await linkedInService.fetchPostsByProfileUrl('https://linkedin.com/in/johndoe')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should filter out posts with insufficient content', async () => {
      const postsWithShortContent = [
        ...mockLinkedInPosts,
        { id: 'short1', content: 'Too short', createdAt: '2024-01-01T00:00:00Z', likes: 0, numComments: 0, numShares: 0, media: [] },
        { id: 'short2', content: '', createdAt: '2024-01-01T00:00:00Z', likes: 0, numComments: 0, numShares: 0, media: [] }
      ]

      mockSupabaseInvoke.mockResolvedValue({
        data: {
          success: true,
          data: { posts: postsWithShortContent }
        },
        error: null
      })

      const result = await linkedInService.fetchPostsByProfileUrl('https://linkedin.com/in/johndoe')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(mockLinkedInPosts.length) // Should filter out short posts
    })
  })

  describe('fetchProfile', () => {
    it('should successfully fetch LinkedIn profile', async () => {
      mockSupabaseInvoke.mockResolvedValue({
        data: {
          success: true,
          data: mockLinkedInProfile
        },
        error: null
      })

      const result = await linkedInService.fetchProfile('access_token')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockLinkedInProfile)
      expect(mockSupabaseInvoke).toHaveBeenCalledWith('linkedin-profile', {
        body: { accessToken: 'access_token' },
        headers: { 'Content-Type': 'application/json' }
      })
    })

    it('should handle profile fetch errors', async () => {
      mockSupabaseInvoke.mockResolvedValue({
        data: {
          success: false,
          error: 'Token expired'
        },
        error: null
      })

      const result = await linkedInService.fetchProfile('expired_token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token expired')
    })
  })

  describe('storePosts', () => {
    it('should successfully store posts in database', async () => {
      const mockInsertedPosts = mockLinkedInPosts.map((_, index) => ({ id: `db_id_${index}` }))
      
      mockSupabaseSelect.mockResolvedValue({
        data: mockInsertedPosts,
        error: null
      })

      const result = await linkedInService.storePosts(mockLinkedInPosts, 'user123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(mockLinkedInPosts.length)
      expect(mockSupabaseFrom).toHaveBeenCalledWith('linkedin_posts')
      expect(mockSupabaseInsert).toHaveBeenCalled()

      // Verify the data structure passed to insert
      const insertedData = mockSupabaseInsert.mock.calls[0][0]
      expect(insertedData).toHaveLength(mockLinkedInPosts.length)
      expect(insertedData[0]).toMatchObject({
        user_id: 'user123',
        post_id: mockLinkedInPosts[0].id,
        content: mockLinkedInPosts[0].content,
        post_date: mockLinkedInPosts[0].createdAt,
        likes_count: mockLinkedInPosts[0].likes,
        comments_count: mockLinkedInPosts[0].numComments,
        shares_count: mockLinkedInPosts[0].numShares
      })
    })

    it('should handle database errors when storing posts', async () => {
      mockSupabaseSelect.mockResolvedValue({
        data: null,
        error: { message: 'Database constraint violation' }
      })

      const result = await linkedInService.storePosts(mockLinkedInPosts, 'user123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to store posts')
    })

    it('should calculate post metrics correctly', async () => {
      const postWithMetrics = [{
        id: 'test_post',
        content: 'This is a test post with emojis 😊🎉 and a link https://example.com with multiple words!',
        createdAt: '2024-01-01T00:00:00Z',
        likes: 10,
        numComments: 5,
        numShares: 2,
        media: ['image', 'video']
      }]

      mockSupabaseSelect.mockResolvedValue({
        data: [{ id: 'db_id' }],
        error: null
      })

      await linkedInService.storePosts(postWithMetrics, 'user123')

      const insertedData = mockSupabaseInsert.mock.calls[0][0][0]
      expect(insertedData.word_count).toBeGreaterThan(10) // Should count words
      expect(insertedData.emoji_count).toBe(2) // Should count emojis
      expect(insertedData.has_link).toBe(true) // Should detect links
      expect(insertedData.has_media).toBe(true) // Should detect media
    })
  })

  describe('private methods via storePosts integration', () => {
    it('should correctly count words', async () => {
      const testPost = [{
        id: 'test',
        content: '  This   has   six   distinct   words  ',
        createdAt: '2024-01-01T00:00:00Z',
        likes: 0,
        numComments: 0,
        numShares: 0,
        media: []
      }]

      mockSupabaseSelect.mockResolvedValue({ data: [{ id: 'db_id' }], error: null })
      await linkedInService.storePosts(testPost, 'user')

      const insertedData = mockSupabaseInsert.mock.calls[0][0][0]
      expect(insertedData.word_count).toBe(5) // "This has six distinct words" = 5 words (not counting numbers)
    })

    it('should correctly count emojis', async () => {
      const testPost = [{
        id: 'test',
        content: 'Hello 👋 World 🌍 with emojis 😊🎉🚀',
        createdAt: '2024-01-01T00:00:00Z',
        likes: 0,
        numComments: 0,
        numShares: 0,
        media: []
      }]

      mockSupabaseSelect.mockResolvedValue({ data: [{ id: 'db_id' }], error: null })
      await linkedInService.storePosts(testPost, 'user')

      const insertedData = mockSupabaseInsert.mock.calls[0][0][0]
      expect(insertedData.emoji_count).toBe(5)
    })

    it('should correctly detect links', async () => {
      const testCases = [
        { content: 'Check out https://example.com', expected: true },
        { content: 'Visit http://test.org for more', expected: true },
        { content: 'No links in this content', expected: false },
        { content: 'Almost a link: www.example.com', expected: false }
      ]

      for (const testCase of testCases) {
        const testPost = [{
          id: 'test',
          content: testCase.content,
          createdAt: '2024-01-01T00:00:00Z',
          likes: 0,
          numComments: 0,
          numShares: 0,
          media: []
        }]

        mockSupabaseSelect.mockResolvedValue({ data: [{ id: 'db_id' }], error: null })
        await linkedInService.storePosts(testPost, 'user')

        const insertedData = mockSupabaseInsert.mock.calls[mockSupabaseInsert.mock.calls.length - 1][0][0]
        expect(insertedData.has_link).toBe(testCase.expected)
      }
    })
  })

  describe('data transformation', () => {
    it('should handle posts with missing optional fields', async () => {
      const incompletePost = {
        content: 'This post has minimal data but should still work fine',
        // Missing id, createdAt, likes, etc.
      }

      mockSupabaseInvoke.mockResolvedValue({
        data: {
          success: true,
          data: { posts: [incompletePost] }
        },
        error: null
      })

      const result = await linkedInService.fetchPostsByProfileUrl('https://linkedin.com/in/johndoe')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      
      const transformedPost = result.data![0]
      expect(transformedPost.content).toBe(incompletePost.content)
      expect(transformedPost.likes).toBe(0)
      expect(transformedPost.numComments).toBe(0)
      expect(transformedPost.numShares).toBe(0)
      expect(transformedPost.id).toMatch(/^generated_/)
    })

    it('should handle various date formats', async () => {
      const postsWithDifferentDates = [
        { content: 'Post 1 with createdAt', createdAt: '2024-01-15T10:00:00Z' },
        { content: 'Post 2 with publishedAt', publishedAt: '2024-01-16T10:00:00Z' },
        { content: 'Post 3 without date' }
      ]

      mockSupabaseInvoke.mockResolvedValue({
        data: {
          success: true,
          data: { posts: postsWithDifferentDates }
        },
        error: null
      })

      const result = await linkedInService.fetchPostsByProfileUrl('https://linkedin.com/in/johndoe')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(result.data![0].createdAt).toBe('2024-01-15T10:00:00Z')
      expect(result.data![1].createdAt).toBe('2024-01-16T10:00:00Z')
      expect(result.data![2].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) // Should have current date
    })
  })
})