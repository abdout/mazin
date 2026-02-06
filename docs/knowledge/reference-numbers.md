# Port Sudan Customs Clearance Reference Numbers

> Comprehensive guide to all reference number formats used in the customs clearance process, extracted from real documents.

## Overview

The customs clearance process uses **15+ distinct reference number types** for tracking documents, payments, and containers across different authorities. Understanding these formats is essential for:
- Document verification
- Payment tracking
- System integration
- Data validation

---

## Reference Number Catalog

### 1. Bill of Lading Number (B/L) - رقم البوليصة

**Purpose**: Primary identifier for ocean shipment

**Format**: Varies by shipping line

| Shipping Line | Format | Example |
|---------------|--------|---------|
| CMA CGM | 3 letters + 7 digits | GGZ2339767 |
| Eastern Shipping | OSLPKGPZU + 7 digits | OSLPKGPZU4742625 |
| Al Arbab | VCLPKG + location + digits | VCLPKGPZU4332125, VCLPKGPZUZ33125 |

**Validation Regex**:
```regex
# CMA CGM format
^[A-Z]{3}\d{7}$

# Eastern/Al Arbab format
^[A-Z]{9,12}\d{7}$
```

**Used In**:
- Shipping line invoices
- Delivery orders
- Customs declarations
- Port bills
- Clearance invoices

---

### 2. Container Number - رقم الحاوية

**Purpose**: Unique identifier for shipping container (ISO 6346)

**Format**: 4 letters (owner code + category) + 6 digits + 1 check digit

**Examples**:
```
TGBU6837520
TCLU1992510
CZZU3028214
TDRU7950455
ZXJU0801427
TDTU3402424
FWRU0278636
HJCU8347149
MSCU6753651
BCXU2216321
```

**Structure**:
| Position | Content | Example |
|----------|---------|---------|
| 1-3 | Owner Code | TGB, TCL, CZZ |
| 4 | Category (U=freight) | U |
| 5-10 | Serial Number | 683752 |
| 11 | Check Digit | 0 |

**Validation Regex**:
```regex
^[A-Z]{4}\d{7}$
```

**Container Sizes** (from documents):
| Code | Size |
|------|------|
| 20' | 20 feet |
| 40' | 40 feet |
| 40HC | 40 feet High Cube |

---

### 3. Customs Declaration Reference - مرجع البيان الجمركي

**Purpose**: ASYCUDA declaration identifier

**Format**: Letter A + space + 4-5 digits

**Examples**:
```
A 10294
A 3223
A 3179
```

**Structure**:
| Part | Meaning |
|------|---------|
| A | Model type (A = Import IM4) |
| Space | Separator |
| NNNNN | Sequential number at customs office |

**Validation Regex**:
```regex
^A \d{4,5}$
```

**Used In**:
- ASYCUDA declaration
- Assessment notice
- Payment receipt
- Port bills
- SSMO release form

---

### 4. Assessment Reference - مرجع التقدير

**Purpose**: ASYCUDA assessment/valuation reference

**Format**: Letter H + space + 4-5 digits

**Examples**:
```
H 10541
H 3243
```

**Structure**:
| Part | Meaning |
|------|---------|
| H | Assessment type |
| Space | Separator |
| NNNNN | Assessment number |

**Validation Regex**:
```regex
^H \d{4,5}$
```

**Used In**:
- Assessment notice

---

### 5. Declarant Reference - مرجع المخلص

**Purpose**: Agent's internal declaration reference

**Format**: Year + space + # + sequential number

**Examples**:
```
2024 #12
2025 #41
2025 #42
```

**Structure**:
| Part | Meaning |
|------|---------|
| YYYY | Year |
| Space | Separator |
| # | Prefix |
| NN | Agent's sequential number for year |

**Validation Regex**:
```regex
^\d{4} #\d{1,3}$
```

---

### 6. Bank Code - كود البنك

**Purpose**: Payment reference for customs duties

**Format**: 12 digits

**Examples**:
```
106240110294
17825013179
```

**Structure**:
Assigned by ASYCUDA based on:
- Declaration number
- Assessment date
- Customs office code

**Validation Regex**:
```regex
^\d{12}$
```

**Used In**:
- Assessment notice
- Bank transfer reference

---

### 7. Manifest Reference - مرجع المانيفست

**Purpose**: Vessel manifest registration at port

**Format**: Office code + Year + Sequential number

**Examples**:
```
PZUS0 2025 1419
PZUS0 2025 1387
```

**Structure**:
| Part | Meaning |
|------|---------|
| PZUS0/PZUS1 | Customs office code |
| YYYY | Year |
| NNNN | Sequential manifest number |

**Validation Regex**:
```regex
^PZUS[01] \d{4} \d{4}$
```

---

### 8. Delivery Order Number (D/O) - رقم إذن التسليم

**Purpose**: Release authorization from shipping line

**Format**: Varies by agent

| Agent | Format | Example |
|-------|--------|---------|
| Eastern Shipping | ESST + 7 digits + year | ESST0001092025 |
| Al Arbab | 3 digits | 744, 109, 25 |

