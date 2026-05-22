import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/src/components/providers/AppProviders';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Mini Jira',
  description: 'Team task management on AWS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
