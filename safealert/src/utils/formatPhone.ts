/**
 * Converts a phone number string to E.164 format required by Twilio.
 * Examples:
 *   "+54 9 11 1234-5678" → "+5491112345678"
 *   "011-1234-5678" → needs country code prefix
 */
export function toE164(phone: string, defaultCountryCode = '+54'): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Already in E.164
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');

  return `${defaultCountryCode}${cleaned}`;
}

export function isValidPhone(phone: string): boolean {
  const e164 = toE164(phone);
  // E.164: + followed by 7-15 digits
  return /^\+\d{7,15}$/.test(e164);
}

export function formatDisplayPhone(phone: string): string {
  // Return a human-readable version for display
  const e164 = toE164(phone);
  if (e164.startsWith('+54')) {
    // Argentine format: +54 9 11 XXXX-XXXX
    const digits = e164.slice(3);
    if (digits.length === 11) {
      return `+54 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
  }
  return e164;
}
