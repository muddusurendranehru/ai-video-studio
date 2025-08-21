require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
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
    console.log('📹 Fetching videos from Supabase...');
    
    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch videos',
        details: error.message 
      });
    }

    console.log(`✅ Successfully fetched ${videos?.length || 0} videos`);
    res.json(videos || []);
  } catch (error) {
    console.error('❌ Server error in /api/videos:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Generate new video - FIXED FOR UUID SCHEMA
app.post('/api/generate', async (req, res) => {
  try {
    console.log('🎬 Generate video request received:', req.body);
    
    const { prompt, style = 'cinematic', duration = 10 } = req.body;

    // Validate input
    if (!prompt || prompt.trim() === '') {
      console.log('❌ Missing prompt');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (prompt.trim().length < 5) {
      console.log('❌ Prompt too short');
      return res.status(400).json({ error: 'Prompt must be at least 5 characters' });
    }

    // Create video record - LET SUPABASE GENERATE UUID
    const videoData = {
      // Don't specify id - let Supabase auto-generate UUID
      title: prompt.trim().substring(0, 100), // Limit to 100 chars
      prompt: prompt.trim(),
      style: style,
      duration: parseInt(duration) || 10,
      status: 'generating',
      progress: 0,
      video_url: null,
      thumbnail_url: `https://via.placeholder.com/400x300/667eea/ffffff?text=${encodeURIComponent(prompt.substring(0, 20))}`,
      runway_model: 'smart_mock',
      metadata: {
        generation_mode: 'SMART_MOCK',
        frontend_request: true
      }
      // created_at and updated_at will auto-populate from defaults
    };

    console.log('💾 Saving video to Supabase...');

    // Save to Supabase - let it generate UUID
    const { data, error } = await supabase
      .from('videos')
      .insert([videoData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({ 
        error: 'Failed to save video to database',
        details: error.message 
      });
    }

    console.log('✅ Video saved successfully with UUID:', data.id);

    // Simulate video generation process using the generated UUID
    setTimeout(async () => {
      try {
        console.log('⚙️ Updating video to processing...', data.id);
        await supabase
          .from('videos')
          .update({ 
            status: 'processing',
            progress: 50
          })
          .eq('id', data.id);

        // Complete the video after another delay
        setTimeout(async () => {
          try {
            console.log('✅ Completing video generation...', data.id);
            await supabase
              .from('videos')
              .update({ 
                status: 'completed',
                progress: 100,
                video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
              })
              .eq('id', data.id);
            console.log('🎉 Video generation completed:', data.id);
          } catch (error) {
            console.error('❌ Error completing video:', error);
          }
        }, 5000);
      } catch (error) {
        console.error('❌ Error updating video progress:', error);
      }
    }, 3000);

    // Return immediate response with generated UUID
    res.json(data);
  } catch (error) {
    console.error('❌ Video generation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get video by ID
app.get('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching video by ID:', id);
    
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Video not found:', error);
      return res.status(404).json({ 
        error: 'Video not found',
        details: error.message 
      });
    }

    console.log('✅ Video found:', video.id);
    res.json(video);
  } catch (error) {
    console.error('❌ Get video error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Delete video
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting video:', id);
    
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Delete error:', error);
      return res.status(500).json({ 
        error: 'Failed to delete video',
        details: error.message 
      });
    }

    console.log('✅ Video deleted:', id);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('❌ Delete video error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Update video status
app.patch('/api/videos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, video_url } = req.body;
    
    console.log('🔄 Updating video status:', id, status);
    
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
      console.error('❌ Status update error:', error);
      return res.status(500).json({ 
        error: 'Failed to update video status',
        details: error.message 
      });
    }

    console.log('✅ Status updated:', data.id);
    res.json(data);
  } catch (error) {
    console.error('❌ Status update error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global error:', error);
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
  console.log(`💾 Supabase: ${supabaseUrl ? 'Connected' : 'Not configured'}`);
});

