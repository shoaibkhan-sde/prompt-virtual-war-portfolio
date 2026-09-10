import React, { createContext, useContext, useState, useEffect } from 'react';

type MatchStatus = "live" | "final";

export const TEAM_CONFIG = {
  home: { code: 'ESP', fullName: 'Spain', flagUrl: 'https://flagcdn.com/w80/es.png', color: '#F2B705' },
  away: { code: 'ARG', fullName: 'Argentina', flagUrl: 'https://flagcdn.com/w80/ar.png', color: '#4A7FE8' }
};

interface CelebrationData {
  side: "home" | "away";
  playerName: string;
  playerNumber: number;
  photoUrl: string;
}

interface MatchContextType {
  homeScore: number;
  awayScore: number;
  matchStatus: MatchStatus;
  activeGoalCelebration: CelebrationData | null;
  activeWinnerCelebration: { side: "home" | "away" } | null;
  clearCelebrations: () => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [homeScore] = useState(0);
  const [awayScore] = useState(0);
  const [matchStatus] = useState<MatchStatus>("live");
  
  const [activeGoalCelebration, setActiveGoalCelebration] = useState<CelebrationData | null>(null);
  const [activeWinnerCelebration, setActiveWinnerCelebration] = useState<{ side: "home" | "away" } | null>(null);



  // Goal celebration auto-dismiss
  useEffect(() => {
    if (activeGoalCelebration) {
      const t = setTimeout(() => setActiveGoalCelebration(null), 5000);
      return () => clearTimeout(t);
    }
  }, [activeGoalCelebration]);

  // Winner celebration auto-dismiss
  useEffect(() => {
    if (activeWinnerCelebration) {
      const t = setTimeout(() => setActiveWinnerCelebration(null), 6000);
      return () => clearTimeout(t);
    }
  }, [activeWinnerCelebration]);
  
  const clearCelebrations = () => {
    setActiveGoalCelebration(null);
    setActiveWinnerCelebration(null);
  };

  return (
    <MatchContext.Provider value={{
      homeScore,
      awayScore,
      matchStatus,
      activeGoalCelebration,
      activeWinnerCelebration,
      clearCelebrations
    }}>
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
};
