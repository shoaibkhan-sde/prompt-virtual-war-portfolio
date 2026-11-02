import { EventDefinition, EventTypeId } from './types';
import { weddingDefinition } from './data/wedding';
import { birthdayDefinition } from './data/birthday';
import { collegeFestDefinition } from './data/college-fest';
import { hackathonDefinition } from './data/hackathon';
import { techMeetupDefinition } from './data/tech-meetup';
import { communityEventDefinition } from './data/community-event';

const DEFINITIONS_MAP: Record<EventTypeId, EventDefinition> = {
  wedding: weddingDefinition,
  birthday: birthdayDefinition,
  college_fest: collegeFestDefinition,
  hackathon: hackathonDefinition,
  tech_meetup: techMeetupDefinition,
  community_event: communityEventDefinition,
};

export function getEventDefinition(typeId: string): EventDefinition | undefined {
  if (typeId in DEFINITIONS_MAP) {
    return DEFINITIONS_MAP[typeId as EventTypeId];
  }
  return undefined;
}

export function getAllEventDefinitions(): EventDefinition[] {
  return Object.values(DEFINITIONS_MAP);
}

export function isValidEventType(typeId: string): typeId is EventTypeId {
  return typeId in DEFINITIONS_MAP;
}
