'use client';

import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isVideoLoaded: boolean;
  onComplete: () => void;
}

export function LoadingScreen({ isVideoLoaded, onComplete }: LoadingScreenProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= 100) {
      const timeout = setTimeout(onComplete, 300);
      return () => clearTimeout(timeout);
    }

    // If video is loaded, accelerate to 100%
    if (isVideoLoaded && count < 100) {
      const timeout = setTimeout(() => {
        const remaining = 100 - count;
        const increment = Math.max(Math.ceil(remaining / 5), 2);
        setCount(prev => Math.min(prev + increment, 100));
      }, 30);
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
  }, [count, isVideoLoaded, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#121214',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: '300',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {count}%
      </div>
    </div>
  );
}
