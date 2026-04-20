import type { LucideIcon } from "lucide-react";

export type ServiceCtaTarget = "dashboard" | "contact" | "track" | "marketplace";

export interface ServiceItem {
  id: string;
  icon: LucideIcon;
  image: string;
  ctaTarget: ServiceCtaTarget;
}

export interface ServiceCopyTitle {
  firstLine: string;
  secondLine: string;
}

export interface ServiceCopyDescription {
  firstLine: string;
  secondLine: string;
}

export interface ServiceCopyProcessStep {
  title: string;
  body: string;
}

export interface ServiceCopy {
  title: ServiceCopyTitle;
  description: ServiceCopyDescription;
  detailedDescription: string;
  features: string[];
  advantages: string[];
  advantagesDescriptions: string[];
  process: ServiceCopyProcessStep[];
}

export interface ServicePageSectionsDict {
  overview: string;
  features: string;
  process: string;
  advantages: string;
  whyChoose: string;
  onThisPage: string;
  otherServices: string;
  readyTitle: string;
  readyBody: string;
  getQuote: string;
  learnMore: string;
}

export type ServicePageCatalog = Record<string, ServiceCopy>;

export interface ServicePageDict {
  sections: ServicePageSectionsDict;
  catalog: ServicePageCatalog;
}
