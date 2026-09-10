const EXPLICIT_ERRORS = [
    'ECONNREFUSED',
    'NullPointerException',
    'MemoryError',
    'JsonWebTokenError',
    'deadlock detected',
    'ENOSPC',
    'MongoServerSelectionError',
    'ConnectionTimeoutError',
    'OutOfMemoryError'
];

const KNOWN_CATEGORIES = [
    'NetworkError',
    'DatabaseError',
    'AuthenticationError',
    'MemoryError',
    'TimeoutError',
    'TypeError',
    'SyntaxError',
    'ReferenceError'
];

export interface ConfidenceResult {
    confidenceScore: number;
    confidenceJustification: string;
}

export function computeErrorSignature(errorType: string, stackTrace: string): string {
    const firstLine = stackTrace.split('\n').map(l => l.trim()).filter(l => l.length > 0)[0] || '';
    
    let normalized = firstLine.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]');
    normalized = normalized.replace(/::1/g, '[IP]');
    normalized = normalized.replace(/(?:\/[a-zA-Z0-9_.-]+)+\/?/g, '[PATH]');
    normalized = normalized.replace(/(?:[a-zA-Z]:\\[a-zA-Z0-9_.\\]+)+\/?/g, '[PATH]');
    normalized = normalized.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[UUID]');
    normalized = normalized.replace(/\b0x[0-9a-fA-F]+\b/g, '[HEX]');

    const errorRegex = new RegExp(`^${errorType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:?\\s*`, 'i');
    normalized = normalized.replace(errorRegex, '');

    normalized = normalized.replace(/[^a-zA-Z0-9[\]:]+/g, '_').replace(/^_+|_+$/g, '');

    return `${errorType}_${normalized}`;
}

export function computeConfidence(
    errorType: string, 
    stackTrace: string, 
    isGrounded: boolean,
    history?: { resolved: number; failed: number }
): ConfidenceResult {
    let score = 0;
    const signals: string[] = [];

    // 1. Grounded check (+30 and +15 overlap)
    if (isGrounded) {
        score += 30;
        signals.push('+30 Grounded in real codebase context');
        score += 15;
        signals.push('+15 Code context resolved to specific line');
    }

    const lowerErrorType = errorType.toLowerCase();
    const lowerStack = stackTrace.toLowerCase();

    // 2. Explicit Error Match (+20)
    let hasExplicitError = false;
    for (const err of EXPLICIT_ERRORS) {
        if (lowerErrorType.includes(err.toLowerCase()) || lowerStack.includes(err.toLowerCase())) {
            hasExplicitError = true;
            score += 20;
            signals.push(`+20 Explicit well-known error detected (${err})`);
            break;
        }
    }

    // 3. Corroborating Clues (+20) - Requires both IP/host binding AND multiple call frames
    const hasIpOrHost = /\b(localhost|127\.0\.0\.1|\[::1\]|(?:\d{1,3}\.){3}\d{1,3}:\d+)\b/i.test(stackTrace);
    const callFramesCount = (stackTrace.match(/^\s*at\s+/gm) || []).length;
    const hasMultipleFrames = callFramesCount >= 2;

    if (hasIpOrHost && hasMultipleFrames) {
        score += 20;
        signals.push('+20 Multiple corroborating clues (IP/Host binding + distinct call frames)');
    }

    // 4. Known Category (+15)
    for (const cat of KNOWN_CATEGORIES) {
        if (lowerErrorType.includes(cat.toLowerCase())) {
            score += 15;
            signals.push(`+15 Error matches known category (${cat})`);
            break;
        }
    }

    // 5. Historical Track Record (+/- 10)
    if (history && (history.resolved + history.failed) > 0) {
        const total = history.resolved + history.failed;
        const ratio = history.resolved / total;
        if (ratio >= 0.7) {
            score += 10;
            signals.push(`+10 History (This fix resolved ${history.resolved}/${total} past similar incidents)`);
        } else if (ratio < 0.3) {
            score -= 10;
            signals.push(`-10 History (This fix failed ${history.failed}/${total} past similar incidents)`);
        }
    }

    // Apply limits
    score = Math.max(30, Math.min(100, score));

    if (signals.length === 0) {
        signals.push('Base floor of 30 applied (no specific signals matched)');
    }

    const justificationStr = `Computed Score: ${score}/100. Signals:\n• ${signals.join('\n• ')}`;

    return {
        confidenceScore: score,
        confidenceJustification: justificationStr
    };
}
