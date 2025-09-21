'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/db';
import { CommunityAlert } from '@/services/communityAlertService';
import { AlertTriangle, Bell, BellOff, MapPin, Shield, Info, AlertCircle } from 'lucide-react';

export default function CommunityAlertsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState<CommunityAlert[]>([]);
  const [subscribedAlerts, setSubscribedAlerts] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError('');

        // Get user ID from session (in a real app, this would come from authentication)
        // For demo purposes, we'll use a mock user ID
        const mockUserId = 'user-123';
        setUserId(mockUserId);

        // Fetch active alerts
        const activeAlerts = await db.table('communityAlerts')
          .filter(alert => 
            alert.verificationStatus === 'verified' && 
            (!alert.expiresAt || new Date(alert.expiresAt) > new Date())
          )
          .toArray() as CommunityAlert[];

        // If no alerts in database, use sample data
        if (activeAlerts.length === 0) {
          setAlerts(getSampleAlerts());
        } else {
          setAlerts(activeAlerts);
        }

        // Fetch user's subscribed alerts
        const subscriptions = await db.table('alertSubscriptions')
          .where('userId')
          .equals(mockUserId)
          .toArray();

        setSubscribedAlerts(subscriptions.map(sub => sub.alertId));
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading community alerts:', err);
        setError('An error occurred while loading alerts. Please try again later.');
        setIsLoading(false);
        // Use sample data in case of error
        setAlerts(getSampleAlerts());
      }
    }
    
    loadData();
  }, []);

  const toggleSubscription = async (alertId: string) => {
    if (!userId) return;

    try {
      if (subscribedAlerts.includes(alertId)) {
        // Unsubscribe
        await db.table('alertSubscriptions')
          .where({ alertId, userId })
          .delete();

        setSubscribedAlerts(prev => prev.filter(id => id !== alertId));

        // Update subscriber count in alert
        const alert = alerts.find(a => a.id === alertId);
        if (alert && alert.subscriberCount && alert.subscriberCount > 0) {
          await db.table('communityAlerts')
            .update(alertId, {
              subscriberCount: alert.subscriberCount - 1
            });

          // Update local state
          setAlerts(prev => prev.map(a => 
            a.id === alertId 
              ? { ...a, subscriberCount: (a.subscriberCount || 1) - 1 } 
              : a
          ));
        }
      } else {
        // Subscribe
        await db.table('alertSubscriptions').add({
          alertId,
          userId,
          createdAt: new Date()
        });

        setSubscribedAlerts(prev => [...prev, alertId]);

        // Update subscriber count in alert
        const alert = alerts.find(a => a.id === alertId);
        if (alert) {
          await db.table('communityAlerts')
            .update(alertId, {
              subscriberCount: (alert.subscriberCount || 0) + 1
            });

          // Update local state
          setAlerts(prev => prev.map(a => 
            a.id === alertId 
              ? { ...a, subscriberCount: (a.subscriberCount || 0) + 1 } 
              : a
          ));
        }
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
      setError('An error occurred while updating your subscription. Please try again.');
    }
  };

  const getSeverityIcon = (severity: CommunityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getCategoryIcon = (category: CommunityAlert['category']) => {
    switch (category) {
      case 'fraud':
        return <Shield className="h-5 w-5 text-purple-500" />;
      case 'safety':
        return <Shield className="h-5 w-5 text-green-500" />;
      case 'crime':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'information':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getSeverityBadge = (severity: CommunityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category: CommunityAlert['category']) => {
    switch (category) {
      case 'fraud':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Fraud</Badge>;
      case 'safety':
        return <Badge variant="outline" className="border-green-500 text-green-500">Safety</Badge>;
      case 'crime':
        return <Badge variant="outline" className="border-red-500 text-red-500">Crime</Badge>;
      case 'information':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Information</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const getSourceBadge = (source: CommunityAlert['source']) => {
    switch (source) {
      case 'ai':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">AI Generated</Badge>;
      case 'police':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Police</Badge>;
      case 'verified':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Verified</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Community Alerts</CardTitle>
            <CardDescription>Please wait while we load the latest alerts...</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="w-full max-w-md">
              <Progress value={45} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Community Alerts</h1>
        <p className="text-muted-foreground">
          Stay informed about verified fraud scams, public safety updates, and crime alerts in your area.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="fraud">Fraud</TabsTrigger>
          <TabsTrigger value="crime">Crime</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="subscribed">My Subscriptions</TabsTrigger>
        </TabsList>
        
        {['all', 'fraud', 'crime', 'safety', 'subscribed'].map(tabValue => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {tabValue === 'subscribed' && subscribedAlerts.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Subscriptions</CardTitle>
                  <CardDescription>
                    You haven't subscribed to any alerts yet. Subscribe to alerts to receive notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Browse the available alerts and click the bell icon to subscribe.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {alerts
                  .filter(alert => {
                    if (tabValue === 'all') return true;
                    if (tabValue === 'subscribed') return subscribedAlerts.includes(alert.id);
                    return alert.category === tabValue;
                  })
                  .map(alert => (
                    <Card key={alert.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {getSeverityIcon(alert.severity)}
                            <CardTitle>{alert.title}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSubscription(alert.id)}
                            title={subscribedAlerts.includes(alert.id) ? 'Unsubscribe' : 'Subscribe'}
                          >
                            {subscribedAlerts.includes(alert.id) ? (
                              <Bell className="h-5 w-5 fill-current" />
                            ) : (
                              <BellOff className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {getSeverityBadge(alert.severity)}
                          {getCategoryBadge(alert.category)}
                          {getSourceBadge(alert.source)}
                          {alert.subscriberCount && alert.subscriberCount > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              {alert.subscriberCount}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{alert.description}</p>
                        
                        {alert.location && (
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>
                              {alert.location.address || 'Location available'}
                              {alert.radius && ` (${alert.radius}km radius)`}
                            </span>
                          </div>
                        )}
                        
                        <div className="text-sm text-muted-foreground">
                          <span>Posted: {formatDate(alert.createdAt)}</span>
                          {alert.expiresAt && (
                            <span className="ml-4">Expires: {formatDate(alert.expiresAt)}</span>
                          )}
                        </div>
                      </CardContent>
                      {alert.relatedFIRs && alert.relatedFIRs.length > 0 && (
                        <CardFooter className="bg-muted/50 px-6 py-3">
                          <div className="text-sm">
                            <span className="font-medium">Related cases:</span>{' '}
                            {alert.relatedFIRs.map((fir, index) => (
                              <span key={fir}>
                                <Button variant="link" className="p-0 h-auto font-normal" asChild>
                                  <a href={`/consumer/verify/${fir}`}>{fir}</a>
                                </Button>
                                {index < alert.relatedFIRs!.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Sample alerts for demonstration
function getSampleAlerts(): CommunityAlert[] {
  return [
    {
      id: 'alert-1',
      title: 'Online Banking Fraud Alert',
      description: 'Multiple cases of phishing attacks targeting online banking users have been reported. Fraudsters are sending emails claiming to be from major banks asking for login credentials. Never click on suspicious links or provide your banking details via email.',
      category: 'fraud',
      severity: 'high',
      location: {
        lat: 28.6139,
        lng: 77.2090,
        address: 'Central District'
      },
      createdBy: 'system',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      source: 'verified',
      relatedFIRs: ['FIR-2023-1234', 'FIR-2023-1235', 'FIR-2023-1242'],
      verificationStatus: 'verified',
      subscriberCount: 156
    },
    {
      id: 'alert-2',
      title: 'Increased Theft Risk in Central District',
      description: 'Our AI system has detected an increased risk of theft and pickpocketing in the Central District shopping area. Please be vigilant with personal belongings, especially during crowded hours.',
      category: 'crime',
      severity: 'medium',
      location: {
        lat: 28.6139,
        lng: 77.2090,
        address: 'Central District Shopping Area'
      },
      radius: 2,
      createdBy: 'system',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      source: 'ai',
      verificationStatus: 'verified',
      subscriberCount: 89
    },
    {
      id: 'alert-3',
      title: 'Critical: QR Code Payment Scam',
      description: 'A new scam involving fake QR codes placed over legitimate payment QR codes has been detected at multiple retail locations. Always verify that you are scanning an official QR code and check the payment recipient before confirming transactions.',
      category: 'fraud',
      severity: 'critical',
      location: {
        lat: 28.5562,
        lng: 77.1000,
        address: 'Multiple retail locations'
      },
      createdBy: 'police',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      source: 'police',
      verificationStatus: 'verified',
      subscriberCount: 312
    },
    {
      id: 'alert-4',
      title: 'Road Safety: Construction on Highway 8',
      description: 'Major construction work has begun on Highway 8 between junctions 12-15. Expect delays and follow diversions. Construction expected to continue for the next 3 weeks.',
      category: 'safety',
      severity: 'low',
      location: {
        lat: 28.4513,
        lng: 77.3910,
        address: 'Highway 8, Junctions 12-15'
      },
      radius: 5,
      createdBy: 'traffic-authority',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      source: 'verified',
      verificationStatus: 'verified',
      subscriberCount: 45
    },
    {
      id: 'alert-5',
      title: 'Vehicle Break-ins in North Residential Area',
      description: 'Multiple vehicle break-ins have been reported in the North Residential Area over the past week. Residents are advised to remove valuables from vehicles and ensure cars are locked. Increased police patrols have been deployed to the area.',
      category: 'crime',
      severity: 'high',
      location: {
        lat: 28.5355,
        lng: 77.1025,
        address: 'North Residential Area'        
      },
      radius: 3,
      createdBy: 'police',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      source: 'police',
      verificationStatus: 'verified',
      subscriberCount: 203
    }
  ];
}