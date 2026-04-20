'use client'

import React from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  GitHubNewIcon,
  TwitterIcon,
  LinkedInNewIcon,
  InstagramIcon,
  FacebookIcon,
  WhatsAppIcon,
} from "@/components/atom/icons";
import { Dictionary } from "@/components/internationalization/types";
import Link from "next/link";
import { ReportIssue } from "@/components/report-issue";

interface FooterProps {
  dictionary: Dictionary;
  lang: string;
}

interface FooterLink {
  label: string;
  href: string;
}

export function Footer({ dictionary, lang }: FooterProps) {
  const { footer } = dictionary.marketing;

  const productLinks: FooterLink[] = [
    { label: footer.links.home, href: `/${lang}` },
    { label: footer.links.features, href: `/${lang}#services` },
    { label: footer.links.tracking, href: `/${lang}/dashboard` },
    { label: footer.links.solutions, href: `/${lang}#solutions` },
    { label: footer.links.pricing, href: `/${lang}#pricing` },
    { label: footer.contact, href: `/${lang}/about` },
  ];

  const companyLinks: FooterLink[] = [
    { label: footer.links.about, href: `/${lang}/about` },
    { label: footer.links.careers, href: `/${lang}/about` },
    { label: footer.links.blog, href: `/${lang}/blog` },
  ];

  const serviceLinks: FooterLink[] = [
    { label: footer.links.import, href: `/${lang}#services` },
    { label: footer.links.export, href: `/${lang}#services` },
    { label: footer.links.warehouse, href: `/${lang}#services` },
    { label: footer.links.transport, href: `/${lang}#services` },
  ];

  const supportLinks: FooterLink[] = [
    { label: footer.links.helpCenter, href: `/${lang}/about` },
    { label: footer.links.documentation, href: `/${lang}/about` },
    { label: footer.links.status, href: `/${lang}/about` },
  ];

  return (
    <footer className="bg-[oklch(0.145_0_0)] text-[oklch(0.97_0_0)]">
      <div className="layout-container py-20 md:py-28">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row gap-12 md:gap-10">
          {/* Logo & Description */}
          <div className="md:w-1/4">
            <Link href={`/${lang}`} className="inline-block mb-5">
              <OptimizedImage
                src="/logo.png"
                alt={dictionary.common.appName}
                width={160}
                height={50}
                className="h-12 w-auto invert"
              />
            </Link>
            <p className="text-base text-white/70 leading-relaxed max-w-[280px]">
              {footer.description}
            </p>
          </div>

          {/* Links Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-white mb-5">{footer.quickLinks}</h3>
              <ul className="space-y-3">
                {productLinks.map((item, index) => (
                  <li key={index}>
                    <Link href={item.href} className="text-base text-white/70 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-white mb-5">{footer.company}</h3>
              <ul className="space-y-3">
                {companyLinks.map((item, index) => (
                  <li key={index}>
                    <Link href={item.href} className="text-base text-white/70 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-white mb-5">{footer.services}</h3>
              <ul className="space-y-3">
                {serviceLinks.map((item, index) => (
                  <li key={index}>
                    <Link href={item.href} className="text-base text-white/70 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-white mb-5">{footer.contact}</h3>
              <ul className="space-y-3">
                {supportLinks.map((item, index) => (
                  <li key={index}>
                    <Link href={item.href} className="text-base text-white/70 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="md:w-1/4">
            <h3 className="font-semibold text-white mb-5">{footer.newsletter.title}</h3>
            <p className="text-sm text-white/60 mb-4">{footer.newsletter.description}</p>
            <form className="relative inline-flex items-center mb-6 w-full" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder={footer.newsletter.placeholder}
                className="h-12 w-full ps-5 pe-28 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute end-1.5 bg-white hover:bg-white/90 text-black font-medium h-9 px-5 rounded-full text-sm transition-colors"
              >
                {footer.newsletter.button}
              </button>
            </form>
            {/* Social Icons */}
            <div className="flex items-center gap-5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110"
              >
                <GitHubNewIcon className="h-8 w-8 text-white/70 hover:text-white transition-colors" />
              </a>
              <a href="#" className="transition-transform hover:scale-110">
                <TwitterIcon className="h-8 w-8 text-white/70 hover:text-white transition-colors" />
              </a>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110"
              >
                <LinkedInNewIcon className="h-8 w-8 text-white/70 hover:text-white transition-colors" />
              </a>
              <a href="#" className="transition-transform hover:scale-110">
                <InstagramIcon className="h-8 w-8 text-white/70 hover:text-white transition-colors" />
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110"
              >
                <FacebookIcon className="h-8 w-8 text-white/70 hover:text-white transition-colors" />
              </a>
              <a
                href={`https://wa.me/${footer.contactInfo.phone.replace(/[^0-9+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-110"
              >
                <WhatsAppIcon className="h-8 w-8 text-white/70 hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="layout-container py-6">
          <div className="flex items-center justify-between">
            <p className="text-white/50 text-sm">
              &copy; {new Date().getFullYear()} {dictionary.common.appName}. {footer.copyright}
            </p>
            <div className="text-white/50 text-sm">
              <ReportIssue />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
