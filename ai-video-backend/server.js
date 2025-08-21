require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - Fixes frontend connection
app.use(cors({
  origin: [
    'https://ai-video-studio-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Video Studio Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'AI Video Studio Backend is running!',
    cors: 'configured',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch videos' });
    }

    res.json(videos || []);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate new video
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, style = 'cinematic', duration = 5 } = req.body;

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Create video record with generating status
    const videoData = {
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prompt: prompt.trim(),
      style,
      duration: parseInt(duration),
      status: 'generating',
      progress: 0,
      created_at: new Date().toISOString(),
      video_url: null,
      thumbnail_url: `https://picsum.photos/400/300?random=${Date.now()}`
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('videos')
      .insert([videoData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save video' });
    }

    // Simulate video generation process
    setTimeout(async () => {
      try {
        await supabase
          .from('videos')
          .update({ 
            status: 'processing',
            progress: 50
          })
          .eq('id', data.id);

        // Complete the video after another delay
        setTimeout(async () => {
          await supabase
            .from('videos')
            .update({ 
              status: 'completed',
              progress: 100,
              video_url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`
            })
            .eq('id', data.id);
        }, 3000);
      } catch (error) {
        console.error('Update error:', error);
      }
    }, 2000);

    res.json(data);
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get video by ID
app.get('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get video error:', error);
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete video' });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update video status (for real-time updates)
app.patch('/api/videos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, video_url } = req.body;
    
    const updateData = { status };
    if (progress !== undefined) updateData.progress = progress;
    if (video_url) updateData.video_url = video_url;

    const { data, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update video status' });
    }

    res.json(data);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/videos',
      'POST /api/generate',
      'GET /api/videos/:id',
      'DELETE /api/videos/:id'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Video Studio Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎬 Frontend allowed: https://ai-video-studio-frontend.onrender.com`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

