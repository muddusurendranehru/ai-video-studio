// API service for video operations
// Base URL from environment variable with fallback
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ai-video-studio-backend.onrender.com';

// Common headers for API requests
const getHeaders = (isJson = true) => {
  const headers = {
    'Accept': 'application/json',
  };
  
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// Generic error handler
const handleApiError = (error, endpoint) => {
  console.error(`API Error (${endpoint}):`, error);
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new Error('Network error: Unable to connect to the server');
  }
  
  if (error.name === 'SyntaxError') {
    throw new Error('Invalid response format from server');
  }
  
  throw error;
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(options.body && typeof options.body === 'object'),
        ...options.headers,
      },
    });

    // Handle HTTP error status codes
    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Try to get error details from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || errorMessage);
      } catch (parseError) {
        throw new Error(errorMessage);
      }
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    return await response.json();
  } catch (error) {
    handleApiError(error, endpoint);
  }
};

/**
 * Fetch all videos from the API
 * @returns {Promise<Array>} Array of video objects
 */
export const fetchVideos = async () => {
  try {
    const response = await apiRequest('/videos');
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response && response.videos) {
      return response.videos;
    }
    
    if (response && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new Error('Failed to fetch videos. Please try again later.');
  }
};

/**
 * Generate a new video
 * @param {Object} videoData - Video generation parameters
 * @param {string} videoData.prompt - Text prompt for video generation
 * @param {string} [videoData.style] - Video style (optional)
 * @param {number} [videoData.duration] - Video duration in seconds (optional)
 * @param {string} [videoData.resolution] - Video resolution (optional)
 * @returns {Promise<Object>} Generated video object
 */
export const generateVideo = async (videoData) => {
  try {
    // Validate required fields
    if (!videoData || !videoData.prompt) {
      throw new Error('Video prompt is required');
    }

    const response = await apiRequest('/generate-video', {
      method: 'POST',
      body: JSON.stringify(videoData),
    });

    return response;
  } catch (error) {
    console.error('Error generating video:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('prompt is required')) {
      throw new Error('Please provide a video prompt');
    }
    
    if (error.message.includes('Network error')) {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    
    throw new Error('Failed to generate video. Please try again later.');
  }
};

/**
 * Get a single video by ID
 * @param {string} videoId - The video ID
 * @returns {Promise<Object>} Video object
 */
export const fetchVideo = async (videoId) => {
  try {
    if (!videoId) {
      throw new Error('Video ID is required');
    }

    const response = await apiRequest(`/videos/${videoId}`);
    return response;
  } catch (error) {
    console.error('Error fetching video:', error);
    throw new Error('Failed to fetch video details. Please try again later.');
  }
};

/**
 * Delete a video by ID
 * @param {string} videoId - The video ID to delete
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteVideo = async (videoId) => {
  try {
    if (!videoId) {
      throw new Error('Video ID is required');
    }

    const response = await apiRequest(`/videos/${videoId}`, {
      method: 'DELETE',
    });

    return response;
  } catch (error) {
    console.error('Error deleting video:', error);
    throw new Error('Failed to delete video. Please try again later.');
  }
};

/**
 * Update video metadata
 * @param {string} videoId - The video ID
 * @param {Object} updates - Video updates
 * @returns {Promise<Object>} Updated video object
 */
export const updateVideo = async (videoId, updates) => {
  try {
    if (!videoId) {
      throw new Error('Video ID is required');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates object is required');
    }

    const response = await apiRequest(`/videos/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return response;
  } catch (error) {
    console.error('Error updating video:', error);
    throw new Error('Failed to update video. Please try again later.');
  }
};

// Export the base URL for use in other parts of the application
export { API_BASE_URL };
