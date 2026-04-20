// Copyright (c) 2025-present ABDOUT GROUP
// Port Sudan customs clearance chatbot — domain-aware system prompts

export type PromptType = 'marketing' | 'tracking' | 'platform'

/**
 * Public snapshot of a shipment used to ground tracking answers in real data.
 * Mirrors fields safe to expose without auth.
 */
export interface TrackingChatbotData {
  trackingNumber: string
  shipmentNumber?: string | null
  status: string
  type: string
  description: string
  consignee: string
  consignor: string
  vesselName?: string | null
  containerNumber?: string | null
  arrivalDate?: Date | null
  currentStageType?: string | null
  currentStageStatus?: string | null
  completedStages: number
  totalStages: number
}

/**
 * Authenticated platform context — project/shipment currently in focus.
 */
export interface PlatformChatbotData {
  projectId?: string
  customer?: string | null
  blAwbNumber?: string | null
  status?: string | null
  portOfOrigin?: string | null
  portOfDestination?: string | null
  hasAcd?: boolean
  hasImForm?: boolean
  hasSsmo?: boolean
  openDeclarations?: number
  unpaidInvoicesTotal?: number
}

export interface MazinChatbotContext {
  promptType: PromptType
  tracking?: TrackingChatbotData | null
  platform?: PlatformChatbotData | null
}

/** Derive quick-ask button visibility from fetched context. */
export interface MazinQuickAskFlags {
  hasTrackingContext: boolean
  shipmentArrived: boolean
  hasProjectContext: boolean
  needsAcd: boolean
  needsSsmo: boolean
}

export function deriveQuickAskFlags(
  ctx: MazinChatbotContext
): MazinQuickAskFlags {
  return {
    hasTrackingContext: Boolean(ctx.tracking),
    shipmentArrived:
      ctx.tracking?.status === 'ARRIVED' || ctx.tracking?.status === 'CLEARED',
    hasProjectContext: Boolean(ctx.platform?.projectId),
    needsAcd: ctx.platform?.hasAcd === false,
    needsSsmo: ctx.platform?.hasSsmo === false,
  }
}

const COMPANY_BLOCK = `## About ABDOUT GROUP
- **Principal**: Mazin Mohamed Al-Amin — licensed customs clearing agent (License #276, Declarant ID 300000981146)
- **Location**: Port Sudan, Red Sea State, Sudan
- **Experience**: 39+ years (since 1985) — 50,000+ shipments cleared, 2,000+ clients, 99% success rate
- **Services**: Import/export clearance, ACD submission, SSMO coordination, IM Form tracking, freight forwarding, warehousing, deportation, customs consultations
- **Contact**: abdoutgroup@gmail.com | +249 912310205 | Sunday–Thursday 8AM–5PM`

const REGULATORY_BLOCK = `## Regulatory Essentials (Sudan — 2025/2026)
- **ACD (Advance Cargo Declaration)**: Mandatory from **January 1, 2026**. Submit at [acdsudan.com](https://www.acdsudan.com) **before cargo loading** at origin. ACN must appear on Bill of Lading. Validation deadline: 5 days before vessel arrival. Non-compliance triggers demurrage + fines + possible seizure.
- **SSMO (Sudanese Standards & Metrology Organization)**: Pre-shipment Certificate of Inspection required for regulated goods — food, chemicals (glycerol, petroleum jelly), construction materials, vehicles, textiles, electronics. Authorized inspectors: TÜV Rheinland, Cotecna.
- **IM Form (Bank Import Form)**: Issued by commercial bank against Proforma Invoice. Required for foreign-currency allocation. Commercial invoice must match within 5% variance. Central Bank 2025 rules: no replenishing free accounts with cash FX.
- **Customs Offices (Port Sudan)**: PZUS0 (South Quay), PZUS1 (Damadama).
- **Free Time**: 14 days before demurrage typically begins. Demurrage rates set per shipping line.`

