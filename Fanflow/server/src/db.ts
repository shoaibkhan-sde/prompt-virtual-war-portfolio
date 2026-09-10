import { MongoClient, Db } from 'mongodb';
import { logJSON } from './middleware';

// Database Schema interfaces
export interface VenueGate {
  gateId: string;
  name: string;
  nearZone: string;
  isADACompliant: boolean;
  notes: string;
}

export interface TransitHub {
  hubId: string;
  name: string;
  type: string;
  nearGate: string;
  isEcoFriendly: boolean;
}

export interface VenueMapData {
  stadiumName: string;
  zones: { zoneId: string; name: string; capacity: number }[];
  gates: VenueGate[];
  transitHubs: TransitHub[];
}

export interface CrowdZone {
  zoneId: string;
  name: string;
  capacity: number;
  currentCount: number;
  density: number; // 0 to 100 percentage
  status: 'LOW' | 'MEDIUM' | 'HIGH';
  updatedAt: Date;
}

export interface Incident {
  incidentId: string;
  description: string;
  reportedBy: 'volunteer' | 'staff';
  zoneId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'security' | 'medical' | 'maintenance' | 'transit' | 'crowd' | 'other';
  summary: string;
  status: 'active' | 'resolved';
  createdAt: Date;
}

export interface Facility {
  facilityId: string;
  name: string;
  type: 'restroom' | 'concession' | 'merchandise';
  zoneId: string;
  waitTimeMinutes: number;
  status: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ChatSession {
  sessionId: string;
  messages: { role: 'user' | 'model'; text: string; timestamp: Date }[];
}

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  isGuest?: boolean;
}

// In-memory fallback database
class InMemoryDb {
  venueMap: VenueMapData = {
    stadiumName: 'Fanflow Arena',
    zones: [
      { zoneId: 'Zone-A', name: 'North Stand', capacity: 20000 },
      { zoneId: 'Zone-B', name: 'East Stand', capacity: 25000 },
      { zoneId: 'Zone-C', name: 'South Stand', capacity: 22000 },
      { zoneId: 'Zone-D', name: 'West Stand', capacity: 18000 }
    ],
    gates: [
      { gateId: 'Gate-1', name: 'Gate 1 (North)', nearZone: 'Zone-A', isADACompliant: true, notes: 'ADA Compliant - Equipped with wheelchair ramps and elevator access.' },
      { gateId: 'Gate-2', name: 'Gate 2 (East)', nearZone: 'Zone-B', isADACompliant: false, notes: 'Stairs only - scanner lanes active.' },
      { gateId: 'Gate-3', name: 'Gate 3 (South)', nearZone: 'Zone-C', isADACompliant: true, notes: 'ADA Compliant - Dedicated accessibility lanes, low-grade ramps.' },
      { gateId: 'Gate-4', name: 'Gate 4 (West)', nearZone: 'Zone-D', isADACompliant: false, notes: 'Turnstiles only - high capacity throughput.' }
    ],
    transitHubs: [
      { hubId: 'Hub-1', name: 'Metro Station Central', type: 'Metro', nearGate: 'Gate-1', isEcoFriendly: true },
      { hubId: 'Hub-2', name: 'Bus Terminal West', type: 'Shuttle', nearGate: 'Gate-4', isEcoFriendly: true },
      { hubId: 'Hub-3', name: 'Rideshare Zone South', type: 'Taxi', nearGate: 'Gate-3', isEcoFriendly: false }
    ]
  };

  facilities: Facility[] = [
    { facilityId: 'F-1', name: 'North Concessions', type: 'concession', zoneId: 'Zone-A', waitTimeMinutes: 5, status: 'LOW' },
    { facilityId: 'F-2', name: 'North Restrooms', type: 'restroom', zoneId: 'Zone-A', waitTimeMinutes: 2, status: 'LOW' },
    { facilityId: 'F-3', name: 'East Food Court', type: 'concession', zoneId: 'Zone-B', waitTimeMinutes: 15, status: 'MEDIUM' },
    { facilityId: 'F-4', name: 'East Restrooms', type: 'restroom', zoneId: 'Zone-B', waitTimeMinutes: 8, status: 'MEDIUM' },
    { facilityId: 'F-5', name: 'South Grill', type: 'concession', zoneId: 'Zone-C', waitTimeMinutes: 25, status: 'HIGH' },
    { facilityId: 'F-6', name: 'South Restrooms', type: 'restroom', zoneId: 'Zone-C', waitTimeMinutes: 4, status: 'LOW' },
    { facilityId: 'F-7', name: 'West Snacks', type: 'concession', zoneId: 'Zone-D', waitTimeMinutes: 12, status: 'MEDIUM' },
    { facilityId: 'F-8', name: 'West Restrooms', type: 'restroom', zoneId: 'Zone-D', waitTimeMinutes: 3, status: 'LOW' }
  ];

