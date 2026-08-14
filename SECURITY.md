# OptiPay Security Guidelines & Best Practices

## 🔒 Overview

This document outlines the security architecture and guidelines for the OptiPay eyewear boutique management system. All team members must follow these practices to maintain industry-grade security.

---

## 1. Authentication & Authorization

### Password Security
- **Minimum Length**: 12 characters (enforced via `validatePassword()`)
- **Complexity Requirements**:
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&* etc.)
- **Password Hashing**: bcryptjs with salt rounds = 12
- **Password Storage**: Never store plaintext passwords; always hash

### Session Management
- Sessions are managed via NextAuth.js
- Session tokens are httpOnly and secure cookies
- Default session timeout: 30 minutes (configurable in `saasConfig.ts`)
- Maximum 5 login attempts per 15 minutes (rate-limited)

### Google OAuth
- Configure `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env.local`
- Never hardcode credentials; app will error if env vars not set
- Use OAuth 2.0 flow with PKCE for enhanced security

---

## 2. Input Validation & Sanitization

### Validation Functions (in `src/lib/validation.ts`)

```typescript
// Email validation
validateEmail(email);

// Phone number validation
validatePhoneNumber(phone);

// Currency amounts (with max validation)
validateCurrencyAmount(amount, maxAmount);

// Product SKU
validateSKU(sku);

// Detection of injection attempts
detectInjectionAttempt(userInput);
```

### When to Validate
- ✅ **Always validate**: User input, API parameters, form data
- ✅ **Sanitize outputs**: When rendering user-generated content
- ❌ **Never trust**: Anything from client-side

### Example Usage
```typescript
import { validateEmail, validateCurrencyAmount, detectInjectionAttempt } from "@/lib/validation";

const emailCheck = validateEmail(formData.email);
if (!emailCheck) return { error: "Invalid email" };

const amountCheck = validateCurrencyAmount(formData.amount, 999999);
if (!amountCheck.valid) return { error: amountCheck.error };

if (detectInjectionAttempt(formData.name)) {
  return { error: "Invalid input detected" };
}
```

---

## 3. API Security

### CORS & Headers
- Content-Security-Policy (CSP) enabled
- X-Frame-Options: DENY (prevents clickjacking)
- X-Content-Type-Options: nosniff (prevents MIME type sniffing)
- Strict-Transport-Security: enabled (forces HTTPS)
- Referrer-Policy: strict-origin-when-cross-origin

### Rate Limiting
- **General Endpoint**: 100 requests/minute per IP
- **Sensitive Endpoints** (auth, payment): 5 requests/15 minutes
- Implemented in `src/lib/security.ts`

### Request Validation
- Maximum body size: 10MB
- Content-Type validation enforced
- Null bytes removed from strings

---

## 4. Database Security

### Prisma ORM
- SQL injection prevention: Built-in (parameterized queries)
- No raw SQL queries unless absolutely necessary
- All database operations use Prisma client

### Environment Variables
- Database URL stored in `.env.local` (never commit)
- Use connection pooling via Supabase
- DIRECT_URL used for migrations (not accessible from client)

### Data Access
- Always use `await prisma.[model].findUnique()` with proper filters
- Validate database results before use
- Log sensitive operations to audit trail

---

## 5. Frontend Security

### XSS Prevention
- Use React's built-in escaping (no dangerouslySetInnerHTML)
- Escape user content: `escapeHtml()` from `src/lib/validation.ts`
- Never use `eval()` or similar functions

### CSRF Protection
- NextAuth.js provides CSRF tokens automatically
- All state-changing operations use POST/PUT/DELETE
- CSRF tokens validated server-side

### Secure Cookie Handling
- All cookies are httpOnly (cannot be accessed by JavaScript)
- Secure flag set (HTTPS only in production)
- SameSite=Lax or Strict for CSRF protection

---

## 6. Sensitive Data Handling

### What NOT to Store in Frontend
- ❌ API keys or secrets
- ❌ Database passwords
- ❌ Plaintext user credentials
- ❌ PII (Personal Identifiable Information) beyond necessity

