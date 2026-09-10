import dotenv from 'dotenv';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { buildAiPrompt, computeConfidence } from '@outage-iq/shared';

dotenv.config();

// 1. Initialize Valkey (Redis-compatible) Subscriber & Publisher
const cacheHost = process.env.CACHE_HOST || 'localhost';
const cachePort = parseInt(process.env.CACHE_PORT || '6379', 10);
const cachePassword = process.env.CACHE_PASSWORD || undefined;

const redisSubscriber = new Redis({ host: cacheHost, port: cachePort, password: cachePassword, lazyConnect: true });
redisSubscriber.on('error', (err) => console.error('[Redis Subscriber Error]', err.message));

const redisPublisher = new Redis({ host: cacheHost, port: cachePort, password: cachePassword, lazyConnect: true });
redisPublisher.on('error', (err) => console.error('[Redis Publisher Error]', err.message));

// 2. Initialize PostgreSQL Connection Pool
const dbPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'outage_iq',
    max: 10,
});

// 3. Initialize Mistral AI Client
const apiKey = process.env.MISTRAL_API_KEY || 'DEV_MOCK_KEY';

async function extractCodeContext(stackTrace: string): Promise<string | null> {
    const cleanStackTrace = stackTrace.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
    const regex = /(?:^|\s|\/|\\)([\w.-]+\.[a-zA-Z0-9]+):(\d+)/g;
    let match;
    const matches: { filename: string, line: number }[] = [];
    
    while ((match = regex.exec(cleanStackTrace)) !== null) {
        matches.push({ filename: match[1], line: parseInt(match[2], 10) });
    }
    
    if (matches.length === 0) return null;
    
    try {
        const keys = await redisPublisher.hkeys('codebase_files');
        if (!keys || keys.length === 0) return null;
        
        let contextParts: string[] = [];
        const seenKeys = new Set<string>();
        
        for (const { filename, line } of matches) {
            // Check cache or exact match
            const matchedKey = keys.find(k => k === filename || k.endsWith('/' + filename) || k.endsWith('\\' + filename));
            if (matchedKey && !seenKeys.has(matchedKey + ':' + line)) {
                seenKeys.add(matchedKey + ':' + line);
                const content = await redisPublisher.hget('codebase_files', matchedKey);
                if (content) {
                    const cleanContent = content.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
                    const lines = cleanContent.split('\n');
                    const startLine = Math.max(0, line - 16);
                    const endLine = Math.min(lines.length, line + 15);
                    const snippet = lines.slice(startLine, endLine).map((l, i) => `${startLine + i + 1}: ${l}`).join('\n');
                    contextParts.push(`--- File: ${matchedKey} (Around line ${line}) ---\n${snippet}`);
                }
            }
        }
        
        if (contextParts.length === 0) return null;
        return contextParts.join('\n\n');
    } catch (err) {
        console.error('Failed to extract code context:', err);
        return null;
    }
}

