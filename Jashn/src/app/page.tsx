'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePlannerStore } from '@/store/plannerStore';
import { Navbar } from '@/components/layout/navbar';
import { Hero } from '@/features/landing/hero';
import { AboutMetricsSection } from '@/features/landing/components/AboutMetricsSection';
import { HowItWorksSection } from '@/features/landing/components/HowItWorksSection';
import { FeaturesGridSection } from '@/features/landing/components/FeaturesGridSection';
import { FaqSection } from '@/features/landing/components/FaqSection';
import { CallToActionBanner } from '@/features/landing/components/CallToActionBanner';
import { Footer } from '@/components/Footer';
import { EditPlanModal } from '@/components/EditPlanModal';
import { ScenarioDiffModal } from '@/components/ScenarioDiffModal';

export default function HomePage() {
  const router = useRouter();
  const { plan, loadTemplate } = usePlannerStore();

  const handleStartPlan = () => {
    router.push('/plan');
  };

  const handleSamplePlan = () => {
    router.push('/sample-plan');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FA] dark:bg-[#14161C] text-[#14161C] dark:text-white transition-colors">
      <Navbar />

      <Hero
        onStartPlan={handleStartPlan}
        onSamplePlan={handleSamplePlan}
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* About & Core Architecture Metrics */}
        <AboutMetricsSection />

        {/* 4-Step Guided Execution Flow */}
        <HowItWorksSection />

        {/* 8 Engineered Capabilities Grid */}
        <FeaturesGridSection />


        {/* Accessible Frequently Asked Questions Accordion */}
        <FaqSection />

        {/* Bottom Statement: Bold & Center */}
        <CallToActionBanner />
      </main>

      <Footer />

      {/* Accessible Modals */}
      <EditPlanModal />
      <ScenarioDiffModal />
    </div>
  );
}
