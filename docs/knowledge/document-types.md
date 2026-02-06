# Port Sudan Customs Clearance Document Types

> Comprehensive catalog of documents involved in the customs clearance process at Port Sudan, extracted from real clearance files.

## Overview

The customs clearance process involves **28+ distinct document types** across 5 categories:
1. Shipping Documents
2. Customs Documents
3. Regulatory Documents
4. Financial Documents
5. Port & Terminal Documents

---

## 1. Shipping Documents

### Bill of Lading (B/L) - بوليصة الشحن

**Purpose**: Ocean transport contract serving as receipt for cargo and title document.

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| B/L Number | رقم البوليصة | GGZ2339767, OSLPKGPZU4742625 |
| Shipper | الشاحن | MSDOLEO GLOBAL FZC |
| Consignee | المستورد | YASSIR EMAD TRADING ENTERPRISES |
| Notify Party | الجهة المبلغة | Same as consignee or bank |
| Vessel | الباخرة | SUNSET X, DP WORLD JEDDAH, MING QIANG XING |
| Voyage | الرحلة | PS2439W, 002W, 00125E |
| Port of Loading | ميناء التحميل | PORT KLANG MALAYSIA, NANSHA |
| Port of Discharge | ميناء التفريغ | PORT SUDAN |
| Container Numbers | أرقام الحاويات | TGBU6837520, TCLU1992510 |
| Packages | عدد الطرود | 400 DRUMS, 80 packages |
| Gross Weight | الوزن الإجمالي | 103,200 KGS |
| Net Weight | الوزن الصافي | 100,000 KGS |
| Description | وصف البضاعة | Table, kitchen or other household / Petroleum jelly / Glycerol |

**Issuing Parties**:
- CMA CGM
- Eastern Shipping Co. Ltd.
- Oceanic Star Line Ltd.

---

### Delivery Order (D/O) - إذن التسليم

**Purpose**: Authorization from shipping line/agent to port authority to release container.

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| D/O Number | رقم إذن التسليم | ESST0001092025, 744 |
| Issue Date | تاريخ الإصدار | 10-Aug-2025 |
| Valid Till | صالح حتى | 10-Aug-2025 |
| Consignee | المستلم | YASSIR EMAD TRADING ENTERPRISES |
| Bill of Lading | البوليصة | OSLPKGPZU4742625 |
| Vessel | الباخرة | MING QIANG XING |
| Vessel Voyage | رقم الرحلة | 00125E |
| NOS of Container | عدد الحاويات | 5x20' |
| Return Yard | ساحة الإرجاع | PORT SUDAN SOUTH TERMINAL |
| Clearing Area | منطقة التخليص | Inport |

**Issuing Parties**:
- Eastern Shipping Co. Ltd.
- Al Arbab Shipping Co.

**Associated Charges**:
- Land Charges
- Lift Off Charges
- D/O Administration
- Insurance Charges
- Clean Charges (PHC)

---

### Working Order - أمر العمل

**Purpose**: Authorization for container movement and inspection at port.

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| Kind of Work | نوع العمل | كشف (Inspection) |
| Position/Field | الموقع | Pos.Field-CFS 1 |
| Date | التاريخ | 11/8/2025 |
| Agent | المخلص | Mazin Mohamed Al-Amin (276) |
| Vessel | الباخرة | MING QAING |
| B/L | البوليصة | 2625 |
| Containers | الحاويات | TCLU1992510, CZZU3028214, etc. |
| Commodity | البضاعة | جلسرين (Glycerin) |

---

## 2. Customs Documents

### ASYCUDA Declaration (IM4) - البيان الجمركي

**Purpose**: Official import declaration submitted to Sudan Customs via ASYCUDA World system.

