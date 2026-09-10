import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Redis } from 'ioredis';
import { buildAiPrompt, getMockAiResponse, computeConfidence, computeErrorSignature } from '@outage-iq/shared';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import multer from 'multer';
import AdmZip from 'adm-zip';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Mistral API Key Extraction & Validation Guard
let mistralKey = process.env.MISTRAL_API_KEY;
if (!mistralKey) {
    try {
        const envPath = path.resolve(__dirname, '../../worker/.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/MISTRAL_API_KEY=(.+)/);
        if (match) mistralKey = match[1].trim();
    } catch(e) {}
}

if (mistralKey && mistralKey !== 'DEV_MOCK_KEY') {
    console.log('[Startup Guard] Checking Mistral API key validity...');
    fetch('https://api.mistral.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${mistralKey}` }
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                console.error('❌ [Startup Guard] API Key Verification Failed!');
                console.error(`   Error from Mistral: ${data.message || res.statusText}`);
            } else {
                console.log('✅ [Startup Guard] Mistral API key is VALID and working properly!');
            }
        }).catch(err => {
            console.error('❌ [Startup Guard] Failed to reach Mistral API:', err.message);
        });
} else {
    console.warn('⚠️ [Startup Guard] No Mistral API key provided. Running in simulated fallback mode.');
}

// Enable JSON parsing and CORS for frontend interactions
app.use(cors());
app.use(express.json());

// Default root route for platform health checks
app.get('/', (req: Request, res: Response) => {
    res.status(200).send('OutageIQ API Gateway is running.');
});

// Valkey / Redis client initialization for internal pub/sub event bus
const cacheHost = process.env.CACHE_HOST || 'localhost';
const cachePort = parseInt(process.env.CACHE_PORT || '6379', 10);
const cachePassword = process.env.CACHE_PASSWORD || undefined;

const redisPublisher = new Redis({
    host: cacheHost,
    port: cachePort,
    password: cachePassword,
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    retryStrategy: () => null,
});

redisPublisher.on('error', (err) => {
    console.error('[Redis Publisher Error]', err.message);
});

const redisSubscriber = new Redis({
    host: cacheHost,
    port: cachePort,
    password: cachePassword,
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    retryStrategy: () => null,
});

redisSubscriber.on('error', (err) => {
    console.error('[Redis Subscriber Error]', err.message);
});

const sseClients = new Set<Response>();

redisSubscriber.on('connect', () => {
    redisSubscriber.subscribe('incident-updates', 'incident-ingested', (err) => {
        if (err) console.error('[SSE] Failed to subscribe to Valkey channels:', err);
    });
});

redisSubscriber.on('message', (channel, message) => {
    sseClients.forEach(client => {
        client.write(`data: ${message}\n\n`);
    });
});

function broadcastSse(payload: any) {
    const data = JSON.stringify(payload);
    sseClients.forEach(client => {
        client.write(`data: ${data}\n\n`);
    });
}

// PostgreSQL connection pool initialization
const dbPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'outage_iq',
});

// Health check endpoint (Used by Zerops container health probes)
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
    });
});

// In-memory fallback state for local development without Docker/Databases
const localIncidents: any[] = [];

// Fetch latest 50 incidents for the dashboard
app.get('/api/v1/incidents', async (req: Request, res: Response) => {
    try {
        const query = 'SELECT * FROM incidents ORDER BY created_at DESC LIMIT 50';
        const result = await dbPool.query(query);
        
        // Map snake_case from DB to camelCase for frontend
        const incidents = result.rows.map((row) => ({
            id: row.id,
            serviceName: row.service_name,
            errorType: row.error_type,
            stackTrace: row.stack_trace,
            rootCause: row.root_cause,
            rootCauseReasoning: row.root_cause_reasoning,
            misconfigurationCheck: row.misconfiguration_check,
            recommendedAction: row.recommended_action,
            codeFix: row.code_fix,
            severity: row.severity,
            severityNote: row.severity_note,
            confidenceJustification: row.confidence_justification,
            isGrounded: row.is_grounded,
            status: row.status,
            createdAt: row.created_at,
            analyzedAt: row.analyzed_at,
        }));
        
        return res.json(incidents);
    } catch (err) {
        // Fallback to in-memory state if DB is offline
        const sorted = [...localIncidents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return res.json(sorted.slice(0, 50));
    }
});

const upload = multer({ storage: multer.memoryStorage() });

const localCodebaseFiles = new Map<string, string>();

app.get('/api/v1/debug', (req: Request, res: Response) => {
    res.json({
        redisStatus: redisPublisher.status,
        localCodebaseFilesKeys: Array.from(localCodebaseFiles.keys())
    });
});

// Server-Sent Events (SSE) Stream Endpoint
app.get('/api/v1/incidents/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);

    // Keep-alive ping
    const keepAlive = setInterval(() => {
        res.write(':\n\n');
    }, 15000);

    req.on('close', () => {
        clearInterval(keepAlive);
        sseClients.delete(res);
    });
});

