"use client";

import React from "react";
import ExpandButton from "@/components/atom/expand-button";
import { ArrowRight, ArrowLeft } from "lucide-react";
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

interface ReadySectionProps {
  dictionary: Dictionary;
  lang: string;
  isRTL?: boolean;
}

export default function ReadySection({ dictionary, lang, isRTL = false }: ReadySectionProps) {
  const { footer } = dictionary.marketing;

  return (
    <div className="min-w-[300px] w-2/6" data-section="ready-to-build">
      <p className="font-medium mb-4 text-[oklch(1_0_0)]">
        {dictionary.marketing.footer.readyToGetStarted}
      </p>
      <Link href={`/${lang}/login`}>
        <ExpandButton
          variant="white"
          className={`group flex items-center mb-6 cursor-pointer ${
            isRTL ? "flex-row-reverse justify-center md:justify-start" : ""
          }`}
        >
          <span
            className={`transition-all duration-300 ${
              isRTL
                ? "order-2 group-hover:order-1"
                : "order-1 group-hover:order-2"
            }`}
          >
            {dictionary.header.signUp}
          </span>
          {isRTL ? (
            <ArrowLeft
              className={`order-1 transition-all duration-300 group-hover:order-2 group-hover:-translate-x-1 h-4 w-4 ${
                isRTL
                  ? "mr-2 md:mr-2 group-hover:mr-0 group-hover:ml-2"
                  : "ml-2 group-hover:ml-0 group-hover:mr-2"
              }`}
            />
          ) : (
            <ArrowRight className="order-2 ml-2 group-hover:ml-0 group-hover:mr-2 h-4 w-4 transition-all duration-300 group-hover:order-1 group-hover:translate-x-1" />
          )}
        </ExpandButton>
      </Link>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-transform hover:scale-110"
        >
          <GitHubNewIcon className="h-10 w-10 md:h-8 md:w-8 cursor-pointer transition-colors text-[oklch(1_0_0)] hover:text-[oklch(0.97_0_0)]" />
        </a>
        <a href="#" className="transition-transform hover:scale-110">
          <TwitterIcon className="h-10 w-10 md:h-8 md:w-8 cursor-pointer transition-colors text-[oklch(1_0_0)] hover:text-[oklch(0.97_0_0)]" />
        </a>
        <a
          href="https://www.linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-transform hover:scale-110"
        >
          <LinkedInNewIcon className="h-10 w-10 md:h-8 md:w-8 cursor-pointer transition-colors text-[oklch(1_0_0)] hover:text-[oklch(0.97_0_0)]" />
        </a>
        <a href="#" className="transition-transform hover:scale-110">
          <InstagramIcon className="h-10 w-10 md:h-8 md:w-8 cursor-pointer transition-colors text-[oklch(1_0_0)] hover:text-[oklch(0.97_0_0)]" />
        </a>
        <a
          href="https://www.facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-transform hover:scale-110"
        >
          <FacebookIcon className="h-10 w-10 md:h-8 md:w-8 cursor-pointer transition-colors text-[oklch(1_0_0)] hover:text-[oklch(0.97_0_0)]" />
        </a>
        <a
          href="https://wa.me/+249123456789"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-transform hover:scale-110"
        >
          <WhatsAppIcon className="h-10 w-10 md:h-8 md:w-8 cursor-pointer transition-colors text-[oklch(1_0_0)] hover:text-[oklch(0.97_0_0)]" />
        </a>
      </div>
    </div>
  );
}
