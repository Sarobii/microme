-- Migration: create_rls_policies
-- Created at: 1755797882

-- Create RLS policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for linkedin_posts table
CREATE POLICY "Users can view own posts" ON linkedin_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON linkedin_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON linkedin_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON linkedin_posts FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for persona_analysis table
CREATE POLICY "Users can view own persona analysis" ON persona_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own persona analysis" ON persona_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own persona analysis" ON persona_analysis FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for content_strategies table
CREATE POLICY "Users can view own strategies" ON content_strategies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strategies" ON content_strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own strategies" ON content_strategies FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for transparency_cards table
CREATE POLICY "Users can view own transparency cards" ON transparency_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transparency cards" ON transparency_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transparency cards" ON transparency_cards FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for simulations table
CREATE POLICY "Users can view own simulations" ON simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own simulations" ON simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own simulations" ON simulations FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for data_ingestions table
CREATE POLICY "Users can view own ingestions" ON data_ingestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ingestions" ON data_ingestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ingestions" ON data_ingestions FOR UPDATE USING (auth.uid() = user_id);;