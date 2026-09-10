import React, { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
    const [step, setStep] = useState('venue'); // 'venue' -> 'destination' -> 'done'
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [selectedDestination, setSelectedDestination] = useState(null);

    const resetOnboarding = () => {
        setStep('venue');
        setSelectedVenue(null);
        setSelectedDestination(null);
    };

    return (
        <OnboardingContext.Provider value={{
            step, setStep,
            selectedVenue, setSelectedVenue,
            selectedDestination, setSelectedDestination,
            resetOnboarding
        }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export const useOnboarding = () => useContext(OnboardingContext);
