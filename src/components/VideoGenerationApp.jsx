import React, { useState, useEffect } from 'react';

const VideoGenerationApp = () => {
  const [prompt, setPrompt] = useState('');
  const [videos, setVideos] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_BASE_URL = 'https://ai-video-studio-z4eu.onrender.com';

  // Fetch videos on component mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      console.log('📹 Fetching videos...');
      const response = await fetch(`${API_BASE_URL}/api/videos`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const videosData = await response.json();
      setVideos(videosData);
      console.log('✅ Videos fetched successfully:', videosData.length, 'videos');
    } catch (error) {
      console.error('❌ Error fetching videos:', error);
      setVideos([]);
    }
  };

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateVideo();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🎬 AI Video Studio
        </h1>

        {/* Video Generation Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Generate New Video</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe the video you want to generate..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={isGenerating}
              />
            </div>

            <button
              onClick={generateVideo}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                isGenerating || !prompt.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isGenerating ? 'Generating Video...' : 'Generate Video'}
            </button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="text-red-800">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="text-green-800">
                  <strong>Success:</strong> {success}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Videos List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Generated Videos</h2>
          
          {videos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No videos generated yet. Create your first video above!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, index) => (
                <div key={video.id || index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {video.videoUrl && (
                    <video
                      src={video.videoUrl}
                      controls
                      className="w-full h-48 object-cover"
                      poster={video.thumbnailUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                  
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Prompt:</strong> {video.prompt || 'No prompt available'}
                    </p>
                    {video.createdAt && (
                      <p className="text-xs text-gray-400">
                        Created: {new Date(video.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          API: {API_BASE_URL} | Status: Connected ✅
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationApp;