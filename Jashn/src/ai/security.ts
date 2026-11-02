/**
 * Prompt-injection defenses, sanitization and guardrails for AI layer.
 * Zero external dependencies.
 */

const SUSPICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(the\s+)?(system|above|developer)\s+(prompt|instructions)/i,
  /you\s+are\s+now\s+(DAN|unrestricted|jailbroken|admin)/i,
  /bypass\s+(safety|content|system)\s+filter/i,
  /system\s*:\s*role/i,
  /<script[\s>]/i,
  /javascript\s*:/i,
  /eval\s*\(/i,
  /drop\s+table/i,
  /expose\s+(api\s*key|secret|env|password)/i,
];

export interface SecurityCheckResult {
  isSafe: boolean;
  sanitizedQuery: string;
  rejectionReason?: string;
}

export function sanitizeAndValidatePrompt(
  rawInput: string,
  maxLength = 600
): SecurityCheckResult {
  if (typeof rawInput !== 'string') {
    return {
      isSafe: false,
      sanitizedQuery: '',
      rejectionReason: 'Invalid prompt format.',
    };
  }

  // Normalize Unicode and whitespace, strip unprintable ASCII controls
  let sanitized = rawInput
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  if (sanitized.length === 0) {
    return {
      isSafe: false,
      sanitizedQuery: '',
      rejectionReason: 'Query cannot be empty.',
    };
  }

  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      return {
        isSafe: false,
        sanitizedQuery: '',
        rejectionReason:
          'Prompt rejected by security guardrails: potentially malicious prompt injection detected.',
      };
    }
  }

  return {
    isSafe: true,
    sanitizedQuery: sanitized,
  };
}

export function wrapPromptWithDelimiters(sanitizedQuery: string): string {
  return `--- USER CELEBRATION PLANNING QUERY BEGIN ---\n${sanitizedQuery}\n--- USER CELEBRATION PLANNING QUERY END ---`;
}