  crowdZones: CrowdZone[] = [];
  incidents: Incident[] = [];
  chatSessions: ChatSession[] = [];
  users: User[] = [];

  constructor() {
    // Populate crowd zones with initial simulated state
    this.venueMap.zones.forEach(z => {
      // Start with moderate density
      const startCount = Math.floor(z.capacity * 0.55);
      const density = Math.round((startCount / z.capacity) * 100);
      this.crowdZones.push({
        zoneId: z.zoneId,
        name: z.name,
        capacity: z.capacity,
        currentCount: startCount,
        density,
        status: density > 80 ? 'HIGH' : density > 50 ? 'MEDIUM' : 'LOW',
        updatedAt: new Date()
      });
    });
  }
}

const memoryDb = new InMemoryDb();
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isUsingFallback = true;

// Attempt to connect to MongoDB Atlas with standard SRV connection
// Fallback to direct connections (mongodb://) with host parameters if DNS fails
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logJSON('WARN', { requestId: 'BOOT', method: 'DB', url: 'connect', message: 'MONGODB_URI not found. Running in-memory database fallback.' });
    isUsingFallback = true;
    startCrowdSimulation();
    return;
  }

  // URL-encode all credential components if present
  let safeUri = uri;
  try {
    const url = new URL(uri);
    if (url.username || url.password) {
      url.username = encodeURIComponent(url.username);
      url.password = encodeURIComponent(url.password);
      safeUri = url.toString();
    }
  } catch (e) {
    // If standard parser fails (e.g. SRV format not supported by standard URL parser in node), we continue
  }

  try {
    logJSON('INFO', { requestId: 'BOOT', method: 'DB', url: 'connect', message: 'Attempting connection to MongoDB...' });
    mongoClient = new MongoClient(safeUri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db('fanflow');
    isUsingFallback = false;
    logJSON('INFO', { requestId: 'BOOT', method: 'DB', url: 'connect', message: 'Successfully connected to MongoDB!' });
    
    // Seed initial values
    await seedDB();
  } catch (err: unknown) {
    logJSON('ERROR', {
      requestId: 'BOOT',
      method: 'DB',
      url: 'connect',
      message: 'Failed standard SRV DNS lookup or credentials error. Attempting direct mongodb:// fallback connection...',
      error: err instanceof Error ? err.message : String(err)
    });
    
    // Fallback: If SRV lookup failed, check if we can format it into direct connection or fall back to memory
    try {
      if (uri.startsWith('mongodb+srv://')) {
        // Simple direct fallback syntax check
        const directUri = uri.replace('mongodb+srv://', 'mongodb://');
        logJSON('INFO', { requestId: 'BOOT', method: 'DB', url: 'connect', message: `Attempting direct connection: ${directUri.split('@')[1] || directUri}` });
        mongoClient = new MongoClient(directUri, {
          connectTimeoutMS: 5000,
          serverSelectionTimeoutMS: 5000
        });
        await mongoClient.connect();
        mongoDb = mongoClient.db('fanflow');
        isUsingFallback = false;
        logJSON('INFO', { requestId: 'BOOT', method: 'DB', url: 'connect', message: 'Connected using direct fallback connection!' });
        await seedDB();
      } else {
        throw new Error('Not an SRV string, cannot attempt direct format convert.');
      }
    } catch (fallbackErr: any) {
      logJSON('ERROR', {
        requestId: 'BOOT',
        method: 'DB',
        url: 'connect',
        message: 'All MongoDB connection attempts failed. Continuing with local in-memory fallback database.',
        error: fallbackErr.message
      });
      isUsingFallback = true;
    }
  }
  
  startCrowdSimulation();
}