**System**: UNCTAD/ASYCUDA World

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| Declaration Type | نوع البيان | IM 4 (Import) |
| Customs Office | مكتب الجمارك | PZUS1 - PortSudan South Quay (DAMADAMA) |
| Customs Reference | المرجع الجمركي | A 10294, A 3223, A 3179 |
| Declarant Reference | مرجع المخلص | 2024 #12, 2025 #41, 2025 #42 |
| Manifest | المانيفست | PZUS0 2025 1419, PZUS0 2025 1387 |
| Reference Number | الرقم المرجعي | #42, #41 |
| Declarant | المخلص | MAZIN MOHAMED ELAMIN OSMAN (300000981146) |
| Consignee | المستورد | YASSIR EMAD TRADING ENTERPRISES (300000493804) |
| Country of Origin | بلد المنشأ | Malaysia |
| Delivery Terms | شروط التسليم | CIF |
| Currency | العملة | USD |
| Invoice Amount | قيمة الفاتورة | 50,000.00 USD |
| Exchange Rate | سعر الصرف | 2.312.4500 |
| Bank Code | كود البنك | 40 |
| Bank Name | اسم البنك | ALNILE BANK |
| Bank Reference | مرجع البنك | 2208202506473 |
| Commodity Code | رمز السلعة | 27121000 (Petroleum jelly), 29054500 (Glycerol) |
| Procedure | الإجراء | 4000 / 000 |
| Packages | عدد الطرود | 400 |
| Gross Mass | الوزن الإجمالي | 103,200.000 kg |
| Net Mass | الوزن الصافي | 100,000.000 kg |
| Item Price | سعر الوحدة | 50,000.00 |
| Statistical Value | القيمة الإحصائية | 115,622,500.00 SDG |

**Tax Breakdown on Declaration**:
| Code | Description | Arabic | Rate | Amount (SDG) |
|------|-------------|--------|------|--------------|
| IMD | Import Duty | رسوم الاستيراد | 3.00% | 3,468,675.00 |
| ADT | Additional Tax | ضريبة إضافية | 0.00% | 0.00 |
| VAT | Value Added Tax | ضريبة القيمة المضافة | 17.00% | 20,245,499.75 |
| **Total** | | | | **23,714,174.75** |

---

### Assessment Notice - إشعار التقدير

**Purpose**: Official customs assessment of duties and taxes to be paid.

**System**: ASYCUDA World

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| Customs Office | مكتب الجمارك | PZUS0 - PortSudan South Quay |
| Model | النموذج | IM 4 |
| Customs Reference | المرجع الجمركي | A 10294 |
| Declarant Reference | مرجع المخلص | 2024 #12 |
| Assessment Reference | مرجع التقدير | H 10541 |
| Assessment Date | تاريخ التقدير | 08/12/2024 |
| Declarant | المخلص | 300000981146 |
| Consignee | المستورد | 300000981728 |
| Bank Code | كود البنك | 106240110294 |
| Packages | عدد الطرود | 315 |

**Global Taxes** (Fixed per declaration):
| Code | Tax Description | Amount (SDG) |
|------|-----------------|--------------|
| BSS | Business Stamp | 1,000.00 - 5,000.00 |
| STP | Stamp Tax | 1,500.00 |
| PLS | Police Stamp | 4.00 |
| CMP | Computer Service | 10.00 - 150.00 |
| FRM | Forms Sales | 10.00 |
| DIT | Declarant Income Tax | 3,500.00 |
| CAT | Clearance Added Tax | 3,400.00 |
| **Total Global** | | **9,564.00 - 13,564.00** |

**Item Taxes** (Calculated on value):
| Code | Tax Description | Example Amount (SDG) |
|------|-----------------|---------------------|
| IMD | Import Duty | 4,913,920.06 - 7,076,097.00 |
| ADT | Additional Tax | 0.00 - 966,080.00 |
| VAT | Value Added Tax | 3,402,176.00 - 41,300,819.49 |
| **Total Item** | | **9,282,176.00 - 48,376,916.49** |

---

### Customs Payment Receipt - إيصال دفع الجمارك

**Purpose**: Official receipt confirming payment of customs duties and taxes.

**System**: ASYCUDA World - Ministry of Finance, Customs Headquarters

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| Receipt Number | رقم الإيصال | 2025 R 6763, 2025 R 6648 |
| Issue Date | تاريخ الإصدار | 23/08/2025, 20/08/2025 |
| Customs Office | مكتب الجمارك | PZUS1 - PortSudan South Quay |
| Declarant | المخلص | 300000981146 |
| Declarant Reference | مرجع المخلص | 2025 #41, 2025 #42 |
| Registration Reference | مرجع التسجيل | PZUS1 2025 A 3223, PZUS1 2025 A 3179 |
| Model | النموذج | IM 4 |
| Means of Payment | طريقة الدفع | Bank's Transfer |
| Bank Reference | مرجع البنك | 93353567015744932, 93355070157449320 |
| Bank Code | كود البنك | 02 |
| Total Collected (SDG) | إجمالي المحصل | 48,390,480.49 |

