'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    } else if (user && !user.onboarded && !pathname.includes('/onboarding')) {
      router.replace('/onboarding');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin-slow">️</div>
          <p className="text-textsecondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-bg">
      <Navbar />
      <main className="md:pt-16 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ProtectedContent>{children}</ProtectedContent>
      </ToastProvider>
    </AuthProvider>
  );
}
