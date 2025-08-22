# Dashboard Component

The Dashboard component is a React page that displays a user's AI-generated videos with full API integration.

## Features

- **API Integration**: Fetches videos from a configurable API endpoint
- **Loading States**: Shows loading spinners and skeleton cards during data fetching
- **Error Handling**: Displays user-friendly error messages with retry functionality
- **Video Management**: Displays videos using the VideoList component
- **Responsive Design**: Works on all screen sizes with mobile-first approach
- **Real-time Updates**: Refresh functionality to fetch latest videos

## Configuration

### Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3000/api
```

### API Endpoint

The component expects the API to return videos in one of these formats:

```json
{
  "videos": [
    {
      "id": "1",
      "title": "Video Title",
      "description": "Video description",
      "thumbnail_url": "https://example.com/thumbnail.jpg",
      "video_url": "https://example.com/video.mp4"
    }
  ]
}
```

OR

```json
[
  {
    "id": "1",
    "title": "Video Title",
    "description": "Video description",
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "video_url": "https://example.com/video.mp4"
  }
]
```

## Usage

```jsx
import Dashboard from './pages/Dashboard';

// In your app routing
<Route path="/dashboard" element={<Dashboard />} />
```

## Props

The Dashboard component doesn't accept props as it manages its own state internally.

## State Management

- `videos`: Array of video objects
- `loading`: Boolean for initial loading state
- `error`: Error message string or null
- `refreshing`: Boolean for refresh operation state

## API Integration

The component uses `fetch` with async/await for API calls and includes:
- Proper error handling for network issues
- HTTP status code validation
- Configurable base URL via environment variables
- Automatic retry functionality

## Dependencies

- React (useState, useEffect)
- lucide-react (icons)
- VideoList component
- Tailwind CSS for styling
