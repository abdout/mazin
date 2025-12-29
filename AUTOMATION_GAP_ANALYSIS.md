# Process Elimination Targets - Gap Analysis

> **Audit Date:** December 2025
> **Status:** Implementation Required

---

## Executive Summary

| Target | knowledge.md Requirement | Current Status | Gap Level |
|--------|--------------------------|----------------|-----------|
| Invoice typing → OCR | AI-powered extraction (80% time savings) | STUBBED - No implementation | **CRITICAL** |
| Status calls → Auto-notifications | WhatsApp/SMS on status change | PARTIAL - Not auto-triggered | **HIGH** |
| Manual duty calc → Automated | HS code lookup + instant calculation | BASIC - Frontend only | **HIGH** |
| Demurrage tracking → Countdown | Free time alerts at 7/3/1 days | NOT IMPLEMENTED | **CRITICAL** |

---

## 1. Invoice Typing → OCR

### Requirement (from knowledge.md)

```typescript
interface OCRExtractionResult {
  documentType: 'INVOICE' | 'BL' | 'PACKING_LIST' | 'COO';
  confidence: number;
  extractedFields: Record<string, { value: string; confidence: number }>;
  suggestedHSCodes: string[];
}
```

**Expected Savings:** 90% reduction (15-30 min → 1-2 min per document)

### Current Implementation

**File:** `src/components/platform/finance/receipt/ai/extract-receipt-data.ts`

```typescript
// STUBBED - Returns hardcoded data
export async function extractReceiptData(receiptId: string, fileUrl: string) {
  console.log("extractReceiptData called (stubbed)");
  return {
    success: true,
    data: {
      merchantName: "Sample Merchant", // Hardcoded
      // ... rest is fake data
    },
  };
}
```

### Gap Analysis

| Feature | Required | Current | Status |
|---------|----------|---------|--------|
| AI Provider Integration | @ai-sdk/anthropic | Not installed | ❌ |
| Commercial Invoice Parsing | Yes | No | ❌ |
| Bill of Lading Parsing | Yes | No | ❌ |
| Line Item Extraction | Yes | No | ❌ |
| HS Code Detection | Yes | No | ❌ |
| Multi-language (AR/EN) | Yes | No | ❌ |
| Confidence Scoring | Yes | No | ❌ |

### Implementation Plan

1. **Install Dependencies**
   ```bash
   pnpm add @ai-sdk/anthropic ai
   ```

2. **Create OCR Service** at `src/lib/services/ocr/`
   - `invoice-extractor.ts` - Commercial invoice parsing
   - `bl-extractor.ts` - Bill of Lading parsing
   - `hs-code-detector.ts` - HS code suggestion from descriptions

3. **Integrate with Declaration Form**
   - Auto-populate customs declaration from extracted data
   - Show confidence indicators
   - Allow manual override

---

## 2. Status Calls → Auto-Notifications

### Requirement (from knowledge.md)

```typescript
// Auto-notification on status change
async function notifyClient(update: StatusUpdate, clientPhone: string) {
  const message = statusMessages[update.newStatus];
  await sendWhatsApp(clientPhone, message.ar + '\n' + message.en);
}
```

**Expected Savings:** 100% reduction (10+ calls/day → 0)

### Current Implementation

**Notification Service:** `src/lib/services/notification/index.ts` - **EXISTS & WORKS**

```typescript
export async function notifyShipmentMilestone(
  clientId: string,
  shipmentId: string,
  milestone: 'arrival' | 'cleared' | 'released' | 'delivered',
  trackingNumber: string,
  message?: string
) {
  // Implementation exists and is correct
}
```

**Tracking Actions:** `src/actions/tracking.ts`

```typescript
export async function advanceToNextStage(shipmentId: string) {
  // ... updates status
  await db.shipment.update({ data: { status: shipmentStatus } });
  // ❌ MISSING: Does NOT call notifyShipmentMilestone()
}
```

### Gap Analysis

| Feature | Required | Current | Status |
|---------|----------|---------|--------|
| Notification Service | Yes | Implemented | ✅ |
| WhatsApp Integration | Yes | Implemented | ✅ |
| Auto-trigger on Stage Change | Yes | **NOT CONNECTED** | ❌ |
| Bilingual Messages (AR/EN) | Yes | Partial | ⚠️ |
| Client Portal | Yes | Not Implemented | ❌ |

