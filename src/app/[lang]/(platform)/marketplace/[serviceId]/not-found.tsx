import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDictionary } from '@/components/internationalization/dictionaries';
import { i18n, type Locale } from '@/components/internationalization';

async function detectLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value;
  if (locale && i18n.locales.includes(locale as Locale)) return locale as Locale;

  const headersList = await headers();
  const preferred = headersList.get("accept-language")?.split(",")[0]?.split("-")[0]?.toLowerCase();
  if (preferred && i18n.locales.includes(preferred as Locale)) return preferred as Locale;

  return i18n.defaultLocale;
}

export default async function ServiceNotFound() {
  const locale = await detectLocale();
  const dict = await getDictionary(locale);
  const t = dict.marketplace;

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
            <CardTitle>{t?.serviceNotFound?.title}</CardTitle>
            <CardDescription>{t?.serviceNotFound?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/${locale}/marketplace`}>
                <ArrowLeft className="h-4 w-4 me-2" />
                {t?.serviceNotFound?.back}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
