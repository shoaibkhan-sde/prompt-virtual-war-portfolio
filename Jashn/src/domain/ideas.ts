/**
 * Pure domain logic for curated celebration ideas and personalization.
 * Zero external dependencies.
 */

import { EventType, IdeaItem } from './types';

export const CURATED_IDEAS: IdeaItem[] = [
  {
    id: 'idea-w-1',
    eventType: 'wedding',
    category: 'decor',
    title: 'Marigold & Brass Lamp Cascades',
    description: 'Traditional Genda phool strings draped with floating brass urlis and scented diyas.',
    estimatedCostRange: 'budget',
    culturalContext: 'Traditional Indian / Maharashtrian & Vedic',
    tags: ['floral', 'traditional', 'eco-friendly'],
  },
  {
    id: 'idea-w-2',
    eventType: 'wedding',
    category: 'food',
    title: 'Interactive Live Chaat & Mithai Bar',
    description: 'Chefs preparing freshly made pani puri, sev puri, and hot jalebis with rabri.',
    estimatedCostRange: 'moderate',
    culturalContext: 'Street Food Fusion',
    tags: ['live-counter', 'interactive', 'popular'],
  },
  {
    id: 'idea-w-3',
    eventType: 'wedding',
    category: 'entertainment',
    title: 'Unplugged Sitar & Tabla Lounge',
    description: 'Acoustic Indian classical instrumental melodies for high-tea and cocktail reception.',
    estimatedCostRange: 'moderate',
    culturalContext: 'Classical Elegance',
    tags: ['music', 'sophisticated'],
  },
  {
    id: 'idea-b-1',
    eventType: 'birthday',
    category: 'entertainment',
    title: 'DIY Cupcake Decorating Station',
    description: 'Kids and guests decorate their own miniature cakes with edible glitter and organic fruit pearls.',
    estimatedCostRange: 'budget',
    tags: ['hands-on', 'kids-favorite'],
  },
  {
    id: 'idea-b-2',
    eventType: 'birthday',
    category: 'decor',
    title: 'Biodegradable Balloon & Fabric Canopy',
    description: 'Earth-friendly pastel balloons with fabric drapery backdrop for instant photo booths.',
    estimatedCostRange: 'budget',
    tags: ['sustainable', 'photo-worthy'],
  },
  {
    id: 'idea-c-1',
    eventType: 'community',
    category: 'ritual',
    title: 'Zero-Waste Eco Celebration',
    description: 'Eco-friendly sustainable decor with community tree planting and seed initiatives.',
    estimatedCostRange: 'budget',
    culturalContext: 'Community Green Initiative',
    tags: ['green', 'community', 'sustainable'],
  },
  {
    id: 'idea-f-1',
    eventType: 'festival',
    category: 'decor',
    title: 'Community Rangoli & Fairy Light Tunnel',
    description: 'Collaborative flower-petal rangoli walkway lined with warm fairy string lights.',
    estimatedCostRange: 'budget',
    culturalContext: 'Diwali & Navratri Celebration',
    tags: ['collaborative', 'festive'],
  },
];

export function getIdeasForEvent(
  eventType: EventType,
  categoryFilter?: string,
  costFilter?: string
): IdeaItem[] {
  return CURATED_IDEAS.filter((idea) => {
    if (idea.eventType !== eventType) return false;
    if (categoryFilter && categoryFilter !== 'all' && idea.category !== categoryFilter) {
      return false;
    }
    if (costFilter && costFilter !== 'all' && idea.estimatedCostRange !== costFilter) {
      return false;
    }
    return true;
  });
}

export function toggleSavedIdea(savedIds: string[], ideaId: string): string[] {
  if (savedIds.includes(ideaId)) {
    return savedIds.filter((id) => id !== ideaId);
  }
  return [...savedIds, ideaId];
}
