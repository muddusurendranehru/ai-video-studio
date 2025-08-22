const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// In-memory storage for demo
let videos = [];
let videoIdCounter = 1;

// Mock video URLs for testing
const mockVideoUrls = [
  'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
];

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    runwayConfigured: false,
    lumaConfigured: false,
    mode: 'mock'
  });
});

// Get all videos
app.get('/api/videos', (req, res) => {
  try {
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Generate video with Runway ML (Mock)
app.post('/api/generate/runway', async (req, res) => {
  try {
    const { prompt, imageUrl, duration = 4, aspectRatio = '16:9' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const videoId = `video_${videoIdCounter++}`;
    
    // Create video entry
    const video = {
      id: videoId,
      prompt,
      status: 'generating',
      progress: 0,
      createdAt: new Date().toISOString(),
      provider: 'runway',
      duration,
      aspectRatio
    };

    videos.push(video);
    res.json({ videoId, message: 'Video generation started (Mock Mode)' });

    // Start mock generation process
    generateMockVideo(videoId);

  } catch (error) {
    console.error('Error starting video generation:', error);
    res.status(500).json({ error: 'Failed to start video generation' });
  }
});

// Generate video with Luma AI (Mock)
app.post('/api/generate/luma', async (req, res) => {
  try {
    const { prompt, imageUrl, aspectRatio = '16:9' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const videoId = `video_${videoIdCounter++}`;
    
    const video = {
      id: videoId,
      prompt,
      status: 'generating',
      progress: 0,
      createdAt: new Date().toISOString(),
      provider: 'luma',
      aspectRatio
    };

    videos.push(video);
    res.json({ videoId, message: 'Video generation started (Mock Mode)' });

    // Start mock generation process
    generateMockVideo(videoId);

  } catch (error) {
    console.error('Error starting video generation:', error);
    res.status(500).json({ error: 'Failed to start video generation' });
  }
});

// Get specific video
app.get('/api/videos/:id', (req, res) => {
  const video = videos.find(v => v.id === req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  res.json(video);
});

// Delete video
app.delete('/api/videos/:id', (req, res) => {
  const index = videos.findIndex(v => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Video not found' });
  }
  videos.splice(index, 1);
  res.json({ message: 'Video deleted' });
});

// Upload image endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Mock video generation function
async function generateMockVideo(videoId) {
  try {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    console.log(`Starting mock generation for video ${videoId}`);

    // Simulate generation progress
    for (let progress = 10; progress <= 90; progress += 10) {
      await delay(2000); // Wait 2 seconds between updates
      video.progress = progress;
      console.log(`Video ${videoId} progress: ${progress}%`);
    }

    // Complete the generation
    await delay(3000); // Final wait
    
    video.status = 'completed';
    video.progress = 100;
    video.videoUrl = mockVideoUrls[Math.floor(Math.random() * mockVideoUrls.length)];
    video.completedAt = new Date().toISOString();
    
    console.log(`Video ${videoId} completed successfully (Mock)`);

  } catch (error) {
    console.error(`Error generating mock video ${videoId}:`, error);
    const video = videos.find(v => v.id === videoId);
    if (video) {
      video.status = 'failed';
      video.error = error.message;
    }
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎬 Mode: Mock video generation (no API keys required)`);
});

module.exports = app;
