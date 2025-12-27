import { TeamMember, TeamLead, Broker, Carrier, Project } from './types';

// Clearance Stages (replaces activities)
export const clearanceStages = {
  "IMPORT_SEA_FCL": {
    items: {
      "Documentation": {
        activities: [
          "Bill of Lading Collection",
          "Commercial Invoice Verification",
          "Packing List Review",
          "Certificate of Origin",
          "HS Code Classification",
          "Import License Check",
          "Insurance Certificate",
          "Fumigation Certificate",
        ],
      },
      "Pre-Clearance": {
        activities: [
          "Arrival Notice Processing",
          "Manifest Review",
          "Tariff Calculation",
          "Duty Rate Assessment",
          "Pre-Alert Submission",
          "Shipping Line Coordination",
          "Terminal Liaison",
        ],
      },
      "Customs Declaration": {
        activities: [
          "SAD Filing",
          "Document Verification",
          "Risk Assessment Review",
          "Physical Inspection Coordination",
          "Sample Collection",
          "Lab Test Coordination",
        ],
      },
      "Payment": {
        activities: [
          "Duty Calculation Verification",
          "VAT Calculation",
          "Port Charges Assessment",
          "Handling Fees",
          "Storage Charges",
          "Payment Processing",
          "Receipt Collection",
        ],
      },
      "Release": {
        activities: [
          "Customs Release Order",
          "Terminal Release",
          "Container Pick-up",
          "Gate-Out Documentation",
          "Transport Coordination",
        ],
      },
      "Delivery": {
        activities: [
          "Empty Container Return",
          "Final Delivery Confirmation",
          "Proof of Delivery",
          "Client Sign-Off",
        ],
      },
      "Post-Clearance": {
        activities: [
          "Audit Trail Documentation",
          "Compliance Verification",
          "Record Archiving",
          "Refund Processing",
        ],
      },
    },
  },

  "IMPORT_SEA_LCL": {
    items: {
      "Documentation": {
        activities: [
          "House Bill of Lading",
          "Master Bill of Lading Verification",
          "Commercial Invoice Verification",
          "Packing List Review",
          "Certificate of Origin",
          "HS Code Classification",
          "Consolidation Manifest",
        ],
      },
      "Pre-Clearance": {
        activities: [
          "Arrival Notice Processing",
          "Deconsolidation Coordination",
          "Manifest Review",
          "Tariff Calculation",
          "Duty Rate Assessment",
          "CFS Liaison",
        ],
      },
      "Customs Declaration": {
        activities: [
          "SAD Filing",
          "Document Verification",
          "Risk Assessment",
          "Physical Inspection",
          "Cargo Segregation",
        ],
      },
      "Payment": {
        activities: [
          "Duty Calculation",
          "VAT Calculation",
          "CFS Charges",
          "Handling Fees",
          "Payment Processing",
        ],
      },
      "Release": {
        activities: [
          "Customs Release",
          "CFS Release",
          "Cargo Collection",
          "Transport Coordination",
        ],
      },
      "Delivery": {
        activities: [
          "Final Delivery",
          "Proof of Delivery",
          "Client Sign-Off",
        ],
      },
      "Post-Clearance": {
        activities: [
          "Audit Documentation",
          "Compliance Check",
          "Record Keeping",
        ],
      },
    },
  },

  "IMPORT_AIR": {
    items: {
      "Documentation": {
        activities: [
          "Air Waybill Collection",
          "Commercial Invoice",
          "Packing List",
          "Certificate of Origin",
          "HS Code Classification",
          "Special Cargo Documentation",
          "Dangerous Goods Declaration",
        ],
      },
      "Pre-Clearance": {
        activities: [
          "Flight Manifest Review",
          "Arrival Notification",
          "Tariff Calculation",
          "Duty Assessment",
          "Airline Coordination",
          "Ground Handler Liaison",
        ],
      },
      "Customs Declaration": {
        activities: [
          "SAD Filing",
          "E-Declaration Submission",
          "Document Verification",
          "Risk Assessment",
          "Physical Inspection",
          "X-Ray Screening Review",
        ],
      },
      "Payment": {
        activities: [
          "Duty Calculation",
          "VAT Calculation",
          "Airport Handling Charges",
          "Terminal Charges",
          "Payment Processing",
        ],
      },
      "Release": {
        activities: [
          "Customs Release",
          "Airline Release",
          "Cargo Collection",
          "Transport Arrangement",
        ],
      },
      "Delivery": {
        activities: [
          "Final Delivery",
          "Proof of Delivery",
          "Client Sign-Off",
        ],
      },
      "Post-Clearance": {
        activities: [
          "Audit Trail",
          "Compliance Verification",
          "Record Archiving",
        ],
      },
    },
  },

  "IMPORT_LAND": {
    items: {
      "Documentation": {
        activities: [
          "CMR/Road Consignment Note",
          "Commercial Invoice",
          "Packing List",
          "Certificate of Origin",
          "HS Code Classification",
          "TIR Carnet",
          "Vehicle Documents",
        ],
      },
      "Pre-Clearance": {
        activities: [
          "Border Pre-Alert",
          "Manifest Declaration",
          "Tariff Calculation",
          "Route Planning",
          "Transit Documentation",
        ],
      },
      "Customs Declaration": {
        activities: [
          "Border Declaration",
          "Document Verification",
          "Physical Inspection",
          "Vehicle Inspection",
          "Seal Verification",
        ],
      },
      "Payment": {
        activities: [
          "Duty Calculation",
          "VAT Calculation",
          "Border Crossing Fees",
          "Payment Processing",
        ],
      },
      "Release": {
        activities: [
          "Customs Release",
          "Border Clearance",
          "Transport Continuation",
        ],
      },
      "Delivery": {
        activities: [
          "Final Delivery",
          "Proof of Delivery",
          "Client Sign-Off",
        ],
      },
      "Post-Clearance": {
        activities: [
          "Audit Documentation",
          "Compliance Check",
          "Record Keeping",
        ],
      },
    },
  },

  "EXPORT_SEA": {
    items: {
      "Documentation": {
        activities: [
          "Commercial Invoice Preparation",
          "Packing List Creation",
          "Bill of Lading Draft",
          "Certificate of Origin Application",
          "HS Code Classification",
          "Export License",
          "Letter of Credit Documents",
        ],
      },
      "Pre-Clearance": {
        activities: [
          "Booking Confirmation",
          "Container Allocation",
          "Stuffing Plan",
          "VGM Declaration",
          "Terminal Booking",
        ],
      },
      "Customs Declaration": {
        activities: [
          "Export Declaration (EX-1)",
          "Document Submission",
          "Exit Summary",
          "Inspection Coordination",
        ],
      },
      "Payment": {
        activities: [
          "Export Fees",
          "Terminal Charges",
          "Documentation Fees",
          "Payment Processing",
        ],
      },
      "Release": {
        activities: [
          "Customs Release",
          "Gate-In Documentation",
          "Loading Confirmation",
          "BL Issuance",
        ],
      },
      "Shipping": {
        activities: [
          "Vessel Loading Confirmation",
          "Sailing Confirmation",
          "Document Dispatch",
          "Client Notification",
        ],
      },
      "Post-Clearance": {
        activities: [
          "Audit Trail",
          "Export Statistics",
          "Record Archiving",
        ],
      },
    },
  },

  "EXPORT_AIR": {
    items: {
      "Documentation": {
        activities: [
          "Commercial Invoice",
          "Packing List",
          "AWB Preparation",
          "Certificate of Origin",
          "HS Code Classification",
          "Export Permit",
          "Dangerous Goods Declaration",
        ],
      },
      "Pre-Clearance": {
        activities: [
          "Flight Booking",
          "Cargo Dimensions Check",
          "Security Screening",
          "Airline Coordination",
        ],
      },
      "Customs Declaration": {
        activities: [
          "Export Declaration",
          "Document Verification",
          "Physical Inspection",
        ],
      },
      "Payment": {
        activities: [
          "Airline Charges",
          "Handling Fees",
          "Export Fees",
          "Payment Processing",
        ],
      },
      "Release": {
        activities: [
          "Customs Release",
          "Cargo Acceptance",
          "AWB Finalization",
        ],
      },
      "Shipping": {
        activities: [
          "Flight Manifest",
          "Loading Confirmation",
          "Departure Confirmation",
          "Client Notification",
        ],
      },
      "Post-Clearance": {
        activities: [
          "Audit Trail",
          "Record Archiving",
        ],
      },
    },
  },

  "EXPORT_LAND": {
    items: {
      "Documentation": {
        activities: [
          "Commercial Invoice",
          "Packing List",
          "CMR/Consignment Note",
          "Certificate of Origin",
          "HS Code Classification",
          "Export Permit",
          "TIR Carnet",
        ],
      },
      "Pre-Clearance": {
        activities: [
          "Transport Booking",
          "Loading Plan",
          "Route Planning",
          "Border Pre-Alert",
        ],
      },
      "Customs Declaration": {
        activities: [
          "Export Declaration",
          "Document Verification",
          "Vehicle Inspection",
          "Seal Application",
        ],
      },
      "Payment": {
        activities: [
          "Export Fees",
          "Transport Charges",
          "Border Fees",
          "Payment Processing",
        ],
      },
      "Release": {
        activities: [
          "Customs Release",
          "Border Clearance",
          "Departure Confirmation",
        ],
      },
      "Post-Clearance": {
        activities: [
          "Proof of Exit",
          "Audit Trail",
          "Record Archiving",
        ],
      },
    },
  },

  "TRANSIT": {
    items: {
      "Documentation": {
        activities: [
          "Transit Declaration (T1/T2)",
          "Bill of Lading/AWB",
          "Commercial Invoice",
          "Packing List",
          "Guarantee/Bond",
          "TIR Carnet",
        ],
      },
      "Entry Clearance": {
        activities: [
          "Entry Point Declaration",
          "Document Verification",
          "Seal Application",
          "Transit Route Approval",
        ],
      },
      "Transit Monitoring": {
        activities: [
          "GPS Tracking",
          "Checkpoint Verification",
          "Time Limit Monitoring",
          "Route Compliance",
        ],
      },
      "Exit Clearance": {
        activities: [
          "Exit Declaration",
          "Seal Verification",
          "Document Discharge",
          "Guarantee Release",
        ],
      },
      "Post-Transit": {
        activities: [
          "Transit Completion Report",
          "Compliance Verification",
          "Record Archiving",
        ],
      },
    },
  },

  "RE_EXPORT": {
    items: {
      "Documentation": {
        activities: [
          "Original Import Declaration",
          "Re-Export Application",
          "Commercial Invoice",
          "Packing List",
          "HS Code Verification",
          "Duty Exemption Application",
        ],
      },
      "Pre-Clearance": {
        activities: [
          "Duty Drawback Calculation",
          "Original Entry Verification",
          "Booking Confirmation",
        ],
      },
      "Customs Declaration": {
        activities: [
          "Re-Export Declaration",
          "Document Verification",
          "Physical Inspection",
          "Goods Identification",
        ],
      },
      "Payment": {
        activities: [
          "Fee Calculation",
          "Refund Processing",
          "Payment Reconciliation",
        ],
      },
      "Release": {
        activities: [
          "Customs Release",
          "Export Confirmation",
          "Document Finalization",
        ],
      },
      "Post-Clearance": {
        activities: [
          "Duty Refund Collection",
          "Audit Trail",
          "Record Archiving",
        ],
      },
    },
  },
};

