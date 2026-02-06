# Port Sudan Customs Clearance Fee Structure

> Complete catalog of fees, duties, and charges involved in customs clearance at Port Sudan, extracted from real clearance invoices.

## Overview

The customs clearance process involves **50+ distinct fee categories** across 6 payment destinations:

1. **Sudan Customs** - Duties and taxes via ASYCUDA
2. **Sea Ports Corporation** - Terminal handling charges
3. **Shipping Lines/Agents** - D/O and freight charges
4. **SSMO** - Quality standards fees
5. **Ministry of Finance** - Government stamps and fees
6. **Clearing Agent** - Service fees and commission

---

## 1. Customs Duties & Taxes (ASYCUDA)

Paid to: **Ministry of Finance - Customs Headquarters**
System: **ASYCUDA World**

### Global Taxes (Fixed per Declaration)

| Code | Description | Arabic | Amount (SDG) |
|------|-------------|--------|--------------|
| BSS | Business Stamp | رسم الأعمال | 1,000.00 - 5,000.00 |
| STP | Stamp Tax | رسم الدمغة | 1,500.00 |
| PLS | Police Stamp | طابع الشرطة | 4.00 |
| CMP | Computer Service | خدمة الحاسوب | 10.00 - 150.00 |
| FRM | Forms Sales | بيع النماذج | 10.00 |
| DIT | Declarant Income Tax | ضريبة دخل المخلص | 3,500.00 |
| CAT | Clearance Added Tax | ضريبة التخليص المضافة | 3,400.00 |
| **Total Global** | | | **9,564.00 - 13,564.00** |

### Item Taxes (Calculated on CIF Value)

| Code | Description | Arabic | Rate | Example Amount (SDG) |
|------|-------------|--------|------|---------------------|
| IMD | Import Duty | رسوم الاستيراد | 0% - 40% | 3,468,675.00 - 7,076,097.00 |
| ADT | Additional Tax | ضريبة إضافية | 0% - 8.37% | 0.00 - 966,080.00 |
| VAT | Value Added Tax | ضريبة القيمة المضافة | 17% | 3,402,176.00 - 41,300,819.49 |

### Duty Calculation Formula

```
CIF Value (USD) × Exchange Rate = Base Value (SDG)

Import Duty = Base Value × Duty Rate (varies by HS Code)
Additional Tax = Base Value × ADT Rate (if applicable)
Taxable Amount = Base Value + Import Duty + Additional Tax
VAT = Taxable Amount × 17%

Total Customs = Import Duty + Additional Tax + VAT + Global Taxes
```

### Example Calculation (from PDF)

```
CIF Value:           USD 50,000.00
Exchange Rate:       2,312.45
Statistical Value:   SDG 115,622,500.00

Import Duty (3%):    SDG 3,468,675.00
Additional Tax:      SDG 0.00
VAT (17%):           SDG 20,245,499.75
Global Taxes:        SDG 13,564.00
─────────────────────────────────────
Total Declaration:   SDG 23,727,738.75
```

---

## 2. Sea Ports Corporation Charges

Paid to: **Sea Ports Corporation - Port Sudan South Port Containers Terminal**

### Container Handling Charges

| Service | Tariff Code | Description | Rate Basis | Rate (SDG) |
|---------|-------------|-------------|------------|------------|
| TRANSE FULL EXAM | CT/F-3-4 | Full container examination | Per 20'/40' | 205,128.70 / 252,584.10 |
| TRANSE EMPTY CONT | CT/F-2 | Empty container transport | Per 20'/40' | 152,799.95 / 188,034.83 |
| PORT DUES FOR CONTAINERS | CT/U-13/1 | Port usage fees | Per 20'/40' | 606,201.84 / 904,240.80 |
| Environment service | Enviro20/40 | Environmental fee | Per 20'/40' | 60.00 / 90.00 |

### Documentation & Processing

| Service | Tariff Code | Description | Amount (SDG) |
|---------|-------------|-------------|--------------|
| EXTRACTION BILL | H9/1 | Bill extraction | 10,465.75 - 14,032.45 |
| BILL_LATE | O/6 | Late bill penalty | 28,064.90 |
| OVER TIME OFFICE | OT1 | Overtime processing | 14,032.45/hr |

### Equipment & Labor