---

## 3. Regulatory Documents

### SSMO Release Form - استمارة إفراج المواصفات

**Purpose**: Quality standards release from Sudanese Standards and Metrology Organization.

**Authority**: SSMO (الهيئة السودانية للمواصفات والمقاييس) - Ministry of Cabinet Affairs

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| Form Number | الرقم المتسلسل | FR2513494, FR2513495 |
| Date | التاريخ | 18/11/2024 |
| Addressed To | الأخ الكريم | مدير دائرة جمارك... |
| Subject | الموضوع | الإفراج عن رسالة جلسرين |
| Reference | المرجع | A-3179, حرف الواردي |
| Importer | المستورد | ياسر عماد |
| Customs Broker | المخلص | مازن محمد الامين |
| License Number | رقم رخصة المخلص | 276 |
| B/L Number | رقم البوليصة | 4625, 33125 |
| Customs Declaration | الإقرار الجمركي | A-3179, A-3223 |
| Origin | المنشأ | ماليزيا (Malaysia) |
| Port of Arrival | ميناء الوصول | بورتسودان (Port Sudan) |
| Quantity | الكمية / عدد الوحدات | 5×20 حاوية |
| Weight | الوزن / الحجم الإجمالي | 103,200 kg |
| Payment Receipt | إيصال مالي رقم | 794086 |
| Receipt Date | تاريخ تحرير الإيصال | 18/11/2024 |

**Copy Distribution**:
- الأمن الاقتصادي (Economic Security)
- صاحب العلاقة (Stakeholder)
- الملف (File)

**Validity**: يسري هذا الخطاب لمدة شهر من تاريخه (Valid for one month from date)

**Required For**:
- Food products
- Chemicals (including glycerin/glycerol)
- Construction materials
- Vehicles
- Textiles
- Electronics

---

### Ministry of Finance Receipt (Fin Form 15) - إيصال وزارة المالية

**Purpose**: Government administrative fee payment receipt.

**Authority**: وزارة المالية والتخطيط الاقتصادي (Ministry of Finance and Economic Planning)

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| Form Number | أنموذج مالي | 15 |
| Receipt Number | إيصال رقم | H 0041637, I 0794086 |
| Locality | المحلية | بورتسودان البحر الأحمر |
| Received From | وصل من السيد | أعمال ياسر عماد |
| Account (ON A/C OF) | الحساب | Various fee codes |

**Typical Fees Paid**:
| Item | Arabic | Amount (SDG) |
|------|--------|--------------|
| Inspection | تفتيش | 75,000 |
| Laboratory | معمل | Variable |
| Stamps | طوابع | 15,000 |
| Analysis | تحليل | 4,000 |
| Certificate | شهادة مطابقة | 170,000 |
| **Total** | | ~1,830,000 |

---

## 4. Financial Documents

### Clearance Invoice - فاتورة التخليص

**Issuing Party**: Abdout Group Co. / Mazin Mohamed Al-Amin

**Purpose**: Detailed breakdown of all clearance charges for client billing.

**Header Information**:
| Field | Arabic | Example |
|-------|--------|---------|
| Company | الشركة | ABDOUT GROUP Co. |
| License Number | رقم الرخصة | 276 |
| Location | العنوان | Albahr Al-ahmar |
| Tax ID | الرقم الضريبي | 300000981146 |
| Date | التاريخ | 2024/12/26, 2025/8/25 |
| Invoice Number | رقم الفاتورة | 991, 1043/25, 1044/25 |
| Client | المورد | حافظ عماد, ياسر عماد |
| Commodity | الصنف | معدات مطابخ, جرسلين |
| Container | الحاوية | CN NO: 1*40, 5*20 |
| B/L Number | رقم البوليصة | GGZ2339767, VCLPKGPZUZ33125 |

