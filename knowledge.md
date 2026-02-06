# Port Sudan Customs Clearance Automation Knowledge Base

> **Target:** Port Sudan customs clearance operations 2025/2026
> **Critical Update:** Mandatory ACD effective January 1, 2026

---

## Real Operations Analysis (From PDFs)

This knowledge base now includes insights from **actual clearance documents** processed by Abdout Group Co. at Port Sudan. Three shipments analyzed:

| Shipment | Client | Commodity | Containers | Total Cost (SDG) |
|----------|--------|-----------|------------|------------------|
| GGZ2339767 | Hafez Emad | Kitchen Equipment | 1×40' | 15,352,201.90 |
| VCLPKGPZUZ33125 | Yassir Emad | Petroleum Jelly | 5×20' | 25,120,988.20 |
| OSLPKGPZU4742625 | Yassir Emad | Glycerol | 5×20' | 49,845,467.08 |

### Detailed Documentation

| Document | Description |
|----------|-------------|
| [Document Types](./docs/knowledge/document-types.md) | 28+ document types across shipping, customs, regulatory, and financial categories |
| [Fee Structure](./docs/knowledge/fee-structure.md) | 50+ fee categories with actual rates and calculation formulas |
| [Workflow Stages](./docs/knowledge/workflow-stages.md) | 11 stages mapped from real documents with timelines |
| [Reference Numbers](./docs/knowledge/reference-numbers.md) | 15+ reference formats with validation regex patterns |
| [Entities](./docs/knowledge/entities.md) | Key parties, authorities, and relationships |

### Key Operational Insights

1. **VAT Applied Universally**: 17% VAT applies across all entities (Customs, Port, SSMO, Shipping)
2. **SSMO Required for Chemicals**: Glycerin/Glycerol products require SSMO release (FR forms)
3. **Multi-Party Payments**: Single shipment requires 4-6 separate payments to different entities
4. **Agent Commission**: Typically 1,200,000 - 2,000,000 SDG per shipment
5. **Container Transport**: Local transport ranges 400,000 - 1,600,000 SDG based on distance/quantity

---

## Executive Summary

This knowledge base enables automation of customs clearance operations for Port Sudan. The key regulatory shift is the **Advance Cargo Declaration (ACD)** requirement, transforming the workflow from reactive paperwork to proactive pre-loading data submission. Integration with the emerging **Single Window** system connecting customs, banks, and standards bodies is essential.

---

## 1. Critical Regulations (2025/2026)

### 1.1 Advance Cargo Declaration (ACD)

