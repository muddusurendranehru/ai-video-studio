import React, { useState } from 'react';

const VideoCard = ({ video }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 bg-gray-200">
        {!imgError && video.thumbnail_url ? (
          <img 
            src={video.thumbnail_url} 
            alt={video.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">▶</span>
            </div>
            <p className="text-sm text-center px-4">{video.title}</p>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{video.title}</h3>
        <p className="text-gray-600 text-sm mt-1">{video.description}</p>
        <div className="mt-2 text-xs text-gray-500">
          Duration: {video.duration}s
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
