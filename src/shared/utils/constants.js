/**
 * @fileoverview System-wide constants for CivicMind AI.
 */

export * from './journey_config.js';
export * from './quiz_bank.js';
export * from './sim_scenarios.js';

export const TABS = {
  JOURNEY: 'journey',
  SIMULATE: 'simulate',
  MENTOR: 'mentor',
  QUIZ: 'quiz',
  SETTINGS: 'settings',
  TIMELINE: 'journey',
  WIZARD: 'simulate',
};

export const TAB_META = {
  [TABS.JOURNEY]: { title: 'Civic Journey', subtitle: 'Master the stages of democracy.' },
  [TABS.SIMULATE]: { title: 'Candidate Adventure', subtitle: 'Run your own campaign simulation.' },
  [TABS.MENTOR]: { title: 'Sage Mentor', subtitle: 'Ask your civic questions.' },
  [TABS.QUIZ]: { title: 'Training Hub', subtitle: 'Test your knowledge.' },
  [TABS.SETTINGS]: { title: 'Settings', subtitle: 'Manage your profile and data.' },
};

export const GA_EVENTS = {
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  QUIZ_COMPLETE: 'quiz_complete',
  LEVEL_UP: 'level_up',
  WIZARD_STEP_CHANGE: 'wizard_step_change',
  WIZARD_COMPLETE: 'wizard_complete',
};

export const CHAT_MAX_CHARS = 500;
export const CHAT_WARN_CHARS = 400;

export const XP_LEVELS = [
  { min: 0, title: 'New Voter', level: 1 },
  { min: 100, title: 'Aware Citizen', level: 2 },
  { min: 250, title: 'Active Voter', level: 3 },
  { min: 500, title: 'Civic Leader', level: 4 },
];

export const NAV_ITEMS = [
  { id: TABS.JOURNEY, icon: '🗺️', label: 'Journey' },
  { id: TABS.SIMULATE, icon: '🎭', label: 'Simulate' },
  { id: TABS.MENTOR, icon: '🤖', label: 'Mentor' },
  { id: TABS.QUIZ, icon: '🧠', label: 'Quiz' },
];

export const WIZARD_STEPS = [
  {
    id: 'id_check',
    title: 'ID Verification',
    icon: '🪪',
    bullets: [
      'Present your Voter ID (EPIC) to the first polling officer.',
      'Officer checks your name in the electoral roll.',
      'Officer checks your ID proof.'
    ]
  },
  {
    id: 'ink',
    title: 'Inking & Slip',
    icon: '👆',
    bullets: [
      'Second officer marks your finger with indelible ink.',
      'You sign the register (Form 17A).',
      'You are given a signed voter slip.'
    ]
  },
  {
    id: 'booth',
    title: 'The Voting Booth',
    icon: '🗳️',
    bullets: [
      'Deposit the slip with the third officer.',
      'Go into the private voting compartment.',
      'Press the blue button next to your candidate on the EVM.'
    ]
  },
  {
    id: 'vvpat',
    title: 'Verify (VVPAT)',
    icon: '🧾',
    bullets: [
      'Look at the VVPAT glass box for 7 seconds.',
      'Verify that the printed slip shows your candidate.',
      'Leave the booth peacefully.'
    ]
  }
];
