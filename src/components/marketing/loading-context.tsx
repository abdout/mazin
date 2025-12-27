'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface LoadingContextType {
  isVideoLoaded: boolean;
  setVideoLoaded: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const setVideoLoaded = useCallback(() => setIsVideoLoaded(true), []);

  return (
    <LoadingContext.Provider value={{ isVideoLoaded, setVideoLoaded }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}
