import React from 'react';
import VideoCard from './VideoCard';

const VideoCardExample = () => {
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
      thumbnail_url: 'invalid-url-to-test-fallback', // This will trigger the fallback
      video_url: 'https://example.com/video4.mp4'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Video Gallery
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sampleVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoCardExample;
