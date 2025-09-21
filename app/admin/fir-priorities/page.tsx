'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FIRPriorityService } from '@/services/firpriorityservice';
import { RepeatOffenderService } from '@/services/repeatoffenderservice';
import { BiasDetectionService } from '@/services/biasdetectionservice';

// Initialize services
const firPriorityService = new FIRPriorityService();
const repeatOffenderService = new RepeatOffenderService();
const biasDetectionService = new BiasDetectionService();

// Import FIR interface from service
import { FIR } from '@/services/firpriorityservice';

// Local FIR interface extension
interface LocalFIR extends FIR {
  caseNumber: string;
  reportedDate: Date;
  category: string;
  complainant: {
    name: string;
    contact: string;
  };
  priorityScore?: number;
  priorityDetails?: {
    urgency: number;
    severity: number;
    publicImpact: number;
    repeatOffender: number;
    geographicalHotspot: number;
  };
  biasAudit?: {
    score: number;
    factors: string[];
    recommendation: string;
  };
  linkedCases?: {
    id: string;
    name: string;
    count: number;
  }[];
  riskScore?: number;
}

// Create a mapper function to convert between FIR and LocalFIR
function mapToServiceFIR(localFir: LocalFIR): FIR {
  return {
    id: localFir.id,
    title: localFir.title,
    description: localFir.description,
    location: localFir.location,
    timestamp: localFir.reportedDate,
    status: localFir.status,
    tags: [localFir.category],
    evidence: []
  };
}

function mapToLocalFIR(fir: FIR, localData: Partial<LocalFIR> = {}): LocalFIR {
  return {
    ...fir,
    caseNumber: localData.caseNumber || `FIR-${fir.id}`,
    reportedDate: localData.reportedDate || fir.timestamp,
    category: localData.category || (fir.tags && fir.tags.length > 0 ? fir.tags[0] : 'General'),
    complainant: localData.complainant || {
      name: 'Anonymous',
      contact: 'N/A'
    },
    ...localData
  };
}

