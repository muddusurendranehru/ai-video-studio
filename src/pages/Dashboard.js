import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import VideoList from '../components/VideoList';
import { fetchVideos } from '../services/api';

const Dashboard = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch videos from API
  const loadVideos = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const videosData = await fetchVideos();
      setVideos(videosData);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch videos on component mount
  useEffect(() => {
    loadVideos();
  }, []);

  // Handle refresh button click
  const handleRefresh = () => {
    loadVideos(true);
  };

  // Handle generate new video button click
  const handleGenerateVideo = () => {
    // TODO: Implement video generation logic
    console.log('Generate new video clicked');
    // This could navigate to a video generation page or open a modal
  };

  // Error state component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Error Loading Videos
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        {error || 'Something went wrong while loading your videos.'}
      </p>
      <button
        onClick={handleRefresh}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Your AI Videos
          </h1>
          {!loading && !error && (
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh videos"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          {/* Generate new video button */}
          <button
            onClick={handleGenerateVideo}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Generate New Video</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
        {/* Loading indicator */}
        {loading && !refreshing && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading your videos...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <ErrorState />
        )}

        {/* Video list */}
        {!error && (
          <VideoList 
            videos={videos} 
            loading={loading}
            emptyMessage="You haven't generated any videos yet"
          />
        )}

        {/* Refresh indicator */}
        {refreshing && (
          <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Refreshing...</span>
          </div>
        )}
      </div>
  );
};

export default Dashboard;