// Legacy alias for backward compatibility
export const activities = clearanceStages;

// Team Members
export const TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Ahmed Al-Rashid' },
  { id: '2', name: 'Fatima Hassan' },
  { id: '3', name: 'Mohammed Khalil' },
  { id: '4', name: 'Sara Al-Mutairi' },
  { id: '5', name: 'Omar Ibrahim' },
];

export const TEAM_LEADS: TeamLead[] = [
  { id: '1', name: 'Ahmed Al-Rashid' },
  { id: '2', name: 'Fatima Hassan' },
  { id: '3', name: 'Sara Al-Mutairi' },
];

// Customs Brokers (replaces KITS)
export const BROKERS: Broker[] = [
  { id: '1', name: 'Gulf Customs Services', license: 'CB-2024-001' },
  { id: '2', name: 'Al-Rashid Clearing', license: 'CB-2024-002' },
  { id: '3', name: 'Maritime Logistics', license: 'CB-2024-003' },
  { id: '4', name: 'Express Customs', license: 'CB-2024-004' },
  { id: '5', name: 'Port Authority Brokers', license: 'CB-2024-005' },
];

// Transport Carriers (replaces CARS)
export const CARRIERS: Carrier[] = [
  { id: '1', name: 'Gulf Trucking Co.', type: 'trucking' },
  { id: '2', name: 'Maersk Line', type: 'shipping_line' },
  { id: '3', name: 'Emirates SkyCargo', type: 'airline' },
  { id: '4', name: 'DHL Global Forwarding', type: 'freight_forwarder' },
  { id: '5', name: 'Hapag-Lloyd', type: 'shipping_line' },
];

