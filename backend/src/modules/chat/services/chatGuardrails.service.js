/**
 * AI Guardrails Engine for E-Commerce Assistant
 * Enforces security, brand alignment, PII protection, input sanitization, and output moderation.
 */

// Patterns indicating prompt injection, jailbreaking, or boundary violations
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /system\s+prompt/i,
  /you\s+are\s+now\s+(an?\s+)?unrestricted/i,
  /act\s+as\s+(dan|an\s+unfiltered|an\s+evil)/i,
  /bypass\s+(filters|rules|safety)/i,
  /reveal\s+(internal|secret|hidden|password|key|token)/i,
  /drop\s+database/i,
  /<script[\s\S]*?>/i,
  /\bexec\s*\(/i,
  /\beval\s*\(/i,
];

// Sensitive information patterns (Credit cards, passwords, API tokens)
const PII_PATTERNS = [
  /\b(?:\d{4}[ -]?){3}\d{4}\b/, // Credit card numbers
  /\b(cvv|cvc)\s*[:=]?\s*\d{3,4}\b/i,
  /\b(password|secret|bearer\s+[a-z0-9_\-\.]+)\b/i,
];

// Off-topic or toxic domains disallowed on fashion/clothing platform
const TOXIC_OFFTOPIC_PATTERNS = [
  /\b(porn|adult|explicit|nude|sex|casino|gambling|betting|hack|crypto|bitcoin)\b/i,
  /\b(kill|suicide|bomb|weapon|drugs|poison)\b/i,
];

export class ChatGuardrails {
  /**
   * Evaluates user input against safety filters.
   * @param {string} text - User message text
   * @returns {{ safe: boolean, reason?: string, sanitized: string }}
   */
  static validateInput(text = '') {
    if (!text || typeof text !== 'string') {
      return { safe: true, sanitized: '' };
    }

    const trimmed = text.trim();

    // 1. Length limitation (Industry standard protection against token exhaustion attacks)
    if (trimmed.length > 1000) {
      return {
        safe: false,
        reason: "Message is too long. Please keep questions under 1000 characters.",
        sanitized: trimmed.slice(0, 1000),
      };
    }

    // 2. Prompt injection & Jailbreak detection
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          safe: false,
          reason: "I am designed specifically to assist you with Drip Nation's clothing collections, styles, sizing, and orders.",
          sanitized: "",
        };
      }
    }

    // 3. Toxic or harmful intent
    for (const pattern of TOXIC_OFFTOPIC_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          safe: false,
          reason: "I can only assist with clothing, fashion advice, sizing, and shopping orders.",
          sanitized: "",
        };
      }
    }

    // 4. Sanitize HTML tags & dangerous symbols
    const sanitized = trimmed
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');

    return { safe: true, sanitized };
  }

  /**
   * Sanitizes and verifies AI assistant response before sending to user.
   * @param {string} reply - AI generated reply
   * @returns {string} Sanitized output
   */
  static validateOutput(reply = '') {
    if (!reply || typeof reply !== 'string') return '';

    let clean = reply;

    // Mask any leaked sensitive numbers (Credit cards, phone numbers leaked accidentally)
    for (const pattern of PII_PATTERNS) {
      clean = clean.replace(pattern, '[REDACTED]');
    }

    // Strip out raw script tags or iframe injections
    clean = clean.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    clean = clean.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '');

    return clean.trim();
  }
}

