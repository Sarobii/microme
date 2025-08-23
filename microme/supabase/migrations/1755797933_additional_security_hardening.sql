-- Migration: additional_security_hardening
-- Created at: 1755797933

-- Ensure auth.users table has proper security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create policy for auth.users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'auth' 
        AND tablename = 'users' 
        AND policyname = 'Users can view own data'
    ) THEN
        CREATE POLICY "Users can view own data" ON auth.users FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- Ensure storage objects have proper RLS if storage is being used
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        
        -- Create storage policy if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'storage' 
            AND tablename = 'objects' 
            AND policyname = 'Users can access own files'
        ) THEN
            CREATE POLICY "Users can access own files" ON storage.objects FOR ALL USING (auth.uid()::text = (metadata->>'uploader_id'));
        END IF;
    END IF;
END $$;

-- Revoke unnecessary public permissions that might cause security warnings
REVOKE ALL ON SCHEMA public FROM public;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;;