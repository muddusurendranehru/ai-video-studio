import React from 'react';
import VideoCard from './VideoCard';

const VideoGridExample = () => {
  // Sample video data
  const videos = [
    {
      id: '1',
      title: 'Amazing Sunset Timelapse',
      description: 'A beautiful timelapse video capturing the stunning sunset over the mountains.',
      thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      duration: 30
    },
    {
      id: '2',
      title: 'City Lights at Night',
      description: 'Experience the vibrant energy of the city as it comes alive with thousands of twinkling lights.',
      thumbnail_url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop',
      duration: 45
    },
    {
      id: '3',
      title: 'Ocean Waves Meditation',
      description: 'Soothing ocean waves for meditation and relaxation.',
      thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
      duration: 60
    },
    {
      id: '4',
      title: 'Mountain Adventure',
      description: 'An exciting journey through breathtaking mountain landscapes.',
      thumbnail_url: 'invalid-url-to-test-fallback',
      duration: 90
    }
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Video Grid Example</h2>
      
      {/* Direct VideoCard usage in grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default VideoGridExample;