**Validation Regex**:
```regex
# Eastern format
^ESST\d{7}\d{4}$

# Simple format
^\d{1,4}$
```

---

### 9. Invoice Number - رقم الفاتورة

**Purpose**: Clearance agent invoice reference

**Format**: Sequential number or number + /year

**Examples**:
```
991
1043/25
1044/25
```

**Structure**:
| Part | Meaning |
|------|---------|
| NNNN | Sequential invoice number |
| / | Optional separator |
| YY | Year (if included) |

**Validation Regex**:
```regex
^\d{3,4}(/\d{2})?$
```

---

### 10. SSMO Form Number - رقم استمارة المواصفات

**Purpose**: Quality standards release form reference

**Format**: FR + 7 digits

**Examples**:
```
FR2513494
FR2513495
```

**Structure**:
| Part | Meaning |
|------|---------|
| FR | Form Release prefix |
| NNNNNNN | Sequential number |

**Validation Regex**:
```regex
^FR\d{7}$
```

---

### 11. Sea Ports Bill Number - رقم فاتورة الموانئ

**Format**: 11 digits

**Examples**:
```
10124046050
10125041588
10125042351
10125043151
10125043152
```

**Structure**:
| Position | Meaning |
|----------|---------|
| 1-3 | Port code (101 = Port Sudan) |
| 4-5 | Year (24=2024, 25=2025) |
| 6-11 | Sequential number |

**Validation Regex**:
```regex
^101\d{8}$
```

---

### 12. Ministry of Finance Receipt - رقم إيصال وزارة المالية

**Format**: Letter + 7 digits

**Examples**:
```
H 0041637
I 0794086
```

**Validation Regex**:
```regex
^[A-Z] \d{7}$
```

---

### 13. Customs Payment Receipt - رقم إيصال الجمارك

**Format**: Year + space + R + space + 4 digits

**Examples**:
```
2025 R 6763
2025 R 6648
```

**Structure**:
| Part | Meaning |
|------|---------|
| YYYY | Year |
| R | Receipt indicator |
| NNNN | Sequential number |

**Validation Regex**:
```regex
^\d{4} R \d{4}$
```

---

### 14. Bank Transfer Reference - رقم العملية البنكية

**Format**: 11 digits

**Examples**:
```
20007308816
20007340769
20007478219
20017741414
20025166781
```

**Structure**:
| Position | Meaning |
|----------|---------|
| 1-4 | Bank/branch code |
| 5-11 | Transaction number |

**Validation Regex**:
```regex
^\d{11}$
```

---

### 15. Declarant/Consignee ID - رقم المخلص/المستورد

**Purpose**: Tax identification number registered with customs

**Format**: 12 digits

**Examples**:
```
300000981146  (Mazin Mohamed Elamin Osman - Declarant)
300000493804  (Yassir Emad Trading Enterprises - Consignee)
300000981728  (Alatbag Multi Activities Co. Ltd - Consignee)
```

**Structure**: National tax registration number

**Validation Regex**:
```regex
^3\d{11}$
```

---

### 16. Shipping Line Invoice Number - رقم فاتورة خط الملاحة

**Format**: Varies by line

| Line | Format | Example |
|------|--------|---------|
| CMA CGM | SDIM + 7 digits | SDIM0091203 |
| Eastern | SJSUDO + 8 digits + year | SJSUDO01505/2025 |

**Validation Regex**:
```regex
# CMA CGM
^SDIM\d{7}$

# Eastern
^SJSUDO\d{8}/\d{4}$
```

---

### 17. Bank Account Numbers - أرقام الحسابات البنكية

**Format**: 4 groups of 4 digits

**Examples**:
```
0300 1157 4499 0001  (Source account)
0605 0101 9188 5001  (Destination account)
0603 1258 9659 0001  (Destination account)
```

**Validation Regex**:
```regex
^\d{4} \d{4} \d{4} \d{4}$
```

---

## Reference Number Relationships

