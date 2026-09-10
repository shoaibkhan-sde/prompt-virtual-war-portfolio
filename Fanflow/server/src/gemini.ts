import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { logJSON } from './middleware';
import { getVenueLayout, getCrowdDensities, getIncidents, CrowdZone, VenueGate, TransitHub, Incident } from './db';
import { StadiumGraph, DensityMap } from './graph';
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI | null {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    logJSON('INFO', { requestId: 'RUNTIME', method: 'GEMINI', url: 'init', message: 'Gemini API client initialized successfully.' });
    return genAI;
  }
  return null;
}

// Interfaces for structured AI outputs
export interface ChatAIResponse {
  text: string;
  highlights: string[];
  detectedLanguage: string;
}

export interface IncidentAIResponse {
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'security' | 'medical' | 'maintenance' | 'transit' | 'crowd' | 'other';
  summary: string;
}

// 1. Process Chat with Live Context and Auto-Translation
export async function processChat(
  message: string,
  accessibilityMode: boolean,
  sessionId: string,
  requestId: string
): Promise<ChatAIResponse> {
  // Fetch real-time context
  const venue = await getVenueLayout();
  const densities = await getCrowdDensities();
  const incidents = await getIncidents().then(list => list.filter(i => i.status === 'active'));

  // If no Gemini Client, run mock fallback
  const ai = getGenAI();
  if (!ai) {
    return generateMockChat(message, accessibilityMode, densities, incidents, requestId);
  }

  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      tools: [{
        functionDeclarations: [{
          name: "getOptimalRoute",
          description: "Get the optimal route and current crowd status between two locations in the stadium. MUST be called whenever a fan asks for navigation, directions, or crowd status.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              current_location: {
                type: SchemaType.STRING,
                description: "The fan's current location (e.g. Exterior, Gate-1, Zone-A, Hub-1)"
              },
              destination: {
                type: SchemaType.STRING,
                description: "The fan's desired destination (e.g. Interior_Target, Zone-C, Gate-3)"
              }
            },
            required: ["current_location", "destination"]
          }
        }]
      }]
    });

    const systemPrompt = `You are the Fanflow Matchday Assistant, a real-time, context-aware digital assistant for the FIFA World Cup 2026.
Your job is to provide navigation, accessibility, and transit assistance to fans.

CURRENT VENUE LAYOUT CONTEXT:
${JSON.stringify(venue)}

ACCESSIBILITY MODE ACTIVE: ${accessibilityMode}

CRITICAL INSTRUCTIONS:
1. Auto-detect the language of the user query and respond in the SAME language.
2. If the user asks for a route, directions, or crowd status, you MUST invoke the getOptimalRoute tool. Do NOT attempt to answer from your training data or hallucinate a route.
3. If accessibilityMode is true OR if the user mentions accessibility constraints (wheelchair, walking issues, ramps, elevators), pass this context to the tool by ensuring the destination is an ADA-compliant location if applicable, or inform the user based on the tool's output.
4. Zero-Emission Transit Guidance: If they ask about transit, rideshares, or leaving, advise them to take public transit like Metro (Hub-1) or Bus (Hub-2) which are zero-emission, unless there is a capacity bottleneck or incident there.
5. Your final response to the user MUST be a JSON object matching this schema:
{
  "text": "Your helpful response string. Use Markdown. Speak in their detected language.",
  "highlights": ["Gate-3", "Zone-C"],
  "detectedLanguage": "ISO-2 language code (e.g. en, es, fr)"
}
Return ONLY the raw JSON object, no wrapping markdown blocks (e.g. no \`\`\`json).`;

    const chat = model.startChat({
      systemInstruction: systemPrompt
    });

    let result = await chat.sendMessage(`User Input: "${message}"`);
    let response = result.response;
    
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "getOptimalRoute") {
        
        // Execute our Graph Engine
        const graph = new StadiumGraph();
        const densityMap: DensityMap = {};
        densities.forEach(d => densityMap[d.zoneId] = d.density);
        incidents.forEach(inc => {
          if (inc.priority === 'HIGH') densityMap[inc.zoneId] = 150; 
        });

        graph.addEdge('Exterior', 'Gate-1', 10);
        graph.addEdge('Exterior', 'Gate-2', accessibilityMode ? Infinity : 10);
        graph.addEdge('Exterior', 'Gate-3', 10);
        graph.addEdge('Exterior', 'Gate-4', accessibilityMode ? Infinity : 10);
        graph.addEdge('Gate-1', 'Zone-A', 5);
        graph.addEdge('Gate-2', 'Zone-B', 5);
        graph.addEdge('Gate-3', 'Zone-C', 5);
        graph.addEdge('Gate-4', 'Zone-D', 5);
        graph.addEdge('Zone-A', 'Interior_Target', 1);
        graph.addEdge('Zone-B', 'Interior_Target', 1);
        graph.addEdge('Zone-C', 'Interior_Target', 1);
        graph.addEdge('Zone-D', 'Interior_Target', 1);

        const { path, cost } = graph.findShortestPath('Exterior', 'Interior_Target', densityMap);
        
        let recommendedGate = 'Gate-1';
        let targetZone = 'Zone-A';
        if (path.length >= 3) {
          recommendedGate = path[1];
          targetZone = path[2];
        }

        const toolResponse = {
          optimal_path: path,
          cost: cost,
          recommended_gate: recommendedGate,
          target_zone: targetZone,
          active_incidents: incidents.filter(i => i.zoneId === targetZone),
          target_zone_density: densityMap[targetZone] || 0
        };

        // Send function result back to the model
        result = await chat.sendMessage([{
          functionResponse: {
            name: 'getOptimalRoute',
            response: toolResponse
          }
        }]);
        response = result.response;
      }
    }

    const responseText = response.text();
    const cleanText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const data = JSON.parse(cleanText) as ChatAIResponse;
    return data;
  } catch (err: unknown) {
    logJSON('ERROR', { requestId, method: 'GEMINI', url: 'chat', message: 'Gemini chat processing failed. Falling back to mock engine.', error: err instanceof Error ? err.message : String(err) });
    return generateMockChat(message, accessibilityMode, densities, incidents, requestId);
  }
}

