'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServiceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Service detail error:', error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Unable to load service</CardTitle>
            </div>
            <CardDescription>
              We encountered an error while loading this service. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 me-2" />
              Try again
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/marketplace">
                <ArrowLeft className="h-4 w-4 me-2" />
                Back to Marketplace
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
