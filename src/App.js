import React, { useState, useEffect } from 'react';
import './App.css';

// ✅ FIXED: Using deployed backend URL directly
const API_BASE_URL = 'https://ai-video-studio-z4eu.onrender.com';

function App() {
  const [prompt, setPrompt] = useState('');
  const [videos, setVideos] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking...');

  // Check backend health
  const checkBackendHealth = async () => {
    try {
      console.log('🔍 Checking backend health...');
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const healthData = await response.json();
      console.log('✅ Backend health:', healthData);
      setBackendStatus('connected ✅');
      return healthData;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      setBackendStatus('disconnected ❌');
      throw error;
    }
  };

  // Fetch videos
  const fetchVideos = async () => {
    try {
      console.log('📹 Fetching videos...');
      const response = await fetch(`${API_BASE_URL}/api/videos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const videosData = await response.json();
      setVideos(videosData);
      console.log('✅ Videos fetched successfully:', videosData.length, 'videos');
    } catch (error) {
      console.error('❌ Failed to fetch videos:', error);
      setVideos([]);
    }
  };

  // Generate video
  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a video prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🎬 Generating video with prompt:', prompt);
      
      // ✅ FIXED: Using correct endpoint /api/generate/runway
      const response = await fetch(`${API_BASE_URL}/api/generate/runway`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: prompt,
          settings: {
            duration: 5,
            aspectRatio: '16:9'
          }
        })
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Video generation response:', result);
      
      setSuccess('Video generated successfully!');
      setPrompt(''); // Clear prompt
      
      // Refresh videos list
      await fetchVideos();

    } catch (error) {
      console.error('❌ Video generation error:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkBackendHealth();
        await fetchVideos();
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    };
    
    initializeApp();
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateVideo();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎬 AI Video Studio</h1>
        <p>Backend Status: {backendStatus}</p>
        <p>API URL: {API_BASE_URL}</p>
      </header>

      <main className="main-content">
        {/* Video Generation Form */}
        <section className="generation-section">
          <h2>Generate New Video</h2>
          
          <div className="input-group">
            <label htmlFor="prompt">Video Prompt:</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the video you want to generate..."
              rows={3}
              disabled={isGenerating}
            />
          </div>

          <button
            onClick={generateVideo}
            disabled={isGenerating || !prompt.trim()}
            className={`generate-btn ${
              isGenerating || !prompt.trim() ? 'disabled' : ''
            }`}
          >
            {isGenerating ? 'Generating Video...' : 'Generate Video'}
          </button>

          {/* Status Messages */}
          {error && (
            <div className="message error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className="message success">
              <strong>Success:</strong> {success}
            </div>
          )}
        </section>

        {/* Videos List */}
        <section className="videos-section">
          <h2>Generated Videos ({videos.length})</h2>
          
          {videos.length === 0 ? (
            <p className="no-videos">
              No videos generated yet. Create your first video above!
            </p>
          ) : (
            <div className="videos-grid">
              {videos.map((video, index) => (
                <div key={video.id || index} className="video-card">
                  {video.videoUrl && (
                    <video
                      src={video.videoUrl}
                      controls
                      className="video-player"
                      poster={video.thumbnailUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                  
                  <div className="video-info">
                    <p><strong>Prompt:</strong> {video.prompt || 'No prompt available'}</p>
                    {video.createdAt && (
                      <p className="timestamp">
                        Created: {new Date(video.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