| Attribute | Detail |
|-----------|--------|
| **Effective Date** | January 1, 2026 |
| **Authority** | Sudan Customs Authority |
| **Platform** | [www.acdsudan.com](https://www.acdsudan.com) |
| **Requirement** | ACN required **before cargo loading** at origin |

#### ACD Process Flow

```
Exporter/Agent → Upload Documents → ACD Platform → ACN Generated → Include on B/L
```

#### Required Documents for ACD

- Draft Bill of Lading (B/L)
- Commercial Invoice
- Freight Invoice

#### ACD Compliance Rules

| Rule | Detail |
|------|--------|
| Validation Deadline | 5 days **before** vessel arrival |
| Processing Time | 2-3 business days |
| Uniqueness | One ACD per shipment |
| Penalty (non-compliance) | Demurrage fees + customs fines + potential cargo seizure |

#### Automation Actions

```typescript
// ACD Automation Triggers
const acdAutomation = {
  trigger_72h: "Send ACD request email to freight forwarder 72 hours before loading",
  validation: "Block 'Ready for Clearance' status if ACN field is null",
  bl_check: "Validate ACN presence on Draft B/L before approval",
  countdown: "Display days remaining until ACD validation deadline"
};
```

### 1.2 SSMO Pre-Shipment Verification

| Attribute | Detail |
|-----------|--------|
| **Authority** | Sudanese Standards and Metrology Organization |
| **Requirement** | Certificate of Inspection (CoI) for regulated products |
| **Inspectors** | TÜV Rheinland, Cotecna (internationally authorized) |

#### Regulated Product Categories

- Food & Animal Feed
- Chemical Products
- Construction Materials
- Vehicles & Parts
- Textiles
- Toys
- Electrical & Electronic Products

#### SSMO Locations

Port Sudan branch is the most well-equipped, with main laboratories. Additional presence at:
- Khartoum International Airport
- El Obeid, Kassala, Wad Madani
- El Fasher, Ad Damazin, Dongola
- Nyala, Gedaref

### 1.3 Bank Import Form (IM Form)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Foreign currency allocation for imports |
| **Issuer** | Commercial banks (Central Bank regulated) |
| **Trigger Document** | Proforma Invoice |

#### 2025 Central Bank Updates

- Prohibited replenishing free accounts with cash foreign currency supply
- Prohibited using customers' own forex resources for goods import
- All profit repatriation requires Central Bank permission

---

## 2. Import Workflow Model

### Phase A: Pre-Shipment (Bottleneck Phase)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRE-SHIPMENT PHASE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: IM Form Approval                                       │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐      │
│  │ Proforma    │───▶│ Commercial   │───▶│ IM Form       │      │
│  │ Invoice     │    │ Bank Review  │    │ Issued        │      │
│  └─────────────┘    └──────────────┘    └───────────────┘      │
│                                                                 │
│  Step 2: ACD Submission (NEW 2026)                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐      │
│  │ Draft B/L + │───▶│ acdsudan.com │───▶│ ACN Generated │      │
│  │ Invoices    │    │ Upload       │    │ (on B/L)      │      │
│  └─────────────┘    └──────────────┘    └───────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase B: Arrival & Declaration

```
┌─────────────────────────────────────────────────────────────────┐
│                   ARRIVAL & DECLARATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 3: Manifest & Declaration                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐      │
│  │ Shipping    │───▶│ Single       │───▶│ Declaration   │      │
│  │ Manifest    │    │ Window/Form  │    │ Registered    │      │
│  └─────────────┘    └──────────────┘    └───────────────┘      │
│                                                                 │
│  Step 4: SSMO Inspection                                        │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐      │
│  │ Physical    │───▶│ Lab Testing  │───▶│ SSMO Release  │      │
│  │ Inspection  │    │ (if needed)  │    │ Certificate   │      │
│  └─────────────┘    └──────────────┘    └───────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase C: Valuation, Payment & Release

```
┌─────────────────────────────────────────────────────────────────┐
│                  VALUATION & RELEASE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 5: Duty Calculation & Payment                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐      │
│  │ CIF Value   │───▶│ Duty Rate +  │───▶│ Bank Payment  │      │
│  │ Validation  │    │ VAT + Excise │    │ Confirmation  │      │
│  └─────────────┘    └──────────────┘    └───────────────┘      │
│                                                                 │
│  Step 6: Port Release                                           │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐      │
│  │ SPC Fees    │───▶│ Delivery     │───▶│ Gate Pass     │      │
│  │ Payment     │    │ Order (DO)   │    │ Issued        │      │
│  └─────────────┘    └──────────────┘    └───────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Schema

### Core Entities

```typescript
// Shipment Entity
interface Shipment {
  id: string;
  blNumber: string;           // Bill of Lading Number
  containerNumbers: string[]; // Container #s
  vesselName: string;
  voyageNumber: string;
  eta: Date;                  // Estimated Time of Arrival
  ata: Date | null;           // Actual Time of Arrival
  portOfLoading: string;
  consignee: string;
  status: ShipmentStatus;
}

type ShipmentStatus =
  | 'PENDING_ACD'
  | 'ACD_SUBMITTED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'CUSTOMS_REGISTERED'
  | 'INSPECTION_PENDING'
  | 'INSPECTION_PASSED'
  | 'DUTY_CALCULATED'
  | 'DUTY_PAID'
  | 'RELEASED';

// IM Form Entity
interface IMForm {
  id: string;
  imNumber: string;
  bankName: string;
  approvedAmount: number;
  currency: string;
  expiryDate: Date;
  proformaInvoiceValue: number;
  commercialInvoiceValue: number | null;
  shipmentId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'VALUE_MISMATCH';
}

// ACD Entity
interface ACD {
  id: string;
  acnNumber: string;          // ACD Number
  issuedDate: Date;
  validationDeadline: Date;
  draftBlNumber: string;
  commercialInvoiceRef: string;
  freightInvoiceRef: string;
  shipmentId: string;
  status: 'PENDING' | 'VALIDATED' | 'EXPIRED';
}

// HS Code Entity
interface HSCode {
  code: string;               // Tariff Code (e.g., "8471.30")
  description: string;
  dutyRate: number;           // Percentage
  vatRate: number;            // Percentage
  exciseTax: number | null;   // Specific excise if applicable
  ssmoRequired: boolean;      // Requires SSMO certificate
  requiredCertificates: string[]; // e.g., ['Phytosanitary', 'CoO']
}

// Expense Entity
interface Expense {
  id: string;
  shipmentId: string;
  containerId: string | null;
  type: ExpenseType;
  amount: number;
  currency: string;
  receiptNumber: string;
  receiptImage: string | null; // OCR-scanned receipt
  paidDate: Date;
}

type ExpenseType =
  | 'CUSTOMS_DUTY'
  | 'VAT'
  | 'PORT_HANDLING'
  | 'STORAGE'
  | 'DEMURRAGE'
  | 'SSMO_INSPECTION'
  | 'AGENT_FEE'
  | 'TRANSPORT';
```

### Validation Rules

```typescript
// Document Validation (before Declaration step)
const mandatoryDocuments = {
  originalBL: {
    required: true,
    validation: (doc) => doc.acdNumber !== null // Must show ACN
  },
  commercialInvoice: {
    required: true,
    validation: (doc, imForm) =>
      Math.abs(doc.value - imForm.approvedAmount) < imForm.approvedAmount * 0.05
  },
  certificateOfOrigin: {
    required: true,
    validation: (doc) => doc.isAuthenticated
  },
  ssmoCertificate: {
    required: (hsCode) => hsCode.ssmoRequired,
    validation: (doc) => doc.isValid && !doc.isExpired
  },
  imForm: {
    required: true,
    validation: (doc) => new Date() < doc.expiryDate
  }
};
```

---

## 4. Automation Features

### 4.1 OCR Document Extraction

Implement AI-powered OCR to eliminate manual data entry (80% time reduction potential).

#### Target Documents

| Document | Key Extracted Fields |
|----------|---------------------|
| Commercial Invoice | Item descriptions, quantities, unit prices, total value, HS codes |
| Bill of Lading | B/L number, container numbers, vessel name, shipper, consignee, ACN |
| Packing List | Package count, gross/net weights, dimensions |
| Certificate of Origin | Country of origin, exporter details, authentication |

#### Implementation

```typescript
// OCR Integration Schema
interface OCRExtractionResult {
  documentType: 'INVOICE' | 'BL' | 'PACKING_LIST' | 'COO';
  confidence: number;        // 0-100
  extractedFields: Record<string, {
    value: string;
    confidence: number;
    boundingBox: BoundingBox;
  }>;
  rawText: string;
  suggestedHSCodes: string[]; // AI-suggested based on descriptions
}

// Auto-populate Declaration
function autoPopulateDeclaration(ocr: OCRExtractionResult): DeclarationDraft {
  return {
    items: ocr.extractedFields.lineItems.map(item => ({
      description: item.description,
      hsCode: suggestHSCode(item.description),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalValue: item.total,
      origin: ocr.extractedFields.countryOfOrigin
    })),
    totalCIF: calculateCIF(ocr),
    confidence: ocr.confidence
  };
}
```

#### Recommended OCR Providers

- **Affinda** - Customs clearance specialized
- **Klippa** - 15+ logistics document types
- **Veryfi** - BOL-trained including handwritten
- **Microsoft Document Intelligence** - Enterprise-grade

### 4.2 Demurrage Prevention System

```typescript
interface ContainerTracking {
  containerId: string;
  freeTimeDays: number;       // From shipping line (typically 14)
  arrivalDate: Date;
  freeTimeExpiry: Date;
  demurrageRate: number;      // Per day after free time
  status: 'FREE' | 'WARNING' | 'DEMURRAGE';
}

// Alert Triggers
const demurrageAlerts = {
  warning_7d: { daysBefore: 7, channel: 'app' },
  warning_3d: { daysBefore: 3, channel: ['app', 'sms', 'whatsapp'] },
  warning_1d: { daysBefore: 1, channel: ['app', 'sms', 'whatsapp', 'call'] },
  exceeded: { daysAfter: 0, channel: ['app', 'sms', 'whatsapp', 'call'] }
};

function calculateDemurrage(container: ContainerTracking): number {
  const today = new Date();
  const daysOver = Math.max(0,
    Math.ceil((today - container.freeTimeExpiry) / (1000 * 60 * 60 * 24))
  );
  return daysOver * container.demurrageRate;
}
```

### 4.3 Duty Calculator

```typescript
interface DutyCalculation {
  cifValue: number;           // Cost + Insurance + Freight
  localHandling: number;
  dutyRate: number;
  vatRate: number;
  exciseTax: number;
  totalDuty: number;
  totalVAT: number;
  totalExcise: number;
  grandTotal: number;
}

function calculateDuty(
  cifValue: number,
  hsCode: HSCode,
  localHandling: number = 0
): DutyCalculation {
  const baseValue = cifValue + localHandling;
  const totalDuty = baseValue * (hsCode.dutyRate / 100);
  const totalVAT = (baseValue + totalDuty) * (hsCode.vatRate / 100);
  const totalExcise = hsCode.exciseTax || 0;

  return {
    cifValue,
    localHandling,
    dutyRate: hsCode.dutyRate,
    vatRate: hsCode.vatRate,
    exciseTax: hsCode.exciseTax || 0,
    totalDuty,
    totalVAT,
    totalExcise,
    grandTotal: totalDuty + totalVAT + totalExcise
  };
}
```

### 4.4 Client Portal / Status Updates

```typescript
// Auto-notification on status change
interface StatusUpdate {
  shipmentId: string;
  previousStatus: ShipmentStatus;
  newStatus: ShipmentStatus;
  timestamp: Date;
  notes: string | null;
}

const statusMessages: Record<ShipmentStatus, { ar: string; en: string }> = {
  PENDING_ACD: {
    ar: 'في انتظار رقم ACD',
    en: 'Pending ACD Number'
  },
  IN_TRANSIT: {
    ar: 'الشحنة في الطريق',
    en: 'Shipment In Transit'
  },
  ARRIVED: {
    ar: 'وصلت الشحنة إلى ميناء بورتسودان',
    en: 'Vessel Arrived at Port Sudan'
  },
  CUSTOMS_REGISTERED: {
    ar: 'تم التسجيل في الجمارك',
    en: 'Customs Registration Complete'
  },
  INSPECTION_PENDING: {
    ar: 'في انتظار الفحص',
    en: 'Pending Inspection'
  },
  INSPECTION_PASSED: {
    ar: 'تم اجتياز الفحص',
    en: 'Inspection Passed'
  },
  DUTY_CALCULATED: {
    ar: 'تم احتساب الرسوم',
    en: 'Duties Calculated'
  },
  DUTY_PAID: {
    ar: 'تم دفع الرسوم',
    en: 'Duties Paid'
  },
  RELEASED: {
    ar: 'تم الإفراج عن الشحنة',
    en: 'Shipment Released'
  }
};

// WhatsApp/SMS Integration
async function notifyClient(update: StatusUpdate, clientPhone: string) {
  const message = statusMessages[update.newStatus];
  await sendWhatsApp(clientPhone, message.ar + '\n' + message.en);
}
```

### 4.5 IM Form Tracker

```typescript
interface IMFormAlert {
  type: 'EXPIRY_WARNING' | 'VALUE_MISMATCH' | 'EXPIRED';
  imFormId: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

function checkIMFormStatus(imForm: IMForm): IMFormAlert | null {
  const today = new Date();
  const daysToExpiry = Math.ceil(
    (imForm.expiryDate - today) / (1000 * 60 * 60 * 24)
  );

  // Check expiry
  if (daysToExpiry < 0) {
    return {
      type: 'EXPIRED',
      imFormId: imForm.id,
      message: `IM Form ${imForm.imNumber} has expired`,
      severity: 'CRITICAL'
    };
  }

  if (daysToExpiry <= 10) {
    return {
      type: 'EXPIRY_WARNING',
      imFormId: imForm.id,
      message: `IM Form ${imForm.imNumber} expires in ${daysToExpiry} days`,
      severity: daysToExpiry <= 3 ? 'HIGH' : 'MEDIUM'
    };
  }

  // Check value mismatch
  if (imForm.commercialInvoiceValue) {
    const variance = Math.abs(
      imForm.commercialInvoiceValue - imForm.proformaInvoiceValue
    ) / imForm.proformaInvoiceValue;

    if (variance > 0.05) { // 5% threshold
      return {
        type: 'VALUE_MISMATCH',
        imFormId: imForm.id,
        message: `Commercial Invoice value differs from Proforma by ${(variance * 100).toFixed(1)}%`,
        severity: variance > 0.15 ? 'HIGH' : 'MEDIUM'
      };
    }
  }

  return null;
}
```

### 4.6 SSMO Inspection Workflow

```typescript
type SSMOStatus =
  | 'NOT_REQUIRED'
  | 'PENDING_INSPECTION'
  | 'SAMPLE_TAKEN'
  | 'LAB_TESTING'
  | 'RESULT_UPLOADED'
  | 'PASSED'
  | 'FAILED'
  | 'CONDITIONAL_RELEASE';

interface SSMOInspection {
  id: string;
  shipmentId: string;
  inspectorName: string;
  inspectionDate: Date;
  sampleTaken: boolean;
  labSubmissionDate: Date | null;
  labResultDate: Date | null;
  result: 'PASS' | 'FAIL' | 'CONDITIONAL' | null;
  certificateNumber: string | null;
  notes: string;
  status: SSMOStatus;
}

// Status flow automation
const ssmoWorkflow: Record<SSMOStatus, SSMOStatus[]> = {
  NOT_REQUIRED: [],
  PENDING_INSPECTION: ['SAMPLE_TAKEN', 'PASSED'],
  SAMPLE_TAKEN: ['LAB_TESTING'],
  LAB_TESTING: ['RESULT_UPLOADED'],
  RESULT_UPLOADED: ['PASSED', 'FAILED', 'CONDITIONAL_RELEASE'],
  PASSED: [],
  FAILED: [],
  CONDITIONAL_RELEASE: []
};
```

### 4.7 Actual Fee Breakdown (From PDF Analysis)

Real clearance cost structure from Abdout Group invoices:

```typescript
// Fee categories with actual amounts (SDG)
interface ClearanceFeeBreakdown {
  // Government Payments
  customs: {
    importDuty: number;      // IMD: 4,312,864 - 7,076,097
    valueAddedTax: number;   // VAT 17%: 9,686,406 - 41,300,819
    additionalTax: number;   // ADT: 966,080
    stamps: number;          // BSS+STP+PLS: ~6,654
  };

  // Port Authority
  seaPorts: {
    handling: number;        // CT/F-3-4: ~1,262,920
    portDues: number;        // CT/U-13/1: ~3,031,009
    extraction: number;      // H9/1: ~14,032
    equipment: number;       // H/11-1: ~22,451
    trucks: number;          // H/12-1: ~70,162
    stamps: number;          // STAMP20/40: ~8,400
  };

  // Shipping Line/Agent
  shipping: {
    deliveryOrder: number;   // D/O fee: 26,775 - 2,340
    landingCharges: number;  // 142,800 - 941,557
    liftOff: number;         // 350,000 - 4,524,975
    insurance: number;       // 43,435 - 211,553
    cleaning: number;        // 28,263 - 230,776
  };

  // Clearing Agent (Abdout Group)
  agent: {
    declaration: number;     // شهادة جمركية: 500,000
    examination: number;     // الكشف عن الطرد: 1,200,000
    supervision: number;     // اشراف ومتابعة: 200,000
    transport: number;       // ترحيل محلي: 400,000 - 1,600,000
    labourers: number;       // اجرة عمال: 400,000 - 3,200,000
    commission: number;      // العمولة: 1,200,000 - 2,000,000
  };

  // Quality Standards (if required)
  ssmo?: {
    qualityFees: number;     // رسوم ضبط الجودة: 1,830,000
    labFees: number;         // رسوم معمل: 100,000
    stamps: number;          // دمغة جودة: 50,000
  };
}

// Real invoice total ranges
const typicalClearanceCosts = {
  singleContainer40ft: {
    min: 12_000_000,  // ~12M SDG
    max: 18_000_000,  // ~18M SDG
  },
  fiveContainers20ft: {
    min: 25_000_000,  // ~25M SDG
    max: 55_000_000,  // ~55M SDG (with SSMO)
  },
};
```

#### Invoice Auto-Generation Template

```typescript
// Auto-generate clearance invoice from shipment data
interface InvoiceLineItem {
  code: string;           // Service code
  description: string;    // English description
  descriptionAr: string;  // Arabic description
  amount: number;
  category: 'CUSTOMS' | 'PORT' | 'SHIPPING' | 'AGENT' | 'SSMO';
  taxable: boolean;
  vatAmount?: number;
}

function generateClearanceInvoice(
  shipment: Shipment,
  fees: ClearanceFeeBreakdown
): Invoice {
  const lineItems: InvoiceLineItem[] = [
    // Agent fees (always included)
    { code: 'AGT-DEC', description: 'Customs Declaration', descriptionAr: 'شهادة جمركية', amount: fees.agent.declaration, category: 'AGENT', taxable: false },
    { code: 'AGT-EXM', description: 'Container Examination', descriptionAr: 'الكشف عن الطرد', amount: fees.agent.examination, category: 'AGENT', taxable: false },
    { code: 'AGT-SUP', description: 'Supervision & Follow-up', descriptionAr: 'اشراف ومتابعة', amount: fees.agent.supervision, category: 'AGENT', taxable: false },
    { code: 'AGT-TRN', description: 'Local Transport', descriptionAr: 'ترحيل محلي', amount: fees.agent.transport, category: 'AGENT', taxable: false },
    { code: 'AGT-LAB', description: 'Labourers Wages', descriptionAr: 'اجرة عمال الشحن والتفريغ', amount: fees.agent.labourers, category: 'AGENT', taxable: false },
    { code: 'AGT-COM', description: 'Commission', descriptionAr: 'العمولة', amount: fees.agent.commission, category: 'AGENT', taxable: false },

    // Port fees (pass-through)
    { code: 'PRT-BIL', description: 'Sea Ports Corporation Bill', descriptionAr: 'فاتورة موانئ', amount: calculatePortTotal(fees.seaPorts), category: 'PORT', taxable: false },

    // Customs duties (pass-through)
    { code: 'CUS-DTY', description: 'Customs Duties', descriptionAr: 'رسوم جمركية', amount: fees.customs.importDuty + fees.customs.additionalTax, category: 'CUSTOMS', taxable: false },
    { code: 'CUS-VAT', description: 'Value Added Tax', descriptionAr: 'ضريبة القيمة المضافة', amount: fees.customs.valueAddedTax, category: 'CUSTOMS', taxable: false },

    // Shipping (pass-through)
    { code: 'SHP-DOC', description: 'Shipping Line Charges', descriptionAr: 'رسوم خط الملاحة', amount: calculateShippingTotal(fees.shipping), category: 'SHIPPING', taxable: false },
  ];

  // Add SSMO if applicable
  if (fees.ssmo) {
    lineItems.push({ code: 'SSM-QTY', description: 'SSMO Quality Fees', descriptionAr: 'رسوم ضبط الجودة', amount: fees.ssmo.qualityFees, category: 'SSMO', taxable: false });
    lineItems.push({ code: 'SSM-LAB', description: 'Customs Laboratory', descriptionAr: 'رسوم معمل جمركي', amount: fees.ssmo.labFees, category: 'SSMO', taxable: false });
  }

  return {
    invoiceNumber: generateInvoiceNumber(),
    shipmentId: shipment.id,
    billOfLading: shipment.blNumber,
    consignee: shipment.consignee,
    lineItems,
    subtotal: lineItems.reduce((sum, item) => sum + item.amount, 0),
    grandTotal: lineItems.reduce((sum, item) => sum + item.amount + (item.vatAmount || 0), 0),
    createdAt: new Date(),
  };
}
```

---

## 5. Technical Architecture

### 5.1 Single Window Integration

Sudan is implementing electronic foreign trade connectivity. Prepare data exports in compatible formats:

```typescript
// Export format for Single Window
interface SingleWindowPayload {
  declaration: {
    type: 'IMPORT' | 'EXPORT';
    referenceNumber: string;
    acdNumber: string;
    imFormNumber: string;
    declarant: {
      name: string;
      taxId: string;
      license: string;
    };
    consignment: {
      blNumber: string;
      vesselName: string;
      arrivalDate: string; // ISO 8601
      items: Array<{
        hsCode: string;
        description: string;
        quantity: number;
        unit: string;
        value: number;
        currency: string;
        origin: string;
      }>;
    };
  };
  documents: Array<{
    type: string;
    reference: string;
    issuedDate: string;
    expiryDate?: string;
  }>;
}

// Generate XML/JSON for submission
function generateSingleWindowPayload(shipment: Shipment): string {
  const payload: SingleWindowPayload = buildPayload(shipment);
  return JSON.stringify(payload); // or XML depending on requirements
}
```

### 5.2 Offline Capability

Port Sudan connectivity is intermittent. Implement offline-first architecture:

```typescript
// Offline sync queue
interface SyncQueue {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  timestamp: Date;
  synced: boolean;
  retryCount: number;
}

// Field inspection offline data
interface OfflineInspectionData {
  containerId: string;
  sealIntact: boolean;
  sealNumber: string;
  damageNotes: string;
  photos: string[];       // Base64 or local file paths
  timestamp: Date;
  gpsCoordinates: {
    lat: number;
    lng: number;
  };
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
}
```

### 5.3 API Integration Points

```typescript
// External system integrations
const integrations = {
  // Vessel tracking
  vesselTracking: {
    provider: 'MarineTraffic | VesselFinder',
    events: ['ETA_UPDATE', 'ARRIVAL', 'DEPARTURE']
  },

  // ACD Platform
  acdPlatform: {
    url: 'https://www.acdsudan.com',
    operations: ['SUBMIT', 'STATUS_CHECK', 'RETRIEVE_ACN']
  },

  // Banking
  banking: {
    operations: ['IM_FORM_VALIDATION', 'PAYMENT_STATUS']
  },

  // SSMO
  ssmo: {
    operations: ['COI_VERIFICATION', 'LAB_RESULT_RETRIEVAL']
  },

  // Sea Port Corporation
  spc: {
    operations: ['STORAGE_FEES', 'DO_STATUS', 'GATE_PASS']
  }
};
```

---

## 6. Elimination Opportunities

### High-Impact Automation Targets

| Task | Current Time | Automated Time | Savings |
|------|--------------|----------------|---------|
| Invoice data entry | 15-30 min/doc | 1-2 min (OCR) | 90% |
| Declaration drafting | 45-60 min | 5-10 min | 85% |
| Duty calculation | 10-15 min | Instant | 99% |
| Client status updates | 10+ calls/day | Automated | 100% |
| Document validation | 20-30 min | 2-3 min | 90% |
| Demurrage tracking | Manual calendar | Automated alerts | 100% |

### Process Elimination Checklist

> **Status Legend:** ✅ Implemented | ⚠️ Partial | ❌ Not Implemented | 🔧 In Progress

- ❌ Manual typing of invoice line items → OCR extraction
  - *Status: STUBBED - `extract-receipt-data.ts` returns hardcoded data*
  - *Action: Install @ai-sdk/anthropic, implement real extraction*

- ⚠️ Phone calls for status updates → Client portal + WhatsApp bot
  - *Status: Service exists but NOT auto-triggered on stage changes*
  - *Action: Connect `advanceToNextStage()` to `notifyShipmentMilestone()`*

- ✅ Paper-based document tracking → Digital document management
  - *Status: Document model exists with upload support*

- ⚠️ Manual duty calculations → Automated HS code lookup + calculation
  - *Status: Basic frontend calculator at `/project/[id]/duty/`*
  - *Action: Add HS code database, server-side logic, tariff lookup*

- ❌ Calendar-based demurrage tracking → Automated countdown alerts
  - *Status: "DEMURRAGE" fee category exists, NO tracking logic*
  - *Action: Add Container model, cron job, countdown alerts*

- ❌ Email-based ACD requests → Automated trigger 72h before loading
  - *Status: NOT IMPLEMENTED*
  - *Action: Add ACD model, scheduled job for pre-loading alerts*

- ❌ Manual IM Form expiry tracking → Automated alerts at 10, 5, 3, 1 days
  - *Status: NOT IMPLEMENTED*
  - *Action: Add IMForm model with expiry tracking*

### Implementation Status Summary

| Feature | File Location | Status |
|---------|---------------|--------|
| OCR Extraction | `src/components/platform/finance/receipt/ai/` | ❌ Stubbed |
| Notifications | `src/lib/services/notification/` | ⚠️ Service exists, not auto-triggered |
| Duty Calculator | `src/app/[lang]/(platform)/project/[id]/duty/` | ⚠️ Frontend only |
| Demurrage | `src/components/platform/finance/fees/config.ts` | ❌ Category only |
| Tracking | `src/actions/tracking.ts` | ✅ 11-stage workflow |
| WhatsApp | `src/lib/services/notification/whatsapp.ts` | ✅ Working |

> See `AUTOMATION_GAP_ANALYSIS.md` for detailed implementation plan.

---

## 7. Compliance Checklist

### Pre-Declaration Requirements

```
□ IM Form obtained and not expired
□ IM Form value matches Commercial Invoice (within 5%)
□ ACD Number (ACN) obtained from acdsudan.com
□ ACN displayed on Original Bill of Lading
□ Commercial Invoice uploaded
□ Certificate of Origin authenticated
□ SSMO Certificate (if regulated product)
□ Packing List complete
```

### Post-Arrival Requirements

```
□ Manifest registered by shipping line
□ Customs Declaration submitted (Form 11 / Single Window)
□ SSMO inspection scheduled (if required)
□ Lab samples submitted (if required)
□ CIF valuation approved
□ Duties calculated and paid
□ Port fees (SPC) paid
□ Delivery Order issued
□ Gate Pass obtained
```

---

## 8. Key Contacts & Resources

### Official Platforms

| Entity | Website | Purpose |
|--------|---------|---------|
| ACD Sudan | [acdsudan.com](https://www.acdsudan.com) | Advance Cargo Declaration |
| Central Bank of Sudan | [cbos.gov.sd](https://cbos.gov.sd) | IM Form regulations |
| SSMO | - | Standards & Metrology |
| Sea Port Corporation | - | Port operations |

### Clearing Agent (Abdout Group Co.)

| Attribute | Value |
|-----------|-------|
| Principal | Mazin Mohamed Al-Amin (مازن محمد الأمين) |
| License | 276 |
| Declarant ID | 300000981146 |
| Location | Albahr Al-ahmar (البحر الأحمر) |
| Email | abdoutgroup@gmail.com |
| Phone | +249 912310205 |
| Services | Clearance, Deportation, Storage, Customs Consultations |

### Customs Offices at Port Sudan

| Code | Name | Arabic |
|------|------|--------|
| PZUS0 | PortSudan South Quay | الميناء الجنوبي - الرصيف الجنوبي |
| PZUS1 | PortSudan South Quay (DAMADAMA) | الميناء الجنوبي - دمدمة |

### Shipping Lines & Agents

| Entity | Contact | Role |
|--------|---------|------|
| CMA CGM | pan.mahmed@cma-cgm.com | Ocean carrier |
| Eastern Shipping | info@easternship.com | Shipping agent |
| Al Arbab Shipping | +249 311823729 | Shipping agent |

### Authorized SSMO Inspectors

- TÜV Rheinland
- Cotecna

---

## Sources

- [Maersk - ACD Requirements for Sudan](https://www.maersk.com/news/articles/2025/12/11/advance-cargo-declaration-acd-requirements-sudan)
- [GlobalCTN - Sudan ACD](https://globalctn.com/sudan-acd/)
- [GetCTN - Mandatory ACD Requirement](https://getctn.com/new-mandatory-acd-requirement-for-all-sudan-shipments/)
- [TÜV Rheinland - Sudan Pre-Shipment Verification](https://www.tuv.com/landingpage/en/government-inspections-international-trade/navigation/pvoc/exporting-to-africa/sudan-certificate-of-inspection-coi/)
- [Trade.gov - Sudan Customs Regulations](https://www.trade.gov/country-commercial-guides/sudan-customs-regulations)
- [Cotecna - Inspection Certificate for Sudan](https://www.cotecna.com/en/services/verification-of-conformity/sudan/)
- [Affinda - OCR for Customs Clearance](https://www.affinda.com/use-cases/customs-clearance)
- [Klippa - OCR in Logistics Guide 2025](https://klearstack.com/ocr-in-logistics)
- [Customs4trade - Automated Customs Software](https://www.customs4trade.com)
- [Dabanga - Central Bank Foreign Currency Restrictions](https://www.dabangasudan.org/en/all-news/article/central-bank-of-sudan-restricts-flow-of-foreign-currency)
- [Trade.gov - Sudan Trade Financing](https://www.trade.gov/country-commercial-guides/sudan-trade-financing)

---

*Last Updated: December 2025*

---

## Related Documentation

For detailed operational knowledge extracted from real clearance documents, see:

- **[docs/knowledge/document-types.md](./docs/knowledge/document-types.md)** - Comprehensive catalog of 28+ document types
- **[docs/knowledge/fee-structure.md](./docs/knowledge/fee-structure.md)** - 50+ fee categories with actual rates and formulas
- **[docs/knowledge/workflow-stages.md](./docs/knowledge/workflow-stages.md)** - 11 real workflow stages with timelines and automation opportunities
- **[docs/knowledge/reference-numbers.md](./docs/knowledge/reference-numbers.md)** - Reference number formats with validation patterns
- **[docs/knowledge/entities.md](./docs/knowledge/entities.md)** - Key parties, authorities, contacts, and relationships
