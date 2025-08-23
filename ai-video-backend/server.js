const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 10000;

// Environment variables
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || 'key_a1ea42f4dec4f56029ba0f0d6b20b941dc6591ffd12a82cdce53ba695cc74fc8b28498fa0e44bf085c17ad7696775d097abca06b1319f37bdbff3f7bd7a4deb6';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Middleware
app.use(cors({
  origin: [
    'https://ai-video-studio-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const runwayConfigured = RUNWAY_API_KEY && RUNWAY_API_KEY.startsWith('key_');
  const supabaseConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;
  
  res.json({
    status: 'healthy',
    runway: runwayConfigured ? 'configured' : 'missing',
    supabase: supabaseConfigured ? 'configured' : 'missing',
    mode: runwayConfigured ? 'production' : 'demo',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Runway ML API helper function
async function callRunwayAPI(endpoint, data) {
  const url = `https://api.dev.runwayml.com/v1/${endpoint}`;
  
  console.log(`🚀 Calling Runway API: ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const responseData = await response.text();
    
    if (!response.ok) {
      console.error(`❌ Runway API Error: ${response.status}`);
      console.error(`❌ Response: ${responseData}`);
      throw new Error(`HTTP ${response.status}: ${responseData}`);
    }

    return JSON.parse(responseData);
  } catch (error) {
    console.error(`❌ Runway API call failed:`, error.message);
    throw error;
  }
}

// Check Runway API status
async function checkRunwayCredits() {
  try {
    const response = await fetch('https://api.dev.runwayml.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Runway API connected - Credits: ${data.credits || 'Unknown'}`);
      return data;
    } else {
      const error = await response.text();
      console.error(`❌ Runway API check failed: ${response.status} - ${error}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Runway API check error:`, error.message);
    return null;
  }
}

// Generate video endpoint
app.post('/generate-video', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt, style = 'cinematic', duration = 10 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        processingTime: Date.now() - startTime
      });
    }

    console.log(`🎬 Video generation request: "${prompt}"`);

    // Check if Runway API is configured
    if (!RUNWAY_API_KEY || !RUNWAY_API_KEY.startsWith('key_')) {
      console.log('⚠️  Demo mode - returning sample video');
      
      const sampleVideo = {
        id: `demo_${Date.now()}`,
        status: 'completed',
        videoUrl: 'https://cdn.coverr.co/videos/coverr-aerial-view-of-a-road-in-the-forest-1573/1573-preview.mp4',
        prompt: prompt,
        style: style,
        duration: duration,
        created_at: new Date().toISOString(),
        mode: 'demo'
      };

      // Save to Supabase if configured
      if (supabase) {
        try {
          await supabase.from('videos').insert(sampleVideo);
          console.log('✅ Demo video saved to database');
        } catch (dbError) {
          console.error('❌ Database save error:', dbError.message);
        }
      }

      return res.json({
        success: true,
        video: sampleVideo,
        processingTime: Date.now() - startTime
      });
    }

    // Production mode - use real Runway API
    console.log('🚀 Production mode - calling Runway API');
    
    const runwayData = {
      model: 'gen4_turbo',
      promptText: prompt,
      durationSeconds: duration,
      aspectRatio: '16:9'
    };

    const result = await callRunwayAPI('tasks', runwayData);
    
    console.log(`✅ Runway task created: ${result.id}`);

    // Save to database
    const videoRecord = {
      id: result.id,
      status: result.status || 'processing',
      videoUrl: result.videoUrl || null,
      prompt: prompt,
      style: style,
      duration: duration,
      runway_task_id: result.id,
      created_at: new Date().toISOString(),
      mode: 'production'
    };

    if (supabase) {
      try {
        await supabase.from('videos').insert(videoRecord);
        console.log('✅ Video record saved to database');
      } catch (dbError) {
        console.error('❌ Database save error:', dbError.message);
      }
    }

    res.json({
      success: true,
      video: videoRecord,
      taskId: result.id,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ COMPREHENSIVE ERROR:', error.message);
    
    res.status(500).json({
      error: error.message,
      processingTime: Date.now() - startTime,
      fullError: `Error: ${error.message}`
    });
  }
});

// Check video status endpoint
app.get('/video-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!RUNWAY_API_KEY || !RUNWAY_API_KEY.startsWith('key_')) {
      return res.json({
        id: taskId,
        status: 'completed',
        videoUrl: 'https://cdn.coverr.co/videos/coverr-aerial-view-of-a-road-in-the-forest-1573/1573-preview.mp4',
        mode: 'demo'
      });
    }

    // Check status with Runway API
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    
    // Update database if completed
    if (result.status === 'completed' && result.videoUrl && supabase) {
      try {
        await supabase
          .from('videos')
          .update({ 
            status: 'completed', 
            videoUrl: result.videoUrl 
          })
          .eq('runway_task_id', taskId);
      } catch (dbError) {
        console.error('❌ Database update error:', dbError.message);
      }
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Status check error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all videos endpoint
app.get('/videos', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ videos: [] });
    }

    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    res.json({ videos: videos || [] });

  } catch (error) {
    console.error('❌ Get videos error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Test Runway API endpoint
app.get('/test-runway', async (req, res) => {
  try {
    const credits = await checkRunwayCredits();
    res.json({
      success: !!credits,
      apiKeyConfigured: !!RUNWAY_API_KEY,
      credits: credits
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Serve static files (for frontend if needed)
app.use(express.static('public'));

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'AI Video Studio Backend API',
    status: 'running',
    endpoints: [
      'GET /health',
      'POST /generate-video',
      'GET /video-status/:taskId',
      'GET /videos',
      'GET /test-runway'
    ],
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: ['/', '/health', '/generate-video', '/video-status/:id', '/videos', '/test-runway']
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Video Studio Backend running on port ${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎬 Runway API: ${RUNWAY_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`💾 Supabase: ${supabase ? 'Connected' : 'Not configured'}`);
  
  // Test Runway API on startup
  if (RUNWAY_API_KEY) {
    checkRunwayCredits().then(credits => {
      if (credits) {
        console.log(`✅ Runway API working - Credits: ${credits.credits || 'Unknown'}`);
      }
    });
  }
});
