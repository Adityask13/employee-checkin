// Route protection hook for admin pages

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidAdminSession } from '../utils/adminSession';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const validSession = isValidAdminSession();
      setIsAuthenticated(validSession);
      
      if (!validSession) {
        router.push('/admin');
      }
      
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      const validSession = isValidAdminSession();
      setIsAuthenticated(validSession);
      
      if (!validSession) {
        router.push('/admin');
      }
    };

    window.addEventListener('adminAuthChange', handleAuthChange);

    return () => {
      window.removeEventListener('adminAuthChange', handleAuthChange);
    };
  }, [router]);

  return { isAuthenticated, loading };
};