### Implementation Plan

1. **Connect Notifications to Tracking Actions**
   - Modify `advanceToNextStage()` to call `notifyShipmentMilestone()`
   - Add client lookup to get notification preferences

2. **Add Missing Milestones**
   - Map all 11 tracking stages to notification types
   - Include: `INSPECTION_PASSED`, `DUTY_PAID`, `LOADING`, etc.

3. **Implement Client Tracking Portal**
   - Public page at `/track/[trackingNumber]` (already exists)
   - Add real-time status updates

---

## 3. Manual Duty Calc → Automated

### Requirement (from knowledge.md)

```typescript
function calculateDuty(
  cifValue: number,
  hsCode: HSCode,
  localHandling: number = 0
): DutyCalculation {
  const baseValue = cifValue + localHandling;
  const totalDuty = baseValue * (hsCode.dutyRate / 100);
  const totalVAT = (baseValue + totalDuty) * (hsCode.vatRate / 100);
  const totalExcise = hsCode.exciseTax || 0;
  return { /* ... */ grandTotal: totalDuty + totalVAT + totalExcise };
}
```

**Expected Savings:** 99% reduction (10-15 min → Instant)

### Current Implementation

**File:** `src/app/[lang]/(platform)/project/[id]/duty/page.tsx`

```typescript
// Simple frontend calculator - no backend logic
const [cifValue, setCifValue] = useState('');
const [dutyRate, setDutyRate] = useState('5');  // Manual input
const [vatRate, setVatRate] = useState('17');   // Manual input

const duty = cif * (parseFloat(dutyRate) / 100);
const vat = (cif + duty) * (parseFloat(vatRate) / 100);
```

### Gap Analysis

| Feature | Required | Current | Status |
|---------|----------|---------|--------|
| Basic Calculation | Yes | Frontend only | ⚠️ |
| HS Code Database | Yes | No | ❌ |
| Tariff Rate Lookup | Yes | Manual input | ❌ |
| SSMO Requirement Flag | Yes | No | ❌ |
| Excise Tax Support | Yes | No | ❌ |
| Multi-currency | Yes | USD only | ⚠️ |
| Save to Shipment | Yes | No | ❌ |
| Demurrage Calculation | Yes | No | ❌ |

### Implementation Plan

1. **Create HS Code Database**
   - Prisma model for `HSCode` entity
   - Seed with Sudan customs tariff data
   - Include SSMO requirements per code

2. **Create Duty Calculator Service**
   ```
   src/lib/services/duty/
   ├── calculator.ts      - Core calculation logic
   ├── hs-lookup.ts       - HS code search/lookup
   └── tariff-rates.ts    - Rate configuration
   ```

3. **Enhance Duty Page**
   - HS code autocomplete/search
   - Auto-populate rates from database
   - Save calculation to shipment record
   - Support excise taxes

---

## 4. Demurrage Tracking → Countdown Alerts

### Requirement (from knowledge.md)

```typescript
interface ContainerTracking {
  containerId: string;
  freeTimeDays: number;       // From shipping line (typically 14)
  arrivalDate: Date;
  freeTimeExpiry: Date;
  demurrageRate: number;      // Per day after free time
  status: 'FREE' | 'WARNING' | 'DEMURRAGE';
}

const demurrageAlerts = {
  warning_7d: { daysBefore: 7, channel: 'app' },
  warning_3d: { daysBefore: 3, channel: ['app', 'sms', 'whatsapp'] },
  warning_1d: { daysBefore: 1, channel: ['app', 'sms', 'whatsapp', 'call'] },
  exceeded: { daysAfter: 0, channel: ['app', 'sms', 'whatsapp', 'call'] }
};
```

**Expected Savings:** 100% reduction (manual calendar → automated)

### Current Implementation

**Fee Category Config:** `src/components/platform/finance/fees/config.ts`

```typescript
export const SERVICE_CATEGORIES = [
  // ...
  "DEMURRAGE",  // Category exists but no logic
  // ...
];
```

**Container Page:** `src/app/[lang]/(platform)/project/[id]/containers/page.tsx` - EXISTS

### Gap Analysis

