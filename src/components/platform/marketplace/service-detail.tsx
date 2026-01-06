'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Truck, Forklift, Users, Wrench, MessageCircle, Phone, Mail, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Dictionary, Locale } from '@/components/internationalization';
import { isRTL } from '@/components/internationalization/config';
import type { ServiceListingWithRelations } from './types';
import type { ServiceCategoryType } from '@prisma/client';
import { OrderForm } from './order-form';

// Normalize phone for WhatsApp (Sudan country code)
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    return '249' + cleaned.substring(1);
  }
  return cleaned.replace(/^\+/, '');
}

interface ServiceDetailProps {
  service: ServiceListingWithRelations;
  dictionary: Dictionary;
  locale: Locale;
}

const categoryIcons: Record<ServiceCategoryType, React.ComponentType<{ className?: string }>> = {
  TRUCK: Truck,
  FORKLIFT: Forklift,
  MANPOWER: Users,
  TOOLS: Wrench,
};

function formatPrice(
  priceMin: number,
  priceMax: number | null,
  currency: string,
  dictionary: Dictionary
) {
  const currencyLabel = dictionary.marketplace?.currency || currency;
  if (priceMax && priceMax !== priceMin) {
    return `${dictionary.marketplace?.priceFrom || 'From'} ${priceMin.toLocaleString()} ${dictionary.marketplace?.priceTo || 'to'} ${priceMax.toLocaleString()} ${currencyLabel}`;
  }
  return `${dictionary.marketplace?.priceFrom || 'From'} ${priceMin.toLocaleString()} ${currencyLabel}`;
}

function ServiceIcon({
  category,
  className,
}: {
  category: ServiceCategoryType;
  className?: string;
}) {
  const Icon = categoryIcons[category] || Wrench;
  return <Icon className={className} />;
}

export function ServiceDetail({ service, dictionary, locale }: ServiceDetailProps) {
  const rtl = isRTL(locale);

  const title = rtl ? service.titleAr || service.title : service.title;
  const description = rtl ? service.descriptionAr || service.description : service.description;
  const details = rtl ? service.detailsAr || service.details : service.details;
  const vendorName = rtl
    ? service.vendor.businessNameAr || service.vendor.businessName
    : service.vendor.businessName;

  return (
    <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6" dir={rtl ? 'rtl' : 'ltr'}>
      {/* Back button */}
      <div className="px-4 lg:px-6">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/marketplace`}>
            <ArrowLeft className={`h-4 w-4 ${rtl ? 'rotate-180 ml-2' : 'mr-2'}`} />
            {dictionary.marketplace?.backToMarketplace || 'Back to Marketplace'}
          </Link>
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {service.imageUrl ? (
                      <Image
                        src={service.imageUrl}
                        alt={title}
                        width={256}
                        height={256}
                        sizes="(max-width: 768px) 100vw, 256px"
                        className="w-64 h-64 object-contain rounded-lg bg-muted"
                        priority
                      />
                    ) : (
                      <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                        <ServiceIcon
                          category={service.category.type}
                          className="h-24 w-24 text-muted-foreground"
                        />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {dictionary.marketplace?.categories?.[service.category.type] ||
                          service.category.name}
                      </Badge>
                      <h1 className="text-2xl font-bold">{title}</h1>
                      <p className="text-muted-foreground mt-2">{description}</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(
                          Number(service.priceMin),
                          service.priceMax ? Number(service.priceMax) : null,
                          service.currency,
                          dictionary
                        )}
                      </p>
                      {service.priceNote && (
                        <p className="text-sm text-muted-foreground">
                          {rtl ? service.priceNoteAr || service.priceNote : service.priceNote}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {dictionary.marketplace?.serviceArea || 'Service Area'}:{' '}
                        {service.serviceArea}
                      </span>
                    </div>

                    {service.isActive && (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        {dictionary.marketplace?.inStock || 'Available'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Full description */}
            {details && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {dictionary.marketplace?.viewDetails || 'Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{details}</p>
                </CardContent>
              </Card>
            )}

            {/* Vendor info */}
            <Card>
              <CardHeader>
                <CardTitle>{dictionary.marketplace?.vendor || 'Vendor'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {service.vendor.logoUrl ? (
                    <Image
                      src={service.vendor.logoUrl}
                      alt={vendorName}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {vendorName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{vendorName}</h3>
                    <p className="text-sm text-muted-foreground">{service.vendor.city}</p>
                  </div>
                </div>

                {service.vendor.description && (
                  <p className="text-sm text-muted-foreground">
                    {rtl
                      ? service.vendor.descriptionAr || service.vendor.description
                      : service.vendor.description}
                  </p>
                )}

                <Separator />

                <div className="flex flex-wrap gap-3">
                  {service.vendor.whatsappNumber && (
                    <a
                      href={`https://wa.me/${normalizePhone(service.vendor.whatsappNumber)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {dictionary.marketplace?.whatsapp || 'WhatsApp'}
                    </a>
                  )}
                  {service.vendor.phone && (
                    <a
                      href={`tel:${service.vendor.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {service.vendor.phone}
                    </a>
                  )}
                  {service.vendor.email && (
                    <a
                      href={`mailto:${service.vendor.email}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-md text-sm hover:bg-orange-200 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      {dictionary.marketplace?.email || 'Email'}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Order form */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <OrderForm service={service} dictionary={dictionary} locale={locale} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
