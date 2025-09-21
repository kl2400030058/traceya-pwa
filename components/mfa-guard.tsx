'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authManager } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface MFAGuardProps {
  children: React.ReactNode;
  requiredRoles?: Array<'admin' | 'super_admin' | 'court' | 'lab' | 'processor' | 'farmer' | 'citizen'>;
}

export function MFAGuard({ children, requiredRoles = [] }: MFAGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // Check if user is authenticated (including MFA verification if required)
      const isAuthenticated = authManager.isAuthenticated();
      
      // Check if MFA verification is required but not completed
      const needsMFAVerification = authManager.requiresMFAVerification();
      
      // Check role-based access if roles are specified
      let hasRequiredRole = true;
      if (requiredRoles.length > 0) {
        const userRole = authManager.getUserRole();
        hasRequiredRole = userRole ? requiredRoles.includes(userRole as any) : false;
      }

      if (!isAuthenticated && !needsMFAVerification) {
        // Not authenticated at all, redirect to login
        router.push('/login');
        return false;
      } else if (needsMFAVerification) {
        // Authenticated but needs MFA verification
        router.push(`/verify-mfa?redirectTo=${encodeURIComponent(pathname)}`);
        return false;
      } else if (!hasRequiredRole) {
        // Authenticated but doesn't have the required role
        router.push('/unauthorized');
        return false;
      }

      return true;
    };

    const authorized = checkAuth();
    setIsAuthorized(authorized);
    setIsLoading(false);
  }, [router, pathname, requiredRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}