**Line Items Structure**:
| English | Arabic | Example Amount (SDG) |
|---------|--------|---------------------|
| Delivery Order No | اذن تسليم رقم | 737,489.39 - 6,151,914.87 |
| Customs Declaration No | شهادة جمركية رقم | 500,000.00 |
| C.Duty R No | ايصال جمركي رقم | (Reference only) |
| Customs Duty Receipt No | ايصال جمارك رقم | 9,291,740.00 - 48,390,480.49 |
| Examination | الكشف عن الطرد | 700,000.00 - 1,200,000.00 |
| Ministry Of Trade Charges | رسوم وزارة التجارة | Variable |
| Qult.Gens.F | رسوم ضبط الجودة وتحليل | 860,000.00 - 1,830,000.00 |
| Container Move | نقل الحاويات | 30,000.00 - 200,000.00 |
| Port Rage & Storage & Quay | فاتورة موانئ نهائية | 1,279,652.00 - 4,846,709.96 |
| Hire Of Cran | اجرة كرين | Variable |
| Customs Labouratory | رسوم معمل جمركي | 100,000.00 |
| Stamps | دمغة جودة | 50,000.00 |
| Initial Port Invoice | فاتورة موانئ اولية | 1,495,109.95 |
| Customs Supervision | رسوم ملاحظة | Variable |
| Ovar Times | عمل اضافي | Variable |
| Trans Portation | اشراف ومتابعة | 200,000.00 |
| Trans Portation | ترحيل محلي | 250,000.00 - 1,600,000.00 |
| Labourers Wages | اجرة عمال الشحن والتفريغ | 400,000.00 |
| Fumigation Fees | رسوم التبخير | Variable |
| Stevedoring Charges | اجرة عمال التستيف | 3,200,000.00 |
| Checkers Wages | يوميات العدادين | Variable |
| Health Fees | رسوم وزارة الصحة والبساتين ووقاية النباتات | Variable |
| Other Carges | منصرفات اخرى | 200,000.00 |
| Demmurage Charges | اجار حاويات | Variable |
| Other | اخرى: مازن | 2,000,000.00 |
| Comm | العمولة | 500,000.00 - 1,200,000.00 |
| 17% VAT | قيمه مضافة 17% | Calculated |
| **TOTAL** | **الجملة** | **15,352,201.90 - 25,120,988.20** |

---

### Account Statement - كشف حساب

**Purpose**: Summary of client account showing transfers received and invoices issued.

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| Date | التاريخ | 2025/8/25 |
| Client | المورد | ياسر عماد |
| Container | الحاوية | NO: 10*20 |
| B/L Numbers | أرقام البوالص | ZUZ33125/GPZU4742625 |
| Commodity | الصنف | جرسلين (5) الارياب (5) استران |

**Account Structure**:
| Column | Arabic | Description |
|--------|--------|-------------|
| Description | البيان | اجمالي تحاويلكم (مرفق كشف تحاويل) |
| Credit (CT) | له | Client transfers received |
| Debit (DR) | منه | Invoices issued |
| Balance | الرصيد المطلوب منكم | Amount due |

**Example from PDF**:
| Description | Debit (DR) | Credit (CT) |
|-------------|------------|-------------|
| Total Transfers | - | 48,287,000 |
| Invoice 1043/25 | 24,724,478 (88) | - |
| Invoice 1044/25 | 25,120,988 (20) | - |
| **Total** | **49,845,467 (08)** | **48,287,000** |
| **Balance Due** | | **1,558,467 (08)** |

**Arabic Amount in Words**: فقط واحد مليون وخمسمائة ثمانية وخمسون الف واربعمائة سبعة وستون جنية وثمانية قرشا لا غير

---

### Bank Transfer Records - سجلات التحويلات البنكية

**Purpose**: Track client payments received via bank transfer.

**Source**: Mobile banking app screenshots (تحويلات)

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| Operation Number | رقم العملية | 20007308816, 20007340769 |
| Date & Time | التاريخ والوقت | 14-Aug-2025 10:41:39 |
| From Account | من حساب | 0300 1157 4499 0001 |
| To Account | الى حساب | 0605 0101 9188 5001, 0603 1258 9659 0001 |
| Sender Name | اسم المرسل | شركة الارياب للملاحة المحدودة |
| Mobile | رقم الموبايل | N/A |
| Notes | التعليق | اعمال ياسر عماد |
| Amount | المبلغ | 3,000,000.00 SDG |
| Status | الحالة | موافق (Approved) |

