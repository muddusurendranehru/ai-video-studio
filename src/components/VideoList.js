import React from 'react';
import VideoCard from './VideoCard';

const VideoList = ({ videos = [], loading = false, emptyMessage = "No videos found" }) => {
  // Skeleton card component for loading state
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
      {/* Skeleton thumbnail */}
      <div className="w-full h-48 bg-gray-200"></div>
      
      {/* Skeleton content */}
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-1"></div>
        <div className="h-4 bg-gray-200 rounded mb-1 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
        
        {/* Skeleton metadata */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-12">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg 
          className="w-12 h-12 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {emptyMessage}
      </h3>
      <p className="text-gray-600 text-center max-w-md">
        No videos are available at the moment. Check back later or try refreshing the page.
      </p>
    </div>
  );

  // Loading state - show skeleton cards
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  // Empty state - no videos
  if (!videos || videos.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <EmptyState />
      </div>
    );
  }

  // Render video cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id || `video-${Math.random()}`} video={video} />
      ))}
    </div>
  );
};

export default VideoList;
