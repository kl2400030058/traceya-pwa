'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { federatedLearningService, ModelMetadata } from '@/services/federatedlearningservice';
import { CICDTestService, TestResult } from '@/services/cicdtestservice';

// Define missing interfaces if needed
interface TestConfig {
  modelId: string;
  testType: string;
  parameters: Record<string, any>;
}

export default function AIModelsPage() {
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelMetadata | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState({
    models: true,
    tests: false,
    runningTests: false
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Load test results when selected model changes
  useEffect(() => {
    if (selectedModel) {
      loadTestResults(selectedModel.id);
    }
  }, [selectedModel]);

  // Load models
  const loadModels = async () => {
    try {
      setLoading(prev => ({ ...prev, models: true }));
      const modelList = await federatedLearningService.getAllModelMetadata();
      setModels(modelList);
      
      // Select first model if available and none selected
      if (modelList.length > 0 && !selectedModel) {
        setSelectedModel(modelList[0]);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(prev => ({ ...prev, models: false }));
    }
  };

  // Load test results for a model
  const loadTestResults = async (modelId: string) => {
    try {
      setLoading(prev => ({ ...prev, tests: true }));
      const results = await CICDTestService.getTestResults(modelId);
      setTestResults(results);
    } catch (error) {
      console.error('Error loading test results:', error);
      setError('Failed to load test results');
    } finally {
      setLoading(prev => ({ ...prev, tests: false }));
    }
  };

  // Run tests for selected model
  const runTests = async (testType?: string) => {
    if (!selectedModel) return;

    try {
      setLoading(prev => ({ ...prev, runningTests: true }));
      
      // Use the available runTests method from CICDTestService
      const success = await CICDTestService.runTests(selectedModel.id, testType);
      
      if (success) {
        // After successful test run, refresh test results
        await loadTestResults(selectedModel.id);
      }
    } catch (error) {
      console.error('Error running tests:', error);
      setError('Failed to run tests');
    } finally {
      setLoading(prev => ({ ...prev, runningTests: false }));
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'skipped': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  // Calculate test pass rate
  const calculatePassRate = () => {
    if (testResults.length === 0) return 0;
    
    const passedCount = testResults.filter(result => result.status === 'passed').length;
    return (passedCount / testResults.length) * 100;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Model Management</h1>
        <Button onClick={() => loadModels()}>Refresh Models</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Model List Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Models</CardTitle>
              <CardDescription>Select a model to view details</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.models ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No models available
                </div>
              ) : (
                <div className="space-y-2">
                  {models.map(model => (
                    <div 
                      key={model.id}
                      className={`p-3 rounded-md cursor-pointer hover:bg-gray-100 ${selectedModel?.id === model.id ? 'bg-gray-100 border-l-4 border-blue-500' : ''}`}
                      onClick={() => setSelectedModel(model)}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">{model.modelType}</div>
                      <div className="text-xs text-gray-400">v{model.version}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Model Details */}
        <div className="md:col-span-3">
          {selectedModel ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedModel.name}</CardTitle>
                        <CardDescription>{selectedModel.description || 'No description available'}</CardDescription>
                      </div>
                      <Badge>{selectedModel.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Model Details</h3>
                        <Separator className="my-2" />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Version:</span>
                            <span className="text-sm font-medium">{selectedModel.version}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Training Rounds:</span>
                            <span className="text-sm font-medium">{selectedModel.trainingDataSize}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Participants:</span>
                            <span className="text-sm font-medium">{selectedModel.parameters}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Last Updated:</span>
                            <span className="text-sm font-medium">
                              {new Date(selectedModel.lastUpdated).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Created:</span>
                            <span className="text-sm font-medium">
                              {new Date(selectedModel.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Performance Metrics</h3>
                        <Separator className="my-2" />
                        <div className="space-y-3">
                          {Object.entries(selectedModel.metrics).length > 0 ? (
                            Object.entries(selectedModel.metrics).map(([key, value]) => (
                              <div key={key}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm capitalize">{key}:</span>
                                  <span className="text-sm font-medium">
                                    {typeof value === 'number' ? value.toFixed(4) : value}
                                  </span>
                                </div>
                                {typeof value === 'number' && (
                                  <Progress value={value * 100} className="h-2" />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500 py-2">
                              No metrics available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500">Model Architecture</h3>
                      <Separator className="my-2" />
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm">
                          <div className="mb-2">
                            <span className="font-medium">Input Shape:</span> [{selectedModel.inputShape.join(', ')}]
                          </div>
                          <div>
                            <span className="font-medium">Output Shape:</span> [{selectedModel.outputShape.join(', ')}]
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setActiveTab('testing')}>
                      View Tests
                    </Button>
                    <Button onClick={() => setActiveTab('training')}>
                      Training History
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Testing Tab */}
              <TabsContent value="testing">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Model Testing</CardTitle>
                        <CardDescription>Run and view test results for {selectedModel.name}</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => runTests('unit')}
                          disabled={loading.runningTests}
                        >
                          Unit Tests
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => runTests('regression')}
                          disabled={loading.runningTests}
                        >
                          Regression Tests
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => runTests('bias')}
                          disabled={loading.runningTests}
                        >
                          Bias Tests
                        </Button>
                        <Button 
                          onClick={() => runTests()}
                          disabled={loading.runningTests}
                        >
                          Run All Tests
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading.runningTests && (
                      <Alert className="mb-4">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                          <AlertTitle>Running tests...</AlertTitle>
                        </div>
                        <AlertDescription>
                          Please wait while tests are being executed.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Test Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{testResults.length}</div>
                              <div className="text-sm text-gray-500">Total Tests</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-500">
                                {testResults.filter(r => r.status === 'passed').length}
                              </div>
                              <div className="text-sm text-gray-500">Passed</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-500">
                                {testResults.filter(r => r.status === 'failed').length}
                              </div>
                              <div className="text-sm text-gray-500">Failed</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold">
                                {calculatePassRate().toFixed(0)}%
                              </div>
                              <div className="text-sm text-gray-500">Pass Rate</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <h3 className="text-sm font-medium text-gray-500 mb-2">Test Results</h3>
                    {loading.tests ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : testResults.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No test results available
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {testResults.map(result => (
                          <Card key={result.id}>
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <Badge className={getStatusColor(result.status)}>
                                      {result.status.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline">{result.testType}</Badge>
                                    <div className="text-sm text-gray-500">
                                      {new Date(result.timestamp).toLocaleString()}
                                    </div>
                                  </div>
                                  {result.details?.message && (
                                    <div className="mt-2 text-sm">
                                      {result.details.message}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  {Object.entries(result.metrics).map(([key, value]) => (
                                    <div key={key} className="text-sm">
                                      <span className="capitalize">{key}:</span> 
                                      <span className="font-medium ml-1">
                                        {typeof value === 'number' ? value.toFixed(4) : value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Training Tab */}
              <TabsContent value="training">
                <Card>
                  <CardHeader>
                    <CardTitle>Training History</CardTitle>
                    <CardDescription>View training history and contributions for {selectedModel.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Training Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{selectedModel.trainingRounds}</div>
                              <div className="text-sm text-gray-500">Training Rounds</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{selectedModel.participantCount}</div>
                              <div className="text-sm text-gray-500">Contributors</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold">
                                {selectedModel.metrics.accuracy ? 
                                  (selectedModel.metrics.accuracy * 100).toFixed(2) + '%' : 
                                  'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">Current Accuracy</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Training Contributions</h3>
                      <div className="text-center py-4 text-gray-500">
                        Training contribution history will be displayed here
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline" disabled>
                      Request New Training Round
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-10">
                <div className="text-center text-gray-500">
                  <p className="mb-2">Select a model from the list to view details</p>
                  {models.length === 0 && !loading.models && (
                    <Button onClick={() => loadModels()}>Refresh Models</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}