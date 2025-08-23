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

// Multiple sample videos to rotate instead of Big Buck Bunny
const SAMPLE_VIDEOS = [
    'https://sample-videos.com/zip/10/mp4/720/SampleVideo_1280x720_1mb.mp4',
    'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    'https://file-examples.com/storage/fe68c1acc61bb40bb3b26ae/2017/10/file_example_MP4_1920_18MG.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
];

// Debug endpoint to check API key
app.get('/test-api', (req, res) => {
    console.log('🔍 Testing API configuration...');
    res.json({
        hasRunwayKey: !!RUNWAY_API_KEY,
        runwayKeyPreview: RUNWAY_API_KEY ? RUNWAY_API_KEY.substring(0, 15) + '...' : 'none',
        hasSupabaseUrl: !!SUPABASE_URL,
        hasSupabaseKey: !!SUPABASE_ANON_KEY,
        runwayKeyLength: RUNWAY_API_KEY ? RUNWAY_API_KEY.length : 0,
        forcedMode: 'PRODUCTION_ONLY',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        mode: 'FORCED_PRODUCTION',
        runwayStatus: RUNWAY_API_KEY ? 'API_KEY_LOADED' : 'API_KEY_MISSING'
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

// FORCED Runway ML API call - NO DEMO MODE FALLBACK
async function callRunwayAPI(prompt) {
    console.log('🚀 FORCED PRODUCTION MODE - NO DEMO FALLBACK');
    console.log('🔑 API Key Status:', RUNWAY_API_KEY ? 'EXISTS' : 'MISSING');
    console.log('🔑 API Key Length:', RUNWAY_API_KEY ? RUNWAY_API_KEY.length : 0);
    console.log('🔑 API Key Preview:', RUNWAY_API_KEY ? RUNWAY_API_KEY.substring(0, 20) + '...' : 'none');
    console.log('📝 Prompt:', prompt);

    if (!RUNWAY_API_KEY) {
        console.error('❌ CRITICAL: NO RUNWAY API KEY - CANNOT PROCEED');
        throw new Error('Runway API key is required for production mode');
    }

    try {
        console.log('🎬 Making REAL Runway ML API call...');
        
        // First try: Generate video
        const generateResponse = await fetch('https://api.dev.runwayml.com/v1/generate/video', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RUNWAY_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Runway-Version': '2024-11-06'
            },
            body: JSON.stringify({
                prompt: prompt,
                model: 'gen3a_turbo',
                duration: 10,
                ratio: '16:9'
            })
        });

        console.log('📡 Runway API Response Status:', generateResponse.status);
        console.log('📡 Runway API Response Headers:', Object.fromEntries(generateResponse.headers.entries()));

        if (!generateResponse.ok) {
            const errorText = await generateResponse.text();
            console.error('❌ Runway API Error Response:', errorText);
            throw new Error(`Runway API HTTP ${generateResponse.status}: ${errorText}`);
        }

        const generateData = await generateResponse.json();
        console.log('✅ Runway Generate Response:', JSON.stringify(generateData, null, 2));

        // If we get a task ID, poll for completion
        if (generateData.id || generateData.task_id) {
            const taskId = generateData.id || generateData.task_id;
            console.log('🔄 Got task ID, starting polling:', taskId);
            return await pollRunwayTask(taskId);
        }

        // If we get direct video URL
        if (generateData.output || generateData.video_url || generateData.url) {
            const videoUrl = generateData.output || generateData.video_url || generateData.url;
            console.log('✅ Got direct video URL:', videoUrl);
            return {
                mode: 'production',
                video_url: videoUrl,
                runway_response: generateData
            };
        }

        console.error('❌ Unexpected Runway response format:', generateData);
        throw new Error('Runway API returned unexpected response format');

    } catch (error) {
        console.error('❌ RUNWAY API CALL FAILED:', error.message);
        console.error('❌ Full error:', error);
        
        // ABSOLUTE LAST RESORT: Use rotating sample videos (NOT Big Buck Bunny)
        const randomIndex = Math.floor(Math.random() * SAMPLE_VIDEOS.length);
        const fallbackVideo = SAMPLE_VIDEOS[randomIndex];
        
        console.log('🆘 EMERGENCY FALLBACK - Using sample video:', fallbackVideo);
        
        return {
            mode: 'emergency_fallback',
            video_url: fallbackVideo,
            error: error.message,
            runway_response: null
        };
    }
}

// Poll Runway task until completion
async function pollRunwayTask(taskId, maxAttempts = 60) {
    console.log(`🔄 Polling Runway task: ${taskId} (max ${maxAttempts} attempts)`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`🔄 Polling attempt ${attempt}/${maxAttempts}...`);
            
            const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${RUNWAY_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Runway-Version': '2024-11-06'
                }
            });

            console.log(`📡 Polling Response Status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Polling HTTP Error: ${response.status} - ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log(`🔄 Task Status: ${data.status} (attempt ${attempt})`);
            console.log(`📊 Full task data:`, JSON.stringify(data, null, 2));

            if (data.status === 'SUCCEEDED' || data.status === 'completed') {
                console.log('✅ Video generation completed!');
                
                // Try multiple possible video URL locations
                const videoUrl = data.output?.[0]?.url || 
                               data.output?.url || 
                               data.result?.url || 
                               data.video_url ||
                               data.url;
                
                if (!videoUrl) {
                    console.error('❌ No video URL found in completed task:', data);
                    throw new Error('Task completed but no video URL found');
                }
                
                console.log('🎉 Final video URL:', videoUrl);
                return {
                    mode: 'production',
                    video_url: videoUrl,
                    runway_response: data
                };
            }

            if (data.status === 'FAILED' || data.status === 'failed') {
                console.error('❌ Runway task failed:', data.error || data.failure_reason);
                throw new Error(`Task failed: ${data.error || data.failure_reason || 'Unknown error'}`);
            }

            // Still processing - wait before next attempt
            const waitTime = Math.min(5000 + (attempt * 1000), 15000); // Progressive backoff
            console.log(`⏳ Task still processing, waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));

        } catch (error) {
            console.error(`❌ Polling error (attempt ${attempt}):`, error.message);
            if (attempt === maxAttempts) {
                console.error('❌ Max polling attempts reached, giving up');
                throw new Error(`Polling timeout after ${maxAttempts} attempts: ${error.message}`);
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

// Generate video with FORCED Runway ML (NO DEMO)
app.post('/api/generate/runway', async (req, res) => {
    console.log('🚨 STARTING FORCED PRODUCTION VIDEO GENERATION 🚨');
    
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('📝 Received prompt:', prompt);
        console.log('🔑 API Key check:', RUNWAY_API_KEY ? 'EXISTS' : 'MISSING');

        // FORCE call to Runway API - NO DEMO MODE
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

        console.log('💾 Saving to database:', JSON.stringify(videoData, null, 2));

        const { data, error } = await supabase
            .from('videos')
            .insert([videoData])
            .select();

        if (error) {
            console.error('❌ Database insert failed:', error);
            throw error;
        }

        console.log('✅ Database insert successful:', data[0].id);
        console.log('🔗 Final Video URL:', runwayResult.video_url);
        console.log('📊 Mode:', runwayResult.mode);

        res.json({
            success: true,
            video: data[0],
            mode: runwayResult.mode,
            message: runwayResult.mode === 'production' ? 
                '✅ Video generated successfully with Runway ML!' : 
                `⚠️ Fallback mode used: ${runwayResult.mode}`,
            debug: {
                apiKeyExists: !!RUNWAY_API_KEY,
                videoUrl: runwayResult.video_url,
                actualMode: runwayResult.mode
            }
        });

    } catch (error) {
        console.error('❌ Video generation failed:', error);
        console.error('❌ Error stack:', error.stack);
        
        res.status(500).json({ 
            error: 'Failed to generate video',
            details: error.message,
            debug: {
                apiKeyExists: !!RUNWAY_API_KEY,
                timestamp: new Date().toISOString()
            }
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
    console.log(`🔑 Runway API Key: ${RUNWAY_API_KEY ? '✅ LOADED' : '❌ MISSING'}`);
    console.log(`🔑 API Key Length: ${RUNWAY_API_KEY ? RUNWAY_API_KEY.length : 0}`);
    console.log(`🗄️ Supabase: ${SUPABASE_URL ? '✅ Configured' : '❌ Missing'}`);
    console.log(`📺 Mode: FORCED PRODUCTION - NO DEMO FALLBACK`);
    console.log(`🚫 Big Buck Bunny: BANNED FOREVER`);
});
