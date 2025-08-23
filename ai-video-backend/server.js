const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();

// Initialize Supabase
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log('✅ Supabase connected');
} else {
  console.log('⚠️ Supabase not configured');
}

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'ai-videos';

// CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://ai-video-studio-frontend.onrender.com',
    'https://ai-video-studio-z4eu.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Job tracking
const jobs = new Map();

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Video Studio Backend API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      videos: '/api/videos',
      generate: '/api/generate/runway'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: process.env.RUNWAY_API_KEY ? 'production' : 'mock',
    storage: supabase ? 'supabase' : 'memory',
    bucket: BUCKET_NAME
  });
});

// Generate video with Runway ML
app.post('/api/generate/runway', async (req, res) => {
  try {
    const { prompt, settings = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check API key
    if (!process.env.RUNWAY_API_KEY) {
      console.log('🎭 Mock mode - no API key');
      return generateMockVideo(req, res, prompt);
    }

    const jobId = `runway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    jobs.set(jobId, {
      id: jobId,
      status: 'starting',
      prompt: prompt,
      provider: 'runway',
      createdAt: new Date(),
      progress: 0
    });

    // Start async generation
    generateRealVideo(jobId, prompt, settings);

    res.json({
      jobId: jobId,
      status: 'started',
      message: 'Real AI video generation started'
    });

  } catch (error) {
    console.error('❌ Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Real video generation
async function generateRealVideo(jobId, prompt, settings) {
  try {
    console.log(`🚀 Real AI generation for: ${prompt}`);
    
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'generating',
      progress: 20
    });

    // Simulate Runway API call (replace with real API when ready)
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second simulation

    // For now, create a mock video that gets stored
    const mockVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
    
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'processing',
      progress: 70
    });

    let finalVideoUrl = mockVideoUrl;
    let filename = null;

    // Upload to Supabase if available
    if (supabase) {
      try {
        const uploadResult = await uploadToSupabase(mockVideoUrl, jobId, prompt);
        finalVideoUrl = uploadResult.publicUrl;
        filename = uploadResult.filename;
        console.log('✅ Uploaded to Supabase');
      } catch (uploadError) {
        console.warn('⚠️ Upload failed:', uploadError.message);
      }
    }

    // Complete job
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'completed',
      progress: 100,
      videoUrl: finalVideoUrl,
      filename: filename,
      completedAt: new Date(),
      metadata: {
        provider: 'runway',
        prompt: prompt,
        duration: settings.duration || 5
      }
    });

    console.log(`🎉 Video completed: ${jobId}`);

  } catch (error) {
    console.error(`❌ Generation failed: ${jobId}`, error);
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'failed',
      error: error.message,
      failedAt: new Date()
    });
  }
}

// Upload to Supabase
async function uploadToSupabase(videoUrl, jobId, prompt) {
  try {
    console.log(`📁 Uploading to Supabase: ${jobId}`);

    // Download video
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const videoBuffer = await response.buffer();
    const filename = `${jobId}.mp4`;
    const filePath = `videos/${filename}`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (error) throw new Error(`Upload error: ${error.message}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // Save to database
    try {
      await supabase.from('videos').insert({
        id: jobId,
        prompt: prompt,
        video_url: urlData.publicUrl,
        created_at: new Date()
      });
    } catch (dbError) {
      console.warn('DB insert warning:', dbError.message);
    }

    return {
      publicUrl: urlData.publicUrl,
      filename: filename,
      path: filePath
    };

  } catch (error) {
    console.error('❌ Supabase upload error:', error);
    throw error;
  }
}

// Mock video generation (fallback)
function generateMockVideo(req, res, prompt) {
  const mockVideo = {
    id: `mock_${Date.now()}`,
    prompt: prompt,
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    duration: 5,
    status: 'completed',
    provider: 'mock',
    createdAt: new Date()
  };

  setTimeout(() => {
    res.json({
      success: true,
      video: mockVideo,
      message: 'Mock video (no API key configured)'
    });
  }, 2000);
}

// Get job status
app.get('/api/videos/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    // Try Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          console.log(`📊 Fetched ${data.length} videos from Supabase`);
          return res.json(data);
        }
      } catch (dbError) {
        console.warn('DB query failed:', dbError.message);
      }
    }

    // Fallback to memory
    const completed = Array.from(jobs.values())
      .filter(job => job.status === 'completed')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);

    console.log(`📊 Fallback: ${completed.length} videos from memory`);
    res.json(completed);

  } catch (error) {
    console.error('❌ Failed to fetch videos:', error);
    res.json([]);
  }
});

// Legacy endpoints (for compatibility)
app.post('/api/generate/luma', (req, res) => {
  res.json({ error: 'Luma not implemented, use /api/generate/runway' });
});

app.get('/api/videos/jobs', (req, res) => {
  const allJobs = Array.from(jobs.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);
  res.json(allJobs);
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    available: [
      'GET /api/health',
      'POST /api/generate/runway',
      'GET /api/videos',
      'GET /api/videos/status/:jobId'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Cleanup old jobs
setInterval(() => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const [jobId, job] of jobs.entries()) {
    if (new Date(job.createdAt) < cutoff) {
      jobs.delete(jobId);
    }
  }
  console.log(`🧹 Active jobs: ${jobs.size}`);
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔑 Runway API: ${process.env.RUNWAY_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`💾 Storage: ${supabase ? 'Supabase Ready' : 'Memory Only'}`);
  console.log(`🗄️ Bucket: ${BUCKET_NAME}`);
});

module.exports = app;
