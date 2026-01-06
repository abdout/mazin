'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Marketplace error:', error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription>
              We encountered an error while loading the marketplace. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 me-2" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
