// Client-side validators aligned with server-side ValidationUtil

// Normalize phone numbers to E.164-like for Uganda where possible
// Accepted inputs: +2567XXXXXXXX, 2567XXXXXXXX, 07XXXXXXXX, 7XXXXXXXX (we'll add +256)
export function normalizeUgPhone(input) {
  if (!input) return '';
  // Strip spaces, dashes, parentheses
  let s = String(input).replace(/[\s\-()]/g, '');
  // If starts with 00, convert to +
  if (s.startsWith('00')) s = '+' + s.slice(2);
  // If starts with 0 and next is 7, replace leading 0 with +256
  if (/^07[0-9]{8}$/.test(s)) return '+256' + s.slice(1);
  // If starts with 7 and length 9, add +256
  if (/^7[0-9]{8}$/.test(s)) return '+256' + s;
  // If starts with 2567..., add +
  if (/^2567[0-9]{8}$/.test(s)) return '+' + s;
  // If already +2567...
  if (/^\+2567[0-9]{8}$/.test(s)) return s;
  // Otherwise return as-is (server will still validate)
  return s;
}

// Uganda phone validation: +2567XXXXXXXX where X = digits and the second digit 7 is followed by valid range 0-8 by business rule
export function isValidUgPhone(input) {
  if (!input) return true; // optional by default
  const normalized = normalizeUgPhone(input);
  // Accept +2567XXXXXXXX with the next digit in [0-8]
  return /^\+2567[0-8][0-9]{7}$/.test(normalized);
}

// Parse a date string (yyyy-mm-dd) safely
export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function isAdult18(dobStr) {
  if (!dobStr) return true; // optional
  const dob = parseDate(dobStr);
  if (!dob) return false;
  const today = new Date();
  const eighteen = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
  return eighteen <= today;
}

export function isPastDate(dobStr) {
  if (!dobStr) return true;
  const dob = parseDate(dobStr);
  if (!dob) return false;
  const today = new Date();
  // compare date-only
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return dob < todayOnly;
}

export function validateProfile(form) {
  // Returns { valid: boolean, errors: { field: message }, transformed: {} }
  const errors = {};
  const transformed = { ...form };

  // Phone (optional)
  if (form.phoneNumber) {
    const normalized = normalizeUgPhone(form.phoneNumber);
    transformed.phoneNumber = normalized;
    if (!isValidUgPhone(normalized)) {
      errors.phoneNumber = 'Enter a valid Uganda phone number, e.g. +256701234567';
    }
  }

  // DOB (optional but must be past and >= 18 if provided)
  if (form.dateOfBirth) {
    if (!isPastDate(form.dateOfBirth)) {
      errors.dateOfBirth = 'Date of birth must be in the past';
    } else if (!isAdult18(form.dateOfBirth)) {
      errors.dateOfBirth = 'You must be at least 18 years old';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, transformed };
}
