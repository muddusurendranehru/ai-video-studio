require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5001;
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

<<<<<<< HEAD
// Environment check
=======
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

>>>>>>> 3d3b8faf5173eaafada106edb94f9492d79a238e
console.log('🔍 Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', PORT);
console.log('VIDEO_MODE:', process.env.VIDEO_MODE || 'SMART_MOCK');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configured' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
console.log('✅ Supabase client initialized');

// Middleware
app.use(cors());
app.use(express.json());

// Sample video data for smart mock
const SAMPLE_VIDEOS = [
  {
    id: 'vid_001',
    title: 'Corporate Product Launch',
    description: 'Professional product demonstration with sleek animations',
    duration: 45,
    status: 'completed',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail_url: 'https://via.placeholder.com/320x180/4F46E5/white?text=Product+Launch'
  },
  {
    id: 'vid_002',
    title: 'Educational Tutorial Series',
    description: 'Step-by-step learning content with interactive elements',
    duration: 120,
    status: 'completed',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail_url: 'https://via.placeholder.com/320x180/059669/white?text=Tutorial+Series'
  },
  {
    id: 'vid_003',
    title: 'Social Media Campaign',
    description: 'Dynamic social content with trending animations',
    duration: 30,
    status: 'completed',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: 'https://via.placeholder.com/320x180/DC2626/white?text=Social+Campaign'
  },
  {
    id: 'vid_004',
    title: 'Event Highlights Reel',
    description: 'Conference highlights with professional editing',
    duration: 90,
    status: 'completed',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail_url: 'https://via.placeholder.com/320x180/7C3AED/white?text=Event+Highlights'
  }
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    video_mode: process.env.VIDEO_MODE || 'SMART_MOCK'
  });
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    if (process.env.VIDEO_MODE === 'SMART_MOCK') {
      // Return sample videos in smart mock mode
      res.json({
        success: true,
        data: SAMPLE_VIDEOS,
        count: SAMPLE_VIDEOS.length
      });
    } else {
      // Real database query
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0
      });
    }
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch videos',
      details: error.message
    });
  }
});

// Create new video
app.post('/api/videos', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

    if (process.env.VIDEO_MODE === 'SMART_MOCK') {
      // Smart mock: Create realistic video with processing simulation
      const newVideo = {
        id: `vid_${Date.now()}`,
        title,
        description,
        duration: Math.floor(Math.random() * 120) + 30, // 30-150 seconds
        status: 'processing',
        created_at: new Date().toISOString(),
        video_url: null,
        thumbnail_url: `https://via.placeholder.com/320x180/6366F1/white?text=${encodeURIComponent(title.substring(0, 20))}`
      };

      // Simulate processing time
      setTimeout(async () => {
        // Update status to completed (in real app, this would update database)
        console.log(`✅ Video "${title}" processing completed`);
      }, 5000);

      res.status(201).json({
        success: true,
        data: newVideo,
        message: 'Video generation started'
      });
    } else {
      // Real database insertion
      const { data, error } = await supabase
        .from('videos')
        .insert([{ 
          title, 
          description, 
          status: 'processing',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(201).json({
        success: true,
        data,
        message: 'Video created successfully'
      });
    }
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create video',
      details: error.message
    });
  }
});

// Get single video
app.get('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (process.env.VIDEO_MODE === 'SMART_MOCK') {
      const video = SAMPLE_VIDEOS.find(v => v.id === id);
      if (!video) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }
      res.json({
        success: true,
        data: video
      });
    } else {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Video not found'
          });
        }
        throw error;
      }

      res.json({
        success: true,
        data
      });
    }
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch video',
      details: error.message
    });
  }
});

// Delete video
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (process.env.VIDEO_MODE === 'SMART_MOCK') {
      // In mock mode, just return success
      res.json({
        success: true,
        message: 'Video deleted successfully'
      });
    } else {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'Video deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete video',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AI Video Studio Backend`);
  console.log(`📡 Server running on port ${PORT}`);
<<<<<<< HEAD
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Mode: ${process.env.VIDEO_MODE || 'SMART_MOCK'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);
});

module.exports = app;
=======
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎬 Video Mode: ${VIDEO_GENERATION_MODE}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`✅ Ready for deployment!`);
});
>>>>>>> 3d3b8faf5173eaafada106edb94f9492d79a238e
