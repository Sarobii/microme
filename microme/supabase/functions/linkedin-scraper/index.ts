import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface LinkedInPost {
  id: string
  content: string
  createdAt: string
  likes: number
  numComments: number
  numShares: number
  media: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profileUrl } = await req.json()

    if (!profileUrl) {
      return new Response(
        JSON.stringify({ error: 'Profile URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate LinkedIn profile URL format
    const linkedinProfileRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_.]+\/?$/
    if (!linkedinProfileRegex.test(profileUrl)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid LinkedIn profile URL format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For demo purposes, return sample data
    // In production, this would scrape the actual LinkedIn profile
    const samplePosts: LinkedInPost[] = await scrapeLinkedInProfile(profileUrl)

    return new Response(
      JSON.stringify({
        success: true,
        data: { posts: samplePosts }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('LinkedIn scraper error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to process LinkedIn profile' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function scrapeLinkedInProfile(profileUrl: string): Promise<LinkedInPost[]> {
  // This is a mock implementation
  // In a real scenario, you would use a web scraping service or LinkedIn API
  
  // Extract username from URL for personalized demo data
  const usernameMatch = profileUrl.match(/\/in\/([^/?]+)/)
  const username = usernameMatch ? usernameMatch[1] : 'user'

  // Generate sample posts based on username for consistency
  const samplePosts: LinkedInPost[] = [
    {
      id: `${username}_post_1`,
      content: `Just launched an exciting new project! Really excited to share this with the LinkedIn community. The potential applications are endless and I can't wait to see how people use it. #innovation #technology`,
      createdAt: '2024-01-15T10:00:00Z',
      likes: 45,
      numComments: 12,
      numShares: 8,
      media: []
    },
    {
      id: `${username}_post_2`,
      content: `Sharing some valuable insights about industry trends for 2024. The future looks incredibly bright! Here are my top 5 predictions for the year ahead in technology and business automation. What are your thoughts? #trends #future #business`,
      createdAt: '2024-01-18T14:30:00Z',
      likes: 67,
      numComments: 23,
      numShares: 15,
      media: ['image']
    },
    {
      id: `${username}_post_3`,
      content: `Had an incredible experience at the tech conference yesterday. Met so many brilliant minds working on similar challenges. Collaboration is truly the key to innovation and breakthrough solutions. Looking forward to following up on all the connections I made!`,
      createdAt: '2024-01-20T09:15:00Z',
      likes: 89,
      numComments: 34,
      numShares: 21,
      media: []
    },
    {
      id: `${username}_post_4`,
      content: `Reflecting on the importance of continuous learning in our rapidly evolving industry. Just completed an excellent course on emerging technologies and I'm amazed by how much the landscape has changed. What new skills are you developing this year?`,
      createdAt: '2024-01-22T16:45:00Z',
      likes: 52,
      numComments: 18,
      numShares: 11,
      media: ['document']
    },
    {
      id: `${username}_post_5`,
      content: `Grateful for the amazing team I work with every day. Their dedication and creativity continue to inspire me and drive our projects to new heights. Success is truly a collective effort and I couldn't be prouder of what we've accomplished together. #teamwork #gratitude`,
      createdAt: '2024-01-25T11:20:00Z',
      likes: 78,
      numComments: 28,
      numShares: 16,
      media: []
    }
  ]

  // Simulate some processing delay
  await new Promise(resolve => setTimeout(resolve, 100))

  return samplePosts
}