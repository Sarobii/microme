-- Migration: add_performance_indexes
-- Created at: 1755872290

-- Add timestamp indexes for better date range queries
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_post_date ON linkedin_posts (post_date DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_created_at ON linkedin_posts (created_at DESC);

-- Add composite indexes for user + timestamp queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user_date ON linkedin_posts (user_id, post_date DESC);
CREATE INDEX IF NOT EXISTS idx_persona_analysis_user_created ON persona_analysis (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_strategies_user_created ON content_strategies (user_id, created_at DESC);

-- Add indexes for JSONB fields that might be commonly queried
CREATE INDEX IF NOT EXISTS idx_persona_analysis_big_five ON persona_analysis USING gin ((analysis_data->'bigFive'));
CREATE INDEX IF NOT EXISTS idx_content_strategies_week_plan ON content_strategies USING gin ((strategy_data->'weekPlan'));

-- Add index for data ingestion status queries
CREATE INDEX IF NOT EXISTS idx_data_ingestions_status ON data_ingestions (processing_status) WHERE processing_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_data_ingestions_user_status ON data_ingestions (user_id, processing_status) WHERE processing_status IS NOT NULL;;