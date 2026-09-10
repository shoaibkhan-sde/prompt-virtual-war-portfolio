import React from 'react';
import MyMatchView from '../components/MyMatchView';
import CrowdSnapshot from '../components/CrowdSnapshot';
import MatchStrip from '../components/MatchStrip';
import { useOnboarding } from '../context/OnboardingContext';

export default function OverviewPage() {
    const { selectedDestination } = useOnboarding();

    return (
        <div className="flex flex-col gap-5 pb-12 md:px-0 mt-8">
            {/* Top Match/Ticket Info Layer */}
            <div className="shrink-0">
                <MyMatchView userSection={selectedDestination?.id || selectedDestination} />
            </div>

            <MatchStrip />

            <div className="h-5" /> {/* FORCED VERTICAL SPACER */}

            {/* Live Crowd Analysis Layer */}
            <div className="shrink-0 px-4 md:px-0">
                <CrowdSnapshot />
            </div>
        </div>
    );
}