// 2. Process and Triage Incident Reports
export async function triageIncident(
  description: string,
  reportedBy: 'volunteer' | 'staff',
  zoneId: string,
  requestId: string
): Promise<IncidentAIResponse> {
  const ai = getGenAI();
  if (!ai) {
    return generateMockIncident(description, reportedBy, zoneId, requestId);
  }

  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `You are the Fanflow Ops Intelligence Agent. Your job is to process incoming incident reports from on-ground volunteers and staff, categorize them, and assign a priority level.

INCIDENT REPORT DETAILS:
- Reporter type: ${reportedBy}
- Zone: ${zoneId}
- Raw description: "${description}"

INSTRUCTIONS:
1. Assess the urgency and impact of the incident.
2. Assign a priority:
   - HIGH: Security threats, fires, medical emergencies, structural failures, or major flow blockages.
   - MEDIUM: Scanner/turnstile breakdowns, minor maintenance issues (leaks, broken seats), moderate crowd delays.
   - LOW: General questions, minor spills, lost items, routine reports.
3. Assign a category: "security", "medical", "maintenance", "transit", or "other".
4. Write a concise, 1-sentence summary of the incident (max 10-12 words).
5. Return a JSON object matching this schema:
{
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "category": "security" | "medical" | "maintenance" | "transit" | "other",
  "summary": "Concise summary sentence"
}
Return ONLY the raw JSON object, no wrapping markdown blocks.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText.trim()) as IncidentAIResponse;
    return data;
  } catch (err: unknown) {
    logJSON('ERROR', { requestId, method: 'GEMINI', url: 'triage', message: 'Gemini incident triage failed. Falling back to mock engine.', error: err instanceof Error ? err.message : String(err) });
    return generateMockIncident(description, reportedBy, zoneId, requestId);
  }
}

// --- MOCK FALLBACK IMPLEMENTATIONS ---

function generateMockChat(
  message: string,
  accessibilityMode: boolean,
  densities: CrowdZone[],
  incidents: Incident[],
  requestId: string
): ChatAIResponse {
  logJSON('INFO', { requestId, method: 'GEMINI_MOCK', url: 'chat', message: 'Generating simulated chat response.' });

  const text = message.toLowerCase();
  
  // 1. Language Detection
  let lang = 'en';
  let greeting = 'Hello! Welcome to Fanflow Arena.';
  let gateIntro = 'For your entry/exit,';
  let routeRec = 'We suggest using';
  let accessInfo = 'All accessibility routes are operational.';
  let densityWarning = 'Please note that some areas are experiencing heavy capacity.';
  let transitGuidance = 'We recommend taking zero-emission transit like the Metro (Central Station) or Bus (Terminal West) to minimize carbon footprints.';
  
  if (text.startsWith('hola') || text.includes('como') || text.includes('dónde') || text.includes('gracias') || text.includes('puerta')) {
    lang = 'es';
    greeting = '¡Hola! Bienvenido a Fanflow Arena.';
    gateIntro = 'Para su entrada o salida,';
    routeRec = 'Sugerimos utilizar';
    accessInfo = 'Todas las rutas de accesibilidad están operativas.';
    densityWarning = 'Tenga en cuenta que algunas áreas están experimentando una alta densidad de personas.';
    transitGuidance = 'Recomendamos tomar transporte público de cero emisiones como el Metro (Estación Central) o el Autobús (Terminal Oeste).';
  } else if (text.startsWith('bonjour') || text.includes('comment') || text.includes('où') || text.includes('porte') || text.includes('merci')) {
    lang = 'fr';
    greeting = 'Bonjour! Bienvenue à Fanflow Arena.';
    gateIntro = 'Pour votre entrée/sortie,';
    routeRec = 'Nous vous suggérons d\'utiliser';
    accessInfo = 'Toutes les voies d\'accessibilité sont opérationnelles.';
    densityWarning = 'Veuillez noter que certaines zones connaissent une forte affluence.';
    transitGuidance = 'Nous vous conseillons d\'emprunter des transports à zéro émission comme le Métro (Station Centrale) ou le Bus (Terminal Ouest).';
  }

  // 2. Check for Accessibility Intent
  const hasAccessIntent = accessibilityMode || text.includes('wheelchair') || text.includes('silla') || text.includes('rampa') || text.includes('ramp') || text.includes('elevator') || text.includes('ascensor') || text.includes('disabled') || text.includes('incapacitado') || text.includes('handicap');
  
  // 3. Conversational Overrides (Mock enhancements)
  if (text.match(/^(hi|hello|hey|how are you|who are you|what are you|tell me about yourself|good morning|good evening)/i)) {
    return {
      text: `${greeting} I am your Fanflow Matchday Assistant. I can help you navigate the stadium, find the least congested gates, identify zero-emission transit options, and locate accessible routes. How can I assist you today?`,
      highlights: [],
      detectedLanguage: lang
    };
  }

  // 4. Crowd-Aware Routing logic with Graph Engine
  const sortedZones = [...densities].sort((a, b) => a.density - b.density);
  const worstZone = sortedZones[sortedZones.length - 1]; // Zone with highest crowd density

  // Initialize Graph
  const graph = new StadiumGraph();
  const densityMap: DensityMap = {};
  densities.forEach(d => densityMap[d.zoneId] = d.density);

  // Apply incident penalties heavily to density map so graph avoids them
  incidents.forEach(inc => {
    if (inc.priority === 'HIGH') densityMap[inc.zoneId] = 150; 
  });

  // Build routing edges (Exterior -> Gates -> Zones -> Interior)
  // If ADA is required, non-ADA gates (Gate-2, Gate-4) get infinite penalty
  graph.addEdge('Exterior', 'Gate-1', 10);
  graph.addEdge('Exterior', 'Gate-2', hasAccessIntent ? Infinity : 10);
  graph.addEdge('Exterior', 'Gate-3', 10);
  graph.addEdge('Exterior', 'Gate-4', hasAccessIntent ? Infinity : 10);

  graph.addEdge('Gate-1', 'Zone-A', 5);
  graph.addEdge('Gate-2', 'Zone-B', 5);
  graph.addEdge('Gate-3', 'Zone-C', 5);
  graph.addEdge('Gate-4', 'Zone-D', 5);

  graph.addEdge('Zone-A', 'Interior_Target', 1);
  graph.addEdge('Zone-B', 'Interior_Target', 1);
  graph.addEdge('Zone-C', 'Interior_Target', 1);
  graph.addEdge('Zone-D', 'Interior_Target', 1);

  const { path } = graph.findShortestPath('Exterior', 'Interior_Target', densityMap);
  
  let recommendedGate = 'Gate-1';
  let bestZone = sortedZones[0];

  if (path.length >= 3) {
    recommendedGate = path[1]; // E.g., Gate-3
    const targetZoneId = path[2]; // E.g., Zone-C
    bestZone = densities.find(d => d.zoneId === targetZoneId) || sortedZones[0];
  }

  const highlights: string[] = [];
  let responseText = '';

  if (hasAccessIntent) {
    highlights.push(recommendedGate, bestZone.zoneId);

    if (lang === 'es') {
      responseText += `♿ **Modo de Accesibilidad Activado**: Recomendamos ingresar por la **Puerta ${recommendedGate.split('-')[1]}**. Cuenta con rampas de acceso especiales y personal de asistencia. La zona conectada tiene una densidad de personas de sólo el ${bestZone.density}%.`;
    } else if (lang === 'fr') {
      responseText += `♿ **Mode Accessibilité Activé**: Nous vous recommandons d'entrer par la **Porte ${recommendedGate.split('-')[1]}**. Elle dispose de rampes d'accès adaptées. La zone connectée affiche une affluence de seulement ${bestZone.density}%.`;
    } else {
      responseText += `♿ **Accessibility Assistance Mode Active**: We recommend entering through **Gate ${recommendedGate.split('-')[1]}**. This gate features low-grade ramps, elevator access, and dedicated volunteers. The connected area currently has a low crowd density of ${bestZone.density}%.`;
    }
  } else {
    // Standard crowd-aware routing
    highlights.push(recommendedGate, bestZone.zoneId);
    
    // Add warning if the worst zone is highly congested
    let warningSnippet = '';
    if (worstZone.density > 80) {
      warningSnippet = ` **${worstZone.name}** is currently heavily congested (${worstZone.density}% capacity). Please avoid Gate-${worstZone.zoneId.split('-')[1].toLowerCase()} and route through **Gate-${recommendedGate.split('-')[1]}** instead which has a much lower density (${bestZone.density}%).`;
    }

    if (lang === 'es') {
      responseText += `${gateIntro} ${routeRec} **Puerta ${recommendedGate.split('-')[1]}** (${bestZone.name}), que actualmente se encuentra muy despejada (capacidad del ${bestZone.density}%).${warningSnippet ? warningSnippet.replace('Gate-', 'Puerta ').replace('is currently heavily congested', 'está muy congestionado') : ''}`;
    } else if (lang === 'fr') {
      responseText += `${gateIntro} ${routeRec} **Porte ${recommendedGate.split('-')[1]}** (${bestZone.name}), qui est actuellement très fluide (${bestZone.density}% de capacité).${warningSnippet ? warningSnippet.replace('Gate-', 'Porte ').replace('is currently heavily congested', 'est très encombré') : ''}`;
    } else {
      responseText += `${gateIntro} ${routeRec} **Gate ${recommendedGate.split('-')[1]}** (${bestZone.name}) which is currently highly clear (${bestZone.density}% capacity).${warningSnippet}`;
    }
  }

  // 4. Transit guidance
  if (text.includes('metro') || text.includes('bus') || text.includes('leave') || text.includes('exit') || text.includes('transito') || text.includes('ir') || text.includes('salir') || text.includes('transit') || text.includes('station') || text.includes('shuttle')) {
    responseText += `\n\n${transitGuidance}`;
    highlights.push('Hub-1', 'Hub-2');
  }

  // 5. Add details of active incidents if relevant to routing
  const relevantIncidents = incidents.filter(i => i.zoneId === bestZone.zoneId || i.zoneId === worstZone.zoneId);
  if (relevantIncidents.length > 0) {
    responseText += `\n\n⚠️ **Operational Updates**: `;
    relevantIncidents.forEach((inc, idx) => {
      if (idx > 0) responseText += ', ';
      responseText += `${inc.summary} (${inc.priority} priority)`;
    });
  }

  return {
    text: responseText,
    highlights,
    detectedLanguage: lang
  };
}

function generateMockIncident(
  description: string,
  reportedBy: 'volunteer' | 'staff',
  zoneId: string,
  requestId: string
): IncidentAIResponse {
  logJSON('INFO', { requestId, method: 'GEMINI_MOCK', url: 'triage', message: 'Generating simulated incident triage.' });

  const text = description.toLowerCase();
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let category: 'security' | 'medical' | 'maintenance' | 'transit' | 'other' = 'other';
  let summary = 'Routine issue reported.';

  // 1. Tag Category & Priority
  if (text.includes('fire') || text.includes('smoke') || text.includes('alarm') || text.includes('fight') || text.includes('weapon') || text.includes('threat') || text.includes('danger')) {
    priority = 'HIGH';
    category = 'security';
    summary = 'Security alert: Urgent hazard or safety issue detected.';
  } else if (text.includes('medical') || text.includes('injury') || text.includes('hurt') || text.includes('collapse') || text.includes('cpr') || text.includes('heart') || text.includes('bleed')) {
    priority = 'HIGH';
    category = 'medical';
    summary = 'Medical emergency: Volunteer requesting immediate first aid.';
  } else if (text.includes('broken scanner') || text.includes('scanner down') || text.includes('turnstile') || text.includes('scanner failure') || text.includes('gate closed')) {
    priority = 'MEDIUM';
    category = 'transit';
    summary = 'Scanner gate failure causing entrance delays.';
  } else if (text.includes('delay') || text.includes('traffic') || text.includes('shuttle stop') || text.includes('bus delay') || text.includes('train')) {
    priority = 'MEDIUM';
    category = 'transit';
    summary = 'Transit delay at stadium connections.';
  } else if (text.includes('leak') || text.includes('flood') || text.includes('water') || text.includes('structural') || text.includes('broken seat') || text.includes('spill')) {
    priority = 'MEDIUM';
    category = 'maintenance';
    summary = 'Maintenance report: Physical infrastructure update required.';
  } else {
    priority = 'LOW';
    category = 'other';
    summary = `Report: ${description.slice(0, 30)}...`;
  }

  // Staff reports default to higher urgency if borderline
  if (reportedBy === 'staff' && priority === 'LOW') {
    priority = 'MEDIUM';
  }

  return {
    priority,
    category,
    summary
  };
}