```
┌────────────────────────────────────────────────────────────────────────┐
│                    REFERENCE NUMBER RELATIONSHIPS                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Bill of Lading (B/L)                                                   │
│  └── GGZ2339767                                                         │
│      │                                                                  │
│      ├── Container Numbers                                              │
│      │   └── TGBU6837520, TCLU1992510, etc.                             │
│      │                                                                  │
│      ├── Delivery Order                                                 │
│      │   └── ESST0001092025 / 744                                       │
│      │                                                                  │
│      ├── Customs Declaration                                            │
│      │   └── A 10294                                                    │
│      │       │                                                          │
│      │       ├── Assessment Reference                                   │
│      │       │   └── H 10541                                            │
│      │       │                                                          │
│      │       ├── Bank Code                                              │
│      │       │   └── 106240110294                                       │
│      │       │                                                          │
│      │       └── Payment Receipt                                        │
│      │           └── 2025 R 6763                                        │
│      │                                                                  │
│      ├── Sea Ports Bill                                                 │
│      │   └── 10125042351                                                │
│      │                                                                  │
│      ├── SSMO Form (if applicable)                                      │
│      │   └── FR2513494                                                  │
│      │                                                                  │
│      └── Clearance Invoice                                              │
│          └── 1043/25                                                    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Reference Number Usage by Document

| Document | Reference Numbers Used |
|----------|----------------------|
| Bill of Lading | B/L number, Container numbers |
| Delivery Order | D/O number, B/L number, Vessel name, Voyage |
| ASYCUDA Declaration | Declaration ref, Declarant ref, Manifest, Bank code |
| Assessment Notice | Declaration ref, Assessment ref, Bank code |
| Payment Receipt | Receipt number, Declaration ref, Bank reference |
| SSMO Form | Form number, Declaration ref, B/L number |
| Sea Ports Bill | Bill number, Declaration ref, Container number, D/O number |
| Clearance Invoice | Invoice number, B/L number, Container number |
| Bank Transfer | Operation number, Account numbers |

---

## Validation Functions

### TypeScript Validators

```typescript
// Reference number validation patterns
const REFERENCE_PATTERNS = {
  billOfLading: {
    cmaCgm: /^[A-Z]{3}\d{7}$/,
    eastern: /^OSLPKGPZU\d{7}$/,
    alArbab: /^VCLPKG[A-Z]{2,4}\d{5,8}$/,
  },

  containerNumber: /^[A-Z]{4}\d{7}$/,

  customsDeclaration: /^A \d{4,5}$/,

  assessmentReference: /^H \d{4,5}$/,

  declarantReference: /^\d{4} #\d{1,3}$/,

  bankCode: /^\d{12}$/,

  manifestReference: /^PZUS[01] \d{4} \d{4}$/,

  deliveryOrder: {
    eastern: /^ESST\d{7}\d{4}$/,
    simple: /^\d{1,4}$/,
  },

  invoiceNumber: /^\d{3,4}(\/\d{2})?$/,

  ssmoForm: /^FR\d{7}$/,

  seaPortsBill: /^101\d{8}$/,

  financeReceipt: /^[A-Z] \d{7}$/,

  customsReceipt: /^\d{4} R \d{4}$/,

  bankTransfer: /^\d{11}$/,

  taxId: /^3\d{11}$/,

  bankAccount: /^\d{4} \d{4} \d{4} \d{4}$/,
};

// Validation function
function validateReference(
  value: string,
  type: keyof typeof REFERENCE_PATTERNS
): boolean {
  const pattern = REFERENCE_PATTERNS[type];

  if (pattern instanceof RegExp) {
    return pattern.test(value);
  }

  // Handle nested patterns (like billOfLading with multiple formats)
  return Object.values(pattern).some((p) => p.test(value));
}

// Container check digit validation (ISO 6346)
function validateContainerCheckDigit(containerNumber: string): boolean {
  if (!/^[A-Z]{4}\d{7}$/.test(containerNumber)) return false;

  const values: Record<string, number> = {
    A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19,
    J: 20, K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29,
    S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
  };

  const chars = containerNumber.slice(0, 10).split('');
  const checkDigit = parseInt(containerNumber[10]);

  const sum = chars.reduce((acc, char, index) => {
    const value = values[char] || 0;
    return acc + value * Math.pow(2, index);
  }, 0);

  const calculatedCheck = sum % 11 % 10;
  return calculatedCheck === checkDigit;
}
```

---

## Data Model Recommendations

### Reference Number Fields

```prisma
model Shipment {
  id                    String   @id @default(cuid())
  billOfLading          String   @unique // GGZ2339767
  // ... other fields
}

model Container {
  id                    String   @id @default(cuid())
  containerNumber       String   @unique // TGBU6837520
  size                  ContainerSize // SIZE_20 | SIZE_40 | SIZE_40HC
  // ... other fields
}

model CustomsDeclaration {
  id                    String   @id @default(cuid())
  declarationRef        String   @unique // A 10294
  assessmentRef         String?  // H 10541
  declarantRef          String   // 2025 #41
  bankCode              String?  // 106240110294
  manifestRef           String?  // PZUS0 2025 1419
  // ... other fields
}

model DeliveryOrder {
  id                    String   @id @default(cuid())
  doNumber              String   @unique // ESST0001092025
  // ... other fields
}

model PortBill {
  id                    String   @id @default(cuid())
  billNumber            String   @unique // 10125042351
  // ... other fields
}

model SSMOForm {
  id                    String   @id @default(cuid())
  formNumber            String   @unique // FR2513494
  // ... other fields
}

model Invoice {
  id                    String   @id @default(cuid())
  invoiceNumber         String   @unique // 1043/25
  // ... other fields
}

model PaymentReceipt {
  id                    String   @id @default(cuid())
  receiptNumber         String   @unique // 2025 R 6763
  bankReference         String?  // Bank transfer reference
  // ... other fields
}
```

---

## Related Files

- [Document Types](./document-types.md) - All document types
- [Fee Structure](./fee-structure.md) - Complete fee catalog
- [Workflow Stages](./workflow-stages.md) - Stage-by-stage process
- [Entities](./entities.md) - Key parties and authorities
