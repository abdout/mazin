# Port Sudan Customs Clearance Workflow Stages

> Real workflow stages mapped from actual clearance documents, showing the sequence of activities, documents, and payments at each stage.

## Overview

The customs clearance process at Port Sudan follows **11 distinct stages** from pre-shipment to final delivery. Each stage involves specific:
- Documents generated/required
- Payments to specific authorities
- Actions by clearing agent
- Timeline considerations

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PORT SUDAN CUSTOMS CLEARANCE WORKFLOW                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                            │
│  │ 1. PRE-      │                                                            │
│  │   SHIPMENT   │ ← B/L issued at origin                                     │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │ 2. VESSEL    │ ← Vessel arrives at Port Sudan                             │
│  │   ARRIVAL    │ ← Arrival Notice from shipping line                        │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │ 3. DELIVERY  │ ← Pay shipping line/agent                                  │
│  │   ORDER      │ ← D/O issued (releases container from line)                │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │ 4. CUSTOMS   │ ← Submit IM4 declaration via ASYCUDA                       │
│  │ DECLARATION  │ ← Assessment Notice generated                              │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │ 5. CUSTOMS   │ ← Bank transfer to customs                                 │
│  │   PAYMENT    │ ← Payment Receipt issued (ASYCUDA)                         │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │ 6. INSPECTION│ ← Working Order issued                                     │
│  │ /EXAMINATION │ ← Container moved to CFS                                   │
│  └──────┬───────┘ ← Physical inspection completed                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │ 7. QUALITY   │ ← SSMO Release Form application (if required)              │
│  │  STANDARDS   │ ← Quality inspection                                       │
│  └──────┬───────┘ ← Release letter issued                                    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │ 8. PORT FEES │ ← Sea Ports Corporation Bill                               │
│  │   PAYMENT    │ ← Terminal handling charges                                │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │ 9. RELEASE   │ ← All payments confirmed                                   │
│  │              │ ← Container released from port                             │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │ 10. LOADING  │ ← Truck assigned                                           │
│  │ & TRANSPORT  │ ← Container loaded                                         │
│  └──────┬───────┘ ← Local transport begins                                   │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐                                                            │
│  │ 11. DELIVERY │ ← Goods delivered to consignee                             │
│  │              │ ← Final invoice issued                                     │
│  └──────────────┘                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Stage Breakdown

### Stage 1: Pre-Shipment (قبل الشحن)

**Location**: Origin Port (e.g., Port Klang Malaysia, Nansha China)

**Activities**:
- Goods loaded into container at origin
- Bill of Lading (B/L) issued by shipping line
- Container sealed with seal number
- Shipping booking confirmed

**Documents Generated**:
| Document | Issuing Party | Key Data |
|----------|---------------|----------|
| Bill of Lading | Shipping Line (CMA CGM, MSC, etc.) | B/L number, container numbers, cargo description |
| Packing List | Shipper | Item details, quantities, weights |
| Commercial Invoice | Shipper | Value, terms (CIF/FOB) |

**Key Data Points from PDFs**:
```
B/L Number:       OSLPKGPZU4742625
Booking Ref:      OSL-49880/25
Container:        TCLU1992510, CZZU3028214, etc.
Port of Loading:  PORT KLANG, MALAYSIA
Ship on Board:    06/06/2025
```

**Automation Opportunity**:
- ACD (Advance Cargo Declaration) submission - mandatory from Jan 2026
- Must be submitted before cargo loading at origin
- Generates ACN number shown on B/L

---

### Stage 2: Vessel Arrival (وصول الباخرة)

**Location**: Port Sudan South Quay (DAMADAMA)

**Activities**:
- Vessel arrives at Port Sudan
- Container discharged from vessel
- Manifest registered with customs (PZUS0/PZUS1)
- Arrival Notice sent to consignee/agent

**Documents Generated**:
| Document | Issuing Party | Key Data |
|----------|---------------|----------|
| Arrival Notice | Shipping Line/Agent | Vessel name, voyage, ETA, charges |
| Manifest | Port Authority | Manifest reference (PZUS0 2025 1419) |

**Key Data Points from PDFs**:
```
Vessel Name:      MING QIANG XING / TJ ZARAR / SUNSET X
Voyage:           00125E / 25/0225 / PS2439W
Arrive Date:      20/11/2024, 10/08/2025
Discharge Port:   PORT SUDAN
Manifest:         PZUS0 2025 1419
```

**Fees at This Stage** (CMA CGM example):
| Fee | Amount (SDG) |
|-----|--------------|
| Arrival Notice Charge | 12,495.00 |

---

### Stage 3: Delivery Order (إذن التسليم)

