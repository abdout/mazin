'use client';

import { useState, useEffect, useCallback } from 'react';

interface LoadingScreenProps {
  isVideoLoaded: boolean;
  onComplete: () => void;
}

export function LoadingScreen({ isVideoLoaded, onComplete }: LoadingScreenProps) {
  const [count, setCount] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const startExitAnimation = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation to complete before calling onComplete
    setTimeout(onComplete, 600);
  }, [onComplete]);

  useEffect(() => {
    // If already exiting, don't do anything
    if (isExiting) return;

    // When count reaches 100, start the exit animation
    if (count >= 100) {
      // Small delay to show 100% before animating out
      const timeout = setTimeout(startExitAnimation, 200);
      return () => clearTimeout(timeout);
    }

    // If video is loaded and we're past 90%, accelerate to 100
    if (isVideoLoaded && count >= 90 && count < 100) {
      const timeout = setTimeout(() => {
        const remaining = 100 - count;
        const increment = Math.max(Math.ceil(remaining / 3), 1);
        setCount(prev => Math.min(prev + increment, 100));
      }, 40);
      return () => clearTimeout(timeout);
    }

    // If video is loaded but we're below 90%, speed up moderately
    if (isVideoLoaded && count < 90) {
      const timeout = setTimeout(() => {
        const increment = Math.floor(Math.random() * 10) + 3;
        setCount(prev => Math.min(prev + increment, 90));
      }, 30 + Math.random() * 50);
      return () => clearTimeout(timeout);
    }

    // Pause at 90% if video not loaded
    if (count >= 90 && !isVideoLoaded) {
      return;
    }

    // Normal progression 0-90%
    const timeout = setTimeout(() => {
      const increment = Math.floor(Math.random() * 8) + 1;
      setCount(prev => Math.min(prev + increment, 90));
    }, 50 + Math.random() * 100);

    return () => clearTimeout(timeout);
  }, [count, isVideoLoaded, isExiting, startExitAnimation]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-background z-[9999]"
    >
      {/* Container with overflow hidden to clip the text as it moves up */}
      <div
        className="overflow-hidden"
        style={{ height: '1.5em' }}
      >
        <div
          className="text-foreground text-lg font-light transition-transform duration-500 ease-out"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            transform: isExiting ? 'translateY(-100%)' : 'translateY(0)',
          }}
        >
          {count}%
        </div>
      </div>
    </div>
  );
}
