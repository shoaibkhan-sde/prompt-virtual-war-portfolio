/**
 * @fileoverview Real-world data, statistics, and landmark cases for Indian elections.
 */

export const REAL_WORLD_DATA = {
  announcement: {
    stats: [
      { label: 'Voters in 2024 General Election', value: '96.8 Crore', icon: '🗳️' },
      { label: 'Polling Stations Set Up', value: '10.5 Lakh', icon: '🏫' },
      { label: 'Phases in 2024 Election', value: '7 Phases', icon: '📅' },
      { label: 'Days of MCC Enforcement', value: '77 Days', icon: '📜' },
    ],
    cases: [
      {
        title: 'ECI Announces 2024 General Elections',
        date: 'March 16, 2024',
        body: 'Chief Election Commissioner Rajiv Kumar announced a 7-phase schedule from April 19 to June 1. The Model Code of Conduct came into effect immediately, restricting government announcements and transfers.',
        verdict: 'ECI notified 543 Lok Sabha constituencies',
        icon: '📢',
      },
      {
        title: 'Historic Voter Registration Drive',
        date: '2024',
        body: 'The ECI ran "Meri Pehli Vote" campaigns targeting first-time voters aged 18–19. Over 1.8 crore new voters were added to the electoral roll ahead of the 2024 elections.',
        verdict: '1.8 Crore new first-time voters registered',
        icon: '📊',
      },
    ],
    link: { label: 'Read the ECI Press Release', url: 'https://www.eci.gov.in' },
  },
  registration: {
    stats: [
      { label: 'Total Registered Voters (2024)', value: '96.8 Crore', icon: '👥' },
      { label: 'Women Voters', value: '47.1 Crore', icon: '👩' },
      { label: 'First-Time Voters (18–19 yrs)', value: '1.8 Crore', icon: '🌟' },
      { label: 'NRI Registered Voters', value: '1.12 Lakh', icon: '✈️' },
    ],
    cases: [
      {
        title: 'Voter ID Becomes Proof of Address',
        date: '2023',
        body: 'The EPIC (Electoral Photo ID Card) was officially recognised as proof of address under multiple central government schemes, including Direct Benefit Transfers — boosting registration incentives.',
        verdict: 'EPIC used in over 12 government schemes',
        icon: '🪪',
      },
      {
        title: 'Duplicate Voter ID Scandal in Bihar',
        date: '2019',
        body: 'ECI investigations uncovered ~4 lakh duplicate voter entries in certain districts of Bihar. Affected entries were deleted under Section 22 of the Representation of the People Act, 1950.',
        verdict: '4 Lakh duplicate entries removed',
        icon: '⚠️',
      },
    ],
    link: { label: 'Register / Check Voter ID on NVSP', url: 'https://voters.eci.gov.in' },
  },
  nomination: {
    stats: [
      { label: 'Nominations Filed (2024 LS)', value: '8,360', icon: '📁' },
      { label: 'Nominations Rejected', value: '1,290', icon: '❌' },
      { label: 'Candidates After Withdrawal', value: '8,360', icon: '✅' },
      { label: 'Candidates with Criminal Cases', value: '46%', icon: '⚠️' },
    ],
    cases: [
      {
        title: 'ADR vs Union of India — Mandatory Disclosure',
        date: 'Supreme Court, 2002',
        body: 'The Supreme Court directed that candidates must disclose their criminal antecedents, assets, and educational qualifications in their nomination affidavit. This landmark ruling created the current Form 26 system.',
        verdict: 'Full disclosure mandatory for all candidates',
        icon: '⚖️',
      },
      {
        title: 'Nomination Rejected for Incomplete Affidavit',
        date: '2023 State Elections',
        body: 'Dozens of candidates in Rajasthan and MP assembly elections had their nominations rejected for leaving blank columns in Form 26, particularly sections related to pending criminal cases.',
        verdict: 'Returning Officers reject incomplete affidavits',
        icon: '📋',
      },
    ],
    link: { label: 'View Candidate Affidavits on MyNeta', url: 'https://myneta.info' },
  },
  campaign: {
    stats: [
      { label: 'Campaign Expenditure Limit (LS)', value: '₹95 Lakh', icon: '💸' },
      { label: 'MCC Violations Registered (2024)', value: '3,400+', icon: '🚨' },
      { label: 'Cash Seized (2024 Elections)', value: '₹4,600 Crore', icon: '💰' },
      { label: 'Paid News Cases Flagged', value: '2,800+', icon: '📰' },
    ],
    cases: [
      {
        title: 'WhatsApp Fake News Crackdown (2019)',
        date: '2019 General Elections',
        body: 'ECI partnered with WhatsApp to limit message forwarding to 5 chats. Over 3,000 pieces of misinformation were flagged through the "cVIGIL" citizen grievance app, with 90% resolved within 100 minutes.',
        verdict: 'cVIGIL App resolved 95% complaints in <100 mins',
        icon: '📱',
      },
      {
        title: '₹4,600 Crore Seized in 2024',
        date: 'April–June 2024',
        body: 'ECI enforcement teams seized record ₹4,600 crore in cash, drugs, liquor, and freebies during the 2024 general elections — over 3x the 2019 seizures — using Flying Squads and SSTs.',
        verdict: 'Record seizures — 3x more than 2019',
        icon: '🚔',
      },
    ],
    link: { label: 'File a Campaign Complaint via cVIGIL', url: 'https://cvigil.eci.gov.in' },
  },
  voting: {
    stats: [
      { label: 'Voter Turnout (2024 LS)', value: '65.79%', icon: '📊' },
      { label: 'Women Turnout (2024)', value: '65.78%', icon: '👩' },
      { label: 'EVMs Deployed', value: '55 Lakh+', icon: '🖥️' },
      { label: 'Booths with Webcasting', value: '1.5 Lakh+', icon: '📷' },
    ],
    cases: [
      {
        title: 'World\'s Longest Polling Route — Arunachal',
        date: '2024',
        body: 'ECI officials trekked 2 days through dense forest to reach a single-voter polling station in Malogam, Arunachal Pradesh — demonstrating that every vote counts in Indian democracy.',
        verdict: '1-voter booth in Malogam served faithfully',
        icon: '🏔️',
      },
      {
        title: 'EVM Tampering Allegations Dismissed',
        date: '2019 — Supreme Court',
        body: 'The Supreme Court upheld the integrity of EVMs while ordering VVPAT slip verification in at least 5 randomly selected polling stations per constituency to provide an independent audit trail.',
        verdict: 'Supreme Court: No credible evidence of EVM tampering',
        icon: '⚖️',
      },
    ],
    link: { label: 'Track Voter Turnout Live on ECI', url: 'https://results.eci.gov.in' },
  },
  counting: {
    stats: [
      { label: 'Counting Centres (2024)', value: '1,100+', icon: '🏛️' },
      { label: 'Observer Officials Deployed', value: '2,200+', icon: '👁️' },
      { label: 'VVPAT Slips Cross-Verified', value: '5 / Constituency', icon: '🧾' },
      { label: 'Time to Declare All Results', value: '~12 Hours', icon: '⏱️' },
    ],
    cases: [
      {
        title: 'Postal Ballot Decides Close Contest',
        date: '2019 — Rajasthan By-Election',
        body: 'In the Ramgarh constituency by-election, postal ballots proved decisive in a result decided by fewer than 2,000 votes. The ECI counted all postal ballots first, followed by EVM results, preventing delays.',
        verdict: 'Postal ballots counted first — critical process',
        icon: '✉️',
      },
      {
        title: 'Strong Room Security Protocols',
        date: 'Standard Practice',
        body: 'EVMs are stored in triple-layer security after polling: CRPF guards outside, videography inside, and agent seals on the room. No EVM has ever been reported missing from a strong room in Indian election history.',
        verdict: '100% EVM accountability maintained since 1998',
        icon: '🔐',
      },
    ],
    link: { label: 'Watch Live Counting on ECI Results', url: 'https://results.eci.gov.in' },
  },
  results: {
    stats: [
      { label: 'Seats for Lok Sabha Majority', value: '272 of 543', icon: '🏆' },
      { label: 'NDA Seats Won (2024)', value: '293', icon: '📊' },
      { label: 'I.N.D.I.A. Alliance Seats (2024)', value: '234', icon: '📊' },
      { label: 'Women MPs Elected (2024)', value: '74', icon: '👩' },
    ],
    cases: [
      {
        title: '10th Schedule — Anti-Defection Law',
        date: 'In Force Since 1985',
        body: 'The Anti-Defection Law (10th Schedule) disqualifies any MP who voluntarily gives up party membership or votes against party whip. The Speaker of the Lok Sabha is the deciding authority — a power upheld by the Supreme Court in Kihoto Hollohan vs Zachillhu (1992).',
        verdict: 'MPs disqualified if they switch parties post-election',
        icon: '⚖️',
      },
      {
        title: 'Historic 2024 Mandate — Coalition Government',
        date: 'June 4, 2024',
        body: 'The BJP won 240 seats in 2024 — short of the 272-majority mark — forming a coalition NDA government with allies JD(U) and TDP. This marked the first time since 2014 that a coalition was necessary, reshaping the political balance.',
        verdict: 'Coalition government formed with 293 NDA seats',
        icon: '🤝',
      },
    ],
    link: { label: 'See Full 2024 Results on ECI', url: 'https://results.eci.gov.in' },
  },
};
