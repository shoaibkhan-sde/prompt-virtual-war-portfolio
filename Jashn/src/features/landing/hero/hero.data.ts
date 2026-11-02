export const SAMPLE_EVENTS = [
  { id: 'wedding', label: 'Wedding', guests: 220, budget: 1800000, planned: 22 },
  { id: 'birthday', label: 'Birthday', guests: 40, budget: 40000, planned: 72 },
  { id: 'hackathon', label: 'Hackathon', guests: 60, budget: 60000, planned: 40 },
] as const;

export const HEADLINE_WORDS = ['wedding', 'birthday', 'festival', 'reunion'] as const;

export const TICKER_ITEMS = [
  'Weddings',
  'Birthdays',
  'Eid celebrations',
  'Baby showers',
  'Anniversaries',
  'Society festivals',
  'Community festivals',
  'Reunions',
  'Diwali meets',
] as const;

export const EVENT_CHIPS = ['Wedding', 'Birthday', 'Community', 'Festival'] as const;

export const FLOATING_DOTS = [
  { left: '5%', size: 16, duration: '11s', delay: '-3s' },
  { left: '17%', size: 28, duration: '15s', delay: '-9s' },
  { left: '31%', size: 12, duration: '10s', delay: '-1s' },
  { left: '46%', size: 22, duration: '13s', delay: '-6s' },
  { left: '58%', size: 14, duration: '12s', delay: '-8s' },
  { left: '71%', size: 30, duration: '16s', delay: '-2s' },
  { left: '84%', size: 18, duration: '11s', delay: '-5s' },
  { left: '94%', size: 12, duration: '14s', delay: '-10s' },
] as const;
