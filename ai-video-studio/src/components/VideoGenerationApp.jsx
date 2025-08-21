// Update your VideoGenerationApp.jsx to use environment-based API URL

import React, { useState, useEffect } from 'react';

// Production-ready API URL configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
 ?'https://ai-video-studio-backend.onrender.com/api'
  : 'http://localhost:5001/api';

const VideoGenerationApp = () => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(10);
  const [videos, setVideos] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [error, setError] = useState(null);

  // Check backend health on component mount
  useEffect(() => {
    checkBackendHealth();
    fetchVideos();
    
    // Auto-refresh videos every 30 seconds in production
    const interval = setInterval(fetchVideos, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkBackendHealth = async () => {
    try {
      console.log('🔍 Checking backend health:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBackendStatus(data.status === 'ok' ? 'connected' : 'error');
      setError(null);
      console.log('✅ Backend health check passed:', data);
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      setBackendStatus('error');
      setError(`Backend connection failed: ${error.message}`);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/videos`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Don't set error state for fetch failures in production
      if (process.env.NODE_ENV === 'development') {
        setError(`Failed to fetch videos: ${error.message}`);
      }
    }
  };

  // Real-time status polling for video generation
  const pollVideoStatus = async (videoId) => {
    const maxPolls = 60; // 5 minutes max
    let pollCount = 0;
    
    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/videos/${videoId}/status`);
        if (!response.ok) {
          if (response.status === 404) {
            console.log(`Video ${videoId} not found, stopping poll`);
            return;
          }
          throw new Error(`Status check failed: ${response.status}`);
        }
        
        const statusData = await response.json();
        console.log(`📊 Video ${videoId} status:`, statusData.status);
        
        // Update video in state
        setVideos(prev => 
          prev.map(video => 
            video.id === videoId 
              ? { 
                  ...video, 
                  status: statusData.status,
                  video_url: statusData.video_url || video.video_url,
                  thumbnail_url: statusData.thumbnail_url || video.thumbnail_url,
                  runway_task_id: statusData.runway_task_id || video.runway_task_id
                }
              : video
          )
        );
        
        // Continue polling if still processing
        if (statusData.status === 'processing' && pollCount < maxPolls) {
          pollCount++;
          setTimeout(poll, 5000); // Check every 5 seconds
        } else if (statusData.status === 'completed') {
          console.log(`🎉 Video ${videoId} completed!`);
          // Refresh video list to ensure we have latest data
          setTimeout(fetchVideos, 1000);
        } else if (statusData.status === 'failed') {
          console.log(`❌ Video ${videoId} generation failed`);
        }
        
      } catch (error) {
        console.error('Error polling video status:', error);
        if (pollCount < maxPolls) {
          pollCount++;
          setTimeout(poll, 10000); // Retry in 10 seconds
        }
      }
    };
    
    // Start polling after 2 seconds
    setTimeout(poll, 2000);
  };

  // REAL video generation function
  const generateVideo = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('🎬 Starting video generation...');
      
      const response = await fetch(`${API_BASE_URL}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration: duration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const newVideo = await response.json();
      setVideos(prev => [newVideo, ...prev]);
      setPrompt('');
      
      console.log('✅ Video creation started:', newVideo.id);
      
      // Start real-time status checking for this video
      pollVideoStatus(newVideo.id);
      
    } catch (error) {
      console.error('Error generating video:', error);
      setError(`Failed to generate video: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle watch video button click
  const handleWatchVideo = (video) => {
    if (video.video_url) {
      // Open video in new tab
      window.open(video.video_url, '_blank');
    } else {
      alert(`🎬 "${video.title}"\n\nVideo URL not available yet.\nStatus: ${video.status}\n\n${video.status === 'processing' ? 'Generation in progress...' : 'Please wait for generation to complete.'}`);
    }
  };

  // Handle download video button click
  const handleDownloadVideo = (video) => {
    if (video.video_url) {
      // Create download link
      const link = document.createElement('a');
      link.href = video.video_url;
      link.download = `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`📥 "${video.title}"\n\nVideo not ready for download.\nStatus: ${video.status}\n\n${video.status === 'processing' ? 'AI is generating your video...' : 'Please wait for generation to complete.'}`);
    }
  };

  // Get enhanced status display
  const getStatusDisplay = (video) => {
    switch (video.status) {
      case 'pending':
        return { icon: '🕐', text: 'Pending', color: '#eab308' };
      case 'processing':
        return { 
          icon: '🎬', 
          text: 'Generating with AI...', 
          color: '#3b82f6' 
        };
      case 'completed':
        return { icon: '✅', text: 'Ready to Watch', color: '#22c55e' };
      case 'failed':
        return { icon: '❌', text: 'Generation Failed', color: '#ef4444' };
      default:
        return { icon: '❓', text: video.status, color: '#6b7280' };
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'rgba(0,0,0,0.2)', 
        padding: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(45deg, #9333ea, #ec4899)', 
              padding: '0.5rem', 
              borderRadius: '8px',
              fontSize: '1.5rem'
            }}>
              🎬
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>AI Video Studio</h1>
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8 }}>
                {process.env.NODE_ENV === 'production' ? 'Production Ready' : 'Development Mode'}
              </p>
            </div>
          </div>
          
          {/* Backend Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              background: backendStatus === 'connected' ? '#22c55e' : 
                         backendStatus === 'error' ? '#ef4444' : '#eab308'
            }}></div>
            <span style={{ fontSize: '0.875rem' }}>
              API: {backendStatus === 'connected' ? 'Connected' : 
                   backendStatus === 'error' ? 'Disconnected' : 'Checking...'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          margin: '1rem auto',
          maxWidth: '1200px',
          color: '#fecaca'
        }}>
          <strong>⚠️ Connection Issue:</strong> {error}
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Video Generation Form */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '16px', 
          padding: '2rem', 
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Generate New Video</h2>
          </div>
          
          <form onSubmit={generateVideo} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.75rem', opacity: 0.9 }}>
                Video Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to generate with AI... (e.g., 'A serene lake at sunset with gentle ripples reflecting the golden sky')"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  resize: 'none',
                  outline: 'none'
                }}
                rows="3"
                disabled={isGenerating}
                required
                minLength={3}
                maxLength={500}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.75rem', opacity: 0.9 }}>
                Duration: {duration} seconds
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}
                disabled={isGenerating}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                <span>5s</span>
                <span>15s</span>
                <span>30s</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim() || backendStatus !== 'connected'}
              style={{
                width: '100%',
                background: isGenerating || !prompt.trim() || backendStatus !== 'connected' 
                  ? 'rgba(107, 114, 128, 0.8)' 
                  : 'linear-gradient(45deg, #9333ea, #ec4899)',
                color: 'white',
                fontWeight: '600',
                padding: '1rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: isGenerating || !prompt.trim() || backendStatus !== 'connected' ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isGenerating ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>🎬</span>
                  <span>Generating AI Video...</span>
                </>
              ) : (
                <>
                  <span>▶️</span>
                  <span>Generate AI Video</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Videos List */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '16px', 
          padding: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎬</span>
            <span>Your AI Videos ({videos.length})</span>
          </h3>

          {videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ 
                background: 'rgba(147, 51, 234, 0.2)', 
                borderRadius: '50%', 
                width: '64px', 
                height: '64px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem',
                fontSize: '2rem'
              }}>
                🎬
              </div>
              <p style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>No AI videos generated yet</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: 0 }}>Create your first AI-generated video above!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {videos.map((video) => {
                const statusDisplay = getStatusDisplay(video);
                return (
                  <div key={video.id} style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    padding: '1.5rem',
                    transition: 'background 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem', 
                        fontWeight: '500',
                        background: `${statusDisplay.color}20`,
                        color: statusDisplay.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span>{statusDisplay.icon}</span>
                        <span>{statusDisplay.text}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                      {video.prompt}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.7, marginBottom: '1rem' }}>
                      <span>Duration: {video.duration}s</span>
                      <span>AI Model: Smart Mock</span>
                    </div>

                    {video.status === 'completed' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleWatchVideo(video)}
                          style={{ 
                            flex: 1, 
                            background: '#22c55e', 
                            color: 'white', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '6px', 
                            border: 'none', 
                            fontSize: '0.875rem', 
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <span>▶️</span>
                          <span>Watch</span>
                        </button>
                        <button 
                          onClick={() => handleDownloadVideo(video)}
                          style={{ 
                            flex: 1, 
                            background: '#3b82f6', 
                            color: 'white', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '6px', 
                            border: 'none', 
                            fontSize: '0.875rem', 
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <span>⬇️</span>
                          <span>Download</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationApp;
