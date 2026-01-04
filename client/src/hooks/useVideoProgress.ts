import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { VideoProgress, WatchSession } from '@shared/schema';

interface UseVideoProgressProps {
  lessonId: number;
  videoDuration?: number;
}

interface VideoProgressData {
  currentPosition: number;
  totalDuration: number;
  watchedSeconds: number;
  completionPercentage: number;
  watchCount: number;
  isCompleted: boolean;
}

export function useVideoProgress({ lessonId, videoDuration = 0 }: UseVideoProgressProps) {
  const queryClient = useQueryClient();
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  // Get video progress
  const { data: progress, isLoading } = useQuery<VideoProgressData>({
    queryKey: ['video-progress', lessonId],
    queryFn: () => fetch(`/api/video-progress/${lessonId}`, { credentials: 'include' }).then(res => res.json()),
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: (progressData: Partial<VideoProgressData> & { lessonId: number }) =>
      apiRequest('POST', '/api/video-progress', progressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-progress', lessonId] });
    },
  });

  // Save watch session mutation
  const saveSessionMutation = useMutation({
    mutationFn: (sessionData: Partial<WatchSession>) =>
      apiRequest('POST', '/api/watch-session', sessionData),
  });

  // Start a new watch session
  const startSession = useCallback((startPosition: number = 0) => {
    const sessionStart = Date.now();
    setCurrentSession(sessionStart);
    
    saveSessionMutation.mutate({
      lessonId,
      startPosition,
      sessionStart: new Date(),
    });
  }, [lessonId, saveSessionMutation]);

  // End current watch session
  const endSession = useCallback((endPosition: number) => {
    if (!currentSession) return;
    
    const sessionEnd = Date.now();
    const duration = Math.round((sessionEnd - currentSession) / 1000); // Convert to seconds
    
    saveSessionMutation.mutate({
      lessonId,
      endPosition,
      duration,
      sessionEnd: new Date(),
    });
    
    setCurrentSession(null);
  }, [currentSession, lessonId, saveSessionMutation]);

  // Update progress (throttled to avoid too many API calls)
  const updateProgress = useCallback((currentTime: number, duration: number) => {
    const now = Date.now();
    
    // Only update every 5 seconds to avoid spam
    if (now - lastUpdateTime < 5000) return;
    
    setLastUpdateTime(now);
    
    const completionPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const watchedSeconds = Math.max(progress?.watchedSeconds || 0, currentTime);
    
    saveProgressMutation.mutate({
      lessonId,
      currentPosition: Math.round(currentTime),
      totalDuration: Math.round(duration),
      watchedSeconds: Math.round(watchedSeconds),
      completionPercentage: Math.round(completionPercentage * 100) / 100, // Round to 2 decimals
    });
  }, [lessonId, progress?.watchedSeconds, lastUpdateTime, saveProgressMutation]);

  // Force save progress (for when video ends or user closes)
  const forceUpdateProgress = useCallback((currentTime: number, duration: number) => {
    const completionPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const watchedSeconds = Math.max(progress?.watchedSeconds || 0, currentTime);
    
    saveProgressMutation.mutate({
      lessonId,
      currentPosition: Math.round(currentTime),
      totalDuration: Math.round(duration),
      watchedSeconds: Math.round(watchedSeconds),
      completionPercentage: Math.round(completionPercentage * 100) / 100,
    });
  }, [lessonId, progress?.watchedSeconds, saveProgressMutation]);

  return {
    progress,
    isLoading,
    startSession,
    endSession,
    updateProgress,
    forceUpdateProgress,
    isSaving: saveProgressMutation.isPending || saveSessionMutation.isPending,
  };
}