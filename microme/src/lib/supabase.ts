import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://phxrjqnfskdawlethprq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeHJqcW5mc2tkYXdsZXRocHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDU2NTksImV4cCI6MjA3MTMyMTY1OX0.QOJGr5lXJPflgMs9keqS0RteIlwX4FRlLOX2dHv1AuM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  full_name?: string
  email?: string
  big_five_opt_in: boolean
  use_external_links: boolean
  suggest_tagging: boolean
  created_at: string
  updated_at: string
}

export interface LinkedInPost {
  id: string
  user_id: string
  post_id: string
  content: string
  post_date: string
  word_count: number
  emoji_count: number
  has_link: boolean
  has_media: boolean
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
}

export interface PersonaAnalysis {
  id: string
  user_id: string
  analysis_data: any
  confidence_score: number
  created_at: string
  updated_at: string
}

export interface ContentStrategy {
  id: string
  user_id: string
  goal: string
  strategy_data: any
  created_at: string
  updated_at: string
}

export interface TransparencyCard {
  id: string
  user_id: string
  card_data: any
  user_reviewed: boolean
  created_at: string
  updated_at: string
}

export interface Simulation {
  id: string
  user_id: string
  scenario: string
  simulation_data: any
  assumptions: any
  risks: any
  ab_test_plan: any
  created_at: string
}