async function seedDB() {
  if (isUsingFallback || !mongoDb) return;

  try {
    // Check and seed venue map
    const venueCount = await mongoDb.collection('venueMap').countDocuments();
    if (venueCount === 0) {
      await mongoDb.collection('venueMap').insertOne(memoryDb.venueMap);
      logJSON('INFO', { requestId: 'BOOT', method: 'DB', url: 'seed', message: 'Seeded venueMap collection.' });
    }

    // Check and seed crowdZones
    const crowdCount = await mongoDb.collection('crowdZones').countDocuments();
    if (crowdCount === 0) {
      await mongoDb.collection('crowdZones').insertMany(memoryDb.crowdZones);
      logJSON('INFO', { requestId: 'BOOT', method: 'DB', url: 'seed', message: 'Seeded crowdZones collection.' });
    }
  } catch (err: unknown) {
    logJSON('ERROR', { requestId: 'BOOT', method: 'DB', url: 'seed', message: 'Failed database seeding.', error: err instanceof Error ? err.message : String(err) });
  }
}

// Background simulator ticks: applies realistic capacity jitter
let intervalId: NodeJS.Timeout | null = null;
function startCrowdSimulation() {
  if (intervalId) return;

  intervalId = setInterval(async () => {
    try {
      if (isUsingFallback) {
        memoryDb.crowdZones = memoryDb.crowdZones.map(zone => {
          // Jitter: +/- 1-5% of capacity
          const jitterPercent = (Math.random() * 8 - 4) / 100; // -4% to +4%
          let countChange = Math.floor(zone.capacity * jitterPercent);
          
          // Add seasonal drift towards high density
          if (zone.density < 45) {
            countChange += Math.floor(zone.capacity * 0.02);
          } else if (zone.density > 92) {
            countChange -= Math.floor(zone.capacity * 0.03);
          }

          let newCount = Math.max(0, Math.min(zone.capacity, zone.currentCount + countChange));
          const density = Math.round((newCount / zone.capacity) * 100);
          
          return {
            ...zone,
            currentCount: newCount,
            density,
            status: density > 80 ? 'HIGH' : density > 50 ? 'MEDIUM' : 'LOW',
            updatedAt: new Date()
          };
        });
      } else if (mongoDb) {
        const zones = await mongoDb.collection('crowdZones').find({}).toArray();
        for (const zone of zones) {
          const capacity = zone.capacity;
          const currentCount = zone.currentCount;
          const densityVal = zone.density;

          const jitterPercent = (Math.random() * 8 - 4) / 100; // -4% to +4%
          let countChange = Math.floor(capacity * jitterPercent);
          if (densityVal < 45) {
            countChange += Math.floor(capacity * 0.02);
          } else if (densityVal > 92) {
            countChange -= Math.floor(capacity * 0.03);
          }

          const newCount = Math.max(0, Math.min(capacity, currentCount + countChange));
          const density = Math.round((newCount / capacity) * 100);
          const status = density > 80 ? 'HIGH' : density > 50 ? 'MEDIUM' : 'LOW';

          await mongoDb.collection('crowdZones').updateOne(
            { zoneId: zone.zoneId },
            { 
              $set: { 
                currentCount: newCount, 
                density, 
                status, 
                updatedAt: new Date() 
              } 
            }
          );
        }
      }
    } catch (err: unknown) {
      logJSON('ERROR', { requestId: 'SYSTEM', method: 'DB', url: 'simulation', message: 'Crowd simulation tick failed.', error: err instanceof Error ? err.message : String(err) });
    }
  }, 5000);
}

// Database query interfaces
export async function getVenueLayout(): Promise<VenueMapData> {
  if (isUsingFallback || !mongoDb) {
    return memoryDb.venueMap;
  }
  const layouts = await mongoDb.collection('venueMap').findOne({});
  return (layouts as unknown as VenueMapData) || memoryDb.venueMap;
}

export async function getCrowdDensities(): Promise<CrowdZone[]> {
  if (isUsingFallback || !mongoDb) {
    return memoryDb.crowdZones;
  }
  const zones = await mongoDb.collection('crowdZones').find({}).toArray();
  return zones as unknown as CrowdZone[];
}

