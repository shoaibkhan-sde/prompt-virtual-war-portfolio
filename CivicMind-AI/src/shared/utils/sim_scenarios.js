/**
 * SIM_SCENARIOS — Narrative bank for the Candidate Simulator.
 * Each scenario offers 4 choices with varying impacts on stats and XP.
 */

export const SIM_SCENARIOS = {
  active: [
    {
      id: 's1',
      scene: 'The Launchpad',
      description: 'Your campaign officially begins today in your home district. The crowd is waiting.',
      prompt: 'What is the core message of your opening speech?',
      choices: [
        { id: 'a', text: 'Focus on development and infrastructure.', cost: 5000, stats: { reach: 15, trust: 10 }, xp: 20 },
        { id: 'b', text: 'Attack your opponent\'s past failures.', cost: 2000, stats: { reach: 25, trust: -15, integrity: -10 }, xp: -30 },
        { id: 'c', text: 'Present a detailed 10-year civic vision.', cost: 10000, stats: { trust: 30, integrity: 20 }, xp: 50 },
        { id: 'd', text: 'Promise freebies to every household.', cost: 0, stats: { reach: 40, trust: -20, integrity: -30 }, xp: -60 }
      ]
    },
    {
      id: 's2',
      scene: 'The Dark Offering',
      description: 'A local industrialist offers to fund your entire digital campaign if you promise to overlook environmental violations later.',
      prompt: 'Will you take the deal?',
      choices: [
        { id: 'a', text: 'Take the money. Victory requires resources.', cost: -200000, stats: { reach: 50, integrity: -60, trust: -30 }, xp: -60 },
        { id: 'b', text: 'Refuse and report the bribe to the media.', cost: 0, stats: { integrity: 60, trust: 40, reach: -10 }, xp: 80 },
        { id: 'c', text: 'Politely decline and ask for a legal donation.', cost: 0, stats: { integrity: 20, trust: 10 }, xp: 30 },
        { id: 'd', text: 'Accept half but make no promises.', cost: -100000, stats: { reach: 25, integrity: -30, trust: -15 }, xp: -40 }
      ]
    },
    {
      id: 's3',
      scene: 'Water Crisis',
      description: 'A major pipe burst has left three neighborhoods without water. The government is slow to react.',
      prompt: 'How do you spend your day?',
      choices: [
        { id: 'a', text: 'Organize private water tankers immediately.', cost: 50000, stats: { trust: 50, reach: 20 }, xp: 60 },
        { id: 'b', text: 'Protest at the water department office.', cost: 5000, stats: { reach: 40, trust: 10 }, xp: 20 },
        { id: 'c', text: 'Blame the current MLA on social media.', cost: 0, stats: { reach: 30, trust: -10 }, xp: -30 },
        { id: 'd', text: 'Stay home and plan for the next rally.', cost: 0, stats: { trust: -20, integrity: -10 }, xp: -40 }
      ]
    },
    {
      id: 's4',
      scene: 'The Media Trap',
      description: 'A journalist asks you a trick question about a sensitive communal issue.',
      prompt: 'Your response?',
      choices: [
        { id: 'a', text: 'Give a balanced, constitutional answer.', cost: 0, stats: { integrity: 30, trust: 20 }, xp: 40 },
        { id: 'b', text: 'Use a polarising statement to gain viral reach.', cost: 0, stats: { reach: 60, trust: -40, integrity: -50 }, xp: -60 },
        { id: 'c', text: 'No comment. Safety first.', cost: 0, stats: { trust: -10, reach: -10 }, xp: 0 },
        { id: 'd', text: 'Divert by talking about unemployment.', cost: 0, stats: { trust: 15, integrity: 10 }, xp: 20 }
      ]
    },
    {
      id: 's5',
      scene: 'Volunteer Revolt',
      description: 'Your core volunteers are tired and feel ignored by the leadership team.',
      prompt: 'How will you motivate them?',
      choices: [
        { id: 'a', text: 'Host a dinner and listen to their concerns.', cost: 15000, stats: { trust: 40, integrity: 10 }, xp: 30 },
        { id: 'b', text: 'Offer them small cash "incentives" to work harder.', cost: 40000, stats: { reach: 20, integrity: -40, trust: -20 }, xp: -60 },
        { id: 'c', text: 'Give a firey motivational speech about duty.', cost: 0, stats: { reach: 10, trust: 10 }, xp: 15 },
        { id: 'd', text: 'Replace the complainers with paid staff.', cost: 80000, stats: { reach: 30, trust: -50, integrity: -30 }, xp: -50 }
      ]
    }
  ],
  results: []
};
