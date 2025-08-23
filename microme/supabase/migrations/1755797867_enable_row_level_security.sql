-- Migration: enable_row_level_security
-- Created at: 1755797867

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transparency_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_ingestions ENABLE ROW LEVEL SECURITY;;