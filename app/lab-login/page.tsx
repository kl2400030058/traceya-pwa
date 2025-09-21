'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authManager } from '@/lib/auth';
import { Beaker, Cog, AlertTriangle } from 'lucide-react';

export default function LabLoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<'lab' | 'processor'>('lab');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!userId || !otp) {
      setError('Please enter both ID and OTP');
      setIsLoading(false);
      return;
    }

    try {
      const result = await authManager.login(userId, otp, role);

      if (result) {
        // Update settings with the appropriate ID field
        const { db } = await import('@/lib/db');
        const settings = await db.settings.get('settings');
        
        if (settings) {
          if (role === 'lab') {
            await db.settings.update('settings', { 
              labUserId: userId,
              userRole: role 
            });
          } else if (role === 'processor') {
            await db.settings.update('settings', { 
              processorId: userId,
              userRole: role 
            });
          }
        }

        // Redirect to the appropriate page
        if (role === 'lab') {
          router.push('/lab');
        } else {
          router.push('/processing');
        }
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
          <CardTitle className="text-2xl font-bold text-center">Lab & Processing Login</CardTitle>
          <CardDescription className="text-center">
            Enter your ID and OTP to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lab" onValueChange={(value) => setRole(value as 'lab' | 'processor')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lab" className="flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Lab User
              </TabsTrigger>
              <TabsTrigger value="processor" className="flex items-center gap-2">
                <Cog className="h-4 w-4" />
                Processor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lab">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Input
                    id="lab-id"
                    placeholder="Lab User ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="lab-otp"
                    placeholder="One-Time Password"
                    type="password"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login as Lab User'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="processor">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Input
                    id="processor-id"
                    placeholder="Processor ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="processor-otp"
                    placeholder="One-Time Password"
                    type="password"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login as Processor'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <span>Are you a farmer? </span>
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/login')}>
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