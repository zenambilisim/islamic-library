'use client';

import { UserAuthProvider } from '@/contexts/UserAuthContext';
import '@/i18n';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserAuthProvider>
      <div className="flex min-h-screen flex-col bg-cream">{children}</div>
    </UserAuthProvider>
  );
}
