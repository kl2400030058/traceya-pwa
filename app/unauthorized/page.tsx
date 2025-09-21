'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authManager } from '@/lib/auth';

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleGoBack = () => {
    // Redirect to appropriate dashboard based on user role
    const userRole = authManager.getUserRole();
    
    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'court') {
      router.push('/admin/dashboard');
    } else if (userRole === 'lab') {
      router.push('/lab/dashboard');
    } else if (userRole === 'processor') {
      router.push('/processor/dashboard');
    } else if (userRole === 'farmer') {
      router.push('/dashboard');
    } else if (userRole === 'citizen') {
      router.push('/consumer/dashboard');
    } else {
      // If no role or not authenticated, go to login
      router.push('/login');
    }
  };

  const handleLogout = () => {
    authManager.logout();
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Access Denied</CardTitle>
          <CardDescription className="text-center">
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600">
            This area requires higher privileges than your current account has.
            Please contact an administrator if you believe you should have access.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleGoBack}>
            Go Back
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}