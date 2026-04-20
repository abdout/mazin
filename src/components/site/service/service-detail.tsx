"use client";

import { useState, useEffect, useMemo, useRef, type RefObject } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/template/timeline/timeline";
import type { Dictionary } from "@/components/internationalization/types";
import type { Locale } from "@/components/internationalization";

import { TableOfContents } from "./table-of-contents";
import { servicesItems, DEFAULT_SERVICE_ID } from "./constant";
import type { ServiceCtaTarget } from "./types";

interface ServiceDetailPageProps {
  dictionary: Dictionary;
  lang: Locale;
}

function resolveCtaHref(target: ServiceCtaTarget, lang: Locale): string {
  switch (target) {
    case "dashboard":
      return `/${lang}/dashboard`;
    case "contact":
      return `/${lang}/contact`;
    case "track":
      return `/${lang}/track`;
    case "marketplace":
      return `/${lang}/marketplace`;
    default:
      return `/${lang}`;
  }
}

export function ServiceDetailPage({ dictionary, lang }: ServiceDetailPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedId = searchParams.get("id") ?? DEFAULT_SERVICE_ID;

  const activeService = useMemo(
    () => servicesItems.find((s) => s.id === requestedId) ?? servicesItems[0]!,
    [requestedId]
  );

  const servicePage = dictionary.marketing.servicePage;
  const copy = servicePage?.catalog[activeService.id];
  const sections = servicePage?.sections;

  const [activeSection, setActiveSection] = useState("overview");

  const overviewRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const advantagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refs: Array<{ id: string; ref: RefObject<HTMLDivElement | null> }> = [
      { id: "overview", ref: overviewRef },
      { id: "features", ref: featuresRef },
      { id: "process", ref: processRef },
      { id: "advantages", ref: advantagesRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const match = refs.find((r) => r.ref.current === entry.target);
            if (match) setActiveSection(match.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px -40% 0px" }
    );

    refs.forEach(({ ref }) => ref.current && observer.observe(ref.current));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (ref: RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const switchService = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("id", id);
    router.replace(url.pathname + url.search, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!copy || !sections) {
    return (
      <div className="min-h-screen bg-primary text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Service not available</h1>
          <p className="text-white/70">
            The service page dictionary is not loaded for locale &ldquo;{lang}&rdquo;.
          </p>
        </div>
      </div>
    );
  }

  const ctaHref = resolveCtaHref(activeService.ctaTarget, lang);
  const otherServices = servicesItems.filter((s) => s.id !== activeService.id);

  return (
    <main className="bg-primary text-white">
      {/* Hero */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <Image
          src={activeService.image}
          alt={`${copy.title.firstLine} ${copy.title.secondLine}`}
          fill
          priority
          className="object-cover brightness-50"
          sizes="100vw"
        />
        <div className="absolute inset-0 flex items-end pb-12">
          <div
            className="w-full"
            style={{ paddingInline: "var(--container-padding, 2rem)" }}
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-6xl font-bold text-start"
              >
                <span className="block">{copy.title.firstLine}</span>
                <span className="block">{copy.title.secondLine}</span>
              </motion.h1>
              <nav className="flex flex-wrap gap-2 justify-end">
                {servicesItems.map((s) => {
                  const Icon = s.icon;
                  const isActive = s.id === activeService.id;
                  const label =
                    servicePage.catalog[s.id]?.title.firstLine ?? s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => switchService(s.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition ${
                        isActive
                          ? "bg-white text-primary"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div
        className="relative pb-0 pt-12 pe-0 lg:pe-64 xl:pe-72 ps-8"
        style={{ paddingInline: "var(--container-padding, 2rem)" }}
      >
        <TableOfContents
          activeSection={activeSection}
          overviewRef={overviewRef}
          featuresRef={featuresRef}
          processRef={processRef}
          advantagesRef={advantagesRef}
          scrollToSection={scrollToSection}
          labels={{
            onThisPage: sections.onThisPage,
            overview: sections.overview,
            features: sections.features,
            process: sections.process,
            advantages: sections.advantages,
          }}
        />

        {/* Overview */}
        <section id="overview" ref={overviewRef} className="py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {sections.whyChoose}{" "}
                <span className="text-white/80">
                  {copy.title.firstLine} {copy.title.secondLine}
                </span>
              </h2>
              <p className="text-lg text-neutral-300 leading-relaxed">
                {copy.detailedDescription}
              </p>
            </div>
            <div className="lg:col-span-5 space-y-4">
              {copy.advantages.slice(0, 3).map((advantage, i) => (
                <div key={advantage} className="flex items-start gap-3">
                  <CheckCircle
                    className="size-5 text-white shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold">{advantage}</p>
                    {copy.advantagesDescriptions[i] && (
                      <p className="text-sm text-neutral-400 mt-1">
                        {copy.advantagesDescriptions[i]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" ref={featuresRef} className="py-16 lg:py-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">
            {sections.features}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {copy.features.map((feature, index) => (
              <div
                key={feature}
                className="bg-white/5 p-6 rounded-lg border border-white/10"
              >
                <div className="text-2xl font-bold text-white/40 mb-3">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="text-base leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section id="process" ref={processRef} className="py-16 lg:py-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {sections.process}
          </h2>
          <Timeline
            data={copy.process.map((step) => ({
              title: step.title,
              content: (
                <p className="text-base md:text-lg text-neutral-300 leading-relaxed">
                  {step.body}
                </p>
              ),
            }))}
          />
        </section>

        {/* Advantages */}
        <section id="advantages" ref={advantagesRef} className="py-16 lg:py-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">
            {sections.advantages}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {copy.advantages.map((advantage, i) => (
              <div
                key={advantage}
                className="flex items-start gap-4 bg-white/5 rounded-lg p-6 border border-white/10"
              >
                <CheckCircle
                  className="size-6 text-white shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xl font-semibold mb-2">{advantage}</h3>
                  {copy.advantagesDescriptions[i] && (
                    <p className="text-neutral-400 leading-relaxed">
                      {copy.advantagesDescriptions[i]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section py-16 lg:py-24 my-8 bg-white/5 rounded-lg border border-white/10 px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                {sections.readyTitle}
              </h2>
              <p className="text-neutral-300 text-lg">{sections.readyBody}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href={ctaHref}>{sections.getQuote}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Link href={`/${lang}/services`}>{sections.learnMore}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Other services */}
        <section className="py-16 lg:py-24">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            {sections.otherServices}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherServices.map((s) => {
              const Icon = s.icon;
              const card = servicePage.catalog[s.id];
              if (!card) return null;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => switchService(s.id)}
                  className="text-start bg-white/5 rounded-lg p-6 border border-white/10 transition hover:bg-white/10 hover:border-white/20"
                >
                  <Icon
                    className="size-8 text-white mb-4"
                    aria-hidden="true"
                  />
                  <h3 className="text-lg font-semibold mb-2">
                    {card.title.firstLine} {card.title.secondLine}
                  </h3>
                  <p className="text-sm text-neutral-400 line-clamp-2">
                    {card.description.firstLine} {card.description.secondLine}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
