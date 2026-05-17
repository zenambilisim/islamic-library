'use client';

import { UserAuthProvider } from '@/contexts/UserAuthContext';
import '@/i18n';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <UserAuthProvider>{children}</UserAuthProvider>;
}