### Environment Variables
- Store all secrets in `.env.local` (never commit)
- `.env.example` shows required vars (without secrets)
- Access secrets only in server-side code

### Logging
- Never log passwords or auth tokens
- Log security events (failed logins, permission denials)
- Sanitize logs of sensitive data

---

## 7. File Upload Security

### Allowed File Types
Currently not implemented, but when adding:
- ✅ Whitelist extensions (.pdf, .jpg, .png)
- ✅ Validate MIME types
- ✅ Store files outside webroot
- ✅ Rename files with random strings
- ✅ Limit file size (< 10MB)

---

## 8. Compliance & Standards

### OWASP Top 10 Coverage
- A01: Broken Access Control - ✅ Role-based access control
- A02: Cryptographic Failures - ✅ HTTPS enforced, passwords hashed
- A03: Injection - ✅ Prisma ORM, input validation
- A04: Insecure Design - ✅ Security-first architecture
- A05: Security Misconfiguration - ✅ Environment vars, secure headers
- A06: Vulnerable Components - ✅ Dependency audit with npm audit
- A07: Authentication Failures - ✅ Strong password requirements
- A08: Software & Data Integrity - ✅ Package lock file, npm verify
- A09: Logging & Monitoring - ✅ Planned audit trail
- A10: SSRF - ✅ No external URL handling currently

### Industry Standards
- Follows GDPR guidelines (user privacy)
- Implements PCI-DSS for payment handling
- Uses NIST password recommendations

---

## 9. Security Checklist for Developers

### Before Committing Code
- [ ] No hardcoded secrets or API keys
- [ ] All user input validated
- [ ] SQL queries use Prisma ORM (parameterized)
- [ ] Sensitive operations logged (without secrets)
- [ ] Error messages don't leak system info
- [ ] HTTPS used for all external calls
- [ ] Rate limiting applied to sensitive endpoints
- [ ] CSRF tokens used for state-changing operations

### Before Deployment
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Run `npm run build` to check types
- [ ] Environment variables configured
- [ ] Database backups in place
- [ ] Logs reviewed for sensitive data
- [ ] Security headers verified in production
- [ ] SSL/TLS certificate valid and up-to-date

---

## 10. Reporting Security Issues

### If You Find a Vulnerability
1. **DO NOT** commit or share the vulnerability publicly
2. **DO NOT** test further in production
3. Email security details to: [SECURITY_EMAIL]
4. Include: severity, affected component, proof of concept (if safe)
5. Allow time for patching before public disclosure

---

## 11. Security Tools & Monitoring

### Tools Used
- `npm audit` - Dependency vulnerability scanning
- TypeScript - Type safety to prevent common bugs
- ESLint - Code quality and security rules
- NextAuth.js - Secure authentication

### Recommended Tools
- Snyk - Continuous vulnerability monitoring
- OWASP ZAP - Web application security scanning
- SonarQube - Code quality and security analysis

---

## 12. Version History

| Date | Change | Author |
|------|--------|--------|
| 2026-08-14 | Initial security setup | Security Team |
| | - Strong password requirements added | |
| | - Input validation utils created | |
| | - Security middleware implemented | |
| | - CSP headers configured | |

---

## Quick Reference

### Security Files
- `src/lib/security.ts` - Middleware, rate limiting, sanitization
- `src/lib/validation.ts` - Input validation functions
- `src/config/saasConfig.ts` - Security configuration
- `next.config.ts` - Security headers

### Key Functions
```typescript
// Validation
import { validateEmail, validateNumber, detectInjectionAttempt } from "@/lib/validation";

// Password validation (auth actions)
validatePassword(password); // Returns { isValid, error? }

// Security utilities
import { sanitizeInput, validateEmail, checkLoginAttempt } from "@/lib/security";
```

### Environment Variables Required
```
# Google OAuth
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Database
DATABASE_URL=postgresql://user:password@host/db
DIRECT_URL=postgresql://user:password@host/db

# NextAuth (generate with: openssl rand -base64 32)
AUTH_SECRET=your_secure_random_string
```

---

**Remember: Security is everyone's responsibility!** 🔐