// Legacy aliases for backward compatibility
export const KITS = BROKERS;
export const CARS = CARRIERS;

// Incoterm Options
export const INCOTERMS = [
  { value: 'EXW', label: 'EXW - Ex Works' },
  { value: 'FCA', label: 'FCA - Free Carrier' },
  { value: 'FAS', label: 'FAS - Free Alongside Ship' },
  { value: 'FOB', label: 'FOB - Free on Board' },
  { value: 'CFR', label: 'CFR - Cost and Freight' },
  { value: 'CIF', label: 'CIF - Cost, Insurance & Freight' },
  { value: 'CPT', label: 'CPT - Carriage Paid To' },
  { value: 'CIP', label: 'CIP - Carriage & Insurance Paid' },
  { value: 'DAP', label: 'DAP - Delivered at Place' },
  { value: 'DPU', label: 'DPU - Delivered at Place Unloaded' },
  { value: 'DDP', label: 'DDP - Delivered Duty Paid' },
];

// Currency Options
export const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
];

// Shipment Type Labels
export const SHIPMENT_TYPE_LABELS = {
  'IMPORT_SEA_FCL': 'Import Sea (FCL)',
  'IMPORT_SEA_LCL': 'Import Sea (LCL)',
  'IMPORT_AIR': 'Import Air',
  'IMPORT_LAND': 'Import Land',
  'EXPORT_SEA': 'Export Sea',
  'EXPORT_AIR': 'Export Air',
  'EXPORT_LAND': 'Export Land',
  'TRANSIT': 'Transit',
  'RE_EXPORT': 'Re-Export',
};

// Status Options
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'customs_hold', label: 'Customs Hold' },
  { value: 'released', label: 'Released' },
  { value: 'delivered', label: 'Delivered' },
];

// Priority Options
export const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// Phase Options
export const PHASE_OPTIONS = [
  { value: 'documentation', label: 'Documentation' },
  { value: 'pre_clearance', label: 'Pre-Clearance' },
  { value: 'declaration', label: 'Declaration' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'payment', label: 'Payment' },
  { value: 'release', label: 'Release' },
  { value: 'delivery', label: 'Delivery' },
];
