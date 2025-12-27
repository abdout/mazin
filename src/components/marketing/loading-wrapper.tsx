'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { LoadingProvider, useLoading } from './loading-context';
import { LoadingScreen } from './loading-screen';

function LoadingContent({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const { isVideoLoaded } = useLoading();

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  const handleLoadingComplete = () => setIsLoading(false);

  if (isLoading) {
    return (
      <>
        <LoadingScreen isVideoLoaded={isVideoLoaded} onComplete={handleLoadingComplete} />
        <div style={{ visibility: 'hidden', position: 'absolute', top: 0, left: 0 }}>
          {children}
        </div>
      </>
    );
  }

  return <>{children}</>;
}

export function LoadingWrapper({ children }: { children: ReactNode }) {
  return (
    <LoadingProvider>
      <LoadingContent>{children}</LoadingContent>
    </LoadingProvider>
  );
}