// Helper for extracting local codebase content (fallback mode)
function extractLocalCodeContext(stackTrace: string): string | null {
    // Strip ANSI escape sequences from the stack trace
    const cleanStackTrace = stackTrace.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
    
    // Regex now matches any path leading up to the filename:line
    const regex = /(?:^|\s|\/|\\)([\w.-]+\.[a-zA-Z0-9]+):(\d+)/g;
    let match;
    const matches: { filename: string, line: number }[] = [];
    
    while ((match = regex.exec(cleanStackTrace)) !== null) {
        matches.push({ filename: match[1], line: parseInt(match[2], 10) });
    }
    
    const keys = Array.from(localCodebaseFiles.keys());
    console.log('[DEBUG] Extracted filenames from stack trace:', matches.map(m => m.filename));
    console.log('[DEBUG] Keys in localCodebaseFiles:', keys);
    
    if (matches.length === 0 || localCodebaseFiles.size === 0) return null;
    
    let contextParts: string[] = [];
    const seenKeys = new Set<string>();
    
    for (const { filename, line } of matches) {
        const matchedKey = keys.find(k => k === filename || k.endsWith('/' + filename) || k.endsWith('\\' + filename));
        console.log(`[DEBUG] Matching '${filename}' -> Found: ${matchedKey || 'null'}`);
        if (matchedKey && !seenKeys.has(matchedKey + ':' + line)) {
            seenKeys.add(matchedKey + ':' + line);
            const content = localCodebaseFiles.get(matchedKey);
            if (content) {
                // Strip any potential ANSI codes from the file content itself just in case
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
}

app.post('/api/v1/codebase', upload.single('codebase') as any, async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No codebase zip file uploaded.' });
        }

        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();
        
        const isRedisAvailable = redisPublisher.status === 'ready';

        if (isRedisAvailable) {
            // Clear previous codebase from Redis
            await redisPublisher.del('codebase_files');
        } else {
            console.warn('[Codebase Upload] Redis offline. Using in-memory fallback map.');
            localCodebaseFiles.clear();
        }
        
        let storedCount = 0;
        let storedSize = 0;
        const MAX_FILE_SIZE = 500 * 1024; // 500KB
        const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
        
        const validExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.java', '.rb', '.php', '.cs', '.cpp', '.c', '.h', '.json', '.yaml', '.yml'];
        
        const pipeline = isRedisAvailable ? redisPublisher.pipeline() : null;

        for (const entry of zipEntries) {
            if (entry.isDirectory) continue;
            
            const entryName = entry.entryName;
            
            // Filtering
            if (entryName.includes('node_modules/') || 
                entryName.includes('.git/') || 
                entryName.includes('dist/') || 
                entryName.includes('build/') || 
                entryName.includes('__MACOSX/')) {
                continue;
            }
            
            const ext = entryName.slice(entryName.lastIndexOf('.')).toLowerCase();
            if (!validExtensions.includes(ext)) {
                continue;
            }
            
            const size = entry.header.size;
            if (size > MAX_FILE_SIZE) {
                continue;
            }
            
            if (storedSize + size > MAX_TOTAL_SIZE) {
                console.warn(`[Codebase Upload] Reached 50MB limit. Skipping remaining files.`);
                break;
            }
            
            const content = entry.getData().toString('utf8');
            if (isRedisAvailable && pipeline) {
                pipeline.hset('codebase_files', entryName, content);
            } else {
                localCodebaseFiles.set(entryName, content);
            }
            
            storedCount++;
            storedSize += size;
        }
        
        if (isRedisAvailable && pipeline && storedCount > 0) {
            await pipeline.exec();
        }
        
        console.log(`[Codebase Upload] Successfully stored ${storedCount} files (${(storedSize / 1024 / 1024).toFixed(2)} MB)`);
        return res.status(200).json({ message: `Successfully indexed ${storedCount} source files.` });
    } catch (err) {
        console.error('[Codebase Upload] Error:', err);
        return res.status(500).json({ error: 'Failed to process codebase zip.' });
    }
});

