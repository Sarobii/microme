CREATE TABLE data_ingestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    upload_source TEXT CHECK (upload_source IN ('linkedin_api',
    'csv_upload')),
    file_url TEXT,
    posts_count INTEGER DEFAULT 0,
    processing_status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);