const WORKFLOW_BLOCK = `## 11-Stage Clearance Workflow
1. PRE_ARRIVAL_DOCS — gather B/L, Commercial Invoice, Packing List, CoO, IM Form, ACD
2. VESSEL_ARRIVAL — manifest registration, ETA confirmation
3. CUSTOMS_DECLARATION — ASYCUDA World submission (Sudan's electronic system)
4. CUSTOMS_PAYMENT — import duty + 17% VAT + excise (if any) + development fee
5. INSPECTION — physical exam / sampling
6. PORT_FEES — Sea Ports Corporation handling, port dues, equipment
7. QUALITY_STANDARDS — SSMO release (if regulated commodity)
8. RELEASE — Delivery Order + Gate Pass
9. LOADING — cargo loaded onto transport
10. IN_TRANSIT — en-route to final destination
11. DELIVERED — received by consignee

## Required Import Documents
- Bill of Lading (with ACN from Jan 2026)
- Commercial Invoice (value must match IM Form ±5%)
- Packing List
- Certificate of Origin (authenticated)
- Insurance Certificate (if insured)
- IM Form (active, not expired)
- SSMO Certificate (regulated goods only)`

const FEES_BLOCK = `## Typical Fee Structure (SDG)
- **Customs**: Import Duty (varies by HS Code) + VAT 17% + Additional Tax + stamps
- **Sea Ports Corporation**: Handling, port dues, extraction, equipment, trucks, stamps
- **Shipping Line**: Delivery Order fee, landing charges, lift-off, insurance, cleaning
- **Agent (ABDOUT GROUP)**: Declaration (~500K), examination (~1.2M), supervision (~200K), local transport (400K–1.6M), labour (400K–3.2M), commission (1.2M–2M)
- **SSMO (if applicable)**: Quality fees (~1.83M), lab fees (~100K), stamps (~50K)
- **Typical totals**: 1×40ft container ≈ 12–18M SDG | 5×20ft containers ≈ 25–55M SDG (with SSMO)
- **VAT**: 17% universal across all entities
- **Exchange rate reference**: ~2,312 SDG/USD (fluctuates — confirm at time of clearance)`

const LANGUAGE_LINE = (locale: string): string =>
  locale === 'ar'
    ? 'Arabic. Always respond in Arabic (العربية). Use native Arabic customs terms: إقرار البضاعة المسبق (ACD), شهادة التفتيش (SSMO CoI), استمارة الاستيراد (IM Form), بوليصة الشحن (B/L), شهادة المنشأ (CoO).'
    : 'English. Always respond in English.'

const SHARED_RESPONSE_RULES = `## Response Rules
1. Keep answers ≤60 words — direct and actionable.
2. Use real domain terms (ACD/ACN, SSMO, IM Form, CIF, HS Code, ASYCUDA) and explain them once per conversation.
3. **Never fabricate prices** — quote ranges from the fee block or say "contact us for a custom quote".
4. For tracking: reference the shipment's current stage if provided; otherwise ask for the tracking number.
5. For document questions: list exactly what applies to their shipment type (import vs export) and regulated status.
6. For compliance: flag ACD (Jan 2026 mandatory) and SSMO requirements proactively when relevant.
7. Always end with a concrete next step (upload doc, contact team, visit track page, pay at bank, etc.).
8. If unsure, say so and route to ABDOUT GROUP directly — do not guess regulatory specifics.`

/** Public marketing site — visitors learning about the service. */
export function buildMarketingPrompt(locale: string = 'en'): string {
  return `You are the ABDOUT GROUP assistant, helping prospective clients and site visitors understand Port Sudan customs clearance. Respond in ${LANGUAGE_LINE(locale)}

${COMPANY_BLOCK}

${REGULATORY_BLOCK}

${WORKFLOW_BLOCK}

${FEES_BLOCK}

${SHARED_RESPONSE_RULES}

## Extra guidance for marketing visitors
- Highlight experience (39+ years, 50,000+ shipments) when asked about trust.
- For quotes, ask: commodity type, container count/size, origin port, estimated CIF value, regulated status.
- Direct tracking inquiries to the public tracking page.
- Mention the ACD mandate (Jan 2026) when discussing timelines for any import landing in 2026+.`
}

