/**
 * Reference-number validators for Sudan customs documents.
 *
 * Patterns are sourced from `docs/knowledge/reference-numbers.md` and real Mazin
 * invoices in the repo. A bad reference here means customs / port / shipping
 * line will reject the declaration — catch it at the form, not at submission.
 */

/**
 * Bill of Lading number — 3 letters + 7 digits (carrier-issued).
 * Examples: `MAEU1234567`, `CMA1234567`.
 */
export const BL_NUMBER_REGEX = /^[A-Z]{3}\d{7}$/

/**
 * ACD (Advance Cargo Declaration) number issued by acdsudan.com.
 * Format: `ACN-YYYYMM-NNNNN` (mandatory Jan 2026).
 */
export const ACN_REGEX = /^ACN-\d{6}-\d{5}$/

/**
 * Port Sudan customs manifest reference. Format: `PZUS0 YYYY NNNN` or `PZUS1 YYYY NNNN`
 * (PZUS0 = south quay south, PZUS1 = south quay damadama).
 */
export const MANIFEST_REGEX = /^PZUS[01] \d{4} \d{4}$/

/**
 * Bank IM Form (Import Form) number. Format varies a lot across Sudanese banks
 * (some use `IM-2026-00001`, some `FB12345678`, some `IM/2026/0001`). The
 * regex is intentionally permissive — letter prefix + alphanumerics with
 * optional dash/slash separators — but it still catches whitespace, lowercase,
 * and obviously-wrong shapes before they hit the DB.
 */
export const IM_NUMBER_REGEX = /^[A-Z][A-Z0-9/-]{5,29}$/

/**
 * Customs declaration number. Sudan format: `<office><portDigit> <yearYY>/<seq>`,
 * e.g. `PZUS0 25/00123`. The space and 4-letter office prefix are mandatory —
 * a value missing either is almost certainly mistyped.
 */
export const DECLARATION_REGEX = /^[A-Z]{4,5}\d? \d{2}\/\d{3,6}$/

/**
 * ISO 6346 container number — 4 letters (owner) + 7 digits (serial + check digit).
 * The check digit is computed from the first 10 chars; `validateContainer` enforces it.
 */
export const CONTAINER_REGEX = /^[A-Z]{4}\d{7}$/

/**
 * ISO 6346 letter values for check-digit calculation.
 * Letters A=10, skipping 11, 22, 33 (multiples of 11).
 */
const ISO6346_LETTER_VALUES: Record<string, number> = (() => {
  const map: Record<string, number> = {}
  let value = 10
  for (let i = 0; i < 26; i++) {
    if (value % 11 === 0) value++
    map[String.fromCharCode(65 + i)] = value
    value++
  }
  return map
})()

/**
 * Validate ISO 6346 container number including check digit.
 *
 * Algorithm: weight each of the first 10 chars by 2^position, sum, mod 11. The
 * remainder is the expected check digit (with mod-11 = 10 collapsed to 0).
 */
export function validateContainerNumber(input: string): boolean {
  const value = input.trim().toUpperCase()
  if (!CONTAINER_REGEX.test(value)) return false

  let sum = 0
  for (let i = 0; i < 10; i++) {
    const ch = value.charAt(i)
    const digit = ISO6346_LETTER_VALUES[ch] ?? Number(ch)
    if (Number.isNaN(digit)) return false
    sum += digit * 2 ** i
  }
  const expected = sum % 11 === 10 ? 0 : sum % 11
  return expected === Number(value.charAt(10))
}

/**
 * Validate Sudan customs Bill of Lading reference.
 */
export function validateBLNumber(input: string): boolean {
  return BL_NUMBER_REGEX.test(input.trim().toUpperCase())
}

/**
 * Validate Advance Cargo Declaration number.
 */
export function validateACN(input: string): boolean {
  return ACN_REGEX.test(input.trim().toUpperCase())
}

/**
 * Validate Port Sudan customs manifest reference.
 */
export function validateManifestRef(input: string): boolean {
  return MANIFEST_REGEX.test(input.trim().toUpperCase())
}

/**
 * Validate IM Form number (bank import form).
 */
export function validateIMNumber(input: string): boolean {
  return IM_NUMBER_REGEX.test(input.trim().toUpperCase())
}

/**
 * Validate customs declaration number.
 */
export function validateDeclarationNumber(input: string): boolean {
  return DECLARATION_REGEX.test(input.trim().toUpperCase())
}

/**
 * Zod-friendly refinement helpers — usage:
 *   z.string().refine(validateContainerNumber, "Invalid container number")
 */
export const refinements = {
  container: validateContainerNumber,
  bl: validateBLNumber,
  acn: validateACN,
  manifest: validateManifestRef,
  im: validateIMNumber,
  declaration: validateDeclarationNumber,
} as const