---

### Bank Journal Voucher - قسيمة القيد البنكي

**Issuing Party**: Eastern Shipping Co. Ltd.

**Purpose**: Record of payments received and allocated to specific shipments.

**Key Fields**:
| Field | Arabic | Example |
|-------|--------|---------|
| Reference | المرجع | BRVSUDO00724/2025 |
| Date | التاريخ | 10-Aug-2025 |
| Due Date | تاريخ الاستحقاق | 10-Aug-2025 |
| Currency | العملة | SDG |

**Voucher Lines**:
| Reference | Particulars | FC Amount | Currency | Debit | Credit |
|-----------|-------------|-----------|----------|-------|--------|
| 01070016 | KHARTOUM BANK-SDG | 13,651,914.87 | SDG | 13,651,914.87 | 0.00 |
| - | MAZIN MOHED A/MIN OSMAN ABDOUT-REC | 6,151,914.87 | SDG | 0.00 | 6,151,914.87 |
| - | MAZIN MOHED A/MIN OSMAN ABDOUT-REC | 7,500,000.00 | SDG | 0.00 | 7,500,000.00 |

**Bill Matching Details**:
| Date | Ref# | AR/AP Ref# | Currency | Total Amount | Set-off |
|------|------|------------|----------|--------------|---------|
| 10-Aug-2025 | SJSUDO01505/2025 | ESST0014122025 | SDG | 6,151,914.87 | 6,151,914.87 |

**Remark**: SETT+DEP OSLPKGPZU4742625

---

## 5. Port & Terminal Documents

### Sea Ports Corporation Bill - فاتورة هيئة الموانئ

**Issuing Authority**: Sea Ports Corporation - Port Sudan South Port Containers Terminal

**Purpose**: Terminal handling and port service charges.

**Header Information**:
| Field | Arabic | Example |
|-------|--------|---------|
| System | نظام الفوترة | BILL SYSTEM |
| Bill Number | رقم الفاتورة | 10124046050, 10125042351, 10125043152 |
| Issue Date | تاريخ الإصدار | 01/12/2024, 11/08/2025 |
| Bill Date | تاريخ الفاتورة | 01/12/2024 |
| Out Turn Date | تاريخ التفريغ | 24/11/2024, 16/08/2025 |
| Arrive Date | تاريخ الوصول | 20/11/2024, 10/08/2025 |
| Vessel Name | اسم الباخرة | SUNSET X, TJ ZARAR |
| Voyage | الرحلة | 24/0284, 25/0225 |
| Delivery Order | اذن التسليم | 80484, 744 |
| Declaration No | رقم البيان | 10294, 3223 |
| Container No | رقم الحاوية | TGBU6837520, BCXU2216321 |
| OPR Ref No | رقم العملية | GGZ2339767, VCLPKGPZU4332125 |
| Type of Bill | نوع الفاتورة | STRRIPING, WORKING_O, VALUE |
| CUS NO | رقم المخلص | 276 |
| CUS NAME | اسم المخلص | MAZIN MOHMD ALAMEIN |
| Discount | الخصم | 48855, 49720, 25043152 |

**Services & Tariffs**:
| Service | Tariff Code | Rate | Value/SD |
|---------|-------------|------|----------|
| TRANSE FULL EXAM | CT/F-3-4 | 205,128.7 - 252,584.1 | Per container |
| TRANSE EMPTY CONT | CT/F-2 | 152,799.95 - 188,034.83 | Per container |
| PORT DUES FOR CONTAINERS | CT/U-13/1 | 606,201.84 - 904,240.8 | Per container |
| Environment service | Enviro20/Enviro40 | 60 - 90 | Per container |
| Genocide goods | F343_20 | 20 | Fixed |
| Union clearance agents | F343_5 | 5 | Fixed |
| FORKLEFT & CRAN UP TO 10 TON | H/11-1 | 11,225.96 | Per use |
| NO OF TRUCKS | H/12-1 | 14,032.45 | Per truck |
| EXTRACTION BILL | H9/1 | 10,465.75 - 14,032.45 | Per bill |
| BILL_LATE | O/6 | 28,064.9 | Late fee |
| OVER TIME OFFICE | OT1 | 14,032.45 | Per hour |
| STAMP | STAMP | 1,000 | Fixed |
| STAMP_CNTR20/40 | STAMP20/STAMP40 | 5,000 | Per container |
| STAMP FORM 606_SPC | STAMP55 | 50 - 60 | Per form |
| TOUR_STAMP | TOUR_STAMP | 10 | Fixed |
| VAT | VAT | 17% | On subtotal |

