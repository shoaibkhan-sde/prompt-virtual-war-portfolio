/**
 * @module App
 * @description Root React application component for the Atmos Personal Carbon Ledger.
 *
 * Manages top-level rendering state including the initial loading screen, the
 * onboarding flow (initial + edit modes), and the main authenticated shell with
 * sidebar navigation and tab-based content routing.
 *
 * All carbon ledger state, offsetTarget management, and API synchronisation logic
 * is delegated to the {@link useAppState} hook. This component acts as a thin
 * composition shell with no business logic.
 */

import { Suspense } from "react";
import { useAppState } from "./hooks/useAppState";
import { Onboarding } from "./components/Onboarding";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CardSkeleton } from "./components/Skeleton";
import { Dashboard } from "./components/Dashboard";
import { ActivityLogger } from "./components/ActivityLogger";
import { AtmosCoach } from "./components/AtmosCoach";
import { Goals } from "./components/Goals";
import { ActionsList } from "./components/ActionsList";
import { Reports } from "./components/Reports";
import { Sidebar } from "./components/Sidebar";
import { ResetConfirmModal } from "./components/ResetConfirmModal";

import { Leaf, Menu, X } from "lucide-react";

/**
 * Root application component for the Atmos Personal Carbon Ledger & Action Platform.
 *
 * Manages top-level rendering across three states:
 * - **Loading**: Shows a spinner while the carbon ledger syncs from the server.
 * - **Onboarding**: Renders the profile setup wizard for new or profile-editing users.
 * - **Main Shell**: Renders the sidebar navigation and tab-routed content panels.
 *
 * @returns {React.JSX.Element} The root application element tree.
 */
function App(): React.JSX.Element {
  const state = useAppState();

  // Render Loader screen
  if (state.loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="space-y-4 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-accent-teal/10 border border-accent-teal/30 flex items-center justify-center text-accent-teal animate-spin">
            <Leaf size={24} />
          </div>
          <span className="text-sm font-semibold tracking-wider text-muted font-mono uppercase">Syncing ledger states...</span>
        </div>
      </div>
    );
  }

  // Render Onboarding flow if profile doesn't exist
  if (!state.profile) {
    return (
      <ErrorBoundary>
        <Onboarding
          onComplete={state.handleOnboardingComplete}
        />
      </ErrorBoundary>
    );
  }

  // Render Onboarding flow in edit mode
  if (state.isEditingProfile) {
    return (
      <ErrorBoundary>
        <Onboarding
          initialProfile={state.profile}
          onComplete={async (updatedProfile, dailyBudget, annualFootprint) => {
            await state.handleOnboardingComplete(updatedProfile, dailyBudget, annualFootprint);
            state.setIsEditingProfile(false);
          }}
          onCancel={() => state.setIsEditingProfile(false)}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
        {/* Skip to main content link — first focusable element for screen readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent-teal focus:text-background focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>

        {/* Mobile Navbar Header */}
        <header className="md:hidden flex justify-between items-center bg-surface border-b border-border p-4 z-20 w-full">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-gradient-to-r from-accent-teal to-cyan-500 flex items-center justify-center text-background">
              <Leaf size={16} />
            </div>
            <span className="font-bold tracking-tight text-white font-tabular text-base">ATMOS</span>
          </div>

          <button
            onClick={() => state.setMobileMenuOpen(!state.mobileMenuOpen)}
            className="p-1.5 border border-border rounded text-muted hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            {state.mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        {/* Sidebar Navigation */}
        <Sidebar
          profile={state.profile}
          offlineMode={state.offlineMode}
          activeTab={state.activeTab}
          mobileMenuOpen={state.mobileMenuOpen}
          onTabChange={state.setActiveTab}
          onMobileMenuClose={() => state.setMobileMenuOpen(false)}
          onEditProfile={() => state.setIsEditingProfile(true)}
          onResetAccount={() => state.setShowResetConfirm(true)}
        />

        {/* Backdrop overlay for mobile menu */}
        {state.mobileMenuOpen && (
          <div
            onClick={() => state.setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 md:hidden z-20"
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6" role="main">
          <h1 className="sr-only">Atmos — Personal Carbon Ledger &amp; Action Platform</h1>
          <Suspense fallback={<CardSkeleton />}>
            {state.activeTab === "dashboard" && (
              <Dashboard
                profile={state.profile}
                activities={state.activities}
                dailyBudget={state.dailyBudget}
                streak={state.streakCount}
                onNavigate={(tab) => {
                  if (
                    tab === "dashboard" ||
                    tab === "activities" ||
                    tab === "coach" ||
                    tab === "goals" ||
                    tab === "actions" ||
                    tab === "reports"
                  ) {
                    state.setActiveTab(tab);
                  }
                }}
              />
            )}

            {state.activeTab === "activities" && (
              <ActivityLogger
                activities={state.activities}
                onAddActivity={state.handleAddActivity}
                onUpdateActivity={state.handleUpdateActivity}
                onDeleteActivity={state.handleDeleteActivity}
              />
            )}

            {state.activeTab === "coach" && (
              <AtmosCoach
                profile={state.profile}
                activities={state.activities}
                onAdoptAction={state.handleAdoptAction}
              />
            )}

            {state.activeTab === "goals" && (
              <Goals
                profile={state.profile}
                activities={state.activities}
                currentGoals={state.goals}
                onUpdateGoals={state.handleUpdateGoals}
              />
            )}

            {state.activeTab === "actions" && (
              <ActionsList
                adoptedActions={state.adoptedActions}
                streak={state.streakCount}
                onCompleteAction={state.handleCompleteActionLog}
                onRemoveAdopted={state.handleRemoveAdopted}
              />
            )}

            {state.activeTab === "reports" && (
              <Reports
                profile={state.profile}
                activities={state.activities}
                dailyBudget={state.dailyBudget}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* Reset Confirmation Modal */}
      {state.showResetConfirm && (
        <ResetConfirmModal
          onConfirm={state.handleResetProfile}
          onCancel={() => state.setShowResetConfirm(false)}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;
