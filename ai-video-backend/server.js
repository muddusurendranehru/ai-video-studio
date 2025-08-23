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

// Comprehensive debug endpoint
app.get('/test-api', (req, res) => {
    res.json({
        hasRunwayKey: !!RUNWAY_API_KEY,
        runwayKeyPreview: RUNWAY_API_KEY ? RUNWAY_API_KEY.substring(0, 15) + '...' : 'none',
        runwayKeyLength: RUNWAY_API_KEY ? RUNWAY_API_KEY.length : 0,
        hasSupabaseUrl: !!SUPABASE_URL,
        hasSupabaseKey: !!SUPABASE_ANON_KEY,
        apiVersion: '2024-11-06',
        mode: 'COMPREHENSIVE_SOLUTION',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        runway: RUNWAY_API_KEY ? 'configured' : 'missing',
        supabase: SUPABASE_URL ? 'configured' : 'missing',
        timestamp: new Date().toISOString()
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

        if (error) throw error;

        console.log(`📊 Found ${data.length} videos in database`);
        res.json(data);
    } catch (error) {
        console.error('❌ Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// Comprehensive Runway ML API integration
async function callRunwayAPI(prompt) {
    if (!RUNWAY_API_KEY) {
        throw new Error('Runway API key is required');
    }

    console.log('🚀 COMPREHENSIVE RUNWAY ML INTEGRATION');
    console.log('🔑 API Key Status: LOADED');
    console.log('🔑 API Key Length:', RUNWAY_API_KEY.length);
    console.log('📝 Prompt:', prompt);
    console.log('🎯 Target: Real AI video generation');

    // Step 1: Create video generation task
    try {
        console.log('📡 Making request to Runway ML API...');
        
        // Try image-to-video with minimal starter image (common pattern for text-to-video)
        const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RUNWAY_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Runway-Version': '2024-11-06'
            },
            body: JSON.stringify({
                model: 'gen4_turbo',
                promptText: prompt,
                // Use a simple white background for text-to-video effect
                promptImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                duration: 5,
                ratio: '1280:720'
            })
        });

        console.log('📡 Response Status:', response.status);
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Task Created:', JSON.stringify(data, null, 2));

        // Step 2: Poll for completion
        if (data.id) {
            return await pollTaskCompletion(data.id);
        } else {
            throw new Error('No task ID received from Runway API');
        }

    } catch (error) {
        console.error('❌ Runway API call failed:', error.message);
        throw error;
    }
}

// Comprehensive task polling with exponential backoff
async function pollTaskCompletion(taskId, maxAttempts = 40) {
    console.log(`🔄 Polling task: ${taskId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`📡 Polling attempt ${attempt}/${maxAttempts}`);
            
            const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${RUNWAY_API_KEY}`,
                    'X-Runway-Version': '2024-11-06'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Polling failed: ${response.status} - ${errorText}`);
                throw new Error(`Polling failed: HTTP ${response.status}`);
            }

            const taskData = await response.json();
            console.log(`📊 Task Status: ${taskData.status}`);
            console.log(`📊 Task Progress:`, taskData.progress || 'N/A');

            // Handle different task statuses
            switch (taskData.status) {
                case 'SUCCEEDED':
                    console.log('✅ Video generation completed!');
                    
                    // Find the video URL in the response
                    let videoUrl = null;
                    if (taskData.output && taskData.output.length > 0) {
                        videoUrl = taskData.output[0].url || taskData.output[0];
                    } else if (taskData.result && taskData.result.url) {
                        videoUrl = taskData.result.url;
                    } else if (taskData.artifacts && taskData.artifacts.length > 0) {
                        videoUrl = taskData.artifacts[0].url;
                    }

                    if (!videoUrl) {
                        console.error('❌ No video URL found in completed task');
                        throw new Error('Task completed but no video URL found');
                    }

                    console.log('🎉 Final video URL:', videoUrl);
                    return {
                        mode: 'production',
                        video_url: videoUrl,
                        runway_response: taskData
                    };

                case 'FAILED':
                    console.error('❌ Task failed:', taskData.error || taskData.failure_reason);
                    throw new Error(`Task failed: ${taskData.error || taskData.failure_reason || 'Unknown error'}`);

                case 'CANCELLED':
                case 'CANCELED':
                    throw new Error('Task was cancelled');

                case 'PENDING':
                case 'PROCESSING':
                case 'THROTTLED':
                    // Continue polling
                    break;

                default:
                    console.log(`⏳ Unknown status: ${taskData.status}, continuing to poll...`);
            }

            // Exponential backoff: start at 3s, increase by 1s each attempt, max 15s
            const waitTime = Math.min(3000 + (attempt * 1000), 15000);
            console.log(`⏳ Waiting ${waitTime}ms before next poll...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));

        } catch (error) {
            console.error(`❌ Polling error (attempt ${attempt}):`, error.message);
            
            if (attempt === maxAttempts) {
                throw new Error(`Polling timeout after ${maxAttempts} attempts: ${error.message}`);
            }
            
            // Brief wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    throw new Error(`Task polling timeout after ${maxAttempts} attempts`);
}

// Generate video with comprehensive error handling
app.post('/api/generate/runway', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (!RUNWAY_API_KEY) {
            return res.status(500).json({ 
                error: 'Runway API key not configured',
                details: 'Server configuration error'
            });
        }

        console.log('🚨 STARTING COMPREHENSIVE VIDEO GENERATION 🚨');
        console.log('📝 Prompt:', prompt);
        console.log('🔑 API Key: LOADED');
        console.log('⏰ Start time:', new Date().toISOString());

        // Call Runway API with comprehensive error handling
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
            processing_time: Date.now() - startTime,
            created_at: new Date().toISOString()
        };

        console.log('💾 Saving to database:', JSON.stringify(videoData, null, 2));

        const { data, error } = await supabase
            .from('videos')
            .insert([videoData])
            .select();

        if (error) {
            console.error('❌ Database error:', error);
            throw error;
        }

        console.log('✅ SUCCESS! Video generated and saved');
        console.log('📊 Processing time:', Date.now() - startTime, 'ms');
        console.log('🔗 Video URL:', runwayResult.video_url);

        res.json({
            success: true,
            video: data[0],
            mode: runwayResult.mode,
            processing_time: Date.now() - startTime,
            message: '🎉 Video generated successfully with Runway ML!'
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ COMPREHENSIVE ERROR:', error.message);
        console.error('❌ Processing time:', processingTime, 'ms');
        console.error('❌ Full error:', error.stack);
        
        // Determine appropriate HTTP status code
        let statusCode = 500;
        if (error.message.includes('HTTP 400')) statusCode = 400;
        if (error.message.includes('HTTP 401')) statusCode = 401;
        if (error.message.includes('HTTP 402')) statusCode = 402;
        if (error.message.includes('HTTP 429')) statusCode = 429;
        
        res.status(statusCode).json({ 
            error: 'Video generation failed',
            details: error.message,
            processing_time: processingTime,
            debug: {
                apiKeyExists: !!RUNWAY_API_KEY,
                timestamp: new Date().toISOString(),
                errorType: error.constructor.name
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

        if (error) throw error;

        console.log('🗑️ Video deleted:', id);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Delete failed:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

// Start server
app.listen(port, () => {
    console.log('🚀 ═══════════════════════════════════════');
    console.log('🚀 COMPREHENSIVE RUNWAY ML SERVER READY');
    console.log('🚀 ═══════════════════════════════════════');
    console.log(`🌐 Server: http://localhost:${port}`);
    console.log(`🔑 Runway API: ${RUNWAY_API_KEY ? '✅ CONFIGURED' : '❌ MISSING'}`);
    console.log(`🗄️ Supabase: ${SUPABASE_URL ? '✅ CONFIGURED' : '❌ MISSING'}`);
    console.log(`📺 Mode: PRODUCTION ONLY - NO FALLBACKS`);
    console.log(`📚 API Version: 2024-11-06`);
    console.log(`🎯 Endpoint: /v1/image_to_video (text-to-video)`);
    console.log(`⚡ Model: gen4_turbo (latest)`);
    console.log('🚀 ═══════════════════════════════════════');
});
