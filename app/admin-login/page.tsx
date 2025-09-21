'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authManager } from '@/lib/auth';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!adminId || !password) {
      setError('Please enter both Admin ID and password');
      setIsLoading(false);
      return;
    }

    try {
      // For demo purposes, we'll use the OTP login mechanism
      // In a real app, this would use a different authentication method
      const result = await authManager.login(adminId, password, 'admin');

      if (result) {
        // Update settings with admin role
        const { db } = await import('@/lib/db');
        const settings = await db.settings.get('settings');
        
        if (settings) {
          await db.settings.update('settings', { 
            userRole: 'admin' 
          });
        }

        // Redirect to the batches page
        router.push('/batches');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your administrator credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="admin-id"
                placeholder="Admin ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Input
                id="admin-password"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login as Administrator'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            <span>Are you a farmer? </span>
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/login')}>
              Login here
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <span>Are you a lab user or processor? </span>
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/lab-login')}>
              Login here
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <span>Are you a researcher? </span>
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/researcher-login')}>
              Login here
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}