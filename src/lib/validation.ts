/**
 * Security Validation Utilities for OptiPay
 * 
 * Provides reusable validation functions to prevent common security vulnerabilities:
 * - SQL Injection (via input validation)
 * - XSS attacks
 * - CSRF (via tokens)
 * - Malformed requests
 */

/**
 * Validates and sanitizes string input
 * Prevents injection attacks by limiting special characters
 */
export function validateAndSanitizeString(
  input: unknown,
  options: {
    minLength?: number;
    maxLength?: number;
    allowedChars?: RegExp;
  } = {}
): { valid: boolean; sanitized: string; error?: string } {
  const {
    minLength = 0,
    maxLength = 1000,
    allowedChars = /^[\w\s\-\.@]+$/,
  } = options;

  if (typeof input !== "string") {
    return { valid: false, sanitized: "", error: "Input must be a string" };
  }

  const trimmed = input.trim();

  if (trimmed.length < minLength) {
    return {
      valid: false,
      sanitized: "",
      error: `Input must be at least ${minLength} characters`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      sanitized: "",
      error: `Input must not exceed ${maxLength} characters`,
    };
  }

  if (!allowedChars.test(trimmed)) {
    return {
      valid: false,
      sanitized: "",
      error: "Input contains disallowed characters",
    };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validates email format
 */
export function validateEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  
  const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
  const localPart = email.split("@")[0];
  
  // Check for consecutive dots
  if (email.includes("..")) return false;
  
  // Check local part length (max 64 chars before @)
  if (localPart && localPart.length > 64) return false;

  return emailRegex.test(email);
}

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phone: unknown): boolean {
  if (typeof phone !== "string") return false;
  
  // Basic international phone format: +1234567890 or 1234567890
  const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validates numeric input
 */
export function validateNumber(
  input: unknown,
  options: { min?: number; max?: number } = {}
): { valid: boolean; value: number; error?: string } {
  const { min, max } = options;

  const num = Number(input);
  if (isNaN(num)) {
    return { valid: false, value: 0, error: "Input must be a valid number" };
  }

  if (min !== undefined && num < min) {
    return {
      valid: false,
      value: num,
      error: `Number must be at least ${min}`,
    };
  }

  if (max !== undefined && num > max) {
    return {
      valid: false,
      value: num,
      error: `Number must not exceed ${max}`,
    };
  }

  return { valid: true, value: num };
}

/**
 * Validates currency amount
 */
export function validateCurrencyAmount(
  amount: unknown,
  maxAmount: number = 1000000
): { valid: boolean; amount: number; error?: string } {
  const validation = validateNumber(amount, { min: 0, max: maxAmount });

  if (!validation.valid) return validation;

  // Ensure only 2 decimal places
  const rounded = Math.round(validation.value * 100) / 100;

  return { valid: true, amount: rounded };
}

/**
 * Validates SKU format
 */
export function validateSKU(sku: unknown): boolean {
  if (typeof sku !== "string") return false;

  // SKU should be alphanumeric with hyphens/underscores, 3-20 chars
  const skuRegex = /^[A-Z0-9_\-]{3,20}$/i;
  return skuRegex.test(sku.trim());
}

/**
 * Validates product name
 */
export function validateProductName(name: unknown): boolean {
  if (typeof name !== "string") return false;

  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 255;
}

/**
 * Validates date format (YYYY-MM-DD)
 */
export function validateDate(dateString: unknown): { valid: boolean; date?: Date; error?: string } {
  if (typeof dateString !== "string") {
    return { valid: false, error: "Date must be a string" };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { valid: false, error: "Date must be in YYYY-MM-DD format" };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Invalid date" };
  }

  return { valid: true, date };
}

/**
 * HTML escape to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * URL safe string validation
 */
export function validateUrlSlug(slug: unknown): boolean {
  if (typeof slug !== "string") return false;

  // Only lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug.trim());
}

/**
 * Validates object structure
 */
export function validateObjectStructure<T>(
  obj: unknown,
  schema: Record<keyof T, "string" | "number" | "boolean" | "object">
): { valid: boolean; error?: string } {
  if (typeof obj !== "object" || obj === null) {
    return { valid: false, error: "Input must be an object" };
  }

  const objKeys = Object.keys(obj) as Array<keyof T>;
  const schemaKeys = Object.keys(schema) as Array<keyof T>;

  // Check for extra keys
  const extraKeys = objKeys.filter((key) => !schemaKeys.includes(key));
  if (extraKeys.length > 0) {
    return { valid: false, error: `Extra keys not allowed: ${extraKeys.join(", ")}` };
  }

  // Check for required keys with correct types
  for (const key of schemaKeys) {
    const expectedType = schema[key];
    const actualType = typeof (obj as any)[key];

    if (actualType !== expectedType) {
      return {
        valid: false,
        error: `Key "${String(key)}" must be of type ${expectedType}, got ${actualType}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Prevents common OWASP injection patterns
 */
export function detectInjectionAttempt(input: string): boolean {
  const injectionPatterns = [
    /(\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE|EXEC|EXECUTE|SCRIPT)\b)/gi, // SQL
    /<script[^>]*>.*?<\/script>/gi, // XSS
    /javascript:/gi, // XSS protocol
    /on\w+\s*=/gi, // Event handlers
    /--/g, // SQL comments
    /;/g, // SQL statement separator in some contexts
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(input)) {
      return true;
    }
  }

  return false;
}
