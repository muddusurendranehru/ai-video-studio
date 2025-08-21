const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Environment variables validation
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get base URL for proper thumbnail generation
const getBaseUrl = () => {
  return process.env.RENDER_EXTERNAL_URL || 
         process.env.BASE_URL || 
         `http://localhost:${PORT}`;
};

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://ai-video-studio-frontend.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for thumbnails
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

// Utility functions
const generateVideoId = () => {
  return 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const generateThumbnailUrl = (videoId) => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/thumbnails/${videoId}.jpg`;
};

const createPlaceholderThumbnail = (videoId, title) => {
  // Create thumbnails directory if it doesn't exist
  const thumbnailsDir = path.join(__dirname, 'thumbnails');
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  // For now, we'll use a placeholder. In production, you'd generate actual thumbnails
  const placeholderPath = path.join(thumbnailsDir, `${videoId}.jpg`);
  
  // Create a simple text file as placeholder (you'd use image generation library in production)
  const placeholderData = `Thumbnail for: ${title}`;
  fs.writeFileSync(placeholderPath, placeholderData);
  
  return generateThumbnailUrl(videoId);
};

const formatPromptForAI = (userPrompt, duration = 60) => {
  return {
    prompt: `Create a ${duration}-second professional medical education video about: ${userPrompt}. 
    Requirements:
    - Professional medical education content
    - Clear, authoritative narration
    - Medical accuracy essential
    - Target audience: Healthcare professionals and patients
    - Educational and informative tone
    - Avoid: Commercial advertisements, unrelated company content, promotional material
    
    Topic: ${userPrompt}`,
    duration: duration,
    style: "medical-educational",
    category: "healthcare",
    avoid_commercial: true
  };
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    baseUrl: getBaseUrl(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch videos', details: error.message });
    }

    // Ensure thumbnail URLs are properly formatted
    const videosWithValidUrls = data.map(video => ({
      ...video,
      thumbnail_url: video.thumbnail_url?.startsWith('http') 
        ? video.thumbnail_url 
        : generateThumbnailUrl(video.id)
    }));

    res.json(videosWithValidUrls);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate video
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, duration = 60 } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const videoId = generateVideoId();
    const thumbnailUrl = createPlaceholderThumbnail(videoId, prompt);
    
    // Format prompt for AI API
    const formattedPrompt = formatPromptForAI(prompt, duration);
    
    console.log('Generating video with prompt:', formattedPrompt);

    // Simulate AI video generation (replace with actual AI API call)
    const simulateVideoGeneration = async () => {
      // In production, replace this with actual AI API calls:
      // - Runway ML API
      // - Luma AI API
      // - Pika Labs API
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      // Mock response - replace with actual AI API response
      return {
        video_url: `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`,
        thumbnail_url: thumbnailUrl,
        duration: duration,
        status: 'completed'
      };
    };

    // Generate video (mock for now)
    const aiResponse = await simulateVideoGeneration();

    // Save to database
    const videoData = {
      id: videoId,
      title: prompt.substring(0, 100), // Truncate if too long
      description: `Educational medical video: ${prompt}`,
      video_url: aiResponse.video_url,
      thumbnail_url: thumbnailUrl,
      duration: duration,
      status: 'completed',
      prompt: prompt,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('videos')
      .insert([videoData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save video', details: error.message });
    }

    console.log('Video generated successfully:', videoId);
    res.status(201).json(data);

  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ 
      error: 'Failed to generate video', 
      details: error.message 
    });
  }
});

// Get video by ID
app.get('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Ensure thumbnail URL is properly formatted
    const videoWithValidUrl = {
      ...data,
      thumbnail_url: data.thumbnail_url?.startsWith('http') 
        ? data.thumbnail_url 
        : generateThumbnailUrl(data.id)
    };

    res.json(videoWithValidUrl);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update video
app.put('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove id from updates to prevent overwriting
    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update video', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating video:', error);
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
      return res.status(500).json({ error: 'Failed to delete video', details: error.message });
    }

    // Clean up thumbnail file
    const thumbnailPath = path.join(__dirname, 'thumbnails', `${id}.jpg`);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve thumbnail files
app.get('/api/thumbnails/:videoId', (req, res) => {
  const { videoId } = req.params;
  const thumbnailPath = path.join(__dirname, 'thumbnails', `${videoId}.jpg`);

  if (fs.existsSync(thumbnailPath)) {
    res.sendFile(thumbnailPath);
  } else {
    // Return a default placeholder image
    res.status(404).json({ error: 'Thumbnail not found' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Video Studio Backend running on port ${PORT}`);
  console.log(`📍 Base URL: ${getBaseUrl()}`);
  console.log(`🏥 Medical Education Platform Ready`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;