async function enqueueIncident(payload: any) {
    payload.errorSignature = computeErrorSignature(payload.errorType, payload.stackTrace);
    payload.fixStatus = 'unresolved';

    // Push to local memory fallback
    localIncidents.push(payload);

    let history = { resolved: 0, failed: 0 };
    try {
        const query = "SELECT fix_status, COUNT(*) as count FROM incidents WHERE error_signature = $1 AND fix_status IN ('resolved', 'failed') GROUP BY fix_status";
        const result = await dbPool.query(query, [payload.errorSignature]);
        for (const row of result.rows) {
            if (row.fix_status === 'resolved') history.resolved = parseInt(row.count, 10);
            if (row.fix_status === 'failed') history.failed = parseInt(row.count, 10);
        }
    } catch (dbErr) {
        for (const inc of localIncidents) {
            // Exclude the current incident we just pushed
            if (inc.id !== payload.id && inc.errorSignature === payload.errorSignature) {
                if (inc.fixStatus === 'resolved') history.resolved++;
                if (inc.fixStatus === 'failed') history.failed++;
            }
        }
    }

    // Publish event asynchronously to Valkey channel for ai-worker processing
    try {
        await redisPublisher.publish('incident-events', JSON.stringify(payload));
        // Publish to UI via fan-out
        await redisPublisher.publish('incident-ingested', JSON.stringify(payload));
    } catch (cacheErr) {
        console.warn('Valkey offline: Triggering local fallback AI processing...');
        broadcastSse(payload); // Broadcast ingested event to local SSE clients

        if (mistralKey && mistralKey !== 'DEV_MOCK_KEY') {
            console.log('[Fallback Mode] Calling real Mistral API for diagnosis...');
            const localCodeContext = extractLocalCodeContext(payload.stackTrace);
            const prompt = buildAiPrompt(payload.serviceName, payload.errorType, payload.stackTrace, localCodeContext);

            fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mistralKey}`
                },
                body: JSON.stringify({
                    model: 'mistral-large-latest',
                    response_format: { type: 'json_object' },
                    messages: [{ role: 'user', content: prompt }]
                })
            }).then(res => res.json()).then(data => {
                if (data.message) {
                    throw new Error(`Mistral API Error: ${data.message}`);
                }
                if (!data.choices || !data.choices[0]) {
                    throw new Error('Unexpected Mistral API response structure');
                }
                
                const text = data.choices[0].message.content;
                const cleanJson = text.replace(/```json|```/g, '').trim();
                const aiResult = JSON.parse(cleanJson);
                const idx = localIncidents.findIndex(i => i.id === payload.id);
                if (idx > -1) {
                    const confidence = computeConfidence(payload.errorType, payload.stackTrace, localCodeContext !== null, history);
                    
                    if (confidence.confidenceScore <= 35) {
                        aiResult.rootCause = `[Low Confidence] Limited information available in this trace — diagnosis below is a best-effort guess. ${aiResult.rootCause}`;
                    }

                    localIncidents[idx] = {
                        ...localIncidents[idx],
                        ...aiResult,
                        confidenceScore: confidence.confidenceScore,
                        confidenceJustification: confidence.confidenceJustification,
                        historyInfo: history,
                        isGrounded: localCodeContext !== null,
                        status: 'ANALYZED',
                        analyzedAt: new Date().toISOString()
                    };
                    broadcastSse(localIncidents[idx]);
                }
            }).catch(err => {
                console.error('⚠️ [Fallback Mode] Direct API request failed. Using seamless mock.', err.message);
                setTimeout(() => {
                    const idx = localIncidents.findIndex(i => i.id === payload.id);
                    if (idx > -1) {
                        localIncidents[idx] = {
                            ...localIncidents[idx],
                            ...getMockAiResponse(payload.serviceName, payload.errorType),
                            status: 'ANALYZED',
                            analyzedAt: new Date().toISOString()
                        };
                        broadcastSse(localIncidents[idx]);
                    }
                }, 2000);
            });
        } else {
            console.warn('No Mistral key found. Using simulated delay.');
            setTimeout(() => {
                const idx = localIncidents.findIndex(i => i.id === payload.id);
                if (idx > -1) {
                    const localCodeContext = extractLocalCodeContext(payload.stackTrace);
                    const mockAi = getMockAiResponse(payload.serviceName, payload.errorType);
                    if (localCodeContext) {
                        mockAi.codeFix = `diff\n+ // Grounded local fallback fix\n+ function fixed() { return true; }\n\n${localCodeContext}`;
                    }
                    const confidence = computeConfidence(payload.errorType, payload.stackTrace, localCodeContext !== null, history);
                    
                    if (confidence.confidenceScore <= 35) {
                        mockAi.rootCause = `[Low Confidence] Limited information available in this trace — diagnosis below is a best-effort guess. ${mockAi.rootCause}`;
                    }
                    
                    localIncidents[idx] = {
                        ...localIncidents[idx],
                        ...mockAi,
                        confidenceScore: confidence.confidenceScore,
                        confidenceJustification: confidence.confidenceJustification,
                        historyInfo: history,
                        isGrounded: localCodeContext !== null,
                        status: 'ANALYZED',
                        analyzedAt: new Date().toISOString()
                    };
                    broadcastSse(localIncidents[idx]);
                }
            }, 2000);
        }
    }
}

