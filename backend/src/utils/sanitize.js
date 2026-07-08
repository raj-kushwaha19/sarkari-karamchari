const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  // Strip HTML tags and trim
  return str.replace(/<[^>]*>/g, '').trim();
};

const sanitizeComplaint = (obj) => {
  const sanitized = { ...obj };
  if (sanitized.department) sanitized.department = sanitizeString(sanitized.department);
  if (sanitized.description) {
    if (sanitized.description.raw) sanitized.description.raw = sanitizeString(sanitized.description.raw);
    if (sanitized.description.aiFormatted) sanitized.description.aiFormatted = sanitizeString(sanitized.description.aiFormatted);
  }
  if (sanitized.pinCode) sanitized.pinCode = sanitizeString(sanitized.pinCode);
  if (sanitized.exactAddress) sanitized.exactAddress = sanitizeString(sanitized.exactAddress);
  return sanitized;
};

module.exports = { sanitizeString, sanitizeComplaint };
