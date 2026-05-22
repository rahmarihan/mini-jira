// frontend/src/app/page.tsx
import { redirect } from 'next/navigation';

// Root — send unauthenticated users to login.
// The login page itself redirects to /dashboard after success.
export default function Home() {
  redirect('/auth/login');
}