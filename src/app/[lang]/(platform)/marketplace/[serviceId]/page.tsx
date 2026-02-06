import { notFound } from 'next/navigation';
import { getDictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization';
import { getService } from '@/components/platform/marketplace/actions';
import { ServiceDetail } from '@/components/platform/marketplace/service-detail';
import type { ServiceListingWithRelations } from '@/components/platform/marketplace/types';

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ lang: string; serviceId: string }>;
}) {
  const { lang, serviceId } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const result = await getService(serviceId);

  if (!result.success || !result.listing) {
    notFound();
  }

  const service = result.listing as unknown as ServiceListingWithRelations;

  return <ServiceDetail service={service} dictionary={dict} locale={locale} />;
}
