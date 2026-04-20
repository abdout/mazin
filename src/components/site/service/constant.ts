import {
  ShieldCheck,
  FileCheck2,
  ScanSearch,
  Timer,
  Radar,
  Store,
  FileClock,
  ClipboardList,
} from "./custom-icons";
import type { ServiceItem } from "./types";

/**
 * Mazin service catalog — structural metadata only.
 *
 * All user-facing strings live in the dictionary under
 * `marketing.servicePage.catalog[id]`. This file only carries
 * id, icon, image, and CTA target.
 */
export const servicesItems: ServiceItem[] = [
  {
    id: "customs-clearance",
    icon: ShieldCheck,
    image: "/service/customs.jpg",
    ctaTarget: "dashboard",
  },
  {
    id: "document-processing",
    icon: FileCheck2,
    image: "/service/documents.jpg",
    ctaTarget: "dashboard",
  },
  {
    id: "inspection-coordination",
    icon: ScanSearch,
    image: "/service/inspection.jpg",
    ctaTarget: "contact",
  },
  {
    id: "port-fees-demurrage",
    icon: Timer,
    image: "/service/port.jpg",
    ctaTarget: "dashboard",
  },
  {
    id: "tracking-notifications",
    icon: Radar,
    image: "/service/tracking.jpg",
    ctaTarget: "track",
  },
  {
    id: "marketplace-logistics",
    icon: Store,
    image: "/service/marketplace.jpg",
    ctaTarget: "marketplace",
  },
  {
    id: "advance-cargo-declaration",
    icon: FileClock,
    image: "/service/acd.jpg",
    ctaTarget: "dashboard",
  },
  {
    id: "im-form-processing",
    icon: ClipboardList,
    image: "/service/im-form.jpg",
    ctaTarget: "dashboard",
  },
];

export const DEFAULT_SERVICE_ID = "customs-clearance";