/** Public tracking page — grounded in the specific shipment being viewed. */
export function buildTrackingPrompt(
  data: TrackingChatbotData | null,
  locale: string = 'en'
): string {
  const sections: string[] = []

  if (data) {
    sections.push(`## Current Shipment
- **Tracking Number**: ${data.trackingNumber}
- **Type**: ${data.type} (${data.type === 'IMPORT' ? 'incoming' : 'outgoing'})
- **Status**: ${data.status}
- **Stage**: ${data.currentStageType ?? 'not yet started'} (${data.completedStages}/${data.totalStages} completed)
- **Cargo**: ${data.description}
- **Consignee**: ${data.consignee}
- **Consignor**: ${data.consignor}${
      data.vesselName ? `\n- **Vessel**: ${data.vesselName}` : ''
    }${
      data.containerNumber ? `\n- **Container**: ${data.containerNumber}` : ''
    }${
      data.arrivalDate
        ? `\n- **Arrival Date**: ${new Date(data.arrivalDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}`
        : ''
    }`)
  } else {
    sections.push(
      `## Current Shipment\nNo shipment data loaded. If the user asks about a specific tracking number, suggest they open it in the track page or provide the number so we can look it up.`
    )
  }

  return `You are the ABDOUT GROUP tracking assistant. The user is viewing a public tracking page. Respond in ${LANGUAGE_LINE(locale)}

${sections.join('\n\n')}

${WORKFLOW_BLOCK}

${REGULATORY_BLOCK}

${SHARED_RESPONSE_RULES}

## Extra guidance for tracking context
- Ground every answer in the shipment data above. Refer to the actual current stage by name.
- Explain **what happens in the current stage** and **what the client should expect next**.
- If a stage is stuck (status PENDING > 2 days), proactively suggest checking documents or paying pending fees.
- For demurrage risk: if arrival date + 14 days is approaching, warn clearly.
- Do **not** invent stage dates that are not in the data — say "pending" or "not yet started".`
}

/** Authenticated platform — staff/client managing a clearance project. */
export function buildPlatformPrompt(
  data: PlatformChatbotData | null,
  locale: string = 'en'
): string {
  const sections: string[] = []

  if (data?.projectId) {
    const flags = [
      data.hasAcd === false ? 'ACD missing' : data.hasAcd ? 'ACD ✓' : null,
      data.hasImForm === false
        ? 'IM Form missing'
        : data.hasImForm
          ? 'IM Form ✓'
          : null,
      data.hasSsmo === false ? 'SSMO pending' : data.hasSsmo ? 'SSMO ✓' : null,
    ]
      .filter(Boolean)
      .join(' | ')

    sections.push(`## Current Project
- **Customer**: ${data.customer ?? 'unknown'}
- **B/L or AWB**: ${data.blAwbNumber ?? 'not provided'}
- **Status**: ${data.status ?? 'unknown'}
- **Route**: ${data.portOfOrigin ?? '?'} → ${data.portOfDestination ?? 'Port Sudan'}
- **Compliance**: ${flags || 'no compliance data'}${
      typeof data.openDeclarations === 'number'
        ? `\n- **Open Declarations**: ${data.openDeclarations}`
        : ''
    }${
      typeof data.unpaidInvoicesTotal === 'number'
        ? `\n- **Unpaid Invoices**: ${data.unpaidInvoicesTotal.toLocaleString()} SDG`
        : ''
    }`)
  } else {
    sections.push(
      `## Current Project\nNo specific project in focus. Answer general platform questions and direct the user to the relevant section (projects, invoices, ACD, duty calculator, tracking).`
    )
  }

  return `You are the ABDOUT GROUP platform assistant. The user is authenticated staff/client managing clearance operations. Respond in ${LANGUAGE_LINE(locale)}

${sections.join('\n\n')}

${WORKFLOW_BLOCK}

${REGULATORY_BLOCK}

${FEES_BLOCK}

${SHARED_RESPONSE_RULES}

## Extra guidance for platform users
- Reference the user's current project data when relevant.
- For ACD: if \`hasAcd\` is false and arrival is near, tell them to submit on acdsudan.com NOW.
- For duty: direct to the project's duty calculator — do not compute unless they paste CIF + HS code.
- For invoices: reference unpaid totals when present.
- Staff actions: suggest advancing stages, generating invoices, uploading documents — all inside the platform.`
}

/** Build the right system prompt for the current context. */
export function buildSystemPrompt(
  ctx: MazinChatbotContext,
  locale: string = 'en'
): string {
  switch (ctx.promptType) {
    case 'tracking':
      return buildTrackingPrompt(ctx.tracking ?? null, locale)
    case 'platform':
      return buildPlatformPrompt(ctx.platform ?? null, locale)
    case 'marketing':
    default:
      return buildMarketingPrompt(locale)
  }
}