export async function updateZoneDensityDirectly(zoneId: string, changePercent: number): Promise<void> {
  // Utility for testing and manual validation
  if (isUsingFallback) {
    const zone = memoryDb.crowdZones.find(z => z.zoneId === zoneId);
    if (zone) {
      const countChange = Math.floor(zone.capacity * (changePercent / 100));
      zone.currentCount = Math.max(0, Math.min(zone.capacity, zone.currentCount + countChange));
      zone.density = Math.round((zone.currentCount / zone.capacity) * 100);
      zone.status = zone.density > 80 ? 'HIGH' : zone.density > 50 ? 'MEDIUM' : 'LOW';
      zone.updatedAt = new Date();
    }
  } else if (mongoDb) {
    const zone = await mongoDb.collection('crowdZones').findOne({ zoneId });
    if (zone) {
      const capacity = zone.capacity;
      const countChange = Math.floor(capacity * (changePercent / 100));
      const newCount = Math.max(0, Math.min(capacity, zone.currentCount + countChange));
      const density = Math.round((newCount / capacity) * 100);
      const status = density > 80 ? 'HIGH' : density > 50 ? 'MEDIUM' : 'LOW';

      await mongoDb.collection('crowdZones').updateOne(
        { zoneId },
        { 
          $set: { 
            currentCount: newCount, 
            density, 
            status, 
            updatedAt: new Date() 
          } 
        }
      );
    }
  }
}

export async function logIncident(incident: Omit<Incident, 'incidentId' | 'createdAt' | 'status'>): Promise<Incident> {
  const newIncident: Incident = {
    ...incident,
    incidentId: crypto.randomUUID(),
    status: 'active',
    createdAt: new Date()
  };

  if (isUsingFallback || !mongoDb) {
    memoryDb.incidents.unshift(newIncident);
    
    // When an incident is logged, we dynamically adjust zone density (e.g. increase by 15% if it's HIGH, or block capacity)
    // This feeds back into crowd awareness!
    if (newIncident.priority === 'HIGH') {
      await updateZoneDensityDirectly(newIncident.zoneId, 20); // Incidents cause traffic delays
    } else if (newIncident.priority === 'MEDIUM') {
      await updateZoneDensityDirectly(newIncident.zoneId, 10);
    }

    return newIncident;
  }

  await mongoDb.collection('incidents').insertOne(newIncident);
  
  if (newIncident.priority === 'HIGH') {
    await updateZoneDensityDirectly(newIncident.zoneId, 20);
  } else if (newIncident.priority === 'MEDIUM') {
    await updateZoneDensityDirectly(newIncident.zoneId, 10);
  }
  
  return newIncident;
}

export async function getIncidents(): Promise<Incident[]> {
  if (isUsingFallback || !mongoDb) {
    return memoryDb.incidents;
  }
  const incidents = await mongoDb.collection('incidents').find({}).sort({ createdAt: -1 }).toArray();
  return incidents as unknown as Incident[];
}

export async function appendChatMessage(sessionId: string, role: 'user' | 'model', text: string): Promise<void> {
  if (isUsingFallback || !mongoDb) {
    let session = memoryDb.chatSessions.find(s => s.sessionId === sessionId);
    if (!session) {
      session = { sessionId, messages: [] };
      memoryDb.chatSessions.push(session);
    }
    session.messages.push({ role, text, timestamp: new Date() });
    return;
  }

  await mongoDb.collection('chatSessions').updateOne(
    { sessionId },
    { 
      $push: { 
        messages: { 
          role, 
          text, 
          timestamp: new Date() 
        } 
      } 
    } as any,
    { upsert: true }
  );
}

export async function getChatHistory(sessionId: string): Promise<{ role: 'user' | 'model'; text: string }[]> {
  if (isUsingFallback || !mongoDb) {
    const session = memoryDb.chatSessions.find(s => s.sessionId === sessionId);
    return session ? session.messages.map(m => ({ role: m.role, text: m.text })) : [];
  }

  const sessionDoc = await mongoDb.collection('chatSessions').findOne({ sessionId });
  if (sessionDoc && sessionDoc.messages) {
    return sessionDoc.messages.map((m: { role: string; text: string }) => ({ role: m.role, text: m.text }));
  }
  return [];
}

export async function getDbUserByEmail(email: string): Promise<User | null> {
  if (isUsingFallback || !mongoDb) {
    return memoryDb.users.find(u => u.email === email) || null;
  }
  const user = await mongoDb.collection('users').findOne({ email });
  return user as unknown as User | null;
}

export async function createDbUser(user: Omit<User, 'id'>): Promise<User> {
  const newUser = { ...user, id: `u-${Date.now()}` };
  if (isUsingFallback || !mongoDb) {
    memoryDb.users.push(newUser);
    return newUser;
  }
  await mongoDb.collection('users').insertOne(newUser);
  return newUser;
}

export async function getFacilities(): Promise<Facility[]> {
  // If we had a MongoDB collection, we'd query it here. For now, always return the simulated memory array.
  // Wait times can be jittered dynamically just like crowd zones if we added it to the simulator loop.
  return memoryDb.facilities;
}
