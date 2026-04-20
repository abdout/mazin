/**
 * Sudan phone number normalization utilities.
 *
 * Sudan country code: +249
 * Sudan mobile prefixes: 9, 1 (followed by 8 digits)
 * E.164 format: +249XXXXXXXXX (13 chars total: +249 + 9 digits)
 */

const SUDAN_COUNTRY_CODE = "249"
const SUDAN_MOBILE_PREFIXES = ["9", "1"] as const
const LOCAL_DIGIT_COUNT = 9 // local number length (e.g. 912345678)

/**
 * Normalize a Sudan phone number to E.164 format (`+249XXXXXXXXX`).
 *
 * Accepts raw input with or without country code, and with any common
 * separators (spaces, dashes, parentheses, plus sign, leading zeros).
 *
 * Examples:
 * - `+249912345678`     -> `+249912345678`
 * - `00249912345678`    -> `+249912345678`
 * - `0912345678`        -> `+249912345678`
 * - `912345678`         -> `+249912345678`
 * - `+249 91 234 5678`  -> `+249912345678`
 * - `091-234-5678`      -> `+249912345678`
 *
 * @param input raw phone input
 * @returns normalized E.164 string, or `null` if the input is not a valid
 *          Sudan mobile number
 */
export function normalizeSudanPhone(input: string): string | null {
  if (typeof input !== "string") return null

  // Strip every non-digit character (drops +, spaces, dashes, parens, etc.)
  const digits = input.replace(/\D/g, "")
  if (digits.length === 0) return null

  // Peel off the country code in any of its accepted forms.
  // Priority: 00249 (international dial) -> 249 (raw) -> 0 (local trunk)
  let local: string
  if (digits.startsWith("00" + SUDAN_COUNTRY_CODE)) {
    local = digits.slice(2 + SUDAN_COUNTRY_CODE.length)
  } else if (digits.startsWith(SUDAN_COUNTRY_CODE)) {
    local = digits.slice(SUDAN_COUNTRY_CODE.length)
  } else if (digits.startsWith("0")) {
    local = digits.slice(1)
  } else {
    local = digits
  }

  if (local.length !== LOCAL_DIGIT_COUNT) return null

  const prefix = local.charAt(0)
  if (!SUDAN_MOBILE_PREFIXES.includes(prefix as (typeof SUDAN_MOBILE_PREFIXES)[number])) {
    return null
  }

  return `+${SUDAN_COUNTRY_CODE}${local}`
}

/**
 * Check whether `input` is a valid Sudan mobile number after normalization.
 *
 * @param input raw phone input
 * @returns `true` if `normalizeSudanPhone` would return a non-null value
 */
export function isValidSudanPhone(input: string): boolean {
  return normalizeSudanPhone(input) !== null
}
