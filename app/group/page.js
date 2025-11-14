'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserProfile from '@/app/session/UserProfile';
import Group from '@/components/userGroup/group';
import MainLayout from '../../components/layout/MainLayout';

export default function GroupPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const email = UserProfile.getEmail();
      if (!email) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/auth/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const authData = await res.json();

        if (!authData.authenticated) {
          router.push('/login');
          return;
        }

        if (!authData.hasGroup) {
          router.push('/join');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isAuthorized === null) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <MainLayout>
      <Group />
    </MainLayout>
  );
}