app.post('/api/v1/incidents', async (req: Request, res: Response) => {
    try {
        const { serviceName, errorType, stackTrace, metadata } = req.body;

        if (!serviceName || !errorType) {
            return res.status(400).json({
                error: 'Missing required fields: serviceName and errorType are required.',
            });
        }

        const payload = {
            id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            serviceName,
            errorType,
            stackTrace: stackTrace || 'No stack trace provided.',
            metadata: metadata || {},
            status: 'DETECTED',
            source: 'simulated',
            createdAt: new Date().toISOString(),
        };

        enqueueIncident(payload);

        return res.status(202).json({
            message: 'Incident accepted for asynchronous processing.',
            incident: payload,
        });
    } catch (err) {
        console.error('Error processing incident payload:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/v1/webhook/incident', async (req: Request, res: Response) => {
    try {
        const { service, errorType, message, stackTrace, severity } = req.body;

        if (!service || typeof service !== 'string' || service.trim() === '') {
            return res.status(400).json({ error: 'Missing or invalid field: service' });
        }
        
        const trace = stackTrace || message;
        if (!trace || typeof trace !== 'string' || trace.trim() === '') {
            return res.status(400).json({ error: 'Missing or invalid field: stackTrace or message' });
        }

        const payload = {
            id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            serviceName: service,
            errorType: errorType || 'UnknownError',
            stackTrace: trace,
            metadata: { message, severity },
            status: 'DETECTED',
            source: 'webhook',
            createdAt: new Date().toISOString(),
        };

        enqueueIncident(payload);

        return res.status(202).json({
            message: 'Webhook incident accepted for processing.',
            incident: payload,
        });
    } catch (err) {
        console.error('Error processing incident payload:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/v1/incidents/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        
        // Try deleting from database
        try {
            await dbPool.query('DELETE FROM incidents WHERE id = $1', [id]);
        } catch (dbErr) {
            // ignore if DB is offline, fall through to memory
        }

        // Delete from local memory fallback
        const index = localIncidents.findIndex(i => i.id === id);
        if (index > -1) {
            localIncidents.splice(index, 1);
        }

        return res.status(200).json({ message: 'Incident deleted successfully' });
    } catch (err) {
        console.error('Error deleting incident:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.patch('/api/v1/incidents/:id/fix-status', async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        
        if (!['unresolved', 'applied', 'resolved', 'failed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid fix status' });
        }
        
        try {
            await dbPool.query('UPDATE incidents SET fix_status = $1 WHERE id = $2', [status, id]);
        } catch (dbErr) {
            // ignore if DB is offline, fall through to memory
        }

        const index = localIncidents.findIndex(i => i.id === id);
        if (index > -1) {
            localIncidents[index].fixStatus = status;
        }

        return res.status(200).json({ message: 'Fix status updated' });
    } catch (err) {
        console.error('Error updating fix status:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`[OutageIQ API Gateway] Running on 0.0.0.0:${PORT}`);
});