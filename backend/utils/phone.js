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

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function splitKnownCountryCode(digits) {
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

function parsePhone(input, defaultCountryCode = '58') {
  const raw = String(input || '').trim();
  if (!raw) return null;

  let digits = digitsOnly(raw);
  const hadPlus = raw.startsWith('+');
  const hadInternationalPrefix = digits.startsWith('00');
  if (hadInternationalPrefix) digits = digits.slice(2);
  if (!digits) return null;

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
  if (!nationalNumber) return null;
  if (nationalNumber.length < 6 || nationalNumber.length > 12) return null;

  if (countryCode === '+58' && nationalNumber.length !== 10) return null;

  const e164 = `${countryCode}${nationalNumber}`;
  if (digitsOnly(e164).length > 15) return null;

  return {
    countryCode,
    nationalNumber,
    e164,
    isValid: true,
  };
}

function normalizePhone(input, defaultCountryCode = '58') {
  return parsePhone(input, defaultCountryCode)?.e164 || null;
}

function splitPhone(input, defaultCountryCode = '58') {
  return parsePhone(input, defaultCountryCode) || {
    countryCode: `+${defaultCountryCode}`,
    nationalNumber: '',
    e164: '',
    isValid: false,
  };
}

module.exports = { parsePhone, normalizePhone, splitPhone };
