import { decodeBase64 } from 'jsr:@std/encoding/base64';

const textDecoder = new TextDecoder();

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { posts, uploadSource, accessToken, memberUrn } = await req.json();

        console.log('Ingestion request received:', { uploadSource, postsCount: posts?.length });

        if (!posts || !Array.isArray(posts) || posts.length === 0) {
            throw new Error('Posts data is required and must be a non-empty array');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header using Supabase JWT verification
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('No authorization header or invalid format');
        }

        const token = authHeader.replace('Bearer ', '');
        
        let userId;
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                throw new Error('JWT must have 3 parts');
            }
            
            const payload = decodeBase64(tokenParts[1]);
            const decodedPayload = JSON.parse(textDecoder.decode(payload));
            userId = decodedPayload.sub || decodedPayload.user_id;
            
            if (!userId) {
                throw new Error('No user ID found in token payload');
            }
            
            console.log('User identified:', userId);
        } catch (e) {
            console.error('JWT decode error:', e.message);
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Process posts and derive features
        const processedPosts = posts.map((post: any) => {
            const content = post.content || post.text || '';
            const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;
            const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
            const hasLink = /https?:\/\/[^\s]+/.test(content);
            const hasMedia = !!(post.media || post.images || post.video);

            return {
                user_id: userId,
                post_id: post.id || `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                content: content,
                post_date: post.created_at || post.createdAt || post.date || new Date().toISOString(),
                word_count: wordCount,
                emoji_count: emojiCount,
                has_link: hasLink,
                has_media: hasMedia,
                likes_count: post.likes || post.numLikes || 0,
                comments_count: post.comments || post.numComments || 0,
                shares_count: post.shares || post.numShares || 0,
                created_at: new Date().toISOString()
            };
        });

        console.log('Posts processed, derived features calculated');

        // Clear existing posts for this user
        await fetch(`${supabaseUrl}/rest/v1/linkedin_posts?user_id=eq.${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        // Insert processed posts
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/linkedin_posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(processedPosts)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('Failed to insert posts:', errorText);
            throw new Error(`Failed to insert posts: ${errorText}`);
        }

        console.log('Posts inserted successfully');

        // Create ingestion record
        const ingestionRecord = {
            user_id: userId,
            upload_source: uploadSource || 'csv_upload',
            posts_count: processedPosts.length,
            processing_status: 'completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await fetch(`${supabaseUrl}/rest/v1/data_ingestions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ingestionRecord)
        });

        // Generate summary statistics
        const stats = {
            totalPosts: processedPosts.length,
            averageWordCount: Math.round(processedPosts.reduce((sum, post) => sum + post.word_count, 0) / processedPosts.length),
            totalEmojis: processedPosts.reduce((sum, post) => sum + post.emoji_count, 0),
            postsWithLinks: processedPosts.filter(post => post.has_link).length,
            postsWithMedia: processedPosts.filter(post => post.has_media).length,
            totalEngagement: processedPosts.reduce((sum, post) => sum + post.likes_count + post.comments_count + post.shares_count, 0),
            dateRange: {
                earliest: Math.min(...processedPosts.map(p => new Date(p.post_date).getTime())),
                latest: Math.max(...processedPosts.map(p => new Date(p.post_date).getTime()))
            }
        };

        const result = {
            data: {
                message: 'Posts ingested successfully',
                postsProcessed: processedPosts.length,
                statistics: stats,
                nextStep: 'persona-analysis'
            }
        };

        console.log('Ingestion completed successfully');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Ingestion error:', error);

        const errorResponse = {
            error: {
                code: 'INGESTION_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});