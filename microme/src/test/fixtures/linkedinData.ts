export const mockLinkedInPosts = [
  {
    id: 'post_1',
    content: 'Just launched an amazing new AI project! Really excited to share this with the community. The potential applications are endless and I can\'t wait to see how people use it.',
    createdAt: '2024-01-15T10:00:00Z',
    likes: 45,
    numComments: 12,
    numShares: 8,
    media: []
  },
  {
    id: 'post_2',
    content: 'Sharing some insights about machine learning trends for 2024. The future is bright! Here are my top 5 predictions for the year ahead in AI and automation.',
    createdAt: '2024-01-18T14:30:00Z', 
    likes: 67,
    numComments: 23,
    numShares: 15,
    media: ['image']
  },
  {
    id: 'post_3',
    content: 'Had an incredible experience at the tech conference yesterday. Met so many brilliant minds working on similar problems. Collaboration is key to innovation!',
    createdAt: '2024-01-20T09:15:00Z',
    likes: 89,
    numComments: 34,
    numShares: 21,
    media: []
  }
]

export const mockLinkedInProfile = {
  id: 'linkedin_user_123',
  firstName: 'John',
  lastName: 'Doe',
  headline: 'AI Engineer & Innovation Leader',
  profilePicture: 'https://example.com/profile-pic.jpg',
  location: 'San Francisco, CA',
  connections: 500,
  followers: 1200
}

export const mockCSVData = `content,date,likes,comments,shares,id
"Just launched an amazing new AI project! Really excited to share this with the community.",2024-01-15,45,12,8,post_1
"Sharing some insights about machine learning trends for 2024. The future is bright!",2024-01-18,67,23,15,post_2
"Had an incredible experience at the tech conference yesterday. Met so many brilliant minds.",2024-01-20,89,34,21,post_3`

export const mockMalformedCSVData = `content,date,likes
"Missing columns",2024-01-15
"Another incomplete row"`

export const mockEmptyCSVData = `content,date,likes,comments,shares
,,,,""`

export const mockLinkedInAuthResponse = {
  access_token: 'mock_access_token_12345',
  expires_in: 5184000,
  scope: 'r_liteprofile r_emailaddress',
  token_type: 'Bearer'
}

export const mockLinkedInApiError = {
  error: 'invalid_grant',
  error_description: 'The provided authorization grant is invalid, expired, or revoked.'
}