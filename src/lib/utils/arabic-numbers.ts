/**
 * Arabic Number-to-Words Converter (Tafqit - تفقيط)
 *
 * Converts numeric amounts to Arabic words for invoice totals.
 * Used in Port Sudan customs clearance invoices.
 *
 * Example:
 * 15,352,201 → "خمسة عشر مليون وثلاثمائة واثنان وخمسون ألفاً ومئتان وواحد جنيه سوداني فقط لا غير"
 */

// Arabic number words
const ONES = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];

const TENS = [
  "",
  "عشرة",
  "عشرون",
  "ثلاثون",
  "أربعون",
  "خمسون",
  "ستون",
  "سبعون",
  "ثمانون",
  "تسعون",
];

const HUNDREDS = [
  "",
  "مائة",
  "مئتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

// Scale names (singular, dual, plural 3-10, plural 11+)
const SCALES = {
  thousand: {
    singular: "ألف",
    dual: "ألفان",
    plural310: "آلاف",
    plural11Plus: "ألفاً",
  },
  million: {
    singular: "مليون",
    dual: "مليونان",
    plural310: "ملايين",
    plural11Plus: "مليوناً",
  },
  billion: {
    singular: "مليار",
    dual: "ملياران",
    plural310: "مليارات",
    plural11Plus: "ملياراً",
  },
};

// Currency names
const CURRENCIES: Record<string, { singular: string; dual: string; plural: string; subunit?: string }> = {
  SDG: {
    singular: "جنيه سوداني",
    dual: "جنيهان سودانيان",
    plural: "جنيه سوداني",
    subunit: "قرش",
  },
  USD: {
    singular: "دولار أمريكي",
    dual: "دولاران أمريكيان",
    plural: "دولار أمريكي",
    subunit: "سنت",
  },
  SAR: {
    singular: "ريال سعودي",
    dual: "ريالان سعوديان",
    plural: "ريال سعودي",
    subunit: "هللة",
  },
};

/**
 * Get the appropriate scale word based on number
 */
function getScaleWord(
  num: number,
  scale: keyof typeof SCALES
): string {
  const scaleWords = SCALES[scale];
  if (num === 1) return scaleWords.singular;
  if (num === 2) return scaleWords.dual;
  if (num >= 3 && num <= 10) return scaleWords.plural310;
  return scaleWords.plural11Plus;
}

/**
 * Convert a number (0-999) to Arabic words
 */
function convertHundreds(num: number): string {
  if (num === 0) return "";

  const parts: string[] = [];

  // Hundreds place
  const hundreds = Math.floor(num / 100);
  if (hundreds > 0) {
    parts.push(HUNDREDS[hundreds]!);
  }

  // Remaining (0-99)
  const remainder = num % 100;

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]!);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;

      if (ones > 0) {
        // "واحد وعشرون" format (ones before tens with و)
        parts.push(ONES[ones]!);
        parts.push("و" + TENS[tens]!);
      } else {
        parts.push(TENS[tens]!);
      }
    }
  }

  return parts.join(" و");
}

/**
 * Convert an integer to Arabic words
 */
function integerToArabicWords(num: number): string {
  if (num === 0) return "صفر";
  if (num < 0) return "سالب " + integerToArabicWords(Math.abs(num));

  const parts: string[] = [];

  // Billions
  const billions = Math.floor(num / 1_000_000_000);
  if (billions > 0) {
    if (billions === 1) {
      parts.push(SCALES.billion.singular);
    } else if (billions === 2) {
      parts.push(SCALES.billion.dual);
    } else {
      const billionsWord = convertHundreds(billions);
      parts.push(billionsWord + " " + getScaleWord(billions, "billion"));
    }
  }

  // Millions
  const millions = Math.floor((num % 1_000_000_000) / 1_000_000);
  if (millions > 0) {
    if (millions === 1) {
      parts.push(SCALES.million.singular);
    } else if (millions === 2) {
      parts.push(SCALES.million.dual);
    } else {
      const millionsWord = convertHundreds(millions);
      parts.push(millionsWord + " " + getScaleWord(millions, "million"));
    }
  }

  // Thousands
  const thousands = Math.floor((num % 1_000_000) / 1_000);
  if (thousands > 0) {
    if (thousands === 1) {
      parts.push(SCALES.thousand.singular);
    } else if (thousands === 2) {
      parts.push(SCALES.thousand.dual);
    } else {
      const thousandsWord = convertHundreds(thousands);
      parts.push(thousandsWord + " " + getScaleWord(thousands, "thousand"));
    }
  }

  // Hundreds/Tens/Ones
  const remainder = num % 1_000;
  if (remainder > 0) {
    parts.push(convertHundreds(remainder));
  }

  return parts.join(" و");
}

