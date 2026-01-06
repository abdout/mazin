import { getDictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization';
import PageHeading from '@/components/atom/page-heading';
import { getServices } from '@/components/platform/marketplace/actions';
import { ServiceGrid } from '@/components/platform/marketplace/service-grid';
import type { ServiceListingWithRelations } from '@/components/platform/marketplace/types';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  // Fetch services with pagination (large page for initial load, client filters in-memory)
  const servicesResult = await getServices(undefined, { page: 1, pageSize: 100 });
  const services = (servicesResult.success ? servicesResult.listings : []) as ServiceListingWithRelations[];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <PageHeading
          title={dict.marketplace?.title || 'Marketplace'}
          description={
            dict.marketplace?.description || 'Find services for your clearance needs'
          }
        />
      </div>
      <div className="px-4 lg:px-6">
        <ServiceGrid services={services} dictionary={dict} locale={locale} />
      </div>
    </div>
  );
}
