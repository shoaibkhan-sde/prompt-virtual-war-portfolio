import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { ThemeInitializer } from '@/components/layout/ThemeInitializer';
import { FloatingAIAssistant } from '@/components/ai/FloatingAIAssistant';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-devanagari',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2E2A7A',
};

export const metadata: Metadata = {
  title: 'Jashn - Celebration & Event Planner',
  description:
    'GenAI-powered Celebration & Event Planner for weddings, birthdays and community events with exact budget math, timelines, and vendor checklists.',
  keywords: [
    'event planner',
    'wedding planner',
    'celebration planner',
    'budget rebalancing',
    'festival planner',
    'jashn',
    'celebration',
  ],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${devanagari.variable}`} suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("jashn.theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");}else if(t==="light"){document.documentElement.classList.remove("dark");}}catch(e){}})();`,
          }}
          suppressHydrationWarning
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeInitializer />
        {children}
        <FloatingAIAssistant />
      </body>
    </html>
  );
}
