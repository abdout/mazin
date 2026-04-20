import type { Metadata } from "next";
import { Suspense } from "react";

import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization";
import { SiteHeader } from "@/components/template/site-header";
import { Footer } from "@/components/marketing/footer";

import { ServiceDetailPage, DEFAULT_SERVICE_ID } from "@/components/site/service";

interface ServiceRouteProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ id?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ServiceRouteProps): Promise<Metadata> {
  const { lang: langParam } = await params;
  const { id: requestedId } = await searchParams;
  const lang = langParam as Locale;
  const id = requestedId ?? DEFAULT_SERVICE_ID;
  const dict = await getDictionary(lang);

  const catalog = dict.marketing.servicePage?.catalog;
  const copy = catalog?.[id] ?? catalog?.[DEFAULT_SERVICE_ID];

  const title = copy
    ? `${copy.title.firstLine} ${copy.title.secondLine} | Mazin`
    : "Mazin | Port Sudan Customs Clearance";
  const description = copy
    ? `${copy.description.firstLine} ${copy.description.secondLine}`
    : undefined;

  return {
    title,
    ...(description ? { description } : {}),
    openGraph: {
      title,
      ...(description ? { description } : {}),
      images: [{ url: `/service/${id}.jpg` }],
      locale: lang === "ar" ? "ar_SD" : "en_US",
      type: "website",
    },
    alternates: {
      canonical: `/${lang}/service?id=${id}`,
      languages: {
        "ar-SD": `/ar/service?id=${id}`,
        "en-US": `/en/service?id=${id}`,
      },
    },
  };
}

export default async function ServiceRoutePage({ params }: ServiceRouteProps) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dictionary={dict} />
      <Suspense fallback={<div className="min-h-screen bg-primary" />}>
        <ServiceDetailPage dictionary={dict} lang={lang} />
      </Suspense>
      <Footer dictionary={dict} lang={lang} />
    </>
  );
}