export default function FIRPrioritiesPage() {
  const [firs, setFirs] = useState<LocalFIR[]>([]);
  const [filteredFirs, setFilteredFirs] = useState<LocalFIR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedFIR, setSelectedFIR] = useState<LocalFIR | null>(null);
  const [showBiasAudit, setShowBiasAudit] = useState(false);

  // Load FIRs on mount
  useEffect(() => {
    loadFIRs();
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [firs, searchTerm, categoryFilter, statusFilter, priorityFilter]);

  // Load FIRs from database
  const loadFIRs = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch from the database
      // For demo purposes, we'll create sample data
      const sampleFIRs = generateSampleFIRs(50);
      
      // Calculate priority scores for each FIR
      const prioritizedFIRs = await Promise.all(
        sampleFIRs.map(async (fir) => {
          // Convert LocalFIR to service FIR
          const serviceFir = mapToServiceFIR(fir);
          
          const priorityScore = await firPriorityService.calculateFIRPriorityScore(serviceFir);
          const priorityDetails = {
            urgency: await firPriorityService.calculateUrgencyScore(serviceFir),
            severity: await firPriorityService.calculateSeverityScore(serviceFir),
            publicImpact: await firPriorityService.calculatePublicImpactScore(serviceFir),
            repeatOffender: await firPriorityService.calculateRepeatOffenderScore(serviceFir),
            geographicalHotspot: await firPriorityService.calculateGeographicalHotspotScore(serviceFir)
          };
          
          // Check for linked cases (repeat offenders)
          const linkedCases = await repeatOffenderService.detectRepeatOffenders(fir.id);
          
          return {
            ...fir,
            priorityScore,
            priorityDetails,
            linkedCases: linkedCases.length > 0 ? linkedCases : undefined
          };
        })
      );
      
      // Sort by priority score (highest first)
      const sortedFIRs = prioritizedFIRs.sort((a, b) => 
        (b.priorityScore || 0) - (a.priorityScore || 0)
      );
      
      setFirs(sortedFIRs);
    } catch (error) {
      console.error('Error loading FIRs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to FIRs
  const applyFilters = () => {
    let filtered = [...firs];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(fir => 
        fir.caseNumber.toLowerCase().includes(term) ||
        fir.title.toLowerCase().includes(term) ||
        fir.description.toLowerCase().includes(term) ||
        fir.location.toLowerCase().includes(term) ||
        fir.complainant.name.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(fir => fir.category === categoryFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(fir => fir.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      const score = Number(priorityFilter);
      filtered = filtered.filter(fir => {
        const priorityScore = fir.priorityScore || 0;
        if (score === 90) return priorityScore >= 90; // Critical
        if (score === 75) return priorityScore >= 75 && priorityScore < 90; // High
        if (score === 50) return priorityScore >= 50 && priorityScore < 75; // Medium
        if (score === 0) return priorityScore < 50; // Low
        return true;
      });
    }
    
    setFilteredFirs(filtered);
  };

  // Get priority badge based on score
  const getPriorityBadge = (score?: number) => {
    if (!score) return <Badge variant="outline">Unrated</Badge>;
    
    if (score >= 90) return <Badge className="bg-red-500">Critical</Badge>;
    if (score >= 75) return <Badge className="bg-orange-500">High</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge className="bg-green-500">Low</Badge>;
  };

  // View FIR details
  const viewFIRDetails = async (fir: FIR) => {
    // If bias audit not already performed, do it now
    if (!fir.biasAudit) {
      try {
        const biasAudit = await biasDetectionService.auditFIRPrioritization(fir);
        fir.biasAudit = biasAudit;
      } catch (error) {
        console.error('Error performing bias audit:', error);
      }
    }

    // Convert FIR to LocalFIR before setting state
    const localFir: LocalFIR = {
      ...fir,
      caseNumber: `CN-${fir.id}`,
      reportedDate: new Date(),
      category: 'General',
      complainant: {
        name: 'Unknown',
        contact: 'N/A'
      },
      riskScore: Math.floor(Math.random() * 100),
      linkedCases: fir.linkedCases || [
        { id: "case1", name: "Case #1", count: 3 },
        { id: "case2", name: "Case #2", count: 1 }
      ]
    };
    
    setSelectedFIR(localFir);
  };

  // Generate sample FIRs for demo
  const generateSampleFIRs = (count: number): LocalFIR[] => {
    const categories = ['theft', 'assault', 'fraud', 'cybercrime', 'vandalism', 'domestic', 'narcotics'];
    const statuses: FIR['status'][] = ['pending', 'in-progress', 'resolved', 'closed'];
    const locations = [
      'Sector 14, Gurugram', 'Connaught Place, New Delhi', 'Bandra West, Mumbai',
      'Koramangala, Bangalore', 'Salt Lake, Kolkata', 'Jubilee Hills, Hyderabad'
    ];
    
    return Array.from({ length: count }, (_, i) => {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const reportedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      return {
        id: `fir-${i + 1}`,
        caseNumber: `FIR-${2023}-${1000 + i}`,
        title: getCaseTitle(category),
        description: getCaseDescription(category),
        reportedDate,
        timestamp: reportedDate, // Add timestamp property
        location,
        status,
        category,
        complainant: {
          name: getRandomName(),
          contact: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`
        },
        tags: [category] // Add tags property
      };
    });
  };

  // Helper function to get case title based on category
  const getCaseTitle = (category: string): string => {
    switch (category) {
      case 'theft': return `Theft of personal property at ${Math.random() > 0.5 ? 'residence' : 'public place'}`;
      case 'assault': return `${Math.random() > 0.5 ? 'Physical' : 'Verbal'} assault at ${Math.random() > 0.5 ? 'workplace' : 'public place'}`;
      case 'fraud': return `${Math.random() > 0.5 ? 'Financial' : 'Identity'} fraud case`;
      case 'cybercrime': return `${Math.random() > 0.5 ? 'Online harassment' : 'Phishing attack'}`;
      case 'vandalism': return `Vandalism of ${Math.random() > 0.5 ? 'public' : 'private'} property`;
      case 'domestic': return `Domestic ${Math.random() > 0.5 ? 'dispute' : 'violence'} case`;
      case 'narcotics': return `Possession of illegal substances`;
      default: return `Case related to ${category}`;
    }
  };

  // Helper function to get case description based on category
  const getCaseDescription = (category: string): string => {
    switch (category) {
      case 'theft':
        return `Complainant reported theft of ${Math.random() > 0.5 ? 'mobile phone and wallet' : 'laptop and jewelry'} from ${Math.random() > 0.5 ? 'residence' : 'while traveling'}. Estimated value of stolen items is approximately Rs. ${Math.floor(Math.random() * 50000) + 5000}.`;
      case 'assault':
        return `Complainant was allegedly ${Math.random() > 0.5 ? 'physically attacked' : 'verbally threatened'} by ${Math.random() > 0.5 ? 'known person' : 'stranger'} at ${Math.random() > 0.5 ? 'workplace' : 'public place'}. ${Math.random() > 0.7 ? 'Medical attention was required.' : 'No serious injuries reported.'}`;
      case 'fraud':
        return `Complainant reports being defrauded of Rs. ${Math.floor(Math.random() * 100000) + 10000} through ${Math.random() > 0.5 ? 'online transaction scam' : 'fake investment scheme'}. The incident occurred on ${new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}.`;
      case 'cybercrime':
        return `Complainant reports ${Math.random() > 0.5 ? 'unauthorized access to online accounts' : 'online harassment and threats'} from ${Math.random() > 0.5 ? 'unknown persons' : 'fake profiles'}. Incident has been ongoing for ${Math.floor(Math.random() * 30) + 1} days.`;
      case 'vandalism':
        return `Complainant reports damage to ${Math.random() > 0.5 ? 'vehicle' : 'property'} by unknown persons. Estimated damage worth Rs. ${Math.floor(Math.random() * 30000) + 5000}. Incident occurred during ${Math.random() > 0.5 ? 'night hours' : 'daytime'}.`;
      case 'domestic':
        return `Complainant reports ${Math.random() > 0.5 ? 'verbal abuse and threats' : 'physical altercation'} within household. ${Math.random() > 0.7 ? 'Children were present during the incident.' : 'No minors were present during the incident.'}`;
      case 'narcotics':
        return `Report of ${Math.random() > 0.5 ? 'drug dealing activity' : 'substance abuse'} in ${Math.random() > 0.5 ? 'residential area' : 'public space'}. ${Math.random() > 0.7 ? 'Multiple witnesses have confirmed the activity.' : 'Limited witness information available.'}`;
      default:
        return `Detailed description of the ${category} case as reported by the complainant.`;
    }
  };

  // Helper function to generate random names
  const getRandomName = (): string => {
    const firstNames = ['Amit', 'Priya', 'Rahul', 'Neha', 'Vikram', 'Anjali', 'Sanjay', 'Meera', 'Rajesh', 'Sunita'];
    const lastNames = ['Sharma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Verma', 'Joshi', 'Malhotra', 'Kapoor', 'Mehta'];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI FIR Priority Dashboard</h1>
        <Button onClick={loadFIRs} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh FIRs'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by case number, title, etc."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="assault">Assault</SelectItem>
                  <SelectItem value="fraud">Fraud</SelectItem>
                  <SelectItem value="cybercrime">Cybercrime</SelectItem>
                  <SelectItem value="vandalism">Vandalism</SelectItem>
                  <SelectItem value="domestic">Domestic</SelectItem>
                  <SelectItem value="narcotics">Narcotics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="90">Critical</SelectItem>
                  <SelectItem value="75">High</SelectItem>
                  <SelectItem value="50">Medium</SelectItem>
                  <SelectItem value="0">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}>
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FIR List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>AI Prioritized FIRs</CardTitle>
              <CardDescription>
                {filteredFirs.length} FIRs found, sorted by priority score
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredFirs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No FIRs found matching the current filters
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFirs.map((fir) => (
                      <TableRow key={fir.id} className={fir.linkedCases ? 'bg-yellow-50' : ''}>
                        <TableCell className="font-medium">{fir.caseNumber}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">{fir.title}</div>
                          {fir.linkedCases && (
                            <Badge variant="outline" className="mt-1">
                              Repeat Offender
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{fir.reportedDate.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`
                            ${fir.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${fir.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                            ${fir.status === 'resolved' ? 'bg-green-100 text-green-800' : ''}
                            ${fir.status === 'closed' ? 'bg-gray-100 text-gray-800' : ''}
                          `}>
                            {fir.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{getPriorityBadge(fir.priorityScore)}</TableCell>
                        <TableCell>
                          {fir.priorityScore ? (
                            <div className="flex items-center">
                              <span className="mr-2">{fir.priorityScore.toFixed(0)}</span>
                              <Progress value={fir.priorityScore} className="w-16 h-2" />
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => viewFIRDetails(fir)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FIR Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedFIR ? 'FIR Details' : 'Select an FIR'}
              </CardTitle>
              {selectedFIR && (
                <CardDescription>
                  {selectedFIR.caseNumber} - {getPriorityBadge(selectedFIR.priorityScore)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedFIR ? (
                <div className="text-center py-8 text-gray-500">
                  Select an FIR from the list to view details
                </div>
              ) : (
                <div>
                  <Tabs defaultValue="details">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="priority">Priority Analysis</TabsTrigger>
                      <TabsTrigger value="bias">Bias Audit</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Title</h3>
                        <p>{selectedFIR.title}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p>{selectedFIR.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Category</h3>
                          <p className="capitalize">{selectedFIR.category}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Status</h3>
                          <p className="capitalize">{selectedFIR.status.replace('-', ' ')}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Location</h3>
                        <p>{selectedFIR.location}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Complainant</h3>
                          <p>{selectedFIR.complainant.name}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                          <p>{selectedFIR.complainant.contact}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Reported Date</h3>
                        <p>{selectedFIR.reportedDate.toLocaleDateString()}</p>
                      </div>
                      
                      {selectedFIR.linkedCases && selectedFIR.linkedCases.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Linked Cases</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedFIR.linkedCases.map(caseItem => (
                              <Badge key={caseItem.id} variant="outline">{caseItem.name} ({caseItem.count})</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="priority">
                      {selectedFIR.priorityDetails ? (
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Overall Priority Score</span>
                              <span className="text-sm font-medium">
                                {selectedFIR.priorityScore?.toFixed(0) || 'N/A'}
                              </span>
                            </div>
                            <Progress 
                              value={selectedFIR.priorityScore} 
                              className="h-2"
                              style={{
                                background: selectedFIR.priorityScore && selectedFIR.priorityScore >= 90 ? 'linear-gradient(90deg, #f87171, #ef4444)' :
                                  selectedFIR.priorityScore && selectedFIR.priorityScore >= 75 ? 'linear-gradient(90deg, #fb923c, #f97316)' :
                                  selectedFIR.priorityScore && selectedFIR.priorityScore >= 50 ? 'linear-gradient(90deg, #facc15, #eab308)' :
                                  'linear-gradient(90deg, #4ade80, #22c55e)'
                              }}
                            />
                          </div>
                          
                          <div className="pt-4">
                            <h3 className="text-sm font-medium mb-3">Priority Factors</h3>
                            
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Urgency</span>
                                  <span className="text-sm font-medium">
                                    {(selectedFIR.priorityDetails.urgency * 100).toFixed(0)}
                                  </span>
                                </div>
                                <Progress value={selectedFIR.priorityDetails.urgency * 100} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Severity</span>
                                  <span className="text-sm font-medium">
                                    {(selectedFIR.priorityDetails.severity * 100).toFixed(0)}
                                  </span>
                                </div>
                                <Progress value={selectedFIR.priorityDetails.severity * 100} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Public Impact</span>
                                  <span className="text-sm font-medium">
                                    {(selectedFIR.priorityDetails.publicImpact * 100).toFixed(0)}
                                  </span>
                                </div>
                                <Progress value={selectedFIR.priorityDetails.publicImpact * 100} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Repeat Offender</span>
                                  <span className="text-sm font-medium">
                                    {(selectedFIR.priorityDetails.repeatOffender * 100).toFixed(0)}
                                  </span>
                                </div>
                                <Progress value={selectedFIR.priorityDetails.repeatOffender * 100} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Geographical Hotspot</span>
                                  <span className="text-sm font-medium">
                                    {(selectedFIR.priorityDetails.geographicalHotspot * 100).toFixed(0)}
                                  </span>
                                </div>
                                <Progress value={selectedFIR.priorityDetails.geographicalHotspot * 100} className="h-2" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          Priority details not available
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="bias">
                      {selectedFIR.biasAudit ? (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Bias Audit Score</h3>
                            <div className="flex items-center">
                              <Badge className={`
                                ${selectedFIR.biasAudit.score >= 90 ? 'bg-green-500' : ''}
                                ${selectedFIR.biasAudit.score >= 70 && selectedFIR.biasAudit.score < 90 ? 'bg-yellow-500' : ''}
                                ${selectedFIR.biasAudit.score < 70 ? 'bg-red-500' : ''}
                              `}>
                                {selectedFIR.biasAudit.score}/100
                              </Badge>
                              <span className="ml-2 text-sm">
                                {selectedFIR.biasAudit.score >= 90 ? 'Fair Assessment' : 
                                 selectedFIR.biasAudit.score >= 70 ? 'Potential Bias' : 'Significant Bias'}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Factors Considered</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedFIR.biasAudit.factors.map((factor, index) => (
                                <Badge key={index} variant="outline">{factor}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Recommendation</h3>
                            <p className="text-sm">{selectedFIR.biasAudit.recommendation}</p>
                          </div>
                          
                          <div className="pt-2">
                            <Button variant="outline" size="sm" className="w-full">
                              Request Human Review
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          Bias audit not available
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
            {selectedFIR && (
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedFIR(null)}>
                  Back to List
                </Button>
                <Button>
                  Assign Investigator
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}