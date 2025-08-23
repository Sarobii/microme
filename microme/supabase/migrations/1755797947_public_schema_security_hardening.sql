-- Migration: public_schema_security_hardening
-- Created at: 1755797947

-- Ensure proper permissions on public schema
-- This helps prevent unauthorized access warnings

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure anon users have minimal permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon; -- Only if specifically needed for your app

-- Create indexes for better performance on RLS policies (reduces warnings about performance)
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user_id ON linkedin_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_persona_analysis_user_id ON persona_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_content_strategies_user_id ON content_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_transparency_cards_user_id ON transparency_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_data_ingestions_user_id ON data_ingestions(user_id);;