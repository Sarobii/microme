// MicroMe Types

// Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      data_ingestions: {
        Row: DataIngestion
        Insert: DataIngestionInsert
        Update: DataIngestionUpdate
      }
      linkedin_posts: {
        Row: LinkedInPost
        Insert: LinkedInPostInsert
        Update: LinkedInPostUpdate
      }
      persona_analysis: {
        Row: PersonaAnalysis
        Insert: PersonaAnalysisInsert
        Update: PersonaAnalysisUpdate
      }
      content_strategies: {
        Row: ContentStrategy
        Insert: ContentStrategyInsert
        Update: ContentStrategyUpdate
      }
      simulations: {
        Row: Simulation
        Insert: SimulationInsert
        Update: SimulationUpdate
      }
      transparency_cards: {
        Row: TransparencyCard
        Insert: TransparencyCardInsert
        Update: TransparencyCardUpdate
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      upload_source: 'linkedin_api' | 'csv_upload'
      processing_status: 'pending' | 'processing' | 'completed' | 'failed'
    }
  }
}

// Profile Types
export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  big_five_opt_in: boolean
  use_external_links: boolean
  suggest_tagging: boolean
  created_at: string
  updated_at: string
}

export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>
export type ProfileUpdate = Partial<ProfileInsert>

// Data Ingestion Types
export interface DataIngestion {
  id: string
  user_id: string
  upload_source: 'linkedin_api' | 'csv_upload'
  file_url: string | null
  posts_count: number
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
  updated_at: string
}

export type DataIngestionInsert = Omit<DataIngestion, 'id' | 'created_at' | 'updated_at'>
export type DataIngestionUpdate = Partial<DataIngestionInsert>

// LinkedIn Post Types
export interface LinkedInPost {
  id: string
  user_id: string
  post_id: string | null
  content: string
  post_date: string | null
  word_count: number | null
  emoji_count: number | null
  has_link: boolean
  has_media: boolean
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
}

export type LinkedInPostInsert = Omit<LinkedInPost, 'id' | 'created_at'>
export type LinkedInPostUpdate = Partial<LinkedInPostInsert>

// Persona Analysis Types
export interface PersonaAnalysis {
  id: string
  user_id: string
  analysis_data: PersonaAnalysisData
  confidence_score: number | null
  created_at: string
  updated_at: string
}

export type PersonaAnalysisInsert = Omit<PersonaAnalysis, 'id' | 'created_at' | 'updated_at'>
export type PersonaAnalysisUpdate = Partial<PersonaAnalysisInsert>

export interface PersonaAnalysisData {
  personality: {
    traits: Array<{
      name: string
      score: number
      confidence: number
      description: string
    }>
    communicationStyle: {
      tone: string
      vocabulary: string
      sentiment: string
      formality: string
    }
  }
  contentPatterns: {
    themes: Array<{
      topic: string
      frequency: number
      engagement: number
    }>
    postingFrequency: {
      daily: number
      weekly: number
      monthly?: number
    }
    optimalTimes: Array<{
      day: string
      hour: number
      engagement: number
    }>
  }
  audienceInsights: {
    engagementTriggers: string[]
    preferredContentTypes: Array<{
      type: string
      engagement: number
    }>
  }
}

// Content Strategy Types
export interface ContentStrategy {
  id: string
  user_id: string
  goal: string
  strategy_data: ContentStrategyData
  created_at: string
  updated_at: string
}

export type ContentStrategyInsert = Omit<ContentStrategy, 'id' | 'created_at' | 'updated_at'>
export type ContentStrategyUpdate = Partial<ContentStrategyInsert>

export interface ContentStrategyData {
  overview: {
    objective: string
    targetAudience: string
    keyMessages: string[]
  }
  contentPlan: {
    weeklyPosts: number
    contentMix: Array<{
      type: string
      percentage: number
      frequency: string
    }>
  }
  contentSuggestions: Array<{
    title: string
    type: string
    content: string
    hashtags: string[]
    expectedEngagement: number
    confidence: number
    reasoning?: string
  }>
  postingSchedule: {
    optimalDays: string[]
    optimalTimes: string[]
    timezone: string
  }
  kpis: {
    targetEngagementRate: number
    targetReachGrowth: number
    targetFollowerGrowth?: number
  }
}