**Example Bill Totals**:
| Bill No | Services | Total (SDG) |
|---------|----------|-------------|
| 10124046050 | TRANSE FULL EXAM, Stamps, VAT | 253,320.51 |
| 10124047547 | TRANSE EMPTY CONT, PORT DUES, etc. | 1,279,652.46 |
| 10125042351 | Multiple services | 1,495,109.95 |
| 10125043152 | Full breakdown | 4,846,709.96 |

---

### Shipping Line Invoice - فاتورة خط الملاحة

**Example: CMA CGM Invoice**

**Header**:
| Field | Example |
|-------|---------|
| Company | CMA CONTAINERS MANAGEMENT CO. LTD. |
| Invoice Number | SDIM0091203 |
| Date | 28-NOV-2024 |
| Bill of Lading | GGZ2339767 |
| Booking Ref | GGZ2339767 |
| Customer | 0007232122/001 |
| VAT NO | SDTIN11000549160 |
| Vessel | SUNSET X |
| Voyage | PS2439W |
| Load Port | NANSHA |
| Discharge Port | PORT SUDAN |
| Container | TGBU6837520 |
| Size/Type | 40HC |
| Commodity Code | 732393 |
| Description | Table, kitchen or other household |
| Call Date | 20 NOV 2024 |

**Charge Breakdown**:
| Size/Type | Charge Description | Tax | Rate Basis | Amount (SDG) |
|-----------|-------------------|-----|------------|--------------|
| 40HC L | Administration fee | 89 | 1 FIX | 2,000.00 |
| 40HC L | Arrival Notice Charge | 89 | 1 FIX | 12,495.00 |
| 40HC L | Charges chamber of commerce | 89 | 1 FIX | 3,000.00 |
| 40HC L | Cleaning and disinfection charges | 89 | 1 UNI | 28,263.00 |
| 40HC L | Delivery Order fee | 89 | 1 FIX | 26,775.00 |
| 40HC L | Agent charges | 89 | 1 FIX | 2,000.00 |
| 40HC L | Import service charges | 89 | 1 UNI | 2,000.00 |
| 40HC L | Insurance Cost | 89 | 1 UNI | 43,435.00 |
| 40HC L | Terminal lift off | 89 | 1 UNI | 350,000.00 |
| 40HC L | Landing charges, SD | 89 | 1 UNI | 142,800.00 |
| 40HC L | Province charge, SD | 89 | 12.05 TNE | 0.60 |
| 40HC L | Conference fees, SD | 89 | 1 UNI | 893.00 |
| 40HC L | Direct delivery SOBA-GARI, SD | 89 | 1 FIX | 50.00 |
| 40HC L | Military support | 89 | 12.05 TNE | 1.21 |
| 40HC L | Food bank charge, SD | 89 | 1 FIX | 10.00 |
| 40HC L | City Traffic charge, SD | 89 | 1 FIX | 5,000.00 |
| 40HC L | Nation Protection, SD | 89 | 1 UNI | 10.00 |
| 40HC L | Finance ministry fee, Sudan | 89 | 1 UNI | 500.00 |
| 40HC L | Tourism Stamp fees, SD | 89 | 1 FIX | 100.00 |
| 40HC L | Stamp Duty at Destination | 89 | 1 FIX | 1,000.00 |
| 40HC L | Express release fees | 89 | 1 FIX | 10,000.00 |
| **Subtotal** | | | | **630,332.81** |
| VAT | 17.00% on applicable | | | **107,156.58** |
| **TOTAL** | | | | **737,489.39** |

**Payment Terms**: Payment shall be made for full amount on or prior due date, free of charges, without any deduction nor discount for advance payment. All bank charges are for the account of the payer-remitter.

---

### Shipping Agent Bill - فاتورة وكيل الملاحة

**Example: Al Arbab Shipping Co.**

