import { http, HttpResponse } from 'msw'

export const handlers = [
  // LinkedIn OAuth mock
  http.post('*/functions/v1/linkedin-auth', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.code === 'valid_auth_code') {
      return HttpResponse.json({
        success: true,
        data: {
          access_token: 'mock_access_token',
          profile: {
            id: 'mock_linkedin_id',
            firstName: 'John',
            lastName: 'Doe',
            profilePicture: 'https://example.com/pic.jpg'
          }
        }
      })
    }
    
    return HttpResponse.json(
      { error: 'Invalid authorization code' },
      { status: 400 }
    )
  }),

  // LinkedIn profile scraping mock
  http.post('*/functions/v1/linkedin-scraper', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.profileUrl && body.profileUrl.includes('linkedin.com/in/')) {
      return HttpResponse.json({
        success: true,
        data: {
          posts: [
            {
              id: 'post_1',
              content: 'Just launched an amazing new AI project! Really excited to share this with the community.',
              createdAt: '2024-01-15T10:00:00Z',
              likes: 45,
              numComments: 12,
              numShares: 8,
              media: []
            },
            {
              id: 'post_2', 
              content: 'Sharing some insights about machine learning trends for 2024. The future is bright!',
              createdAt: '2024-01-18T14:30:00Z',
              likes: 67,
              numComments: 23,
              numShares: 15,
              media: ['image']
            }
          ]
        }
      })
    }
    
    return HttpResponse.json(
      { error: 'Invalid LinkedIn profile URL' },
      { status: 400 }
    )
  }),

  // Supabase auth session mock
  http.get('*/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'mock_user_id',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z'
    })
  }),

  // Pipeline orchestrator mock
  http.post('*/functions/v1/pipeline-orchestrator', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      success: true,
      data: {
        summary: {
          completion_rate: 100,
          posts_processed: body.posts?.length || 0
        },
        pipeline_id: 'mock_pipeline_id'
      }
    })
  }),

  // LinkedIn posts database operations
  http.post('*/rest/v1/linkedin_posts', () => {
    return HttpResponse.json([
      {
        id: 'db_post_1',
        user_id: 'mock_user_id',
        content: 'Test post content',
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  http.get('*/rest/v1/linkedin_posts*', () => {
    return HttpResponse.json([
      {
        id: 'db_post_1',
        user_id: 'mock_user_id', 
        content: 'Test post content',
        post_date: '2024-01-01T00:00:00Z',
        likes_count: 10,
        comments_count: 5,
        shares_count: 2,
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  })
]