**Location**: Shipping Agent Office

**Activities**:
- Clear shipping line charges
- Pay freight and local charges
- Obtain Delivery Order (D/O)
- D/O authorizes port to release container to clearing agent

**Documents Generated**:
| Document | Issuing Party | Key Data |
|----------|---------------|----------|
| Delivery Order | Shipping Agent | D/O number, validity, consignee |
| Shipping Agent Invoice | Agent (Al Arbab, Eastern) | Itemized charges |
| Bank Journal Voucher | Agent | Payment allocation |

**Key Data Points from PDFs**:
```
D/O Number:       ESST0001092025 / 744
DO Issued On:     10-Aug-2025
Valid Till:       10-Aug-2025
Return Yard:      PORT SUDAN SOUTH TERMINAL
Clearing Area:    Inport
```

**Fees at This Stage** (Al Arbab example):
| Fee Category | Amount (SDG) |
|--------------|--------------|
| Landing Charges | 804,750.00 |
| Lift Off Charges | 3,867,500.00 |
| D/O Administration | 2,340.00 |
| Insurance Charges | 180,815.00 |
| Clean/PHC Charges | 151,725.00 |
| Documentation | 10,000.00 |
| Various Stamps & Fees | ~100,000.00 |
| VAT (17%) | 869,712.49 |
| **Total** | **~5,985,668.29** |

---

### Stage 4: Customs Declaration (البيان الجمركي)

**Location**: Customs Office / ASYCUDA System

**Activities**:
- Prepare customs declaration (IM4 form)
- Submit via ASYCUDA World system
- System generates Assessment Notice
- Bank Code assigned for payment

**Documents Generated**:
| Document | Issuing Party | Key Data |
|----------|---------------|----------|
| ASYCUDA Declaration (IM4) | Declarant/Agent | Declaration reference, HS code, value |
| Assessment Notice | Sudan Customs | Tax breakdown, total assessment |

**Key Data Points from PDFs**:
```
Customs Office:       PZUS1 - PortSudan South Quay (DAMADAMA)
Model:                IM 4
Customs Reference:    A 10294 / A 3223 / A 3179
Declarant Reference:  2024 #12 / 2025 #41 / 2025 #42
Assessment Reference: H 10541 / H 3243
Bank Code:            106240110294 / 17825013179
Declarant ID:         300000981146 (Mazin Mohamed Elamin Osman)
```

**Data Required for Declaration**:
- Consignee details (tax ID, name, address)
- Commodity code (HS Code)
- Country of origin
- CIF value and currency
- Exchange rate
- Bank details for import financing
- Container and package details
- Net and gross weights

---

### Stage 5: Customs Payment (دفع الرسوم الجمركية)

**Location**: Bank / ASYCUDA System

**Activities**:
- Transfer customs duties to designated bank account
- Bank Code used as payment reference
- ASYCUDA updates payment status
- Payment Receipt generated

**Documents Generated**:
| Document | Issuing Party | Key Data |
|----------|---------------|----------|
| Payment Receipt | Ministry of Finance / Customs | Receipt number, tax breakdown |
| Bank Transfer Confirmation | Bank | Transaction reference |

**Key Data Points from PDFs**:
```
Receipt Number:       2025 R 6763 / 2025 R 6648
Issue Date:           23/08/2025 / 20/08/2025
Means of Payment:     Bank's Transfer
Bank Reference:       93353567015744932
Bank Code:            02
Total Collected:      48,390,480.49 SDG
```

**Tax Breakdown Example**:
| Tax | Amount (SDG) |
|-----|--------------|
| Stamp Tax (STP) | 1,500.00 |
| Declarant Income Tax (DIT) | 3,500.00 |
| Clearance Added Tax (CAT) | 3,400.00 |
| Value Added Tax (VAT) | 41,300,819.49 |
| Police Stamp (PLS) | 4.00 |
| Computer Service (CMP) | 150.00 |
| Additional Tax (ADT) | 0.00 |
| Business Stamp (BSS) | 5,000.00 |
| Forms Sales (FRM) | 10.00 |
| Import Duty (IMD) | 7,076,097.00 |
| **Total** | **48,390,480.49** |

---

### Stage 6: Inspection/Examination (الكشف والفحص)

**Location**: Container Freight Station (CFS) / Port Sudan South Port

**Activities**:
- Working Order issued for container movement
- Container moved from stack to CFS
- Physical inspection by customs officers
- Verification of goods against declaration
- Examination report generated

**Documents Generated**:
| Document | Issuing Party | Key Data |
|----------|---------------|----------|
| Working Order | Port Authority | Kind of work, position, containers |
| Examination Report | Customs | Findings, approval status |

