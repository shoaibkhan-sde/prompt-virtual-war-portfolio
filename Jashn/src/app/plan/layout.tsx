import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plan an Event | Jashn - Intelligent Celebration Planner',
  description:
    'Turn celebration details into a mathematically exact budget split, dated timeline, vendor checklist, and ranked inspiration with progress tracking.',
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