// Simulation Types
export interface Simulation {
  id: string
  user_id: string
  scenario: string
  simulation_data: SimulationData
  assumptions: Record<string, any>
  risks: Record<string, any>
  ab_test_plan: Record<string, any>
  created_at: string
}

export type SimulationInsert = Omit<Simulation, 'id' | 'created_at'>
export type SimulationUpdate = Partial<SimulationInsert>

export interface SimulationData {
  predictions: {
    engagement: {
      likes: { min: number; expected: number; max: number }
      comments: { min: number; expected: number; max: number }
      shares: { min: number; expected: number; max: number }
      total: { min: number; expected: number; max: number }
    }
    reach: {
      organic: number
      viral_potential: number
    }
    sentiment: {
      positive: number
      neutral: number
      negative: number
    }
  }
  confidence: number
  factors: {
    positive: string[]
    negative: string[]
  }
  recommendations?: string[]
  alternatives?: Array<{
    version: string
    expectedImprovement: number
    reasoning: string
  }>
}

// Transparency Card Types
export interface TransparencyCard {
  id: string
  user_id: string
  card_data: TransparencyCardData
  user_reviewed: boolean
  created_at: string
  updated_at: string
}

export type TransparencyCardInsert = Omit<TransparencyCard, 'id' | 'created_at' | 'updated_at'>
export type TransparencyCardUpdate = Partial<TransparencyCardInsert>

export interface TransparencyCardData {
  decisionProcess: string[]
  dataUsage: {
    userDataAccessed: string[]
    retentionPeriod: string
    sharingPolicy: string
  }
  algorithmicApproach: {
    model: string
    trainingData?: string
    biasDetection: string
  }
  userRights: {
    dataPortability: boolean
    rightToExplanation: boolean
    optOut: boolean
    dataCorrection?: boolean
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
    timestamp: string
    request_id: string
  }
}

// Pipeline Types
export interface PipelineStatus {
  pipelineId: string
  status: 'started' | 'processing' | 'completed' | 'failed'
  currentStage: 'ingestion' | 'persona_analysis' | 'strategy_planning' | 'simulation'
  progress: number
  estimatedCompletion: string
}

export interface IngestionResult {
  ingestionId: string
  processedRows: number
  validPosts: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  summary: {
    totalEngagement: number
    avgEngagement: number
    dateRange: {
      start: string
      end: string
    }
    postTypes: Record<string, number>
  }
}

// UI Component Types
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

export interface InputProps extends ComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'file'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
}

// Form Types
export interface CSVUploadData {
  content: string
  engagement?: number
  date?: string
  hashtags?: string
  post_type?: string
}

export interface AuthFormData {
  email: string
  password: string
  full_name?: string
}

export interface ProfileFormData {
  full_name: string
  big_five_opt_in: boolean
  use_external_links: boolean
  suggest_tagging: boolean
}

// Chart & Visualization Types
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
  }>
}

export interface EngagementMetric {
  date: string
  likes: number
  comments: number
  shares: number
  total: number
}

export interface ContentTheme {
  topic: string
  frequency: number
  engagement: number
  posts: LinkedInPost[]
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>>
  & {
      [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

// Error Types
export interface AppError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

export class APIError extends Error {
  code: string
  details?: Record<string, any>
  timestamp: string
  
  constructor(code: string, message: string, details?: Record<string, any>) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

// Hook Types
export interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UsePaginationResult<T> {
  data: T[]
  loading: boolean
  error: Error | null
  hasNextPage: boolean
  hasPrevPage: boolean
  page: number
  totalPages: number
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
}

// Context Types
export interface AuthContextValue {
  user: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: ProfileUpdate) => Promise<void>
}

export interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

// Constants
export const PROCESSING_STAGES = {
  INGESTION: 'ingestion',
  PERSONA_ANALYSIS: 'persona_analysis', 
  STRATEGY_PLANNING: 'strategy_planning',
  SIMULATION: 'simulation'
} as const

export const UPLOAD_SOURCES = {
  LINKEDIN_API: 'linkedin_api',
  CSV_UPLOAD: 'csv_upload'
} as const

export const PROCESSING_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const