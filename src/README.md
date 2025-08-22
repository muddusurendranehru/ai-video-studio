# AI Video Studio App

A React application for generating and managing AI-powered videos with a modern, responsive interface.

## App Structure

### Main Components

- **App.js/App.jsx**: Main application component with routing and global layout
- **Dashboard**: Video management page showing all generated videos
- **VideoGenerationApp**: Video generation interface
- **ErrorBoundary**: Global error handling component

### Routing

The app uses React Router for navigation:

- `/` - Dashboard (default route)
- `/generate` - Video Generation page

### Features

- **Global Header**: Consistent navigation with app title "AI Video Studio"
- **Error Boundary**: Catches and handles React errors gracefully
- **Responsive Design**: Works on all screen sizes
- **Modern React**: Uses functional components with hooks
- **Tailwind CSS**: Styled with utility classes

## Components

### VideoCard
- Displays individual video with thumbnail
- Handles image loading errors gracefully
- Shows video metadata (title, description, duration)

### VideoList
- Displays grid of VideoCard components
- Handles loading, empty, and error states
- Responsive grid layout

### Dashboard
- Fetches and displays user's videos
- API integration with error handling
- Refresh and generate video functionality

## API Integration

The app uses a centralized API service (`src/services/api.js`) for all backend communication:

- `fetchVideos()` - Get all videos
- `generateVideo()` - Create new video
- `fetchVideo()` - Get single video
- `deleteVideo()` - Remove video
- `updateVideo()` - Update video metadata

## Environment Configuration

Create a `.env` file in the project root:

```env
REACT_APP_API_BASE_URL=http://localhost:3000/api
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Dependencies

- React 18
- React Router DOM
- Lucide React (icons)
- Tailwind CSS
- Modern fetch API
