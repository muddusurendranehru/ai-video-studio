import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ai-video-studio-z4eu.onrender.com/api'
  : 'http://localhost:5001/api';

const VideoGenerationApp = () => {
  // State management
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(10);
  const [videos, setVideos] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // API health check
  const checkBackendHealth = async () => {
    try {
      console.log('🔍 Checking backend health...');
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend health check successful:', data);
        setApiStatus('connected');
        setError(null);
        return true;
      } else {
        console.error('❌ Backend health check failed:', response.status);
        setApiStatus('disconnected');
        return false;
      }
    } catch (error) {
      console.error('❌ Backend health check error:', error);
      setApiStatus('disconnected');
      return false;
    }
  };

  // Fetch existing videos
  const fetchVideos = async () => {
    try {
      setIsLoadingVideos(true);
      console.log('📹 Fetching videos...');
      
      const response = await fetch(`${API_BASE_URL}/videos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Videos fetched successfully:', data.length, 'videos');
        setVideos(data);
        setError(null);
      } else {
        console.error('❌ Failed to fetch videos:', response.status);
        setError('Failed to load videos');
      }
    } catch (error) {
      console.error('❌ Video fetch error:', error);
      setError('Failed to connect to backend');
      setVideos([]);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Generate new video
  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a video prompt');
      return;
    }

    if (apiStatus !== 'connected') {
      setError('Backend not connected. Please wait...');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      console.log('🎬 Generating video with prompt:', prompt);

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration: duration,
          style: 'cinematic'
        }),
      });

      if (response.ok) {
        const newVideo = await response.json();
        console.log('✅ Video generation started:', newVideo);
        
        // Add new video to list immediately
        setVideos(prev => [newVideo, ...prev]);
        
        // Clear form
        setPrompt('');
        
        // Refresh videos after a short delay to get updates
        setTimeout(() => {
          fetchVideos();
        }, 2000);
        
      } else {
        const errorData = await response.json();
        console.error('❌ Video generation failed:', errorData);
        setError(errorData.error || 'Failed to generate video');
      }
    } catch (error) {
      console.error('❌ Video generation error:', error);
      setError('Failed to connect to backend');
    } finally {
      setIsGenerating(false);
    }
  };

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing AI Video Studio...');
      
      // First check backend health
      const isHealthy = await checkBackendHealth();
      
      if (isHealthy) {
        // If backend is healthy, fetch videos
        await fetchVideos();
      }
    };

    initializeApp();
  }, []);

  // Auto-refresh videos every 30 seconds if connected
  useEffect(() => {
    if (apiStatus === 'connected') {
      const interval = setInterval(() => {
        fetchVideos();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [apiStatus]);

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px'
      }}>
        <h1 style={{ margin: '0 0 10px 0' }}>🎬 AI Video Studio</h1>
        <div style={{ 
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <span>API Status:</span>
          <span style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: apiStatus === 'connected' ? '#4ade80' : 
                           apiStatus === 'disconnected' ? '#ef4444' : '#fbbf24',
            color: 'white'
          }}>
            {apiStatus === 'connected' ? '✅ Connected' : 
             apiStatus === 'disconnected' ? '❌ Disconnected' : '🔄 Checking...'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Generate Section */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ marginTop: '0', color: '#1e293b' }}>🎥 Generate New Video</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#374151'
          }}>
            Video Prompt:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            style={{
              width: '100%',
              height: '80px',
              padding: '12px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            disabled={isGenerating}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#374151'
          }}>
            Duration: {duration} seconds
          </label>
          <input
            type="range"
            min="5"
            max="30"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            style={{ width: '100%' }}
            disabled={isGenerating}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
            <span>5s</span>
            <span>15s</span>
            <span>30s</span>
          </div>
        </div>

        <button
          onClick={generateVideo}
          disabled={isGenerating || !prompt.trim() || apiStatus !== 'connected'}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isGenerating || !prompt.trim() || apiStatus !== 'connected' ? '#9ca3af' : '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isGenerating || !prompt.trim() || apiStatus !== 'connected' ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isGenerating ? '🎬 Generating Video...' : '▶️ Generate AI Video'}
        </button>
      </div>

      {/* Videos Section */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0', color: '#1e293b' }}>
            🎞️ Your Videos ({videos.length})
          </h2>
          <button
            onClick={fetchVideos}
            disabled={isLoadingVideos}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: isLoadingVideos ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoadingVideos ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {isLoadingVideos && videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <div>🔄 Loading videos...</div>
          </div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <div>📹 No videos yet. Generate your first video above!</div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '20px'
          }}>
            {videos.map((video) => (
              <div key={video.id} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: 'white'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
                      {video.prompt || video.title || 'Untitled Video'}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      Duration: {video.duration}s • 
                      Created: {new Date(video.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: 
                      video.status === 'completed' ? '#dcfce7' :
                      video.status === 'generating' ? '#fef3c7' :
                      video.status === 'processing' ? '#dbeafe' : '#fee2e2',
                    color:
                      video.status === 'completed' ? '#16a34a' :
                      video.status === 'generating' ? '#d97706' :
                      video.status === 'processing' ? '#2563eb' : '#dc2626'
                  }}>
                    {video.status === 'completed' ? '✅ Ready' :
                     video.status === 'generating' ? '🎬 Generating' :
                     video.status === 'processing' ? '⚙️ Processing' : '❌ Failed'}
                  </div>
                </div>

                {video.status === 'completed' && video.video_url && (
                  <div style={{ marginTop: '16px' }}>
                    <video
                      controls
                      style={{ 
                        width: '100%', 
                        maxHeight: '300px',
                        borderRadius: '8px'
                      }}
                      poster={video.thumbnail_url}
                    >
                      <source src={video.video_url} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>
                    <div style={{ 
                      marginTop: '12px',
                      display: 'flex',
                      gap: '12px'
                    }}>
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        👁️ Watch
                      </a>
                      <a
                        href={video.video_url}
                        download={`video-${video.id}.mp4`}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        📥 Download
                      </a>
                    </div>
                  </div>
                )}

                {video.status === 'generating' && (
                  <div style={{ 
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #0ea5e9'
                  }}>
                    <div style={{ fontSize: '14px', color: '#0369a1', marginBottom: '8px' }}>
                      🎬 Generating your video...
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#e0f2fe',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${video.progress || 25}%`,
                        height: '100%',
                        backgroundColor: '#0ea5e9',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerationApp;
