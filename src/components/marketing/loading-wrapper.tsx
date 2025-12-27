'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { LoadingProvider, useLoading } from './loading-context';
import { LoadingScreen } from './loading-screen';

type LoadingState = 'loading' | 'transitioning' | 'complete';

function LoadingContent({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadingState>('loading');
  const { isVideoLoaded } = useLoading();

  useEffect(() => {
    if (state !== 'complete') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [state]);

  const handleLoadingComplete = () => {
    setState('transitioning');
    setTimeout(() => setState('complete'), 700);
  };

  const isLoading = state === 'loading';
  const isTransitioning = state === 'transitioning';
  const isComplete = state === 'complete';

  return (
    <>
      {/* Loading screen - always in DOM until complete, fades out during transition */}
      {!isComplete && (
        <div
          className="transition-opacity duration-500 ease-out"
          style={{
            opacity: isTransitioning ? 0 : 1,
            pointerEvents: isTransitioning ? 'none' : 'auto',
          }}
        >
          <LoadingScreen isVideoLoaded={isVideoLoaded} onComplete={handleLoadingComplete} />
        </div>
      )}

      {/* Content - always rendered, transitions opacity and scale */}
      <div
        className={isComplete ? '' : 'transition-all duration-700 ease-out'}
        style={isComplete ? undefined : {
          opacity: isTransitioning ? 1 : 0,
          transform: isTransitioning ? 'none' : 'scale(0.98)',
          visibility: isLoading ? 'hidden' : 'visible',
        }}
      >
        {children}
      </div>
    </>
  );
}

export function LoadingWrapper({ children }: { children: ReactNode }) {
  return (
    <LoadingProvider>
      <LoadingContent>{children}</LoadingContent>
    </LoadingProvider>
  );
}
