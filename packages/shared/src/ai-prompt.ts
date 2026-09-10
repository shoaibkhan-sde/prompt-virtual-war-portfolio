export const buildAiPrompt = (serviceName: string, errorType: string, stackTrace: string, codeContext: string | null = null) => `
Act as a Senior Site Reliability Engineer. Analyze this software outage log:
Service: ${serviceName}
Stack Trace: ${stackTrace}
${codeContext ? `\n---\nCODE CONTEXT (actual source code surrounding the stack trace frames):\n${codeContext}\n---` : ''}

Respond in clean JSON format with these specific keys:
- "rootCause": (1 clear sentence explaining what broke)
- "rootCauseReasoning": (Technical reasoning explaining *why* this error occurred, distinguishing error classes. Omit if too vague)
- "misconfigurationCheck": (Flag probable environment misconfigurations, e.g. localhost/127.0.0.1 in a networked service. Omit if not applicable)
- "recommendedAction": (1 actionable engineering step to fix it)
- "codeFix": (${codeContext ? 'Generate a unified diff showing exactly how to fix the issue based on the provided CODE CONTEXT. Do not guess; ground the diff in the actual code.' : 'Specific code/config-level fix relevant to the language/library. Omit if too vague'})
- "severity": ("CRITICAL", "HIGH", or "MEDIUM")
- "severityNote": (Note stability risks like UnhandledPromiseRejectionWarning, panic, OOM. Omit if caught/handled cleanly)

IMPORTANT: The fields "rootCauseReasoning", "misconfigurationCheck", "codeFix", and "severityNote" are CONDITIONAL. Only populate them if they are genuinely relevant to the specific trace. Otherwise, omit them or return null.
`;

export const getMockAiResponse = (serviceName: string, errorType: string) => ({
    rootCause: `AI Diagnosis: A critical ${errorType} occurred in ${serviceName} due to unhandled promise rejections or configuration drift.`,
    rootCauseReasoning: "The error indicates a failure to establish a connection, likely due to the target service being unreachable or actively refusing connections.",
    misconfigurationCheck: "Targeting 'localhost' or '127.0.0.1' from within a containerized microservice usually indicates a configuration drift.",
    recommendedAction: "Scale up the container resources, verify injected environment variables, and implement exponential backoff retry logic.",
    codeFix: "Implement exponential backoff retry logic in the connection handler.",
    severity: "HIGH",
    severityNote: "Unhandled promise rejections can cause the Node.js process to exit ungracefully."
});
