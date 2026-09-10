import React from 'react';
import { motion } from 'framer-motion';

const TEAMS = {
  KKR: { short: 'KKR', name: 'Kolkata Knight Riders', color: '#4B2C69', text: '#ffffff' },
  GT: { short: 'GT', name: 'Gujarat Titans', color: '#1B2133', text: '#ffffff' },
  RCB: { short: 'RCB', name: 'Royal Challengers Bengaluru', color: '#d11a2a', text: '#ffffff' },
  DC: { short: 'DC', name: 'Delhi Capitals', color: '#005ca8', text: '#ffffff' },
  CSK: { short: 'CSK', name: 'Chennai Super Kings', color: '#fdb913', text: '#000000' },
  MI: { short: 'MI', name: 'Mumbai Indians', color: '#004ba0', text: '#ffffff' },
  RR: { short: 'RR', name: 'Rajasthan Royals', color: '#ea1a85', text: '#ffffff' },
  PK: { short: 'PK', name: 'Punjab Kings', color: '#ed1d24', text: '#ffffff' },
  LSG: { short: 'LSG', name: 'Lucknow Super Giants', color: '#0057E2', text: '#ffffff' },
  SRH: { short: 'SRH', name: 'Sunrisers Hyderabad', color: '#FF822E', text: '#ffffff' },
};

const ALL_MATCHES = [
  { date: '2026-04-17', team1: TEAMS.KKR, team2: TEAMS.GT, winner: 'GT', statusText: 'GT won by 5 wickets', stage: 'League Stage' },
  { date: '2026-04-18', team1: TEAMS.RCB, team2: TEAMS.DC, winner: 'DC', statusText: 'DC won by 20 runs', stage: 'League Stage' },
  { date: '2026-04-19', team1: TEAMS.KKR, team2: TEAMS.RR, stage: 'League Stage' },
  { date: '2026-04-20', team1: TEAMS.MI, team2: TEAMS.GT, stage: 'League Stage' },
  { date: '2026-04-21', team1: TEAMS.PK, team2: TEAMS.CSK, stage: 'League Stage' },
  { date: '2026-04-22', team1: TEAMS.SRH, team2: TEAMS.LSG, stage: 'League Stage' },
];

const TeamBadge = ({ team, isDimmed, isWinner }) => (
  <div className={`flex items-center gap-3 transition-all duration-500 
    ${isDimmed ? 'opacity-25 grayscale' : 'opacity-100'}`}>
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shrink-0 border
        ${isWinner ? 'scale-110 shadow-accent-blue/20 rotate-3' : ''}`}
      style={{ 
        backgroundColor: team.color, 
        color: team.text, 
        borderColor: isWinner ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)' 
      }}
    >
      {team.short}
    </div>
    <span className={`text-[13px] font-bold truncate tracking-tight
      ${isWinner ? 'text-theme-primary font-black scale-[1.02]' : 'text-theme-secondary opacity-80'}`}>
      {team.name}
      {isWinner && <span className="ml-2 text-[10px] text-accent-cyan opacity-80 uppercase tracking-widest">★</span>}
    </span>
  </div>
);

const MatchCard = ({ match, labelOverride }) => {
  const isToday = labelOverride === 'TODAY';
  const isResult = labelOverride === 'RESULT';
  const isLossT1 = isResult && match.winner && match.winner !== match.team1.short;
  const isLossT2 = isResult && match.winner && match.winner !== match.team2.short;
  const isWinT1 = isResult && match.winner === match.team1.short;
  const isWinT2 = isResult && match.winner === match.team2.short;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative flex-1 min-w-[280px] h-[160px] px-7 py-6 rounded-lg bg-theme-card/40 border border-theme-main/50 backdrop-blur-xl flex flex-col justify-between overflow-hidden group shadow-xl"
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

      {/* Top Row: Status & Stage */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          {isToday && (
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          )}
          <span className={`text-[10px] font-black tracking-[0.15em] uppercase ${isToday ? 'text-red-500' : 'text-theme-secondary opacity-70'}`}>
            {labelOverride}
          </span>
        </div>
        <span className="text-[10px] font-bold text-theme-secondary opacity-40 uppercase tracking-widest">
          {match.stage}
        </span>
      </div>

      {/* Middle Row: Teams */}
      <div className="flex flex-col gap-3 relative z-10">
        <TeamBadge team={match.team1} isDimmed={isLossT1} isWinner={isWinT1} />
        <TeamBadge team={match.team2} isDimmed={isLossT2} isWinner={isWinT2} />
      </div>

      {/* Bottom Row: Spacer */}
      <div className="relative z-10 min-h-[16px]">
      </div>

      {/* Background Decorative Element */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-accent-blue/5 blur-3xl rounded-full group-hover:bg-accent-blue/10 transition-colors" />
    </motion.div>
  );
};

export default function MatchStrip() {
  const now = new Date(); // Using real-time system clock for 2026 data accuracy environment

  const getMatches = () => {
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    return [
      { data: ALL_MATCHES.find(m => m.date === yesterdayStr), label: 'RESULT' },
      { data: ALL_MATCHES.find(m => m.date === todayStr), label: 'TODAY' },
      { data: ALL_MATCHES.find(m => m.date === tomorrowStr), label: 'TOMORROW' }
    ].filter(m => m.data);
  };

  const currentMatches = getMatches();

  return (
    <div className="w-full px-4 md:px-0">
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-5">
        {currentMatches.map((m, idx) => (
          <MatchCard
            key={idx}
            match={m.data}
            labelOverride={m.label}
          />
        ))}
      </div>
    </div>
  );
}
