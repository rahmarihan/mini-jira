// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/src/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Mini Jira',
  description: 'Team task management on AWS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}