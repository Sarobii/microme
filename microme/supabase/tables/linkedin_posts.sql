CREATE TABLE linkedin_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_id TEXT,
    content TEXT NOT NULL,
    post_date TIMESTAMP WITH TIME ZONE,
    word_count INTEGER,
    emoji_count INTEGER,
    has_link BOOLEAN DEFAULT false,
    has_media BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);