/**
 * Convert amount to Arabic words with currency
 *
 * @param amount - The numeric amount (can include decimals)
 * @param currency - Currency code: "SDG", "USD", "SAR"
 * @returns Arabic string representation
 *
 * @example
 * numberToArabicWords(15352201.90, "SDG")
 * // Returns: "خمسة عشر مليون وثلاثمائة واثنان وخمسون ألفاً ومئتان وواحد جنيه سوداني وتسعون قرشاً فقط لا غير"
 */
export function numberToArabicWords(
  amount: number,
  currency: string = "SDG"
): string {
  // Get currency info
  const currencyInfo = CURRENCIES[currency] ?? CURRENCIES["SDG"]!;

  // Split into integer and decimal parts
  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  // Build the result
  const parts: string[] = [];

  // Add "فقط" prefix
  parts.push("فقط");

  // Convert integer part
  if (integerPart > 0) {
    const integerWords = integerToArabicWords(integerPart);
    parts.push(integerWords);
    parts.push(currencyInfo.plural);
  } else {
    parts.push("صفر");
    parts.push(currencyInfo.plural);
  }

  // Add decimal part if exists
  if (decimalPart > 0 && currencyInfo.subunit) {
    parts.push("و" + integerToArabicWords(decimalPart));
    parts.push(currencyInfo.subunit + "اً");
  }

  // Add "لا غير" suffix
  parts.push("لا غير");

  return parts.join(" ");
}

/**
 * Format a number with Arabic-Indic numerals
 *
 * @param num - The number to format
 * @returns String with Arabic-Indic numerals
 *
 * @example
 * formatArabicNumerals(12345.67)
 * // Returns: "١٢٬٣٤٥٫٦٧"
 */
export function formatArabicNumerals(num: number): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

  return num
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replace(/\d/g, (digit) => arabicNumerals[parseInt(digit)]!)
    .replace(/,/g, "٬") // Arabic thousands separator
    .replace(/\./g, "٫"); // Arabic decimal separator
}

/**
 * Format amount for display with currency symbol
 *
 * @param amount - The numeric amount
 * @param currency - Currency code
 * @param locale - Locale for formatting ("ar" or "en")
 * @returns Formatted string
 *
 * @example
 * formatCurrency(15352201.90, "SDG", "ar")
 * // Returns: "١٥٬٣٥٢٬٢٠١٫٩٠ ج.س"
 */
export function formatCurrency(
  amount: number,
  currency: string = "SDG",
  locale: string = "ar"
): string {
  const currencySymbols: Record<string, { ar: string; en: string }> = {
    SDG: { ar: "ج.س", en: "SDG" },
    USD: { ar: "دولار", en: "USD" },
    SAR: { ar: "ر.س", en: "SAR" },
  };

  const symbol = currencySymbols[currency] ?? currencySymbols["SDG"]!;

  if (locale === "ar") {
    return formatArabicNumerals(amount) + " " + symbol.ar;
  }

  return (
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) +
    " " +
    symbol.en
  );
}

/**
 * Simplified version for invoice totals - just returns the amount in words
 * without "فقط" prefix and "لا غير" suffix for inline usage
 *
 * @param amount - The numeric amount
 * @param currency - Currency code
 * @returns Simple Arabic representation
 */
export function amountInWords(
  amount: number,
  currency: string = "SDG"
): string {
  const currencyInfo = CURRENCIES[currency] ?? CURRENCIES["SDG"]!;
  const integerPart = Math.floor(Math.abs(amount));
  const integerWords = integerToArabicWords(integerPart);

  return integerWords + " " + currencyInfo.plural;
}

/**
 * Full invoice total line - used for "الجملة كتابة" section
 *
 * @param amount - The numeric amount
 * @param currency - Currency code
 * @returns Full Arabic representation with prefix/suffix
 *
 * @example
 * invoiceTotalInWords(15352201.90, "SDG")
 * // Returns: "الجملة كتابة: فقط خمسة عشر مليون وثلاثمائة واثنان وخمسون ألفاً ومئتان وواحد جنيه سوداني وتسعون قرشاً فقط لا غير"
 */
export function invoiceTotalInWords(
  amount: number,
  currency: string = "SDG"
): string {
  return "الجملة كتابة: " + numberToArabicWords(amount, currency);
}
