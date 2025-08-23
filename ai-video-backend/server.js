const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3001;

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Debug endpoint to check API key
app.get('/test-api', (req, res) => {
    console.log('🔍 Testing API configuration...');
    res.json({
        hasRunwayKey: !!RUNWAY_API_KEY,
        runwayKeyPreview: RUNWAY_API_KEY ? RUNWAY_API_KEY.substring(0, 15) + '...' : 'none',
        hasSupabaseUrl: !!SUPABASE_URL,
        hasSupabaseKey: !!SUPABASE_ANON_KEY,
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        mode: RUNWAY_API_KEY ? 'production' : 'demo'
    });
});

// Get all videos
app.get('/api/videos', async (req, res) => {
    try {
        console.log('📊 Fetching videos from database...');
        
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }

        console.log(`📊 Found ${data.length} videos in database`);
        res.json(data);
    } catch (error) {
        console.error('❌ Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// Runway ML API functions using built-in fetch
async function callRunwayAPI(prompt) {
    if (!RUNWAY_API_KEY) {
        console.log('⚠️ No Runway API key - using demo mode');
        return {
            mode: 'demo',
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        };
    }

    try {
        console.log('🎬 Calling Runway ML API...');
        console.log('🔑 API Key exists:', !!RUNWAY_API_KEY);
        console.log('🔑 API Key preview:', RUNWAY_API_KEY.substring(0, 15) + '...');
        console.log('📝 Prompt:', prompt);

        // Runway ML API call using built-in fetch
        const response = await fetch('https://api.runwayml.com/v1/generate/video', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RUNWAY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                model: 'gen3a_turbo',
                duration: 10,
                ratio: '16:9'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Runway API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Runway API response:', data);

        // If Runway returns a task ID, we need to poll for completion
        if (data.id) {
            return await pollRunwayTask(data.id);
        }

        return {
            mode: 'production',
            video_url: data.output || data.video_url,
            runway_response: data
        };

    } catch (error) {
        console.error('❌ Runway API error:', error.message);
        
        // If API fails, return demo but log the error
        return {
            mode: 'demo_fallback',
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            error: error.message
        };
    }
}

// Poll Runway task until completion using built-in fetch
async function pollRunwayTask(taskId, maxAttempts = 30) {
    console.log(`🔄 Polling Runway task: ${taskId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${RUNWAY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            console.log(`🔄 Attempt ${attempt}: Status = ${data.status}`);

            if (data.status === 'SUCCEEDED') {
                console.log('✅ Video generation completed!');
                return {
                    mode: 'production',
                    video_url: data.output?.[0]?.url || data.result?.url,
                    runway_response: data
                };
            }

            if (data.status === 'FAILED') {
                console.error('❌ Runway task failed:', data.error);
                throw new Error(`Task failed: ${data.error}`);
            }

            // Wait 5 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (error) {
            console.error(`❌ Polling error (attempt ${attempt}):`, error.message);
            if (attempt === maxAttempts) {
                throw error;
            }
        }
    }

    throw new Error('Task polling timeout');
}

// Generate video with Runway ML
app.post('/api/generate/runway', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('🚀 Starting video generation...');
        console.log('📝 Prompt:', prompt);

        // Call Runway API
        const runwayResult = await callRunwayAPI(prompt);
        
        // Generate unique video ID
        const videoId = `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Save to database
        const videoData = {
            id: videoId,
            prompt: prompt,
            video_url: runwayResult.video_url,
            status: 'completed',
            mode: runwayResult.mode,
            created_at: new Date().toISOString()
        };

        console.log('💾 Saving to database:', videoData);

        const { data, error } = await supabase
            .from('videos')
            .insert([videoData])
            .select();

        if (error) {
            console.error('❌ Database insert failed:', error);
            throw error;
        }

        console.log('✅ Database insert successful:', data[0].id);
        console.log('🔗 Video URL:', runwayResult.video_url);

        res.json({
            success: true,
            video: data[0],
            mode: runwayResult.mode,
            message: runwayResult.mode === 'production' ? 
                'Video generated successfully with Runway ML!' : 
                'Demo mode - using sample video'
        });

    } catch (error) {
        console.error('❌ Video generation failed:', error);
        res.status(500).json({ 
            error: 'Failed to generate video',
            details: error.message 
        });
    }
});

// Delete video
app.delete('/api/videos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        console.log('🗑️ Video deleted:', id);
        res.json({ success: true, message: 'Video deleted successfully' });
    } catch (error) {
        console.error('❌ Delete failed:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🔑 Runway API Key: ${RUNWAY_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🗄️ Supabase: ${SUPABASE_URL ? '✅ Configured' : '❌ Missing'}`);
    console.log(`📺 Mode: ${RUNWAY_API_KEY ? 'PRODUCTION' : 'DEMO'}`);
});
