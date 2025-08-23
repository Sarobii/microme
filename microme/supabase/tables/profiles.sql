CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    full_name TEXT,
    email TEXT,
    big_five_opt_in BOOLEAN DEFAULT true,
    use_external_links BOOLEAN DEFAULT true,
    suggest_tagging BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);