**Key Data Points from PDFs**:
```
Kind of Work:         كشف (Inspection)
Position/Field:       Pos.Field-CFS 1
Date:                 11/8/2025
Agent:                Mazin Mohamed Al-Amin (276)
Containers:           TCLU1992510, CZZU3028214, etc.
Commodity:            جلسرين (Glycerin)
```

**Fees at This Stage** (Sea Ports Corporation):
| Service | Tariff | Amount (SDG) |
|---------|--------|--------------|
| TRANSE FULL EXAM | CT/F-3-4 | 1,262,920.50 |
| FORKLEFT & CRAN | H/11-1 | 22,451.92 |
| NO OF TRUCKS | H/12-1 | 70,162.25 |

---

### Stage 7: Quality Standards (المواصفات والجودة)

**Location**: SSMO Office / Laboratory

**Activities**:
- Submit SSMO Release Form application
- Pay quality inspection fees (Ministry of Finance)
- Laboratory testing (if required)
- Quality certificate/release letter issued

**Required For**:
- Food products
- Chemicals (glycerin, glycerol, etc.)
- Construction materials
- Vehicles
- Textiles
- Electronics

**Documents Generated**:
| Document | Issuing Party | Key Data |
|----------|---------------|----------|
| SSMO Release Form | SSMO | Form number (FR prefix) |
| Ministry of Finance Receipt | Ministry of Finance | Receipt number, fees paid |
| Certificate of Conformity | SSMO | Approval status |

**Key Data Points from PDFs**:
```
Form Number:          FR2513494 / FR2513495
Date:                 18/11/2024
Subject:              الإفراج عن رسالة جلسرين
Receipt Number:       0794086
Validity:             One month from date
```

**Fees at This Stage**:
| Fee | Amount (SDG) |
|-----|--------------|
| Inspection | 75,000.00 |
| Laboratory | Variable |
| Stamps | 15,000.00 |
| Analysis | 4,000.00 |
| Certificate | 170,000.00 |
| **Typical Total** | **~1,830,000.00** |

---

### Stage 8: Port Fees Payment (دفع رسوم الموانئ)

**Location**: Sea Ports Corporation Office

**Activities**:
- Obtain final port bill
- Pay terminal handling charges
- Pay storage (if any demurrage)
- Obtain payment receipt

**Documents Generated**:
| Document | Issuing Party | Key Data |
|----------|---------------|----------|
| Sea Ports Corporation Bill | Port Authority | Bill number, services, total |

**Key Data Points from PDFs**:
```
Bill Number:          10124046050 / 10125042351
Bill Date:            01/12/2024 / 11/08/2025
Vessel:               SUNSET X / TJ ZARAR
Delivery Order:       80484 / 744
Declaration No:       10294 / 3223
Container:            TGBU6837520 / BCXU2216321
CUS NO:               276 (Mazin)
```

