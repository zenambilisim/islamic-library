import type { Metadata } from 'next';
import UserLayoutClient from './UserLayoutClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <UserLayoutClient>{children}</UserLayoutClient>;
}