**Header**:
| Field | Example |
|-------|---------|
| Company | AL ARBAB SHIPPING CO. |
| Tel | 0311 834457 |
| Taxination No | 110005577200 |
| D/O Number | 744 |
| Deliver To | MAZIN MOHAMED ALAMEEN OSMAN ALI (276) |
| Consignee | YASSIR EMAD TRADING ENTERPRISES |
| From Port | PORT KLANG, MALAYSIA |
| Arrival Date | 12/08/2025 |
| B/L | VCLPKGPZU4332125 |
| Vessel Name | 25006 |
| Voyage No | TJ ZARAR/25006 |
| Registered | 1419 |

**Container Details**:
| LOT/NO | Marks | Number | Quantity & Kind | Weight |
|--------|-------|--------|-----------------|--------|
| /sq | FWRU0278636 | 20' | 1 | - |
| /sq | TCKU3063750 | 20' | 1 | - |
| /sq | HJCU8347149 | 20' | 1 | - |
| /sq | MSCU6753651 | 20' | 1 | - |
| /sq | BCXU2216321 | 20' | 1 | - |

**Charges**:
| Charge Type | Amount (SDG) |
|-------------|--------------|
| Landing Charges | 804,750.00 |
| D.Charge | 59,174.00 |
| Clean_PHC | 151,725.00 |
| Extraction Bill | 1,050.00 |
| Stamp Duty | 5,000.00 |
| PPD | 15.48 |
| WE | 10.32 |
| SSC | 11,700.00 |
| Insurance | 180,815.00 |
| AdminFess | 0.00 |
| Notification | 27,615.00 |
| StateGovt | 1,000.00 |
| EUS | 100.00 |
| Tourism Stamp | 500.00 |
| Trafic Map | 5,000.00 |
| NP Stamp | 1.00 |
| LIFT ON / LIFT OFF | 3,867,500.00 |
| **Subtotal** | **5,115,955.80** |
| VAT (17%) | **869,712.49** |
| **TOTAL** | **5,985,668.29** |

---

## Document Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCUMENT WORKFLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRE-SHIPMENT                                                    │
│  └── Bill of Lading (B/L) ─────────────────────────────────────┐│
│                                                                 ││
│  ARRIVAL                                                        ││
│  └── Shipping Line Invoice (CMA CGM, etc.) ────────────────────┤│
│  └── Delivery Order (D/O) ─────────────────────────────────────┤│
│                                                                 ││
│  CUSTOMS                                                        ││
│  └── ASYCUDA Declaration (IM4) ────────────────────────────────┤│
│  └── Assessment Notice ────────────────────────────────────────┤│
│  └── Customs Payment Receipt ──────────────────────────────────┤│
│                                                                 ││
│  INSPECTION                                                     ││
│  └── Working Order ────────────────────────────────────────────┤│
│  └── SSMO Release Form (if required) ──────────────────────────┤│
│  └── Ministry of Finance Receipt ──────────────────────────────┤│
│                                                                 ││
│  PORT                                                           ││
│  └── Sea Ports Corporation Bill ───────────────────────────────┤│
│  └── Shipping Agent Bill ──────────────────────────────────────┤│
│                                                                 ││
│  FINANCIAL                                                      ││
│  └── Bank Transfers ───────────────────────────────────────────┤│
│  └── Clearance Invoice ────────────────────────────────────────┤│
│  └── Account Statement ────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Automation Opportunities

| Document Type | Current State | Automation Opportunity |
|---------------|---------------|----------------------|
| B/L | Manual entry | OCR extraction of key fields |
| D/O | Manual tracking | Auto-link to shipment on creation |
| ASYCUDA Declaration | Manual | API integration (future) |
| Assessment Notice | Manual entry | OCR for tax breakdown |
| Sea Ports Bill | Manual entry | Template-based estimation |
| Clearance Invoice | Manual | Auto-generation from fee templates |
| Account Statement | Manual | Auto-calculation from transfers/invoices |
| Bank Transfers | Screenshot-based | Bank API integration |

---

## Related Files

- [Fee Structure](./fee-structure.md) - Complete fee categorization
- [Workflow Stages](./workflow-stages.md) - Stage-by-stage process
- [Reference Numbers](./reference-numbers.md) - Number formats
- [Entities](./entities.md) - Key parties and authorities
