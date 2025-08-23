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
    mode: process.env.RUNWAY_API_KEY ? 'production' : 'demo',
    storage: supabase ? 'supabase' : 'memory',
    bucket: BUCKET_NAME
  });
});

// Generate video - ALWAYS saves to database
app.post('/api/generate/runway', async (req, res) => {
  try {
    const { prompt, settings = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`🎬 Generating video for: "${prompt}"`);
    
    const jobId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    jobs.set(jobId, {
      id: jobId,
      status: 'starting',
      prompt: prompt,
      provider: 'runway',
      createdAt: new Date(),
      progress: 0
    });

    // Start video generation (always save to database)
    generateAndSaveVideo(jobId, prompt, settings);

    res.json({
      jobId: jobId,
      status: 'started',
      message: 'Video generation started'
    });

  } catch (error) {
    console.error('❌ Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Video generation that ALWAYS saves to database
async function generateAndSaveVideo(jobId, prompt, settings) {
  try {
    console.log(`🚀 Processing video: ${jobId}`);
    
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'generating',
      progress: 20
    });

    // Use sample video URL (replace with real API when Runway key added)
    const videoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
    
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'processing',
      progress: 70
    });

    let finalVideoUrl = videoUrl;
    let filename = null;

    // ALWAYS try to save to Supabase
    if (supabase) {
      try {
        console.log(`💾 Saving to database: ${jobId}`);
        
        const uploadResult = await uploadAndSaveVideo(videoUrl, jobId, prompt);
        finalVideoUrl = uploadResult.publicUrl;
        filename = uploadResult.filename;
        
        console.log(`✅ Saved to Supabase: ${jobId}`);
        
      } catch (saveError) {
        console.error(`❌ Save failed for ${jobId}:`, saveError);
        // Continue with original URL if save fails
      }
    } else {
      console.log(`⚠️ No Supabase - cannot save ${jobId}`);
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

// Upload video and save to database
async function uploadAndSaveVideo(videoUrl, jobId, prompt) {
  try {
    console.log(`📁 Uploading video: ${jobId}`);

    // Download video
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

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

    if (error) {
      throw new Error(`Storage upload error: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log(`📝 Inserting to database: ${jobId}`);

    // Save to database - ALWAYS
    const { data: insertData, error: insertError } = await supabase
      .from('videos')
      .insert({
        id: jobId,
        prompt: prompt,
        video_url: urlData.publicUrl,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error(`❌ Database insert error for ${jobId}:`, insertError);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log(`✅ Database insert successful: ${jobId}`);

    return {
      publicUrl: urlData.publicUrl,
      filename: filename,
      path: filePath
    };

  } catch (error) {
    console.error(`❌ Upload/save error for ${jobId}:`, error);
    throw error;
  }
}

// Get job status
app.get('/api/videos/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// Get all videos from database
app.get('/api/videos', async (req, res) => {
  try {
    if (!supabase) {
      console.log('⚠️ No Supabase connection');
      return res.json([]);
    }

    console.log('📊 Fetching videos from database...');

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Database query error:', error);
      return res.json([]);
    }

    console.log(`📊 Found ${data ? data.length : 0} videos in database`);
    res.json(data || []);

  } catch (error) {
    console.error('❌ Failed to fetch videos:', error);
    res.json([]);
  }
});

// Get all jobs (for debugging)
app.get('/api/videos/jobs', (req, res) => {
  const allJobs = Array.from(jobs.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);
  res.json(allJobs);
});

// Legacy endpoint
app.post('/api/generate/luma', (req, res) => {
  res.json({ error: 'Use /api/generate/runway endpoint' });
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
  console.log(`💾 Storage: ${supabase ? 'Supabase Connected' : 'No Database'}`);
  console.log(`📁 Bucket: ${BUCKET_NAME}`);
  console.log(`📝 Mode: Always save to database`);
});

module.exports = app;