**Fee Breakdown Example** (5×20' containers):
| Service | Tariff | Amount (SDG) |
|---------|--------|--------------|
| TRANSE EMPTY CONT | CT/F-2 | 940,174.15 |
| PORT DUES | CT/U-13/1 | 3,031,009.20 |
| Environment service | Enviro20 | 300.00 |
| Stamps | Various | 26,060.00 |
| EXTRACTION BILL | H9/1 | 14,032.45 |
| VAT (17%) | | 693,231.09 |
| **Total** | | **4,797,451.06** |

---

### Stage 9: Release (الإفراج)

**Location**: Port Sudan South Port

**Activities**:
- Verify all payments completed
- Customs releases cargo
- Port releases container
- Container ready for gate-out

**Required Before Release**:
- [ ] Customs duties paid (Payment Receipt)
- [ ] Port fees paid (Sea Ports Bill cleared)
- [ ] Shipping charges paid (D/O obtained)
- [ ] SSMO clearance (if applicable)
- [ ] Examination completed (if required)

**Documents Required**:
| Document | Purpose |
|----------|---------|
| Payment Receipt (ASYCUDA) | Proves customs paid |
| Sea Ports Bill (Cleared) | Proves port fees paid |
| Delivery Order | Authorizes release |
| SSMO Release (if applicable) | Quality clearance |

---

### Stage 10: Loading & Transport (التحميل والنقل)

**Location**: Port → Destination

**Activities**:
- Assign trucks for transport
- Load containers onto trucks
- Gate-out from port
- Begin local transport to destination

**Documents Generated**:
| Document | Issuing Party | Key Data |
|----------|---------------|----------|
| Gate-Out Pass | Port Authority | Container, truck, date/time |
| Transport Waybill | Transport Company | Route, driver, vehicle |

**Fees at This Stage**:
| Service | Amount (SDG) |
|---------|--------------|
| Local Transport (ترحيل محلي) | 250,000.00 - 1,600,000.00 |
| Labourers Wages | 400,000.00 |
| Stevedoring | 3,200,000.00 |

---

### Stage 11: Delivery (التسليم)

**Location**: Consignee's Premises

**Activities**:
- Goods delivered to consignee
- Delivery confirmation obtained
- Empty container returned to depot
- Final invoice issued to client
- Account statement reconciled

**Documents Generated**:
| Document | Issuing Party | Key Data |
|----------|---------------|----------|
| Delivery Note | Agent/Transport | Confirmation of receipt |
| Final Invoice | Clearing Agent | Complete cost breakdown |
| Account Statement | Clearing Agent | Balance due/paid |

**Final Invoice Example** (Invoice 1044/25):
```
Client:               ياسر عماد
B/L:                  OSLPKGPZU4742625
Container:            5×20'
Commodity:            جرسلين (استران)

Delivery Order:       6,151,914.87 SDG
Customs Declaration:  500,000.00 SDG
Customs Duty:         (paid separately)
Examination:          1,200,000.00 SDG
SSMO Quality Fees:    1,830,000.00 SDG
Port Charges:         4,797,451.06 SDG
Stevedoring:          3,200,000.00 SDG
Local Transport:      1,600,000.00 SDG
Commission:           1,200,000.00 SDG
Other:                4,641,122.27 SDG
────────────────────────────────────
Total:                24,724,475.88 SDG
```

---

## Stage-to-Payment Mapping

| Stage | Payment To | Typical Amount Range |
|-------|------------|---------------------|
| 3. Delivery Order | Shipping Line/Agent | 700K - 6M SDG |
| 5. Customs Payment | Ministry of Finance | 9M - 48M SDG |
| 7. Quality Standards | Ministry of Finance | 1.5M - 2M SDG |
| 8. Port Fees | Sea Ports Corporation | 250K - 5M SDG |
| 10. Transport | Transport Companies | 250K - 4M SDG |
| 11. Delivery | Clearing Agent | Invoice total |

---

## Timeline Estimates

| Stage | Duration |
|-------|----------|
| 1. Pre-Shipment | Origin dependent |
| 2. Vessel Arrival | Transit time (2-4 weeks from SE Asia) |
| 3. Delivery Order | 1-2 days |
| 4. Customs Declaration | 1 day |
| 5. Customs Payment | 1 day |
| 6. Inspection | 1-2 days |
| 7. Quality Standards | 2-5 days (if required) |
| 8. Port Fees | 1 day |
| 9. Release | Same day |
| 10. Loading & Transport | 1-3 days |
| 11. Delivery | Destination dependent |
| **Total (Port Operations)** | **5-15 days** |

---

## Risk Points & Delays

| Stage | Risk | Mitigation |
|-------|------|------------|
| Pre-Shipment | Missing ACD (from 2026) | Submit ACD before loading |
| Vessel Arrival | Manifest errors | Verify B/L details early |
| D/O | Insufficient funds | Pre-fund agent account |
| Declaration | HS Code disputes | Pre-classification consultation |
| Payment | Bank delays | Use established payment channels |
| Inspection | Physical discrepancies | Accurate documentation |
| SSMO | Failed quality tests | Pre-shipment inspection at origin |
| Port Fees | Demurrage accumulation | Clear within free days |
| Release | Missing documents | Document checklist |
| Transport | Truck availability | Pre-book transport |

---

## Automation Opportunities by Stage

| Stage | Current State | Automation Opportunity |
|-------|---------------|----------------------|
| 1 | Manual B/L tracking | ACD integration, vessel tracking API |
| 2 | Phone/email notifications | Auto-alert on vessel arrival |
| 3 | Manual payment | Pre-calculate D/O charges |
| 4 | Manual data entry | OCR from documents, auto-populate |
| 5 | Manual transfer | Payment link generation |
| 6 | Manual scheduling | Working order auto-request |
| 7 | Manual application | SSMO workflow tracking |
| 8 | Manual calculation | Port fee estimator |
| 9 | Manual verification | Document checklist automation |
| 10 | Manual booking | Transport scheduling integration |
| 11 | Manual invoicing | Auto-generate invoice from stage data |

---

## Related Files

- [Document Types](./document-types.md) - All document types
- [Fee Structure](./fee-structure.md) - Complete fee catalog
- [Reference Numbers](./reference-numbers.md) - Number formats
- [Entities](./entities.md) - Key parties and authorities
