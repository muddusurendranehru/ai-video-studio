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
  limits: { fileSize: 50 * 1024 * 1024 },
});

// In-memory storage
let videos = [];
let videoIdCounter = 1;

// Mock video URLs
const mockVideoUrls = [
  'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Video Studio Backend API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      videos: '/api/videos',
      generate: '/api/generate/runway or /api/generate/luma'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'mock'
  });
});

// Get all videos
app.get('/api/videos', (req, res) => {
  res.json(videos);
});

// Generate video (mock)
app.post('/api/generate/:provider', async (req, res) => {
  try {
    const { prompt, duration = 4, aspectRatio = '16:9' } = req.body;
    const { provider } = req.params;

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
      provider,
      duration,
      aspectRatio
    };

    videos.push(video);
    res.json({ videoId, message: 'Video generation started (Mock Mode)' });

    // Start mock generation
    generateMockVideo(videoId);

  } catch (error) {
    res.status(500).json({ error: 'Failed to start video generation' });
  }
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

// Mock generation function
async function generateMockVideo(videoId) {
  const video = videos.find(v => v.id === videoId);
  if (!video) return;

  // Simulate progress
  for (let progress = 10; progress <= 90; progress += 20) {
    await delay(3000);
    video.progress = progress;
  }

  // Complete
  await delay(2000);
  video.status = 'completed';
  video.progress = 100;
  video.videoUrl = mockVideoUrls[Math.floor(Math.random() * mockVideoUrls.length)];
  video.completedAt = new Date().toISOString();
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
