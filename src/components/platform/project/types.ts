// Shipment Types (replaces Systems)
export type ShipmentType =
  | 'IMPORT_SEA_FCL'
  | 'IMPORT_SEA_LCL'
  | 'IMPORT_AIR'
  | 'IMPORT_LAND'
  | 'EXPORT_SEA'
  | 'EXPORT_AIR'
  | 'EXPORT_LAND'
  | 'TRANSIT'
  | 'RE_EXPORT';

// Incoterms
export type Incoterm =
  | 'EXW' | 'FCA' | 'FAS' | 'FOB'
  | 'CFR' | 'CIF' | 'CPT' | 'CIP'
  | 'DAP' | 'DPU' | 'DDP';

// Currency
export type Currency = 'USD' | 'EUR' | 'SAR' | 'AED' | 'GBP' | 'CNY' | 'JPY';

// Status types
export type ShipmentStatus = 'pending' | 'in_progress' | 'customs_hold' | 'released' | 'delivered';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type ClearancePhase = 'documentation' | 'pre_clearance' | 'declaration' | 'inspection' | 'payment' | 'release' | 'delivery';

export interface TeamMember {
  id: string;
  name: string;
}

export interface TeamLead {
  id: string;
  name: string;
}

// Customs Broker (replaces Kit)
export interface Broker {
  id: string;
  name: string;
  license?: string;
}

// Transport Carrier (replaces Car)
export interface Carrier {
  id: string;
  name: string;
  type?: 'trucking' | 'shipping_line' | 'airline' | 'freight_forwarder';
}

// Clearance Stage (replaces Activity)
export interface Stage {
  shipmentType?: string;
  stage?: string;
  substage?: string;
  task?: string;
}

export interface StageCategory {
  item: string;
  subitems: Array<{
    name: string;
    tasks: string[];
  }>;
}

export interface StageWithType {
  shipmentType: ShipmentType;
  stage: string;
  substage: string;
  task: string;
}

export interface ProjectCreateFormProps {
  projectToEdit?: Project | null;
  onSuccess?: () => Promise<void>;
  onClose?: () => void;
}

// Keep Activity as alias for backward compatibility during migration
export interface Activity {
  system?: string;
  category?: string;
  subcategory?: string;
  activity?: string;
}

export interface Project {
  id?: string;
  _id?: string;

  // Basic Information
  customer?: string | null;
  description?: string | null;
  location?: string | null;

  // Custom Clearance Specific
  shipmentReference?: string | null;
  blAwbNumber?: string | null;
  containerNumbers?: string[];
  customsDeclarationNumber?: string | null;
  brokerReference?: string | null;

  // Trade Terms
  incoterm?: Incoterm | null;

  // Ports & Locations
  portOfOrigin?: string | null;
  portOfDestination?: string | null;
  countryOfOrigin?: string | null;
  countryOfDestination?: string | null;

  // Cargo Details
  hsCode?: string;
  hsCodeDescription?: string;
  cargoValue?: number;
  currency?: Currency;
  weight?: number;
  weightUnit?: 'KG' | 'LBS' | 'MT';
  packages?: number;
  packageType?: string;

  // Financial
  dutyAmount?: number;
  vatAmount?: number;
  otherFees?: number;
  totalCharges?: number;

  // Legacy fields (keeping for compatibility)
  client?: string;
  consultant?: string;

  // Status (supports both lowercase and Prisma uppercase)
  status?: ShipmentStatus | "pending" | "on_progress" | "done" | "stuck" | "PENDING" | "IN_PROGRESS" | "CUSTOMS_HOLD" | "RELEASED" | "DELIVERED";
  priority?: Priority | "high" | "medium" | "low" | "pending" | "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  phase?: ClearancePhase | "approved" | "started" | "half_way" | "handover";

  // Team
  team?: string[];
  teamLead?: string | null;

  // Shipment Types & Stages (replaces systems & activities)
  shipmentTypes?: string[];
  stages?: Stage[];

  // Legacy aliases
  systems?: string[];
  activities?: Activity[] | unknown;

  // Resources
  brokers?: string[];
  carriers?: string[];
  warehouseLocation?: string;
  shippingLine?: string;

  // Legacy aliases
  mobilization?: string;
  accommodation?: string;
  kits?: string[];
  cars?: string[];

  // Dates
  arrivalDate?: Date | null;
  releaseDate?: Date | null;
  deliveryDate?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  // Related
  tasks?: unknown[];
  userId?: string;
}

// Alias for backward compatibility
export type Systems = ShipmentType;
