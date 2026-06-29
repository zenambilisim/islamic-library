import { Suspense } from 'react';
import UserLoginPage from '@/views/UserLoginPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <UserLoginPage />
    </Suspense>
  );
}
