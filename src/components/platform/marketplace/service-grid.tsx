'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, Forklift, Users, Wrench, X, MessageCircle, Phone, Mail, Loader2 } from 'lucide-react';

import type { Dictionary, Locale } from '@/components/internationalization';
import { isRTL } from '@/components/internationalization/config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOutsideClick } from './hooks/use-outside-click';
import type { ServiceListingWithRelations, ServiceCategoryFilter } from './types';
import type { ServiceCategoryType } from '@prisma/client';

// Normalize phone for WhatsApp (Sudan country code)
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    return '249' + cleaned.substring(1);
  }
  return cleaned.replace(/^\+/, '');
}

interface ServiceGridProps {
  services: ServiceListingWithRelations[];
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

export function ServiceGrid({ services, dictionary, locale }: ServiceGridProps) {
  const [active, setActive] = useState<ServiceListingWithRelations | null>(null);
  const [category, setCategory] = useState<ServiceCategoryFilter>('ALL');
  const [search, setSearch] = useState('');
  const [prefetchedIds, setPrefetchedIds] = useState<Set<string>>(new Set());
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const rtl = isRTL(locale);

  // Lazy prefetch on hover (better performance than eager prefetch)
  const handlePrefetch = useCallback((serviceId: string) => {
    if (prefetchedIds.has(serviceId)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/${locale}/marketplace/${serviceId}`;
    document.head.appendChild(link);

    setPrefetchedIds(prev => new Set(prev).add(serviceId));
  }, [locale, prefetchedIds]);

  // Escape key handler
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);

  // Outside click handler
  useOutsideClick(ref, () => setActive(null));

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesCategory =
      category === 'ALL' || service.category.type === category;
    const searchTerm = search.toLowerCase();
    const name = rtl
      ? service.titleAr || service.title
      : service.title;
    const desc = rtl
      ? service.descriptionAr || service.description
      : service.description;
    const matchesSearch =
      !search ||
      name.toLowerCase().includes(searchTerm) ||
      desc.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const categories: ServiceCategoryFilter[] = [
    'ALL',
    'TRUCK',
    'FORKLIFT',
    'MANPOWER',
    'TOOLS',
  ];

  const handlePlaceOrder = (service: ServiceListingWithRelations) => {
    // Navigate to detail page with order intent
    window.location.href = `/${locale}/marketplace/${service.id}?action=order`;
  };

  return (
    <>
      {/* Backdrop Overlay - mirror reference */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 h-full w-full z-10"
          />
        )}
      </AnimatePresence>

      {/* Expanded Modal - mirror reference exactly */}
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 grid place-items-center z-[100]">
            {/* Mobile close button */}
            <motion.button
              key={`button-${active.id}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className={`flex absolute top-2 ${rtl ? 'left-2' : 'right-2'} lg:hidden items-center justify-center bg-background rounded-full h-8 w-8 shadow-md`}
              onClick={() => setActive(null)}
            >
              <X className="h-4 w-4" />
            </motion.button>

            {/* Modal Card - max-w-[500px] h-fit max-h-[85%] */}
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="w-full max-w-[500px] h-fit max-h-[85%] mx-4 md:mx-0 flex flex-col bg-card rounded-lg border shadow-lg overflow-hidden"
              dir={rtl ? 'rtl' : 'ltr'}
            >
              {/* Header with image + metadata */}
              <div className="p-6">
                <div className="flex flex-row items-center gap-4">
                  <motion.div layoutId={`image-${active.id}-${id}`}>
                    {active.imageUrl ? (
                      <Image
                        src={active.imageUrl}
                        alt={rtl ? active.titleAr || active.title : active.title}
                        width={128}
                        height={128}
                        className="h-32 w-32 object-contain rounded-md"
                      />
                    ) : (
                      <div className="h-32 w-32 bg-muted rounded-md flex items-center justify-center">
                        <ServiceIcon
                          category={active.category.type}
                          className="h-16 w-16 text-muted-foreground"
                        />
                      </div>
                    )}
                  </motion.div>

                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">
                      {dictionary.marketplace?.categories?.[active.category.type] ||
                        active.category.name}
                    </Badge>
                    <motion.h3
                      layoutId={`title-${active.id}-${id}`}
                      className="font-semibold text-xl text-foreground"
                    >
                      {rtl ? active.titleAr || active.title : active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.id}-${id}`}
                      className="text-muted-foreground text-sm mt-1 line-clamp-2"
                    >
                      {rtl
                        ? active.descriptionAr || active.description
                        : active.description}
                    </motion.p>
                    <motion.p
                      layoutId={`price-${active.id}-${id}`}
                      className="text-primary text-base mt-2 font-semibold"
                    >
                      {formatPrice(
                        Number(active.priceMin),
                        active.priceMax ? Number(active.priceMax) : null,
                        active.currency,
                        dictionary
                      )}
                    </motion.p>
                  </div>
                </div>
              </div>

              {/* Details section */}
              <div className="px-6 pb-4 overflow-y-auto">
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-muted-foreground text-sm space-y-4"
                >
                  {active.details && (
                    <p>
                      {rtl ? active.detailsAr || active.details : active.details}
                    </p>
                  )}

                  {/* Vendor info */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-xs font-medium">
                      {dictionary.marketplace?.vendor || 'Vendor'}:
                    </span>
                    <span className="text-xs">
                      {rtl
                        ? active.vendor.businessNameAr || active.vendor.businessName
                        : active.vendor.businessName}
                    </span>
                  </div>

                  {/* Quick contact buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {active.vendor.whatsappNumber && (
                      <a
                        href={`https://wa.me/${normalizePhone(active.vendor.whatsappNumber)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" />
                        {dictionary.marketplace?.whatsapp || 'WhatsApp'}
                      </a>
                    )}
                    {active.vendor.phone && (
                      <a
                        href={`tel:${active.vendor.phone}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {dictionary.marketplace?.phone || 'Phone'}
                      </a>
                    )}
                    {active.vendor.email && (
                      <a
                        href={`mailto:${active.vendor.email}`}
                        className="inline-flex items-center gap-1 text-xs text-orange-600 hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {dictionary.marketplace?.email || 'Email'}
                      </a>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Two action buttons - mirror reference */}
              <div
                className={`mt-auto p-6 flex gap-4 ${rtl ? 'flex-row-reverse' : ''} justify-start border-t`}
              >
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    onClick={() => handlePlaceOrder(active)}
                    className="min-w-[120px]"
                  >
                    {dictionary.marketplace?.placeOrder || 'Place Order'}
                  </Button>
                </motion.div>
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button variant="outline" asChild className="min-w-[120px]">
                    <Link
                      href={`/${locale}/marketplace/${active.id}`}
                      onClick={() => setActive(null)}
                      prefetch={true}
                    >
                      {dictionary.marketplace?.learnMore || 'Learn More'}
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {dictionary.marketplace?.categories?.[cat] || cat}
            </Button>
          ))}
        </div>
        <Input
          placeholder={dictionary.common?.search || 'Search...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
        {filteredServices.map((service, index) => (
          <motion.div
            layoutId={`card-${service.id}-${id}`}
            key={service.id}
            onClick={() => setActive(service)}
            onMouseEnter={() => handlePrefetch(service.id)}
            onFocus={() => handlePrefetch(service.id)}
            className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            dir={rtl ? 'rtl' : 'ltr'}
            tabIndex={0}
            role="button"
            aria-label={rtl ? service.titleAr || service.title : service.title}
          >
            <div className="py-4 text-center">
              <motion.div
                layoutId={`image-${service.id}-${id}`}
                className="flex justify-center items-center mb-4"
                style={{ height: '200px' }}
              >
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={rtl ? service.titleAr || service.title : service.title}
                    width={160}
                    height={160}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                    className="w-auto h-auto max-h-full object-contain"
                    priority={index < 4}
                    loading={index < 4 ? 'eager' : 'lazy'}
                  />
                ) : (
                  <div className="w-40 h-40 bg-muted rounded-lg flex items-center justify-center">
                    <ServiceIcon
                      category={service.category.type}
                      className="h-16 w-16 text-muted-foreground"
                    />
                  </div>
                )}
              </motion.div>
              <div className="space-y-2">
                <Badge variant="secondary" className="mb-2">
                  {dictionary.marketplace?.categories?.[service.category.type] ||
                    service.category.name}
                </Badge>
                <motion.h2
                  layoutId={`title-${service.id}-${id}`}
                  className="text-lg font-semibold text-foreground"
                >
                  {rtl ? service.titleAr || service.title : service.title}
                </motion.h2>
                <motion.p
                  layoutId={`description-${service.id}-${id}`}
                  className="text-muted-foreground text-sm leading-relaxed line-clamp-2"
                >
                  {rtl
                    ? service.descriptionAr || service.description
                    : service.description}
                </motion.p>
                <motion.p
                  layoutId={`price-${service.id}-${id}`}
                  className="text-primary text-sm font-semibold"
                >
                  {formatPrice(
                    Number(service.priceMin),
                    service.priceMax ? Number(service.priceMax) : null,
                    service.currency,
                    dictionary
                  )}
                </motion.p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {dictionary.common?.noResults || 'No results found'}
        </div>
      )}
    </>
  );
}
