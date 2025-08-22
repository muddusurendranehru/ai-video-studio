import React, { useState, useEffect } from 'react';
import VideoList from './VideoList';

const VideoListExample = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('loading'); // 'loading', 'videos', 'empty'

  // Sample video data
  const sampleVideos = [
    {
      id: '1',
      title: 'Amazing Sunset Timelapse',
      description: 'A beautiful timelapse video capturing the stunning sunset over the mountains. Perfect for relaxation and meditation.',
      thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      video_url: 'https://example.com/video1.mp4'
    },
    {
      id: '2',
      title: 'City Lights at Night',
      description: 'Experience the vibrant energy of the city as it comes alive with thousands of twinkling lights.',
      thumbnail_url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop',
      video_url: 'https://example.com/video2.mp4'
    },
    {
      id: '3',
      title: 'Ocean Waves Meditation',
      description: 'Soothing ocean waves for meditation and relaxation. Perfect background for your mindfulness practice.',
      thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
      video_url: 'https://example.com/video3.mp4'
    },
    {
      id: '4',
      title: 'Mountain Adventure',
      description: 'An exciting journey through breathtaking mountain landscapes and challenging terrains.',
      thumbnail_url: 'invalid-url-to-test-fallback',
      video_url: 'https://example.com/video4.mp4'
    },
    {
      id: '5',
      title: 'Forest Walk',
      description: 'Peaceful walk through a serene forest with birds chirping and leaves rustling in the breeze.',
      thumbnail_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      video_url: 'https://example.com/video5.mp4'
    },
    {
      id: '6',
      title: 'Desert Sunrise',
      description: 'Breathtaking sunrise over vast desert dunes creating a magical golden landscape.',
      thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      video_url: 'https://example.com/video6.mp4'
    }
  ];

  // Simulate loading and data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      if (currentView === 'loading') {
        setVideos(sampleVideos);
        setCurrentView('videos');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentView]);

  const handleViewChange = (view) => {
    setLoading(true);
    setCurrentView(view);
    
    setTimeout(() => {
      setLoading(false);
      if (view === 'videos') {
        setVideos(sampleVideos);
      } else if (view === 'empty') {
        setVideos([]);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Video List Component Demo
          </h1>
          
          {/* View controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <button
              onClick={() => handleViewChange('loading')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'loading' && !loading
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Show Loading
            </button>
            <button
              onClick={() => handleViewChange('videos')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'videos' && !loading
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Show Videos
            </button>
            <button
              onClick={() => handleViewChange('empty')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'empty' && !loading
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Show Empty
            </button>
          </div>

          {/* Current state indicator */}
          <div className="text-sm text-gray-600">
            Current state: {loading ? 'Loading...' : currentView}
          </div>
        </div>
        
        {/* VideoList component */}
        <VideoList 
          videos={videos} 
          loading={loading}
          emptyMessage="No videos available"
        />
      </div>
    </div>
  );
};

export default VideoListExample;
