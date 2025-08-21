const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// ADD THIS LINE BELOW:
app.use(cors({
  origin: ['https://ai-video-studio-frontend.onrender.com', 'http://localhost:3000'],
  credentials: true
}));

// Continue with your existing middleware and routes...
app.use(express.json());
// ... rest of your code
// Production-ready CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://your-frontend-app.vercel.app', // Replace with your actual frontend URL
        'https://ai-video-studio.vercel.app',   // Alternative domain
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check for deployment monitoring
app.get('/', (req, res) => {
  res.json({
    service: 'AI Video Studio Backend',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Configuration
const VIDEO_GENERATION_MODE = process.env.VIDEO_MODE || 'SMART_MOCK';

// Environment validation
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

console.log('🔍 Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', PORT);
console.log('VIDEO_MODE:', VIDEO_GENERATION_MODE);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configured' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing');

// Initialize Supabase client
let supabase;
try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  console.log('✅ Supabase client initialized');
} catch (error) {
  console.error('❌ Supabase initialization failed:', error.message);
  process.exit(1);
}

// Smart Mock Video Generation
const generateMockVideo = async (prompt, duration = 10) => {
  console.log('🎭 Smart Mock Generation:', prompt.substring(0, 50) + '...');
  
  const mockTaskId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Curated list of high-quality sample videos
  const videoUrls = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  ];
  
  // Select video based on prompt content for consistency
  const promptHash = prompt.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const videoIndex = Math.abs(promptHash) % videoUrls.length;
  const selectedVideo = videoUrls[videoIndex];
  
  return {
    task_id: mockTaskId,
    status: 'PENDING',
    mock_video_url: selectedVideo,
    mock_thumbnail: `https://via.placeholder.com/1280x720/667eea/ffffff?text=${encodeURIComponent(prompt.substring(0, 50))}`
  };
};

// Smart video generation
const generateVideo = async (prompt, duration = 10) => {
  return generateMockVideo(prompt, duration);
};

// API Routes
app.get('/api/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('videos').select('count', { count: 'exact', head: true });
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      supabase: error ? 'disconnected' : 'connected',
      video_generation_mode: VIDEO_GENERATION_MODE,
      features: {
        smart_mock: true,
        real_generation: false,
        fallback_enabled: true
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // Limit for performance

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new video
app.post('/api/videos', async (req, res) => {
  try {
    const { prompt, duration = 10 } = req.body;
    
    // Validation
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }
    
    if (prompt.trim().length < 3) {
      return res.status(400).json({ error: 'Prompt must be at least 3 characters long' });
    }

    if (duration < 5 || duration > 30) {
      return res.status(400).json({ error: 'Duration must be between 5 and 30 seconds' });
    }

    const title = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
    console.log('📝 Creating video:', title);

    // Create database record
    const { data: videoRecord, error: dbError } = await supabase
      .from('videos')
      .insert([
        {
          title: title,
          prompt: prompt.trim(),
          duration: duration,
          status: 'pending',
          runway_model: 'smart_mock_v1',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('✅ Video record created:', videoRecord.id);

    // Start generation process
    generateVideo(prompt.trim(), duration)
      .then(async (result) => {
        // Update with generation details
        await supabase
          .from('videos')
          .update({
            runway_task_id: result.task_id,
            status: 'processing',
            metadata: { 
              generation_mode: VIDEO_GENERATION_MODE,
              mock_video_url: result.mock_video_url,
              mock_thumbnail: result.mock_thumbnail,
              started_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', videoRecord.id);

        console.log(`🎬 Generation started: ${result.task_id}`);
        
        // Simulate realistic processing time
        const processingTime = 3000 + Math.random() * 5000; // 3-8 seconds
        setTimeout(async () => {
          try {
            await supabase
              .from('videos')
              .update({
                status: 'completed',
                video_url: result.mock_video_url,
                thumbnail_url: result.mock_thumbnail,
                metadata: {
                  ...videoRecord.metadata,
                  completed_at: new Date().toISOString(),
                  processing_time_ms: processingTime
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', videoRecord.id);
            
            console.log(`🎉 Video completed: ${videoRecord.id}`);
          } catch (error) {
            console.error('Error completing video:', error);
          }
        }, processingTime);
      })
      .catch(async (error) => {
        console.error('Generation failed:', error);
        await supabase
          .from('videos')
          .update({
            status: 'failed',
            metadata: { error: error.message },
            updated_at: new Date().toISOString()
          })
          .eq('id', videoRecord.id);
      });

    res.status(201).json(videoRecord);
    
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get video status
app.get('/api/videos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Video not found' });
      }
      throw error;
    }
    
    res.json({
      video_id: id,
      status: video.status,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url,
      runway_task_id: video.runway_task_id,
      generation_mode: video.metadata?.generation_mode || VIDEO_GENERATION_MODE,
      created_at: video.created_at,
      updated_at: video.updated_at
    });
    
  } catch (error) {
    console.error('Error checking video status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update video
app.patch('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('videos')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Video not found' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Video Studio Backend`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎬 Video Mode: ${VIDEO_GENERATION_MODE}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`✅ Ready for deployment!`);
});
