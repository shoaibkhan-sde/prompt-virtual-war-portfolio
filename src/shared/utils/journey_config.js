/**
 * @fileoverview Journey stages and immersive details.
 * Split from constants.js to optimize bundle size.
 */

export const JOURNEY_STAGES = [
  { id: 'announcement', title: 'Announcement', icon: '📢', order: 1 },
  { id: 'registration', title: 'Registration', icon: '📋', order: 2 },
  { id: 'nomination', title: 'Nomination', icon: '🏛️', order: 3 },
  { id: 'campaign', title: 'Campaign', icon: '📣', order: 4 },
  { id: 'voting', title: 'Voting Day', icon: '🗳️', order: 5 },
  { id: 'counting', title: 'Counting', icon: '🔢', order: 6 },
  { id: 'results', title: 'Results', icon: '🏆', order: 7 },
];

export const STAGE_DETAILS = {
  announcement: {
    story: [
      { id: 'press', icon: '🎤', label: 'Press Note', detail: 'The ECI calls a press conference to announce the schedule.' },
      { id: 'mcc', icon: '📜', label: 'MCC Active', detail: 'The Model Code of Conduct starts immediately after announcement.' },
    ],
    facts: ['📜 Code of Conduct starts Day 1', '🗳️ Over 960 Million voters', '📱 Use C-VIGIL app to report violations'],
    mistakes: [
      { title: 'New Announcements', consequence: 'MCC Violation', fix: 'Wait until after election results.' },
      { title: 'Transferring Officials', consequence: 'Action by ECI', fix: 'Take prior approval from the Election Commission.' },
      { title: 'Using Govt Vehicles', consequence: 'Misuse of Power', fix: 'Use private vehicles for any political work.' }
    ],
  },
  registration: {
    story: [
      { id: 'form6', icon: '📝', label: 'Form 6', detail: 'Citizens fill out Form 6 to register as new voters.' },
      { id: 'epic', icon: '🪪', label: 'EPIC Issued', detail: 'The ECI issues the Electoral Photo Identity Card (Voter ID).' },
    ],
    facts: ['🪪 Must be 18 years old', '📝 Form 6 for new voters', '📱 Check name in Voter Helpline App'],
    mistakes: [
      { title: 'Missing Deadline', consequence: 'Cannot Vote', fix: 'Register before the cutoff date.' },
      { title: 'Multiple Registrations', consequence: 'Offense under RPA', fix: 'Delete duplicate entries immediately.' },
      { title: 'False Information', consequence: 'Jail / Fine', fix: 'Provide accurate date of birth and address.' }
    ],
  },
  nomination: {
    story: [
      { id: 'file', icon: '📁', label: 'File Papers', detail: 'Candidates file their nomination papers with the Returning Officer.' },
      { id: 'scrutiny', icon: '🔎', label: 'Scrutiny', detail: 'The RO verifies the affidavits and documents.' },
    ],
    facts: ['🏛️ Must be 25+ years old for Lok Sabha', '💰 ₹25,000 security deposit'],
    mistakes: [
      { title: 'Incomplete Affidavit', consequence: 'Nomination Rejected', fix: 'Disclose all columns, leave nothing blank.' },
      { title: 'Hiding Criminal Cases', consequence: 'Disqualification', fix: 'Declare all pending cases and publish in newspapers.' },
      { title: 'Fake Proposers', consequence: 'Rejection & Fraud', fix: 'Ensure proposers are genuine voters of that constituency.' }
    ],
  },
  campaign: {
    story: [
      { id: 'rally', icon: '📣', label: 'Public Rallies', detail: 'Candidates address the public and share their manifesto.' },
      { id: 'silence', icon: '🤫', label: 'Campaign Silence', detail: 'All campaigning stops 48 hours before polling.' },
    ],
    facts: ['🛑 Ends 48 hours before voting', '💸 ₹95 Lakh expenditure limit'],
    mistakes: [
      { title: 'Hate Speech', consequence: 'MCC Violation & Ban', fix: 'Focus on development, avoid religious or personal attacks.' },
      { title: 'Bribing Voters', consequence: 'Corrupt Practice', fix: 'Never distribute cash, liquor, or freebies.' },
      { title: 'Campaigning in Silence Period', consequence: 'Arrest / Fine', fix: 'Stop all public meetings 48 hours before voting day.' }
    ],
  },
  voting: {
    story: [
      { id: 'booth', icon: '🏫', label: 'Polling Booth', detail: 'Voters arrive at designated polling stations.' },
      { id: 'evm', icon: '👆', label: 'Cast Vote', detail: 'Voters press the button on the EVM to cast their vote.' },
    ],
    facts: ['👆 EVMs used nationwide', '🧾 VVPAT provides paper trail'],
    mistakes: [
      { title: 'Taking Photos Inside', consequence: 'Arrest / Fine', fix: 'Leave your phone outside the polling booth.' },
      { title: 'Wearing Party Symbols', consequence: 'Prohibited', fix: 'Do not wear party caps or badges within 100 meters.' },
      { title: 'Proxy Voting', consequence: 'Impersonation Crime', fix: 'Only vote for yourself, never pretend to be someone else.' }
    ],
  },
  counting: {
    story: [
      { id: 'strongroom', icon: '🔐', label: 'Strong Room', detail: 'EVMs are brought from heavily guarded strong rooms.' },
      { id: 'tally', icon: '🔢', label: 'Tally Votes', detail: 'Votes are counted under the supervision of the Returning Officer.' },
    ],
    facts: ['✉️ Postal ballots counted first', '🔍 VVPAT slips cross-verified'],
    mistakes: [
      { title: 'Premature Celebration', consequence: 'Chaos / Clashes', fix: 'Wait for the official declaration by the ECI.' },
      { title: 'Breaching Strong Room', consequence: 'Security Threat', fix: 'Only authorized agents can enter the counting center.' },
      { title: 'Disrupting Counting', consequence: 'FIR / Arrest', fix: 'Maintain peace and respect the mandate.' }
    ],
  },
  results: {
    story: [
      { id: 'declare', icon: '📜', label: 'Declaration', detail: 'The RO hands over the winning certificate.' },
      { id: 'form_gov', icon: '🤝', label: 'Form Govt', detail: 'The majority party is invited to form the government.' },
    ],
    facts: ['🏆 272 seats needed for majority', '🤝 Coalitions form if hung parliament'],
    mistakes: [
      { title: 'Defection', consequence: 'Disqualification', fix: 'Adhere to the anti-defection law (10th Schedule).' },
      { title: 'Damaging Public Property', consequence: 'Arrest / Recovery', fix: 'Celebrate responsibly without vandalism.' },
      { title: 'Violence Against Opponents', consequence: 'Criminal Charges', fix: 'Respect the opposition and democratic process.' }
    ],
  },
};
