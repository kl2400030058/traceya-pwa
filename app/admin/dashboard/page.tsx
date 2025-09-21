'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AuthGuard } from '@/components/auth-guard';
import { db } from '@/lib/db';
// Define the type locally since aiService module is not found
type AnomalyDetectionResult = {
  anomalies: Array<{
    field: string;
    expectedRange: [number, number];
    actualValue: number;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
};
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Shield, FileWarning, Activity, Server } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    events: { total: 0, pending: 0, uploading: 0, synced: 0, failed: 0 },
    farmers: { total: 0 },
    syncJobs: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 }
  });
  const [systemLogs, setSystemLogs] = useState<Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    source: string;
  }>>([]);
  const [anomalies, setAnomalies] = useState<Array<{
    id: string;
    certificateId: string;
    batchId: string;
    timestamp: string;
    details: AnomalyDetectionResult['anomalies'][0];
  }>>([]);
  const [rejectedCertificates, setRejectedCertificates] = useState<Array<{
    id: string;
    batchId: string;
    timestamp: string;
    reason: string;
    rejectedBy: string;
  }>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, these would be API calls to the backend
      // For demo purposes, we'll simulate the data

      // Fetch system stats
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }
      const data = await response.json();
      setStats(data.stats);

      // Simulate system logs
      setSystemLogs(generateMockSystemLogs());

      // Simulate anomalies
      setAnomalies(generateMockAnomalies());

      // Simulate rejected certificates
      setRejectedCertificates(generateMockRejectedCertificates());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleRetryFailed = async () => {
    try {
      const response = await fetch('/api/admin/retry-failed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to retry failed events');
      }

      // Reload dashboard data
      loadDashboardData();
    } catch (err) {
      console.error('Error retrying failed events:', err);
      setError('Failed to retry failed events. Please try again.');
    }
  };

  const renderSystemStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.events.total}</div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div>Synced</div>
                <div className="font-medium">{stats.events.synced}</div>
              </div>
              <Progress value={(stats.events.synced / Math.max(stats.events.total, 1)) * 100} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <div>Pending</div>
                <div className="font-medium">{stats.events.pending}</div>
              </div>
              <Progress value={(stats.events.pending / Math.max(stats.events.total, 1)) * 100} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <div>Failed</div>
                <div className="font-medium">{stats.events.failed}</div>
              </div>
              <Progress value={(stats.events.failed / Math.max(stats.events.total, 1)) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.syncJobs.total}</div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div>Completed</div>
                <div className="font-medium">{stats.syncJobs.completed}</div>
              </div>
              <Progress value={(stats.syncJobs.completed / Math.max(stats.syncJobs.total, 1)) * 100} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <div>Processing</div>
                <div className="font-medium">{stats.syncJobs.processing}</div>
              </div>
              <Progress value={(stats.syncJobs.processing / Math.max(stats.syncJobs.total, 1)) * 100} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <div>Failed</div>
                <div className="font-medium">{stats.syncJobs.failed}</div>
              </div>
              <Progress value={(stats.syncJobs.failed / Math.max(stats.syncJobs.total, 1)) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.farmers.total} Farmers</div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div>System Uptime</div>
                <div className="font-medium">99.8%</div>
              </div>
              <Progress value={99.8} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <div>API Response Time</div>
                <div className="font-medium">245ms</div>
              </div>
              <Progress value={85} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <div>Storage Usage</div>
                <div className="font-medium">42%</div>
              </div>
              <Progress value={42} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSystemLogs = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>System Logs</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription>Recent system activity and events</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                  <TableCell>
                    <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warning' ? 'secondary' : 'outline'}>
                      {log.level.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.source}</TableCell>
                  <TableCell className="max-w-md truncate">{log.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderAnomalies = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Detected Anomalies</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription>AI-detected anomalies requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Certificate ID</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anomalies.map((anomaly) => (
                <TableRow key={anomaly.id}>
                  <TableCell className="font-mono text-xs">{anomaly.timestamp}</TableCell>
                  <TableCell className="font-mono text-xs">{anomaly.certificateId.substring(0, 8)}...</TableCell>
                  <TableCell className="font-mono text-xs">{anomaly.batchId.substring(0, 8)}...</TableCell>
                  <TableCell>{anomaly.details.field}</TableCell>
                  <TableCell>
                    <Badge variant={anomaly.details.severity === 'high' ? 'destructive' : anomaly.details.severity === 'medium' ? 'secondary' : 'outline'}>
                      {anomaly.details.severity.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">{anomaly.details.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderRejectedCertificates = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Rejected Certificates</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription>Certificates that failed verification</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Certificate ID</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>Rejected By</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rejectedCertificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-mono text-xs">{cert.timestamp}</TableCell>
                  <TableCell className="font-mono text-xs">{cert.id.substring(0, 8)}...</TableCell>
                  <TableCell className="font-mono text-xs">{cert.batchId.substring(0, 8)}...</TableCell>
                  <TableCell>{cert.rejectedBy}</TableCell>
                  <TableCell className="max-w-md truncate">{cert.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="default" onClick={handleRetryFailed}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Failed
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderSystemStats()}

        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="logs">
              <Server className="h-4 w-4 mr-2" />
              System Logs
            </TabsTrigger>
            <TabsTrigger value="anomalies">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Anomalies
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <FileWarning className="h-4 w-4 mr-2" />
              Rejected Certificates
            </TabsTrigger>
          </TabsList>
          <TabsContent value="logs">
            {renderSystemLogs()}
          </TabsContent>
          <TabsContent value="anomalies">
            {renderAnomalies()}
          </TabsContent>
          <TabsContent value="rejected">
            {renderRejectedCertificates()}
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

// Helper functions to generate mock data for the demo
function generateMockSystemLogs() {
  const logs = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      level: 'info',
      message: 'User admin1 logged in successfully',
      source: 'AuthService'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      level: 'warning',
      message: 'High API usage detected from IP 192.168.1.105',
      source: 'RateLimiter'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      level: 'error',
      message: 'Failed to connect to blockchain network after 3 retries',
      source: 'FabricService'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
      level: 'info',
      message: 'Batch b78a2d3f successfully synced to blockchain',
      source: 'SyncService'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      level: 'warning',
      message: 'Certificate validation failed for batch 7d9e2f1a',
      source: 'ValidationService'
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
      level: 'info',
      message: 'System backup completed successfully',
      source: 'BackupService'
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
      level: 'error',
      message: 'Database connection timeout after 30s',
      source: 'DatabaseService'
    },
  ];

  return logs as Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    source: string;
  }>;
}

function generateMockAnomalies() {
  const anomalies = [
    {
      id: '1',
      certificateId: 'cert_7d9e2f1a3b5c8d6e',
      batchId: 'batch_3f5e8d9a7b2c1d4e',
      timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
      details: {
        field: 'moistureLevel',
        expectedRange: [0, 12] as [number, number],
        actualValue: 15.7,
        description: 'Moisture level exceeds acceptable range',
        severity: 'high' as 'high'
      }
    },
    {
      id: '2',
      certificateId: 'cert_2a4b6c8d0e2f4a6b',
      batchId: 'batch_5a7b9c1d3e5f7g9h',
      timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
      details: {
        field: 'pesticidesLevel',
        expectedRange: [0, 0.4] as [number, number],
        actualValue: 0.52,
        description: 'Pesticide level exceeds regulatory limits',
        severity: 'high' as 'high'
      }
    },
    {
      id: '3',
      certificateId: 'cert_3c5d7e9f1a3b5c7d',
      batchId: 'batch_2d4f6h8j0l2n4p6r',
      timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
      details: {
        field: 'purityScore',
        expectedRange: [80, 100] as [number, number],
        actualValue: 72.5,
        description: 'Purity score below acceptable threshold',
        severity: 'medium' as 'medium'
      }
    },
    {
      id: '4',
      certificateId: 'cert_4d6e8f0a2b4c6d8e',
      batchId: 'batch_1a3c5e7g9i1k3m5o',
      timestamp: new Date(Date.now() - 300 * 60000).toISOString(),
      details: {
        field: 'contaminationRisk',
        expectedRange: [0, 15] as [number, number],
        actualValue: 18.3,
        description: 'Contamination risk above acceptable threshold',
        severity: 'medium' as 'medium'
      }
    },
  ];

  return anomalies;
}

function generateMockRejectedCertificates() {
  const certificates = [
    {
      id: 'cert_9f8e7d6c5b4a3f2e',
      batchId: 'batch_1a2b3c4d5e6f7g8h',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
      reason: 'Failed ZKP verification - hash mismatch',
      rejectedBy: 'System'
    },
    {
      id: 'cert_1a2b3c4d5e6f7g8h',
      batchId: 'batch_9i8u7y6t5r4e3w2q',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
      reason: 'Multiple high-severity anomalies detected',
      rejectedBy: 'AI Validator'
    },
    {
      id: 'cert_5f4e3d2c1b0a9z8y',
      batchId: 'batch_2q3w4e5r6t7y8u9i',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60000).toISOString(),
      reason: 'Manual rejection - inconsistent test results',
      rejectedBy: 'admin1'
    },
    {
      id: 'cert_7h8j9k0l1z2x3c4v',
      batchId: 'batch_5t6y7u8i9o0p1a2s',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(),
      reason: 'Expired certificate submission',
      rejectedBy: 'System'
    },
  ];

  return certificates;
}