| Feature | Required | Current | Status |
|---------|----------|---------|--------|
| Container Tracking Model | Yes | No | ❌ |
| Free Time Configuration | Yes | No | ❌ |
| Countdown Timer | Yes | No | ❌ |
| Alert at 7 days | Yes | No | ❌ |
| Alert at 3 days | Yes | No | ❌ |
| Alert at 1 day | Yes | No | ❌ |
| Demurrage Calculation | Yes | No | ❌ |
| Multi-channel Alerts | Yes | Service exists | ⚠️ |

### Implementation Plan

1. **Add Container Tracking Schema**
   ```prisma
   model Container {
     id              String   @id @default(cuid())
     containerId     String   // e.g., MSKU1234567
     shipmentId      String
     shipment        Shipment @relation(...)
     freeTimeDays    Int      @default(14)
     arrivalDate     DateTime
     freeTimeExpiry  DateTime
     demurrageRate   Decimal
     status          ContainerStatus @default(FREE)
     alertsSent      Json?    // Track which alerts were sent
   }

   enum ContainerStatus {
     FREE
     WARNING_7D
     WARNING_3D
     WARNING_1D
     DEMURRAGE
   }
   ```

2. **Create Demurrage Service**
   ```
   src/lib/services/demurrage/
   ├── calculator.ts       - Calculate fees
   ├── countdown.ts        - Status determination
   └── alerts.ts           - Alert triggers
   ```

3. **Create Cron Job for Daily Checks**
   - `src/app/api/cron/demurrage/route.ts`
   - Run daily to check all containers
   - Send alerts via notification service

4. **UI Components**
   - Countdown timer widget
   - Container status dashboard
   - Demurrage cost preview

---

## Implementation Priority

### Phase 1: Critical (Week 1-2)

1. **Auto-Notifications on Status Change**
   - Quickest win - just connect existing service
   - Modify `advanceToNextStage()` to trigger notifications
   - Estimated: 2-4 hours

2. **Demurrage Countdown Alerts**
   - High financial impact (prevents penalty fees)
   - Add Container model + cron job
   - Estimated: 1-2 days

### Phase 2: High Value (Week 2-3)

3. **Duty Calculator Enhancement**
   - Add HS code database
   - Create server-side calculation service
   - Estimated: 2-3 days

### Phase 3: Advanced (Week 3-4)

4. **OCR Document Extraction**
   - Highest complexity
   - Requires AI provider setup
   - Estimated: 3-5 days

---

## Quick Win: Connect Notifications (2-4 hours)

**File to modify:** `src/actions/tracking.ts`

```typescript
import { notifyShipmentMilestone } from '@/lib/services/notification';

export async function advanceToNextStage(shipmentId: string) {
  // ... existing code ...

  // Add after status update:
  if (shipment.clientId && shipment.trackingNumber) {
    const milestoneMap: Record<string, 'arrival' | 'cleared' | 'released' | 'delivered'> = {
      'VESSEL_ARRIVAL': 'arrival',
      'RELEASE': 'released',
      'DELIVERED': 'delivered',
    };

    const milestone = milestoneMap[currentStage.stageType];
    if (milestone) {
      await notifyShipmentMilestone(
        shipment.clientId,
        shipmentId,
        milestone,
        shipment.trackingNumber
      );
    }
  }
}
```

---

## Files to Create

```
src/lib/services/
├── ocr/
│   ├── index.ts
│   ├── invoice-extractor.ts
│   ├── bl-extractor.ts
│   └── hs-code-detector.ts
├── duty/
│   ├── index.ts
│   ├── calculator.ts
│   ├── hs-lookup.ts
│   └── tariff-rates.ts
└── demurrage/
    ├── index.ts
    ├── calculator.ts
    ├── countdown.ts
    └── alerts.ts

src/app/api/cron/
└── demurrage/
    └── route.ts

prisma/models/
├── container.prisma (new)
└── hs-code.prisma (new)
```

---

## Success Metrics

| Target | Metric | Before | After |
|--------|--------|--------|-------|
| Invoice OCR | Time per document | 15-30 min | 1-2 min |
| Auto-notifications | Daily status calls | 10+ | 0 |
| Duty calculator | Calculation time | 10-15 min | Instant |
| Demurrage alerts | Missed deadlines | Variable | 0 |

---

*Last Updated: December 2025*
