import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import VideoGenerationApp from './components/VideoGenerationApp';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    AI Video Studio
                  </h1>
                </div>
                
                {/* Navigation */}
                <nav className="flex items-center space-x-6">
                  <Link 
                    to="/" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/generate" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Generate Video
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/generate" element={<VideoGenerationApp />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;