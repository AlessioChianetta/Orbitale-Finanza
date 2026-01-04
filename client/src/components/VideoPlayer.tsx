
import React from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  videoType?: 'youtube' | 'vimeo' | 'direct';
  title?: string;
  className?: string;
}

function VideoPlayer({ videoUrl, videoType, title, className = '' }: VideoPlayerProps) {
  const getEmbedUrl = (url: string, type?: string) => {
    if (!url) return null;

    // Auto-detect video type if not provided
    if (!type) {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        type = 'youtube';
      } else if (url.includes('vimeo.com')) {
        type = 'vimeo';
      } else {
        type = 'direct';
      }
    }

    switch (type) {
      case 'youtube':
        const youtubeId = extractYouTubeId(url);
        return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null;
      
      case 'vimeo':
        const vimeoId = extractVimeoId(url);
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
      
      case 'direct':
        return url;
      
      default:
        return null;
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const extractVimeoId = (url: string): string | null => {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const embedUrl = getEmbedUrl(videoUrl, videoType);

  if (!embedUrl) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center p-8 ${className}`}>
        <p className="text-gray-500">Video non disponibile</p>
      </div>
    );
  }

  if (videoType === 'direct') {
    return (
      <video 
        src={embedUrl} 
        controls 
        className={`w-full rounded-lg ${className}`}
        title={title}
      />
    );
  }

  return (
    <iframe
      src={embedUrl}
      className={`w-full rounded-lg ${className}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title={title}
    />
  );
}

export default VideoPlayer;
export { VideoPlayer };
