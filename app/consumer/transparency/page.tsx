'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { TransparencyLog } from '@/services/biasdetectionservice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, BarChart2, PieChart as PieChartIcon } from 'lucide-react';

// Sample data for demonstration
const sampleStats = {
  firs: {
    total: 1245,
    resolved: 876,
    investigating: 289,
    pending: 80
  },
  aiDecisions: {
    total: 1245,
    approved: 1156,
    modified: 67,
    rejected: 22
  },
  categories: [
    { name: 'Theft', value: 412 },
    { name: 'Fraud', value: 298 },
    { name: 'Assault', value: 187 },
    { name: 'Cybercrime', value: 165 },
    { name: 'Property Damage', value: 98 },
    { name: 'Other', value: 85 }
  ],
  monthlyFIRs: [
    { month: 'Jan', count: 65 },
    { month: 'Feb', count: 78 },
    { month: 'Mar', count: 90 },
    { month: 'Apr', count: 81 },
    { month: 'May', count: 95 },
    { month: 'Jun', count: 110 },
    { month: 'Jul', count: 129 },
    { month: 'Aug', count: 142 },
    { month: 'Sep', count: 156 },
    { month: 'Oct', count: 168 },
    { month: 'Nov', count: 131 },
    { month: 'Dec', count: 0 }
  ],
  processingTimes: {
    averageResolutionDays: 14.3,
    averageInvestigationDays: 5.2,
    averageAIProcessingMinutes: 3.5
  },
  biasMetrics: {
    overallFairnessScore: 92,
    demographicParity: 94,
    equalOpportunity: 91,
    disparateImpact: 89
  }
};

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function TransparencyDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(sampleStats);
  const [transparencyLogs, setTransparencyLogs] = useState<TransparencyLog[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError('');

        // In a real implementation, we would fetch actual stats from an API
        // For demo purposes, we'll use the sample data with a slight delay
        setTimeout(() => {
          setStats(sampleStats);
        }, 1000);
        
        // Fetch transparency logs if available
        const logs = await db.table('transparencyLogs').toArray() as TransparencyLog[];
        setTransparencyLogs(logs);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading transparency data:', err);
        setError('An error occurred while loading transparency data. Please try again later.');
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Transparency Dashboard</CardTitle>
            <CardDescription>Please wait while we load the latest data...</CardDescription>
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

  if (error) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Transparency Dashboard</h1>
        <p className="text-muted-foreground">
          Public transparency metrics for TraceYa's AI-powered law enforcement system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total FIRs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.firs.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.firs.resolved / stats.firs.total) * 100)}% resolved
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Fairness Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.biasMetrics.overallFairnessScore}/100</div>
            <Progress 
              value={stats.biasMetrics.overallFairnessScore} 
              className="h-1 mt-1"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processingTimes.averageResolutionDays} days</div>
            <p className="text-xs text-muted-foreground">
              Investigation: {stats.processingTimes.averageInvestigationDays} days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Decision Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.aiDecisions.approved / stats.aiDecisions.total) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.aiDecisions.modified} modified, {stats.aiDecisions.rejected} rejected
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-fairness">AI Fairness</TabsTrigger>
          <TabsTrigger value="case-stats">Case Statistics</TabsTrigger>
          <TabsTrigger value="transparency-logs">Transparency Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md font-medium">Monthly FIR Trends</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Number of FIRs filed per month</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.monthlyFIRs}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="FIRs Filed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md font-medium">FIR Categories</CardTitle>
                  <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>Distribution by category</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>FIR Status Overview</CardTitle>
              <CardDescription>Current status of all FIRs in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resolved</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.firs.resolved} ({Math.round((stats.firs.resolved / stats.firs.total) * 100)}%)
                    </span>
                  </div>
                  <Progress value={(stats.firs.resolved / stats.firs.total) * 100} className="h-2 bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Investigating</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.firs.investigating} ({Math.round((stats.firs.investigating / stats.firs.total) * 100)}%)
                    </span>
                  </div>
                  <Progress value={(stats.firs.investigating / stats.firs.total) * 100} className="h-2 bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.firs.pending} ({Math.round((stats.firs.pending / stats.firs.total) * 100)}%)
                    </span>
                  </div>
                  <Progress value={(stats.firs.pending / stats.firs.total) * 100} className="h-2 bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai-fairness" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Fairness Metrics</CardTitle>
              <CardDescription>Measures of algorithmic fairness in our AI systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Fairness Score</span>
                    <span className="text-sm font-medium">{stats.biasMetrics.overallFairnessScore}/100</span>
                  </div>
                  <Progress 
                    value={stats.biasMetrics.overallFairnessScore} 
                    className="h-2"
                    color={stats.biasMetrics.overallFairnessScore >= 90 ? 'bg-green-500' : 
                           stats.biasMetrics.overallFairnessScore >= 80 ? 'bg-yellow-500' : 'bg-red-500'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Composite score based on multiple fairness metrics
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Demographic Parity</span>
                    <span className="text-sm font-medium">{stats.biasMetrics.demographicParity}/100</span>
                  </div>
                  <Progress value={stats.biasMetrics.demographicParity} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Measures if AI decisions are independent of sensitive attributes
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Equal Opportunity</span>
                    <span className="text-sm font-medium">{stats.biasMetrics.equalOpportunity}/100</span>
                  </div>
                  <Progress value={stats.biasMetrics.equalOpportunity} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Measures if true positive rates are similar across different groups
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disparate Impact</span>
                    <span className="text-sm font-medium">{stats.biasMetrics.disparateImpact}/100</span>
                  </div>
                  <Progress value={stats.biasMetrics.disparateImpact} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Measures if AI decisions have disproportionate effects on different groups
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Decision Review</CardTitle>
              <CardDescription>Human oversight of AI decisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">AI Decisions Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {stats.aiDecisions.approved} 
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          ({Math.round((stats.aiDecisions.approved / stats.aiDecisions.total) * 100)}%)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">AI Decisions Modified</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">
                        {stats.aiDecisions.modified}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          ({Math.round((stats.aiDecisions.modified / stats.aiDecisions.total) * 100)}%)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">AI Decisions Rejected</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {stats.aiDecisions.rejected}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          ({Math.round((stats.aiDecisions.rejected / stats.aiDecisions.total) * 100)}%)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-2">AI Decision Oversight Process</h3>
                  <p className="text-sm text-muted-foreground">
                    All AI decisions in TraceYa undergo a rigorous review process. High-impact decisions 
                    are reviewed by human experts before implementation. Our transparency logs record all 
                    AI decisions, including explanations and any human modifications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="case-stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Processing Metrics</CardTitle>
              <CardDescription>Time-to-resolution and processing efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avg. Resolution Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.processingTimes.averageResolutionDays} days
                      </div>
                      <p className="text-xs text-muted-foreground">
                        From filing to case closure
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avg. Investigation Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.processingTimes.averageInvestigationDays} days
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Initial investigation phase
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">AI Processing Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.processingTimes.averageAIProcessingMinutes} min
                      </div>
                      <p className="text-xs text-muted-foreground">
                        AI analysis and prioritization
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="pt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case Type</TableHead>
                        <TableHead>Avg. Resolution (days)</TableHead>
                        <TableHead>Cases Processed</TableHead>
                        <TableHead>Success Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Theft</TableCell>
                        <TableCell>12.3</TableCell>
                        <TableCell>412</TableCell>
                        <TableCell>
                          <Badge variant="success">92%</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Fraud</TableCell>
                        <TableCell>18.7</TableCell>
                        <TableCell>298</TableCell>
                        <TableCell>
                          <Badge variant="success">88%</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Assault</TableCell>
                        <TableCell>15.2</TableCell>
                        <TableCell>187</TableCell>
                        <TableCell>
                          <Badge variant="success">85%</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Cybercrime</TableCell>
                        <TableCell>21.5</TableCell>
                        <TableCell>165</TableCell>
                        <TableCell>
                          <Badge variant="warning">76%</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Property Damage</TableCell>
                        <TableCell>9.8</TableCell>
                        <TableCell>98</TableCell>
                        <TableCell>
                          <Badge variant="success">94%</Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transparency-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Decision Transparency Logs</CardTitle>
              <CardDescription>Record of AI decisions with explanations</CardDescription>
            </CardHeader>
            <CardContent>
              {transparencyLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>AI System</TableHead>
                      <TableHead>Decision</TableHead>
                      <TableHead>Explanation</TableHead>
                      <TableHead>Human Reviewed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transparencyLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{log.aiSystem}</TableCell>
                        <TableCell>{log.decision}</TableCell>
                        <TableCell className="max-w-md truncate">{log.explanation}</TableCell>
                        <TableCell>
                          <Badge variant={log.humanReviewed ? 'success' : 'outline'}>
                            {log.humanReviewed ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground">
                    No transparency logs available. Sample logs will be displayed here as AI decisions are made.
                  </p>
                  
                  {/* Sample logs for demonstration */}
                  <Table className="mt-6">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>AI System</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead>Explanation</TableHead>
                        <TableHead>Human Reviewed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>{new Date().toLocaleString()}</TableCell>
                        <TableCell>FIR Priority Scoring</TableCell>
                        <TableCell>Assigned priority score of 85</TableCell>
                        <TableCell className="max-w-md truncate">High urgency due to public safety risk and recent similar incidents in the area.</TableCell>
                        <TableCell>
                          <Badge variant="success">Yes</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{new Date(Date.now() - 86400000).toLocaleString()}</TableCell>
                        <TableCell>Hotspot Prediction</TableCell>
                        <TableCell>Identified high-risk zone</TableCell>
                        <TableCell className="max-w-md truncate">Multiple theft reports in close proximity with similar patterns.</TableCell>
                        <TableCell>
                          <Badge variant="outline">No</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{new Date(Date.now() - 172800000).toLocaleString()}</TableCell>
                        <TableCell>Repeat Offender Linking</TableCell>
                        <TableCell>Detected potential repeat offender</TableCell>
                        <TableCell className="max-w-md truncate">Name and identifier patterns matched across 3 different FIRs.</TableCell>
                        <TableCell>
                          <Badge variant="success">Yes</Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Citizen Appeals</CardTitle>
              <CardDescription>Appeals against AI decisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-6 text-center">
                <p className="text-muted-foreground">
                  No citizen appeals have been filed yet. This section will display statistics and status of appeals against AI decisions.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Appeals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Appeals Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Appeals Rejected</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}