| Service | Tariff Code | Description | Amount (SDG) |
|---------|-------------|-------------|--------------|
| FORKLEFT & CRAN UP TO 10 TON | H/11-1 | Forklift/crane usage | 11,225.96 |
| NO OF TRUCKS | H/12-1 | Truck allocation | 14,032.45/truck |

### Stamps & Fees

| Service | Tariff Code | Description | Amount (SDG) |
|---------|-------------|-------------|--------------|
| STAMP | STAMP | General stamp | 1,000.00 |
| STAMP_CNTR20 | STAMP20 | Container stamp (20') | 5,000.00 |
| STAMP_CNTR40 | STAMP40 | Container stamp (40') | 5,000.00 |
| STAMP FORM 606_SPC | STAMP55 | Form 606 stamp | 50.00 - 60.00 |
| TOUR_STAMP | TOUR_STAMP | Tourism stamp | 10.00 |

### Regulatory Fees

| Service | Tariff Code | Description | Amount (SDG) |
|---------|-------------|-------------|--------------|
| Genocide goods | F343_20 | Customs union fee | 20.00 |
| Union clearance agents | F343_5 | Agent union fee | 5.00 |

### VAT

All Sea Ports charges are subject to **17% VAT**.

### Example Port Bill Breakdown

```
Container: 5×20' (TRANSE FULL EXAM)

TRANSE FULL EXAM (5×20'):    SDG 1,262,920.50
Genocide goods:              SDG 20.00
Union clearance agents:      SDG 5.00
EXTRACTION BILL:             SDG 14,032.45
STAMP:                       SDG 1,000.00
STAMP FORM 606:              SDG 50.00
VAT (17%):                   SDG 217,082.00
─────────────────────────────────────────────
Total:                       SDG 1,495,109.95
```

---

## 3. Shipping Line Charges

### CMA CGM Charges

| Charge | Description | Arabic | Basis | Amount (SDG) |
|--------|-------------|--------|-------|--------------|
| Administration fee | Admin processing | رسوم إدارية | FIX | 2,000.00 |
| Arrival Notice Charge | Notification fee | رسوم إشعار الوصول | FIX | 12,495.00 |
| Chamber of commerce | Trade chamber fee | رسوم غرفة التجارة | FIX | 3,000.00 |
| Cleaning and disinfection | Container cleaning | التنظيف والتطهير | UNI | 28,263.00 |
| Delivery Order fee | D/O issuance | رسوم إذن التسليم | FIX | 26,775.00 |
| Agent charges | Agent fee | رسوم الوكيل | FIX | 2,000.00 |
| Import service charges | Import processing | رسوم خدمة الاستيراد | UNI | 2,000.00 |
| Insurance Cost | Cargo insurance | تكلفة التأمين | UNI | 43,435.00 |
| Terminal lift off | Lift on/off | الرفع والإنزال | UNI | 350,000.00 |
| Landing charges | Discharge fee | رسوم الإنزال | UNI | 142,800.00 |
| Province charge | State fee | رسوم الولاية | TNE | 0.60 |
| Conference fees | Shipping conference | رسوم المؤتمر | UNI | 893.00 |
| Direct delivery SOBA-GARI | Door delivery | التسليم المباشر | FIX | 50.00 |
| Military support | Security fee | الدعم العسكري | TNE | 1.21 |
| Food bank charge | Food security | رسوم بنك الطعام | FIX | 10.00 |
| City Traffic charge | Traffic fee | رسوم المرور | FIX | 5,000.00 |
| Nation Protection | Defense fee | حماية الوطن | UNI | 10.00 |
| Finance ministry fee | Ministry fee | رسوم وزارة المالية | UNI | 500.00 |
| Tourism Stamp fees | Tourism stamp | طوابع السياحة | FIX | 100.00 |
| Stamp Duty at Destination | Destination stamp | رسم الدمغة بالوجهة | FIX | 1,000.00 |
| Express release fees | Fast release | رسوم الإفراج السريع | FIX | 10,000.00 |
| **VAT** | 17% | ضريبة القيمة المضافة | % | 17% of applicable |

---

### Shipping Agent Charges (Al Arbab / Eastern Shipping)

| Charge | Arabic | Amount (SDG) |
|--------|--------|--------------|
| Land Charges | رسوم الإنزال | 804,750.00 - 941,557.50 |
| D.Charge (Documentation) | رسوم التوثيق | 59,174.00 |
| Clean_PHC (Port Health) | رسوم صحة الميناء | 151,725.00 - 230,776.65 |
| Extraction Bill | فاتورة الاستخراج | 1,050.00 |
| Stamp Duty | رسوم الدمغة | 5,000.00 - 5,850.00 |
| D/O Administration Charges | رسوم إدارة إذن التسليم | 2,000.00 - 2,340.00 |
| Traffic Map Project Fees | رسوم خريطة المرور | 5,000.00 - 5,850.00 |
| Business Owner Federation Fees | رسوم اتحاد أصحاب الأعمال | 15,000.00 - 17,550.00 |
| Asycoda charges | رسوم أسيكودا | 10,000.00 - 11,700.00 |
| Lift Off Charges | رسوم الرفع | 3,867,500.00 - 4,524,975.00 |
| Chamber of Shipping Federation Fees | رسوم اتحاد غرفة الملاحة | 11,700.00 - 13,689.00 |
| Arrival Notice Charges | رسوم إشعار الوصول | 27,615.00 - 32,309.55 |
| Country Defense Fees | رسوم الدفاع الوطني | 1.00 - 1.17 |
| Red Sea State fees | رسوم ولاية البحر الأحمر | 15,000.00 - 17,550.00 |
| Insurance Charges | رسوم التأمين | 180,815.00 - 211,553.55 |
| Province / Locality Fees | رسوم المحلية | 500.00 - 585.00 |
| MISC Charges | رسوم متنوعة | 10,000.00 - 11,700.00 |
| Tourism Stamp Fees | طوابع السياحة | 500.00 - 585.00 |
| State Stamp Duty Fees | رسوم دمغة الولاية | 1,000.00 - 1,170.00 |
| War Efforts Fees | رسوم المجهود الحربي | 500.00 - 585.00 |
| Wharfage Fees | رسوم الرصيف | 24,736.90 - 28,942.17 |
| Food Bank Fees | رسوم بنك الطعام | 10.00 - 11.70 |
| Bank Charges | رسوم البنك | 10,000.00 - 11,700.00 |
| D/O Charges | رسوم إذن التسليم | 59,174.00 - 69,233.58 |
| DOCUMENTATION CHARGES | رسوم التوثيق | 10,000.00 - 11,700.00 |
| PPD | PPD | 15.48 |
| WE | WE | 10.32 |
| SSC | SSC | 11,700.00 |
| StateGovt | الحكومة المحلية | 1,000.00 |
| EUS | EUS | 100.00 |
| NP Stamp | طابع NP | 1.00 |
| AdminFess | رسوم إدارية | 0.00 - 15,300.00 |
| Notification | الإشعار | 27,615.00 |
| **VAT** | ضريبة القيمة المضافة | **17%** |

---

## 4. SSMO (Quality Standards) Fees

Paid to: **Sudanese Standards and Metrology Organization (SSMO)**
Via: **Ministry of Finance Receipt (Fin Form 15)**

| Fee Type | Arabic | Amount (SDG) |
|----------|--------|--------------|
| Inspection | تفتيش | 75,000.00 |
| Laboratory | معمل | Variable |
| Stamps | طوابع | 15,000.00 |
| Analysis | تحليل | 4,000.00 |
| Certificate of Conformity | شهادة مطابقة | 170,000.00 |
| Administrative fees | رسوم إدارية | Variable |
| **Typical Total** | | **1,830,000.00** |

### Products Requiring SSMO Clearance

- Food products and beverages
- Chemicals (glycerin, glycerol, petroleum jelly)
- Construction materials
- Vehicles and automotive parts
- Textiles and garments
- Electronics and electrical equipment
- Pharmaceuticals
- Cosmetics

---

## 5. Clearing Agent Fees (Abdout Group)

### Standard Service Fees

| Service | Arabic | Typical Amount (SDG) |
|---------|--------|---------------------|
| Customs Declaration | شهادة جمركية | 500,000.00 |
| Examination/Inspection | الكشف عن الطرد | 700,000.00 - 1,200,000.00 |
| Customs Laboratory | رسوم معمل جمركي | 100,000.00 |
| Quality Stamps | دمغة جودة | 50,000.00 |
| Supervision & Follow-up | اشراف ومتابعة | 200,000.00 |
| Container Move | نقل الحاويات | 30,000.00 - 200,000.00 |

### Labor & Transport

| Service | Arabic | Typical Amount (SDG) |
|---------|--------|---------------------|
| Local Transport | ترحيل محلي | 250,000.00 - 1,600,000.00 |
| Labourers Wages | اجرة عمال الشحن والتفريغ | 400,000.00 |
| Stevedoring | اجرة عمال التستيف | 3,200,000.00 |

### Commission & Miscellaneous

| Service | Arabic | Typical Amount (SDG) |
|---------|--------|---------------------|
| Commission | العمولة | 500,000.00 - 1,200,000.00 |
| Other Expenses | منصرفات اخرى | 200,000.00 |
| Other (Mazin) | اخرى: مازن | 2,000,000.00 |

### Calculated Fees

| Fee | Rate |
|-----|------|
| VAT | 17% on applicable services |

---

## 6. Summary Fee Categories by Payment Destination

### Customs (ASYCUDA)

```
┌─────────────────────────────────────────────────────────────┐
│ CUSTOMS DUTIES & TAXES                                       │
├─────────────────────────────────────────────────────────────┤
│ Import Duty (IMD)          │ 0-40% of CIF Value            │
│ Additional Tax (ADT)       │ 0-8.37% of CIF Value          │
│ Value Added Tax (VAT)      │ 17% of taxable amount         │
│ Business Stamp (BSS)       │ 1,000 - 5,000 SDG             │
│ Stamp Tax (STP)            │ 1,500 SDG                     │
│ Police Stamp (PLS)         │ 4 SDG                         │
│ Computer Service (CMP)     │ 10 - 150 SDG                  │
│ Forms Sales (FRM)          │ 10 SDG                        │
│ Declarant Income Tax (DIT) │ 3,500 SDG                     │
│ Clearance Added Tax (CAT)  │ 3,400 SDG                     │
└─────────────────────────────────────────────────────────────┘
```

### Sea Ports Corporation

```
┌─────────────────────────────────────────────────────────────┐
│ PORT & TERMINAL CHARGES                                      │
├─────────────────────────────────────────────────────────────┤
│ TRANSE FULL EXAM           │ Per container size             │
│ TRANSE EMPTY CONT          │ Per container size             │
│ PORT DUES                  │ Per container size             │
│ Environment Service        │ Per container                  │
│ EXTRACTION BILL            │ Fixed                          │
│ FORKLEFT & CRAN            │ Per use                        │
│ NO OF TRUCKS               │ Per truck                      │
│ Various Stamps             │ Fixed amounts                  │
│ + VAT 17%                  │ On all charges                 │
└─────────────────────────────────────────────────────────────┘
```

### Shipping Line/Agent

```
┌─────────────────────────────────────────────────────────────┐
│ SHIPPING CHARGES                                             │
├─────────────────────────────────────────────────────────────┤
│ Delivery Order Fee         │ Per shipment                   │
│ Land/Landing Charges       │ Per container                  │
│ Lift On/Off Charges        │ Per container                  │
│ Insurance                  │ Per shipment                   │
│ Clean/PHC Charges          │ Per container                  │
│ Documentation Fees         │ Fixed                          │
│ Various Stamps & Fees      │ Fixed amounts                  │
│ + VAT 17%                  │ On applicable charges          │
└─────────────────────────────────────────────────────────────┘
```

### SSMO

```
┌─────────────────────────────────────────────────────────────┐
│ QUALITY STANDARDS FEES                                       │
├─────────────────────────────────────────────────────────────┤
│ Inspection                 │ Fixed                          │
│ Laboratory Analysis        │ Per test                       │
│ Certificate                │ Fixed                          │
│ Stamps                     │ Fixed                          │
└─────────────────────────────────────────────────────────────┘
```

### Clearing Agent

```
┌─────────────────────────────────────────────────────────────┐
│ AGENT SERVICE FEES                                           │
├─────────────────────────────────────────────────────────────┤
│ Customs Declaration        │ Fixed per shipment             │
│ Examination                │ Per inspection                 │
│ Transport                  │ Per delivery                   │
│ Labor (Stevedoring)        │ Per shipment                   │
│ Commission                 │ Percentage or fixed            │
│ + VAT 17%                  │ On applicable services         │
└─────────────────────────────────────────────────────────────┘
```

---

## Typical Cost Breakdown by Shipment Size

### 1×40' Container (Kitchen Equipment)

| Category | Amount (SDG) | % of Total |
|----------|--------------|------------|
| Customs Duties & Taxes | 9,291,740.00 | 60.5% |
| Shipping Line (D/O) | 737,489.39 | 4.8% |
| Port Charges | 1,532,972.97 | 10.0% |
| SSMO | 860,000.00 | 5.6% |
| Agent Fees | 2,930,000.00 | 19.1% |
| **TOTAL** | **15,352,202.36** | **100%** |

### 5×20' Containers (Glycerin/Petroleum Jelly)

| Category | Amount (SDG) | % of Total |
|----------|--------------|------------|
| Customs Duties & Taxes | 23,727,738.75 | 47.6% |
| Shipping Agent (D/O) | 6,151,914.87 | 12.3% |
| Port Charges | 4,846,709.96 | 9.7% |
| SSMO | 1,830,000.00 | 3.7% |
| Agent Fees | 13,289,102.30 | 26.7% |
| **TOTAL** | **49,845,465.88** | **100%** |

---

## Fee Calculation Templates

### Import Duty Calculator

```typescript
interface DutyCalculation {
  cifValueUSD: number;
  exchangeRate: number;
  hsCode: string;
  dutyRate: number;      // 0-40%
  adtRate: number;       // 0-8.37%
  vatRate: number;       // 17%
}

function calculateDuties(input: DutyCalculation) {
  const baseValue = input.cifValueUSD * input.exchangeRate;

  const importDuty = baseValue * (input.dutyRate / 100);
  const additionalTax = baseValue * (input.adtRate / 100);
  const taxableAmount = baseValue + importDuty + additionalTax;
  const vat = taxableAmount * (input.vatRate / 100);

  const globalTaxes = 13564; // Fixed global taxes

  return {
    baseValue,
    importDuty,
    additionalTax,
    vat,
    globalTaxes,
    total: importDuty + additionalTax + vat + globalTaxes,
  };
}
```

### Port Fee Estimator

```typescript
interface PortFeeEstimate {
  containerCount: number;
  containerSize: '20' | '40';
  serviceType: 'FULL_EXAM' | 'EMPTY_CONT' | 'STRIPPING';
  trucks: number;
}

const PORT_RATES = {
  FULL_EXAM_20: 205128.70,
  FULL_EXAM_40: 252584.10,
  EMPTY_CONT_20: 152799.95,
  EMPTY_CONT_40: 188034.83,
  PORT_DUES_20: 606201.84,
  PORT_DUES_40: 904240.80,
  ENVIRONMENT_20: 60,
  ENVIRONMENT_40: 90,
  EXTRACTION: 14032.45,
  TRUCK: 14032.45,
  STAMP: 1000,
  STAMP_CNTR: 5000,
  STAMP_FORM: 50,
};

function estimatePortFees(input: PortFeeEstimate) {
  const size = input.containerSize;
  const count = input.containerCount;

  let subtotal = 0;

  // Handling charges
  if (input.serviceType === 'FULL_EXAM') {
    subtotal += PORT_RATES[`FULL_EXAM_${size}`] * count;
  }

  // Port dues
  subtotal += PORT_RATES[`PORT_DUES_${size}`] * count;

  // Environment
  subtotal += PORT_RATES[`ENVIRONMENT_${size}`] * count;

  // Fixed fees
  subtotal += PORT_RATES.EXTRACTION;
  subtotal += PORT_RATES.TRUCK * input.trucks;
  subtotal += PORT_RATES.STAMP;
  subtotal += PORT_RATES.STAMP_CNTR * count;
  subtotal += PORT_RATES.STAMP_FORM;

  const vat = subtotal * 0.17;

  return {
    subtotal,
    vat,
    total: subtotal + vat,
  };
}
```

---

## Related Files

- [Document Types](./document-types.md) - All document types
- [Workflow Stages](./workflow-stages.md) - Stage-by-stage process
- [Reference Numbers](./reference-numbers.md) - Number formats
- [Entities](./entities.md) - Key parties and authorities
