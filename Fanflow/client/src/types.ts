export interface Facility {
  facilityId: string;
  name: string;
  type: 'restroom' | 'concession' | 'merchandise';
  zoneId: string;
  waitTimeMinutes: number;
  status: 'LOW' | 'MEDIUM' | 'HIGH';
}

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
  density: number; // 0 to 100
  status: 'LOW' | 'MEDIUM' | 'HIGH';
  updatedAt: string;
}

export interface Incident {
  incidentId: string;
  description: string;
  reportedBy: 'volunteer' | 'staff' | 'system';
  zoneId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'security' | 'medical' | 'maintenance' | 'transit' | 'crowd' | 'other';
  summary: string;
  status: 'active' | 'resolved';
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp?: string;
}

export interface ChatAIResponse {
  text: string;
  highlights: string[];
  detectedLanguage: string;
}
