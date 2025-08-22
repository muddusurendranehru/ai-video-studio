# API Service

The API service provides centralized functions for all video-related API operations with proper error handling and modern fetch API usage.

## Features

- **Centralized API Management**: All API calls are managed in one place
- **Environment Configuration**: Base URL configurable via environment variables
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Modern Fetch API**: Uses async/await with proper headers and request options
- **Response Format Handling**: Supports multiple response formats from the API
- **Type Safety**: JSDoc comments for better development experience

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
REACT_APP_API_BASE_URL=http://localhost:3000/api
```

If not set, defaults to `http://localhost:3000/api`.

## API Functions

### `fetchVideos()`

Fetches all videos from the API.

```javascript
import { fetchVideos } from '../services/api';

try {
  const videos = await fetchVideos();
  console.log(videos); // Array of video objects
} catch (error) {
  console.error('Failed to fetch videos:', error.message);
}
```

**Returns**: `Promise<Array>` - Array of video objects

### `generateVideo(videoData)`

Generates a new video with the provided parameters.

```javascript
import { generateVideo } from '../services/api';

const videoData = {
  prompt: "A beautiful sunset over the ocean",
  style: "cinematic",
  duration: 30,
  resolution: "1080p"
};

try {
  const result = await generateVideo(videoData);
  console.log('Video generated:', result);
} catch (error) {
  console.error('Failed to generate video:', error.message);
}
```

**Parameters**:
- `videoData` (Object):
  - `prompt` (string, required): Text prompt for video generation
  - `style` (string, optional): Video style
  - `duration` (number, optional): Video duration in seconds
  - `resolution` (string, optional): Video resolution

**Returns**: `Promise<Object>` - Generated video object

### `fetchVideo(videoId)`

Fetches a single video by ID.

```javascript
import { fetchVideo } from '../services/api';

try {
  const video = await fetchVideo('video-123');
  console.log(video);
} catch (error) {
  console.error('Failed to fetch video:', error.message);
}
```

**Parameters**:
- `videoId` (string, required): The video ID

**Returns**: `Promise<Object>` - Video object

### `deleteVideo(videoId)`

Deletes a video by ID.

```javascript
import { deleteVideo } from '../services/api';

try {
  const result = await deleteVideo('video-123');
  console.log('Video deleted:', result);
} catch (error) {
  console.error('Failed to delete video:', error.message);
}
```

**Parameters**:
- `videoId` (string, required): The video ID to delete

**Returns**: `Promise<Object>` - Deletion confirmation

### `updateVideo(videoId, updates)`

Updates video metadata.

```javascript
import { updateVideo } from '../services/api';

const updates = {
  title: "Updated Video Title",
  description: "Updated description"
};

try {
  const updatedVideo = await updateVideo('video-123', updates);
  console.log('Video updated:', updatedVideo);
} catch (error) {
  console.error('Failed to update video:', error.message);
}
```

**Parameters**:
- `videoId` (string, required): The video ID
- `updates` (Object, required): Video updates

**Returns**: `Promise<Object>` - Updated video object

## Error Handling

The API service provides comprehensive error handling:

- **Network Errors**: Handles connection issues gracefully
- **HTTP Errors**: Processes HTTP status codes and error responses
- **Validation Errors**: Validates required parameters
- **User-Friendly Messages**: Converts technical errors to user-friendly messages

### Error Types

- `Network error: Unable to connect to the server`
- `Invalid response format from server`
- `HTTP 404: Not Found`
- `HTTP 500: Internal Server Error`
- `Video prompt is required`
- `Video ID is required`

## Response Format Support

The service handles multiple response formats:

```javascript
// Format 1: Direct array
[
  { id: "1", title: "Video 1", ... },
  { id: "2", title: "Video 2", ... }
]

// Format 2: Wrapped in videos property
{
  videos: [
    { id: "1", title: "Video 1", ... },
    { id: "2", title: "Video 2", ... }
  ]
}

// Format 3: Wrapped in data property
{
  data: [
    { id: "1", title: "Video 1", ... },
    { id: "2", title: "Video 2", ... }
  ]
}
```

## Usage in Components

```javascript
import React, { useState, useEffect } from 'react';
import { fetchVideos, generateVideo } from '../services/api';

const MyComponent = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const videosData = await fetchVideos();
      setVideos(videosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async (prompt) => {
    try {
      const result = await generateVideo({ prompt });
      // Handle successful generation
      await loadVideos(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Component JSX...
};
```

## Dependencies

- Modern browser with fetch API support
- React (for component integration)
- Environment variables support (Create React App)
