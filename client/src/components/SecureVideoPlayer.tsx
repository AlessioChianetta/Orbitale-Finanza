import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useVideoProgress } from '@/hooks/useVideoProgress';

interface SecureVideoPlayerProps {
  videoUrl: string;
  title?: string;
  autoplay?: boolean;
  lessonId?: number;
}

// Helper functions for video processing
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getVimeoVideoId = (url: string): string | null => {
  const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

const getVideoType = (url: string): 'youtube' | 'vimeo' | 'direct' => {
  if (!url) return 'direct';
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  return 'direct';
};

export default function SecureVideoPlayer({ videoUrl, title, autoplay = false, lessonId }: SecureVideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Video progress tracking hook
  const { updateProgress, forceUpdateProgress } = useVideoProgress({ 
    lessonId: lessonId || 0, 
    videoDuration: duration 
  });

  const videoType = getVideoType(videoUrl);
  const videoId = videoType === 'youtube' ? getYouTubeVideoId(videoUrl) : 
                  videoType === 'vimeo' ? getVimeoVideoId(videoUrl) : null;

  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    const timer = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(timer);
  }, [videoUrl]);

  useEffect(() => {
    if (!lessonId) return;

    const startTime = Date.now();
    
    return () => {
      const sessionDuration = Math.floor((Date.now() - startTime) / 1000);
      if (sessionDuration > 10) {
        fetch('/api/video-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            lessonId,
            currentPosition: Math.min(sessionDuration, 1980),
            totalDuration: 1980,
            watchedSeconds: Math.min(sessionDuration, 1980),
            completionPercentage: Math.min((sessionDuration / 1980) * 100, 100)
          })
        }).then(() => {
          window.dispatchEvent(new CustomEvent('videoProgressUpdated', { 
            detail: { lessonId } 
          }));
        }).catch(err => console.error('Error tracking session end:', err));
      }
    };
  }, [lessonId]);

  const renderYouTubePlayer = () => {
    if (!videoId) return null;
    
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      controls: '1',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      cc_load_policy: '0',
      fs: '1',
      enablejsapi: '1',
      origin: window.location.origin,
      playsinline: '1',
      showinfo: '0',
      start: '0',
      end: '0',
      loop: '0',
      playlist: videoId,
      wmode: 'opaque'
    });
    
    return (
      <div className="relative w-full h-full">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`}
          title={title || 'Video Formativo'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={true}
          className="w-full h-full"
          style={{ 
            border: 'none',
            background: '#000',
            borderRadius: '8px',
            pointerEvents: 'auto'
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
        {/* Overlay to prevent right-click and other interactions */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: 'transparent',
            zIndex: 1
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    );
  };

  // Vimeo Player with privacy controls
  const renderVimeoPlayer = () => {
    if (!videoId) return null;
    
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      controls: '1',
      loop: '0',
      muted: autoplay ? '1' : '0',
      playsinline: '1',
      portrait: '0', // Hide portrait
      title: '0', // Hide title
      byline: '0', // Hide author
      color: '4F46E5', // Control color matching theme
      dnt: '1', // Do not track
      autopause: '0',
      background: '0', // Hide background
      speed: '0', // Hide speed controls
      quality: '0' // Hide quality selector
    });
    
    return (
      <div className="relative w-full h-full">
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?${params.toString()}`}
          title={title || 'Video Formativo'}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen={true}
          className="w-full h-full"
          style={{ 
            border: 'none',
            background: '#000',
            borderRadius: '8px'
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
        {/* Overlay to prevent right-click and other interactions */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: 'transparent',
            zIndex: 1
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    );
  };

  if (!videoUrl) {
    return (
      <div className="w-full bg-gray-900 rounded-lg flex items-center justify-center text-white" style={{ aspectRatio: '16/9' }}>
        <p>Nessun video disponibile</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gray-900 rounded-lg flex items-center justify-center text-white" style={{ aspectRatio: '16/9' }}>
        <div className="text-center">
          <p className="text-lg font-medium">Errore nel caricamento</p>
          <p className="text-sm text-gray-400 mt-2">Impossibile riprodurre il video</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-lg flex items-center justify-center"
      style={{ minHeight: '300px' }}
    >
      <div 
        className="w-full h-full max-w-full max-h-full"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Loading overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-white text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Caricamento video...</p>
            </div>
          </div>
        )}
        
        {/* Progress indicator removed - handled in stats panel */}
        
        {/* Video players */}
        {videoType === 'youtube' && renderYouTubePlayer()}
        {videoType === 'vimeo' && renderVimeoPlayer()}
        
        {/* Fallback for unsupported videos */}
        {!videoId && videoType !== 'direct' && isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
              <p className="text-lg font-medium">Formato non supportato</p>
              <p className="text-sm text-gray-400 mt-2">Questo tipo di video non è supportato</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}