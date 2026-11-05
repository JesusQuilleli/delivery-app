const COUNTRY_CODES = [
  '593',
  '507',
  '58',
  '57',
  '56',
  '55',
  '54',
  '52',
  '51',
  '44',
  '39',
  '34',
  '1',
];

export interface ParsedPhone {
  countryCode: string;
  nationalNumber: string;
  e164: string;
  isValid: boolean;
}

function digitsOnly(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

function splitKnownCountryCode(digits: string): { countryCode: string; nationalNumber: string } | null {
  for (const code of COUNTRY_CODES) {
    if (digits.startsWith(code)) {
      const nationalNumber = digits.slice(code.length);
      if (nationalNumber.length >= 6) {
        return { countryCode: `+${code}`, nationalNumber };
      }
    }
  }
  return null;
}

export function parsePhone(input?: string | null, defaultCountryCode = '58'): ParsedPhone {
  const raw = String(input || '').trim();
  const fallback: ParsedPhone = {
    countryCode: `+${defaultCountryCode}`,
    nationalNumber: '',
    e164: '',
    isValid: false,
  };
  if (!raw) return fallback;

  let digits = digitsOnly(raw);
  const hadPlus = raw.startsWith('+');
  const hadInternationalPrefix = digits.startsWith('00');
  if (hadInternationalPrefix) digits = digits.slice(2);
  if (!digits) return fallback;

  const explicitCountryCode = hadPlus || hadInternationalPrefix;
  let countryCode = `+${defaultCountryCode}`;
  let nationalNumber = digits;

  if (explicitCountryCode) {
    const split = splitKnownCountryCode(digits);
    if (split) {
      countryCode = split.countryCode;
      nationalNumber = split.nationalNumber;
    }
  } else if (digits.startsWith('0')) {
    nationalNumber = digits.replace(/^0+/, '');
  } else {
    const split = splitKnownCountryCode(digits);
    if (split && split.nationalNumber.length >= 7) {
      countryCode = split.countryCode;
      nationalNumber = split.nationalNumber;
    }
  }

  nationalNumber = digitsOnly(nationalNumber).replace(/^0+/, '');
  if (!nationalNumber) return fallback;
  if (nationalNumber.length < 6 || nationalNumber.length > 12) return fallback;
  if (countryCode === '+58' && nationalNumber.length !== 10) return fallback;

  const e164 = `${countryCode}${nationalNumber}`;
  if (digitsOnly(e164).length > 15) return fallback;

  return {
    countryCode,
    nationalNumber,
    e164,
    isValid: true,
  };
}

export function normalizePhone(input?: string | null, defaultCountryCode = '58'): string | null {
  const parsed = parsePhone(input, defaultCountryCode);
  return parsed.isValid ? parsed.e164 : null;
}
