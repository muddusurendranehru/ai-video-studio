import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const App = () => {
  const [videos, setVideos] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [provider, setProvider] = useState('runway');
  const [duration, setDuration] = useState(4);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [error, setError] = useState('');

  // Check backend health
  const checkBackendHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setBackendHealthy(true);
      setError('');
      return data;
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendHealthy(false);
      setError(`Backend connection failed: ${error.message}`);
      throw error;
    }
  }, []);

  // Fetch videos from backend
  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/videos`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      if (backendHealthy) {
        setError(`Failed to fetch videos: ${error.message}`);
      }
    }
  }, [backendHealthy]);

  // Upload image
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Generate video
  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!backendHealthy) {
      setError('Backend is not available');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      let imageUrl = '';
      
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const requestData = {
        prompt: prompt.trim(),
        imageUrl,
        aspectRatio,
      };

      if (provider === 'runway') {
        requestData.duration = duration;
      }

      const response = await fetch(`${API_BASE_URL}/generate/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Video generation started:', data);
      
      setPrompt('');
      setSelectedImage(null);
      setImagePreview('');
      
      fetchVideos();
    } catch (error) {
      console.error('Generation error:', error);
      setError(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Image file too large (max 50MB)');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  // Delete video
  const deleteVideo = async (videoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      fetchVideos();
    } catch (error) {
      console.error('Delete error:', error);
      setError(`Failed to delete video: ${error.message}`);
    }
  };

  const formatDuration = (seconds) => `${seconds}s`;
  const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleString();
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'generating': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    checkBackendHealth();
    fetchVideos();

    const interval = setInterval(() => {
      if (backendHealthy) {
        fetchVideos();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkBackendHealth, fetchVideos, backendHealthy]);

  return (
    <div className="video-generation-app">
      <header className="app-header">
        <h1>🎬 AI Video Studio</h1>
        <div className="status-indicator">
          <div 
            className={`status-dot ${backendHealthy ? 'healthy' : 'unhealthy'}`}
            title={backendHealthy ? 'Backend connected' : 'Backend disconnected'}
          />
          <span>{backendHealthy ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="main-content">
        <div className="generation-panel">
          <h2>Generate New Video</h2>
          
          <div className="form-group">
            <label>AI Provider:</label>
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value)}
              disabled={isGenerating}
            >
              <option value="runway">Runway ML</option>
              <option value="luma">Luma AI</option>
            </select>
          </div>

          <div className="form-group">
            <label>Text Prompt:</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to generate..."
              disabled={isGenerating}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Reference Image (optional):</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              disabled={isGenerating}
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button 
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview('');
                  }}
                  disabled={isGenerating}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="form-row">
            {provider === 'runway' && (
              <div className="form-group">
                <label>Duration:</label>
                <select 
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={isGenerating}
                >
                  <option value={4}>4 seconds</option>
                  <option value={8}>8 seconds</option>
                  <option value={16}>16 seconds</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Aspect Ratio:</label>
              <select 
                value={aspectRatio} 
                onChange={(e) => setAspectRatio(e.target.value)}
                disabled={isGenerating}
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateVideo}
            disabled={isGenerating || !backendHealthy || !prompt.trim()}
            className="generate-button"
          >
            {isGenerating ? 'Generating...' : 'Generate Video'}
          </button>
        </div>

        <div className="videos-panel">
          <div className="panel-header">
            <h2>Generated Videos ({videos.length})</h2>
            <button onClick={fetchVideos} disabled={!backendHealthy}>
              🔄 Refresh
            </button>
          </div>

          {videos.length === 0 ? (
            <div className="empty-state">
              <p>No videos generated yet. Create your first video!</p>
            </div>
          ) : (
            <div className="videos-grid">
              {videos.map((video) => (
                <div key={video.id} className="video-card">
                  <div className="video-header">
                    <span className="video-id">{video.id}</span>
                    <div 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(video.status) }}
                    >
                      {video.status}
                    </div>
                  </div>

                  <div className="video-content">
                    {video.videoUrl ? (
                      <video controls className="video-player">
                        <source src={video.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="video-placeholder">
                        <div className="placeholder-content">
                          {video.status === 'generating' && (
                            <>
                              <div className="spinner"></div>
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${video.progress || 0}%` }}
                                ></div>
                              </div>
                              <p>{video.progress || 0}% complete</p>
                            </>
                          )}
                          {video.status === 'failed' && (
                            <>
                              <span className="error-icon">❌</span>
                              <p>Generation failed</p>
                              {video.error && <small>{video.error}</small>}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="video-details">
                    <p className="prompt">{video.prompt}</p>
                    <div className="video-meta">
                      <span>Provider: {video.provider}</span>
                      {video.duration && <span>Duration: {formatDuration(video.duration)}</span>}
                      <span>Ratio: {video.aspectRatio}</span>
                    </div>
                    <div className="video-timestamps">
                      <small>Created: {formatTimestamp(video.createdAt)}</small>
                      {video.completedAt && (
                        <small>Completed: {formatTimestamp(video.completedAt)}</small>
                      )}
                    </div>
                  </div>

                  <div className="video-actions">
                    {video.videoUrl && (
                      <a 
                        href={video.videoUrl} 
                        download 
                        className="download-button"
                      >
                        📥 Download
                      </a>
                    )}
                    <button 
                      onClick={() => deleteVideo(video.id)}
                      className="delete-button"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
