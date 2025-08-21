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

// Mock video library for variety - NO MORE BUGS BUNNY ONLY!
const MOCK_VIDEOS = [
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    keywords: ['bunny', 'rabbit', 'animal', 'cute', 'forest', 'nature']
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    keywords: ['elephant', 'dream', 'surreal', 'abstract', 'fantasy', 'imagination']
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    keywords: ['fire', 'flames', 'blaze', 'action', 'intense', 'dramatic']
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    keywords: ['escape', 'adventure', 'travel', 'journey', 'exploration', 'outdoors']
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    keywords: ['fun', 'entertainment', 'colorful', 'vibrant', 'celebration', 'joy']
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    keywords: ['ride', 'car', 'speed', 'fast', 'racing', 'vehicle', 'motion']
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    keywords: ['meltdown', 'destruction', 'chaos', 'intense', 'explosive', 'dramatic']
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    keywords: ['dragon', 'fantasy', 'magical', 'medieval', 'creature', 'mystical', 'adventure']
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    keywords: ['car', 'vehicle', 'road', 'driving', 'outdoor', 'adventure', 'travel']
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    keywords: ['steel', 'metal', 'industrial', 'futuristic', 'technology', 'sci-fi']
  }
];

// Smart video selection based on prompt keywords
const selectVideoByPrompt = (prompt) => {
  const promptLower = prompt.toLowerCase();
  
  // Find the best matching video based on keywords
  let bestMatch = MOCK_VIDEOS[0]; // Default fallback
  let bestScore = 0;
  
  for (const video of MOCK_VIDEOS) {
    let score = 0;
    
    // Check how many keywords match the prompt
    for (const keyword of video.keywords) {
      if (promptLower.includes(keyword)) {
        score += 1;
      }
    }
    
    // Special scoring for common words
    if (promptLower.includes('dragon') || promptLower.includes('phoenix') || promptLower.includes('magical')) {
      if (video.keywords.includes('dragon') || video.keywords.includes('fantasy')) {
        score += 5;
      }
    }
    
    if (promptLower.includes('fire') || promptLower.includes('flame') || promptLower.includes('burning')) {
      if (video.keywords.includes('fire') || video.keywords.includes('blaze')) {
        score += 5;
      }
    }
    
    if (promptLower.includes('car') || promptLower.includes('drive') || promptLower.includes('road')) {
      if (video.keywords.includes('car') || video.keywords.includes('vehicle')) {
        score += 5;
      }
    }
    
    if (promptLower.includes('medical') || promptLower.includes('doctor') || promptLower.includes('health')) {
      if (video.keywords.includes('abstract') || video.keywords.includes('sci-fi')) {
        score += 3;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = video;
    }
  }
  
  // If no keywords match, select randomly to avoid always showing the same video
  if (bestScore === 0) {
    const randomIndex = Math.floor(Math.random() * MOCK_VIDEOS.length);
    bestMatch = MOCK_VIDEOS[randomIndex];
  }
  
  console.log(`🎯 Selected video for prompt "${prompt.substring(0, 50)}...": ${bestMatch.url.split('/').pop()} (score: ${bestScore})`);
  return bestMatch.url;
};

// Generate smart thumbnail based on prompt
const generateSmartThumbnail = (prompt) => {
  const colors = [
    '667eea', '764ba2', 'f093fb', 'f5576c', 
    '4facfe', '00f2fe', 'a8edea', 'fed6e3',
    'ffecd2', 'fcb69f', 'feca57', 'ff9ff3'
  ];
  
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const shortPrompt = prompt.substring(0, 30).replace(/[^a-zA-Z0-9\s]/g, '');
  
  return `https://via.placeholder.com/400x300/${randomColor}/ffffff?text=${encodeURIComponent(shortPrompt)}`;
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Video Studio Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    mock_videos: MOCK_VIDEOS.length
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'AI Video Studio Backend is running!',
    cors: 'configured',
    environment: process.env.NODE_ENV || 'development',
    available_mock_videos: MOCK_VIDEOS.length
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

// Generate new video - WITH SMART VIDEO SELECTION
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

    // Create video record with smart video selection
    const videoData = {
      title: prompt.trim().substring(0, 100),
      prompt: prompt.trim(),
      style: style,
      duration: parseInt(duration) || 10,
      status: 'generating',
      progress: 0,
      video_url: null,
      thumbnail_url: generateSmartThumbnail(prompt.trim()),
      runway_model: 'smart_mock',
      metadata: {
        generation_mode: 'SMART_MOCK',
        prompt_analysis: 'keyword_matching'
      }
    };

    console.log('💾 Saving video to Supabase...');

    // Save to Supabase
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

    // Smart video generation process
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

        // Complete with smart video selection
        setTimeout(async () => {
          try {
            console.log('🎯 Selecting appropriate video for prompt...');
            const selectedVideoUrl = selectVideoByPrompt(prompt.trim());
            
            console.log('✅ Completing video generation with selected video...', data.id);
            await supabase
              .from('videos')
              .update({ 
                status: 'completed',
                progress: 100,
                video_url: selectedVideoUrl
              })
              .eq('id', data.id);
            console.log('🎉 Video generation completed with URL:', selectedVideoUrl);
          } catch (error) {
            console.error('❌ Error completing video:', error);
          }
        }, 5000);
      } catch (error) {
        console.error('❌ Error updating video progress:', error);
      }
    }, 3000);

    // Return immediate response
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

// Get available mock videos (for testing)
app.get('/api/mock-videos', (req, res) => {
  res.json({
    total: MOCK_VIDEOS.length,
    videos: MOCK_VIDEOS.map(v => ({
      url: v.url,
      name: v.url.split('/').pop(),
      keywords: v.keywords
    }))
  });
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
  console.log(`🎯 Mock videos available: ${MOCK_VIDEOS.length}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

