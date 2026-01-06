import Link from 'next/link';
import { Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServiceNotFound() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-muted rounded-full">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle>Service Not Found</CardTitle>
            <CardDescription>
              The service you&apos;re looking for doesn&apos;t exist or is no longer available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
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
