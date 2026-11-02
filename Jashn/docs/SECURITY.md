# Security Specification — Jashn Celebration & Event Planner

## 1. Security Philosophy & Threat Model

**Jashn** is built with defense-in-depth principles. Because the application processes user queries through Large Language Models (LLMs) and provides financial celebration budgeting, security focuses on five critical vectors:

1. **Prompt Injection & Adversarial Jailbreaks**
2. **Cross-Site Scripting (XSS) & Unsafe HTML Rendering**
3. **Denial of Service (DoS) & API Quota Exhaustion**
4. **Secret Leakage (API Keys and Credentials)**
5. **Client-Side Data Privacy**

---

## 2. Prompt Injection Defenses

User inputs submitted to the AI Planner are subjected to multi-layered guardrails before reaching any model:

### 2.1 Keyword & Regex Signature Scanning (`src/ai/security.ts`)
Inputs are evaluated against a blocklist of adversarial prompt patterns:
- Instruction override attempts (`ignore previous instructions`, `disregard system prompt`)
- Persona jailbreaks (`you are now DAN`, `bypass safety filters`)
- System prompt exfiltration attempts (`expose api key`, `system: role`)
- Code injection fragments (`<script>`, `javascript:`, `eval(`)

If any pattern matches, the query is immediately rejected client-side and server-side without consuming API tokens:
```typescript
const check = sanitizeAndValidatePrompt(userInput);
if (!check.isSafe) {
  return { reply: `⚠️ ${check.rejectionReason}`, source: 'built-in' };
}
```

### 2.2 Strict Context Delimiters
Prompts sent to Gemini are encapsulated in unmistakable boundaries:
```
--- USER CELEBRATION PLANNING QUERY BEGIN ---
[Sanitized User Prompt]
--- USER CELEBRATION PLANNING QUERY END ---
```
System instructions clearly dictate that instructions within the user block cannot override outer constraints or schema specifications.

### 2.3 Strict Zod Output Validation (`src/ai/schemas.ts`)
The model is instructed to respond strictly in `application/json`. Output is parsed and validated using Zod schemas (`AssistantStructuredOutputSchema`). Unstructured or unexpected tokens are rejected and routed to the deterministic fallback engine.

---

## 3. Cross-Site Scripting (XSS) Prevention

- **Prohibition of `dangerouslySetInnerHTML`:** The codebase enforces a strict rule: `dangerouslySetInnerHTML` is NEVER used.
- **Safe React Text Nodes:** All user-supplied strings (event titles, vendor names, notes, guest lists) and assistant replies are rendered via standard React text nodes (`{message.text}`), which automatically escape HTML entities.
- **Strict Content-Type Headers:** All API routes enforce `application/json` or `text/calendar; charset=utf-8`.

---

## 4. HTTP Headers & Content Security Policy (CSP)

Configured directly in `next.config.mjs`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' blob: data: https:; connect-src 'self' https://generativelanguage.googleapis.com; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests;
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 5. Denial of Service & Quota Flooding Protections

1. **Payload Size Capping:** The assistant API route (`src/app/api/assistant/route.ts`) checks `Content-Length` and rejects any payload exceeding **50 KB** with HTTP 413.
2. **Sliding Window Rate Limiting:** `src/lib/rateLimit.ts` limits requests to **30 requests per minute per IP address**. Exceeded quotas return HTTP 429 with standard `Retry-After` headers.
3. **Response Caching:** `src/ai/cache.ts` caches answers using an in-memory LRU store with a 10-minute TTL, avoiding repeated calls for identical queries.

---

## 6. Secret Management

- `GEMINI_API_KEY` is loaded exclusively server-side in API routes and Node.js environments.
- It is never prefixed with `NEXT_PUBLIC_` and never exposed to client browsers or bundled in frontend JavaScript.
- When no API key is configured, the application functions seamlessly in offline deterministic mode with zero errors.