async function analyzeIncidentWithAI(serviceName: string, errorType: string, stackTrace: string, codeContext: string | null) {
    if (apiKey === 'DEV_MOCK_KEY') {
        console.log('[Worker] Using local mock diagnosis for demo purposes.');
        
        let dynamicSeverity = 'MEDIUM';
        if (errorType.includes('TypeError') || errorType.includes('ReferenceError') || errorType.includes('SyntaxError')) {
            dynamicSeverity = 'CRITICAL';
        } else if (errorType.includes('Error') || errorType.includes('ECONN') || stackTrace.includes('Unhandled')) {
            dynamicSeverity = 'HIGH';
        }
        // Return dummy mock response matching the new schema
        return {
            rootCause: `[Local Mock AI] Detected unhandled ${errorType} in ${serviceName}. Probable null pointer or missing env variable.`,
            rootCauseReasoning: "The error indicates a failure to establish a connection, likely due to the target service being unreachable or actively refusing connections.",
            misconfigurationCheck: "Targeting 'localhost' or '127.0.0.1' from within a containerized microservice usually indicates a configuration drift.",
            recommendedAction: 'Verify input payloads and check environmental secrets configuration.',
            codeFix: "Implement exponential backoff retry logic in the connection handler.",
            severity: dynamicSeverity,
            severityNote: dynamicSeverity === 'CRITICAL' ? "This error type typically causes the application to crash or behave unpredictably." : "Unhandled promise rejections can cause the Node.js process to exit ungracefully.",
            confidenceJustification: "Clear error code and stack trace point directly to the connection layer."
        };
    }

    try {
        const prompt = buildAiPrompt(serviceName, errorType, stackTrace, codeContext);

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Mistral API Error: ${response.status} - ${errBody}`);
        }

        const data = await response.json();
        const text = data.choices[0].message.content;
        const cleanJson = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (aiErr) {
        console.error('Mistral AI inference failure, falling back to heuristic diagnosis:', aiErr);
        return {
            rootCause: `Automated analysis failed. Critical ${errorType} reported in ${serviceName}.`,
            recommendedAction: 'Inspect raw stack trace and container logs immediately.',
            severity: 'CRITICAL',
            confidenceJustification: "Fallback heuristic triggered due to Mistral API failure."
        };
    }
}

async function startWorker() {
    try {
        await redisSubscriber.connect();
        await redisPublisher.connect();
        console.log('[OutageIQ AI Worker] Connected to Valkey event bus.');

        await redisSubscriber.subscribe('incident-events');
        console.log('[OutageIQ AI Worker] Listening for real-time incidents on channel: incident-events');

        redisSubscriber.on('message', async (channel, message) => {
            if (channel !== 'incident-events') return;

            try {
                const incident = JSON.parse(message);
                console.log(`[Processing Incident] ID: ${incident.id} | Service: ${incident.serviceName}`);

                // Extract Code Context if codebase exists
                const codeContext = await extractCodeContext(incident.stackTrace);

                // Perform AI inference
                const aiAnalysis = await analyzeIncidentWithAI(
                    incident.serviceName,
                    incident.errorType,
                    incident.stackTrace,
                    codeContext
                );
                
                let history = { resolved: 0, failed: 0 };
                if (incident.errorSignature) {
                    try {
                        const query = "SELECT fix_status, COUNT(*) as count FROM incidents WHERE error_signature = $1 AND fix_status IN ('resolved', 'failed') GROUP BY fix_status";
                        const result = await dbPool.query(query, [incident.errorSignature]);
                        for (const row of result.rows) {
                            if (row.fix_status === 'resolved') history.resolved = parseInt(row.count, 10);
                            if (row.fix_status === 'failed') history.failed = parseInt(row.count, 10);
                        }
                    } catch (dbErr) {
                        console.error('Error fetching history:', dbErr);
                    }
                }
                
                const confidence = computeConfidence(incident.errorType, incident.stackTrace, codeContext !== null, history);

                const isGrounded = codeContext !== null;
                
                if (confidence.confidenceScore <= 35) {
                    aiAnalysis.rootCause = `[Low Confidence] Limited information available in this trace — diagnosis below is a best-effort guess. ${aiAnalysis.rootCause}`;
                }

                const updatedIncident = {
                    ...incident,
                    ...aiAnalysis,
                    confidenceScore: confidence.confidenceScore,
                    confidenceJustification: confidence.confidenceJustification,
                    historyInfo: history,
                    isGrounded,
                    status: 'ANALYZED',
                    analyzedAt: new Date().toISOString(),
                };

                // Persist structured analysis into PostgreSQL
                try {
                    const insertQuery = `
            INSERT INTO incidents (id, service_name, error_type, stack_trace, root_cause, root_cause_reasoning, misconfiguration_check, recommended_action, code_fix, severity, severity_note, confidence_justification, confidence_score, is_grounded, source, fix_status, error_signature, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (id) DO NOTHING;
          `;
                    await dbPool.query(insertQuery, [
                        updatedIncident.id,
                        updatedIncident.serviceName,
                        updatedIncident.errorType,
                        updatedIncident.stackTrace,
                        typeof updatedIncident.rootCause === 'string' ? updatedIncident.rootCause : JSON.stringify(updatedIncident.rootCause),
                        typeof updatedIncident.rootCauseReasoning === 'string' ? updatedIncident.rootCauseReasoning : JSON.stringify(updatedIncident.rootCauseReasoning),
                        typeof updatedIncident.misconfigurationCheck === 'string' ? updatedIncident.misconfigurationCheck : JSON.stringify(updatedIncident.misconfigurationCheck),
                        typeof updatedIncident.recommendedAction === 'string' ? updatedIncident.recommendedAction : JSON.stringify(updatedIncident.recommendedAction),
                        typeof updatedIncident.codeFix === 'string' ? updatedIncident.codeFix : JSON.stringify(updatedIncident.codeFix),
                        updatedIncident.severity,
                        typeof updatedIncident.severityNote === 'string' ? updatedIncident.severityNote : JSON.stringify(updatedIncident.severityNote),
                        typeof updatedIncident.confidenceJustification === 'string' ? updatedIncident.confidenceJustification : JSON.stringify(updatedIncident.confidenceJustification),
                        updatedIncident.confidenceScore,
                        updatedIncident.isGrounded,
                        updatedIncident.source || 'simulated',
                        updatedIncident.fixStatus || 'unresolved',
                        updatedIncident.errorSignature || null,
                        updatedIncident.status,
                        updatedIncident.createdAt,
                    ]);
                } catch (dbErr) {
                    console.warn('PostgreSQL write skipped (table pending initialization during dev):', dbErr);
                }

                // Publish live analyzed event for UI WebSocket/Polling consumers
                await redisPublisher.publish('incident-updates', JSON.stringify(updatedIncident));
                console.log(`[Incident Analyzed & Broadcasted] ID: ${incident.id}`);
            } catch (err) {
                console.error('Failed to process incoming incident message:', err);
            }
        });
    } catch (err) {
        console.error('[OutageIQ AI Worker] Fatal Startup Error:', err);
    }
}

startWorker();