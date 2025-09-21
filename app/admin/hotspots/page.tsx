'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { HotspotPredictionService } from '@/services/hotspotpredictionservice';
import { FIRPriorityService } from '@/services/firpriorityservice';

// Initialize services
const hotspotService = new HotspotPredictionService();
const firPriorityService = new FIRPriorityService();

// Sample coordinates for India
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const CITY_COORDINATES = {
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
};

// Interface for hotspot data
interface Hotspot {
  id: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  riskScore: number;
  crimeTypes: string[];
  recentIncidents: number;
  radius: number; // in meters
  lastUpdated: Date;
  relatedFIRs?: string[];
  predictionConfidence: number;
}

// Interface for FIR data
interface FIR {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  location: string;
  geoLocation?: {
    lat: number;
    lng: number;
  };
  reportedDate: Date;
  category: string;
  status: string;
  priorityScore?: number;
}

export default function HotspotsPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [firs, setFirs] = useState<FIR[]>([]);
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [timeRange, setTimeRange] = useState('7'); // days
  const [crimeTypeFilter, setCrimeTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('heatmap'); // heatmap, markers, circles
  const [riskThreshold, setRiskThreshold] = useState(50); // minimum risk score to display
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Load Google Maps API
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google) {
      // Add Google Maps types
      window.google = {
        maps: {
          Map: class {},
          LatLng: class {},
          Marker: class {},
          InfoWindow: class {},
          Circle: class {},
          SymbolPath: { CIRCLE: 0 },
          MapTypeId: { ROADMAP: 'roadmap' },
          visualization: {
            HeatmapLayer: class {}
          }
        }
      } as any;
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBNLrJhOMz6idD05pzfn5lhA-TAw-mAZCU'}&libraries=visualization`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    } else if (window.google) {
      setMapLoaded(true);
    }
  }, []);
  
  // Initialize map when API is loaded
  useEffect(() => {
    if (mapLoaded && mapRef.current && !googleMapRef.current) {
      const cityCoords = CITY_COORDINATES[selectedCity as keyof typeof CITY_COORDINATES] || INDIA_CENTER;

      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: cityCoords,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
      });
      
      // Initialize heatmap layer
      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        map: googleMapRef.current,
        radius: 30,
        opacity: 0.7,
        gradient: [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
          'rgba(0, 191, 255, 1)',
          'rgba(0, 127, 255, 1)',
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(0, 0, 223, 1)',
          'rgba(0, 0, 191, 1)',
          'rgba(0, 0, 159, 1)',
          'rgba(0, 0, 127, 1)',
          'rgba(63, 0, 91, 1)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)',
          'rgba(255, 0, 0, 1)'
        ]
      });
      
      loadHotspots();
    }
  }, [mapLoaded, selectedCity]);
  
  // Update map when filters change
  useEffect(() => {
    if (googleMapRef.current && hotspots.length > 0) {
      updateMapVisualization();
    }
  }, [hotspots, viewMode, riskThreshold, crimeTypeFilter]);
  
  // Load hotspots data
  const loadHotspots = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch from the database
      // For demo purposes, we'll create sample data
      const cityCoords = CITY_COORDINATES[selectedCity as keyof typeof CITY_COORDINATES] || INDIA_CENTER;
      const sampleHotspots = generateSampleHotspots(cityCoords, 15);
      const sampleFIRs = generateSampleFIRs(cityCoords, 50);
      
      // Process hotspots with the service
      const processedHotspots = await Promise.all(
        sampleHotspots.map(async (hotspot) => {
          // In a real implementation, this would use the actual service
          // For demo, we'll just return the sample data
          return hotspot;
        })
      );
      
      setHotspots(processedHotspots);
      setFirs(sampleFIRs);
      
      // Update map center
      if (googleMapRef.current) {
        googleMapRef.current.setCenter(cityCoords);
      }
      
      updateMapVisualization();
    } catch (error) {
      console.error('Error loading hotspots:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Update map visualization based on selected view mode
  const updateMapVisualization = () => {
    if (!googleMapRef.current) return;
    
    // Clear existing markers and circles
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    circlesRef.current.forEach(circle => circle.setMap(null));
    circlesRef.current = [];
    
    // Filter hotspots based on criteria
    const filteredHotspots = hotspots.filter(hotspot => {
      if (hotspot.riskScore < riskThreshold) return false;
      if (crimeTypeFilter !== 'all' && !hotspot.crimeTypes.includes(crimeTypeFilter)) return false;
      return true;
    });
    
    // Update visualization based on view mode
    if (viewMode === 'heatmap') {
      // Create heatmap data
      const heatmapData = filteredHotspots.map(hotspot => {
        return {
          location: new google.maps.LatLng(hotspot.location.lat, hotspot.location.lng),
          weight: hotspot.riskScore / 100
        };
      });
      
      if (heatmapRef.current) {
        heatmapRef.current.setData(heatmapData);
        heatmapRef.current.setMap(googleMapRef.current);
      }
    } else {
      // Hide heatmap if not in heatmap mode
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
      
      // Create markers or circles
      filteredHotspots.forEach(hotspot => {
        const position = new google.maps.LatLng(hotspot.location.lat, hotspot.location.lng);
        
        if (viewMode === 'markers') {
          // Create marker
          const marker = new google.maps.Marker({
            position,
            map: googleMapRef.current || undefined,
            title: `Risk Score: ${hotspot.riskScore}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: getRiskColor(hotspot.riskScore),
              fillOpacity: 0.7,
              strokeWeight: 1,
              strokeColor: '#ffffff',
              scale: 10
            }
          });
          
          // Add click listener
          marker.addListener('click', () => {
            setSelectedHotspot(hotspot);
          });
          
          markersRef.current.push(marker);
        } else if (viewMode === 'circles') {
          // Add a circle to represent the hotspot area
          const circle = new google.maps.Circle({
            strokeColor: getRiskColor(hotspot.riskScore),
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: getRiskColor(hotspot.riskScore),
            fillOpacity: 0.35,
            map: googleMapRef.current || undefined,
            center: position,
            radius: hotspot.radius,
            clickable: true
          });
          
          // Add click listener
          circle.addListener('click', () => {
            setSelectedHotspot(hotspot);
          });
          
          circlesRef.current.push(circle);
        }
      });
    }
    
    // Add FIR markers if in marker or circle mode
    if (viewMode !== 'heatmap') {
      firs.forEach(fir => {
        if (fir.geoLocation) {
          const marker = new google.maps.Marker({
            position: new google.maps.LatLng(fir.geoLocation.lat, fir.geoLocation.lng),
            map: googleMapRef.current || undefined,
            title: fir.title,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(20, 20)
            },
            zIndex: 1
          });
          
          markersRef.current.push(marker);
        }
      });
    }
  };
  
  // Get color based on risk score
  const getRiskColor = (score: number): string => {
    if (score >= 80) return '#ff0000'; // Red
    if (score >= 60) return '#ff6600'; // Orange
    if (score >= 40) return '#ffcc00'; // Yellow
    return '#00cc00'; // Green
  };
  
  // Generate sample hotspots for demo
  const generateSampleHotspots = (centerCoords: {lat: number, lng: number}, count: number): Hotspot[] => {
    const crimeTypes = ['theft', 'assault', 'fraud', 'cybercrime', 'vandalism', 'narcotics', 'robbery'];
    
    return Array.from({ length: count }, (_, i) => {
      // Generate random coordinates within ~5km of center
      const lat = centerCoords.lat + (Math.random() - 0.5) * 0.1;
      const lng = centerCoords.lng + (Math.random() - 0.5) * 0.1;
      
      // Generate random crime types (1-3 types)
      const typeCount = Math.floor(Math.random() * 3) + 1;
      const types: string[] = [];
      for (let j = 0; j < typeCount; j++) {
        const type = crimeTypes[Math.floor(Math.random() * crimeTypes.length)];
        if (!types.includes(type)) types.push(type);
      }
      
      // Generate risk score (higher for certain crime types)
      let baseRiskScore = Math.floor(Math.random() * 100);
      if (types.includes('assault') || types.includes('robbery')) {
        baseRiskScore = Math.min(baseRiskScore + 20, 100);
      }
      
      // Generate related FIRs
      const firCount = Math.floor(Math.random() * 5) + 1;
      const relatedFIRs = Array.from({ length: firCount }, (_, j) => `FIR-${2023}-${1000 + i * 10 + j}`);
      
      return {
        id: `hotspot-${i + 1}`,
        location: {
          lat,
          lng,
          address: getRandomAddress(selectedCity as keyof typeof CITY_COORDINATES)
        },
        riskScore: baseRiskScore,
        crimeTypes: types,
        recentIncidents: Math.floor(Math.random() * 20) + 1,
        radius: Math.floor(Math.random() * 300) + 100, // 100-400m radius
        lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
        relatedFIRs,
        predictionConfidence: Math.floor(Math.random() * 30) + 70 // 70-100% confidence
      };
    });
  };
  
  // Generate sample FIRs for demo
  const generateSampleFIRs = (centerCoords: {lat: number, lng: number}, count: number): FIR[] => {
    const categories = ['theft', 'assault', 'fraud', 'cybercrime', 'vandalism', 'domestic', 'narcotics', 'robbery'];
    const statuses = ['pending', 'in-progress', 'resolved', 'closed'];
    
    return Array.from({ length: count }, (_, i) => {
      // Generate random coordinates within ~7km of center
      const lat = centerCoords.lat + (Math.random() - 0.5) * 0.14;
      const lng = centerCoords.lng + (Math.random() - 0.5) * 0.14;
      
      const category = categories[Math.floor(Math.random() * categories.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      
      return {
        id: `fir-${i + 1}`,
        caseNumber: `FIR-${2023}-${1000 + i}`,
        title: getCaseTitle(category),
        description: `Detailed description of the ${category} case as reported by the complainant.`,
        location: getRandomAddress(selectedCity),
        geoLocation: {
          lat,
          lng
        },
        reportedDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        category,
        status,
        priorityScore: Math.floor(Math.random() * 100)
      };
    });
  };
  
  // Helper function to get case title based on category
  const getCaseTitle = (category: string): string => {
    switch (category) {
      case 'theft': return `Theft of personal property`;
      case 'assault': return `Physical assault incident`;
      case 'fraud': return `Financial fraud case`;
      case 'cybercrime': return `Online harassment report`;
      case 'vandalism': return `Vandalism of property`;
      case 'domestic': return `Domestic dispute case`;
      case 'narcotics': return `Possession of illegal substances`;
      case 'robbery': return `Armed robbery incident`;
      default: return `Case related to ${category}`;
    }
  };
  
  // Helper function to generate random addresses
  const getRandomAddress = (city: keyof typeof CITY_COORDINATES | string): string => {
    const areas: Record<string, string[]> = {
      'Delhi': ['Connaught Place', 'Karol Bagh', 'Chandni Chowk', 'Hauz Khas', 'Dwarka', 'Rohini', 'Pitampura'],
      'Mumbai': ['Bandra', 'Andheri', 'Juhu', 'Colaba', 'Worli', 'Dadar', 'Powai'],
      'Bangalore': ['Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar', 'MG Road', 'Electronic City'],
      'Hyderabad': ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Secunderabad', 'Hitech City'],
      'Chennai': ['T Nagar', 'Adyar', 'Anna Nagar', 'Mylapore', 'Velachery', 'Besant Nagar'],
      'Kolkata': ['Park Street', 'Salt Lake', 'New Town', 'Ballygunge', 'Alipore', 'Howrah'],
      'Ahmedabad': ['Navrangpura', 'Satellite', 'Bodakdev', 'Vastrapur', 'Paldi', 'Maninagar'],
      'Pune': ['Koregaon Park', 'Viman Nagar', 'Kothrud', 'Aundh', 'Shivaji Nagar', 'Hadapsar'],
    };
    
    const cityAreas = areas[city] || ['Central', 'North', 'South', 'East', 'West'];
    const area = cityAreas[Math.floor(Math.random() * cityAreas.length)];
    const streetNumber = Math.floor(Math.random() * 100) + 1;
    const streetNames = ['Main Street', 'Park Road', 'Gandhi Marg', 'Nehru Road', 'Station Road', 'Market Lane'];
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    
    return `${streetNumber} ${streetName}, ${area}, ${city}`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Crime Hotspot Prediction</h1>
        <Button onClick={loadHotspots} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger id="city">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CITY_COORDINATES).map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeRange">Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger id="timeRange">
                  <SelectValue placeholder="Select Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 Hours</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="crimeType">Crime Type</Label>
              <Select value={crimeTypeFilter} onValueChange={setCrimeTypeFilter}>
                <SelectTrigger id="crimeType">
                  <SelectValue placeholder="Select Crime Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="assault">Assault</SelectItem>
                  <SelectItem value="fraud">Fraud</SelectItem>
                  <SelectItem value="cybercrime">Cybercrime</SelectItem>
                  <SelectItem value="vandalism">Vandalism</SelectItem>
                  <SelectItem value="narcotics">Narcotics</SelectItem>
                  <SelectItem value="robbery">Robbery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="viewMode">View Mode</Label>
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger id="viewMode">
                  <SelectValue placeholder="Select View Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heatmap">Heatmap</SelectItem>
                  <SelectItem value="markers">Markers</SelectItem>
                  <SelectItem value="circles">Risk Zones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={() => {
                setSelectedCity('Delhi');
                setTimeRange('7');
                setCrimeTypeFilter('all');
                setViewMode('heatmap');
                setRiskThreshold(50);
              }}>
                Reset Filters
              </Button>
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="riskThreshold">
              Risk Threshold: {riskThreshold}+
            </Label>
            <Slider
              id="riskThreshold"
              min={0}
              max={100}
              step={5}
              value={[riskThreshold]}
              onValueChange={(value) => setRiskThreshold(value[0])}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Map and Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Crime Hotspot Map</CardTitle>
              <CardDescription>
                Showing {hotspots.filter(h => h.riskScore >= riskThreshold).length} hotspots in {selectedCity}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={mapRef} 
                className="w-full h-[600px] rounded-md overflow-hidden"
                style={{ border: '1px solid #e2e8f0' }}
              >
                {!mapLoaded && (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  <span>High Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
                  <span>Medium-High Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                  <span>Medium Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span>Low Risk</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Hotspot Details */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {selectedHotspot ? 'Hotspot Details' : 'Hotspot Information'}
              </CardTitle>
              {selectedHotspot && (
                <CardDescription>
                  Risk Score: {selectedHotspot.riskScore}/100
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedHotspot ? (
                <div>
                  <p className="text-center py-4 text-gray-500 mb-4">
                    Click on a hotspot marker or zone to view details
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Hotspot Statistics</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">{hotspots.length}</div>
                            <div className="text-xs text-gray-500">Total Hotspots</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">
                              {hotspots.filter(h => h.riskScore >= 80).length}
                            </div>
                            <div className="text-xs text-gray-500">High Risk Zones</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">
                              {hotspots.reduce((sum, h) => sum + h.recentIncidents, 0)}
                            </div>
                            <div className="text-xs text-gray-500">Recent Incidents</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">
                              {Math.round(hotspots.reduce((sum, h) => sum + h.predictionConfidence, 0) / hotspots.length)}%
                            </div>
                            <div className="text-xs text-gray-500">Avg. Confidence</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Top Crime Types</h3>
                      <div className="space-y-2">
                        {['theft', 'assault', 'robbery', 'narcotics', 'fraud'].map(type => {
                          const count = hotspots.filter(h => h.crimeTypes.includes(type)).length;
                          const percentage = Math.round((count / hotspots.length) * 100);
                          
                          return (
                            <div key={type} className="flex items-center">
                              <div className="w-24 capitalize">{type}</div>
                              <div className="flex-1 mx-2">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="text-sm">{percentage}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Tabs defaultValue="details">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="incidents">Related FIRs</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Location</h3>
                        <p>{selectedHotspot.location.address}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Risk Assessment</h3>
                        <div className="flex items-center mt-1">
                          <Badge className={`
                            ${selectedHotspot.riskScore >= 80 ? 'bg-red-500' : ''}
                            ${selectedHotspot.riskScore >= 60 && selectedHotspot.riskScore < 80 ? 'bg-orange-500' : ''}
                            ${selectedHotspot.riskScore >= 40 && selectedHotspot.riskScore < 60 ? 'bg-yellow-500' : ''}
                            ${selectedHotspot.riskScore < 40 ? 'bg-green-500' : ''}
                          `}>
                            {selectedHotspot.riskScore}/100
                          </Badge>
                          <span className="ml-2 text-sm">
                            {selectedHotspot.riskScore >= 80 ? 'High Risk' : 
                             selectedHotspot.riskScore >= 60 ? 'Medium-High Risk' : 
                             selectedHotspot.riskScore >= 40 ? 'Medium Risk' : 'Low Risk'}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Crime Types</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedHotspot.crimeTypes.map((type, index) => (
                            <Badge key={index} variant="outline" className="capitalize">{type}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Recent Incidents</h3>
                          <p>{selectedHotspot.recentIncidents}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Radius</h3>
                          <p>{selectedHotspot.radius} meters</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                          <p>{selectedHotspot.lastUpdated.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Confidence</h3>
                          <p>{selectedHotspot.predictionConfidence}%</p>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          Schedule Patrol
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="incidents">
                      {selectedHotspot.relatedFIRs && selectedHotspot.relatedFIRs.length > 0 ? (
                        <div className="space-y-3">
                          {selectedHotspot.relatedFIRs.map((firId, index) => {
                            const fir = firs.find(f => f.caseNumber === firId);
                            return (
                              <Card key={index}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">{firId}</h4>
                                      <p className="text-sm text-gray-500">
                                        {fir ? fir.title : 'Case details not available'}
                                      </p>
                                    </div>
                                    {fir && (
                                      <Badge variant="outline" className="capitalize">
                                        {fir.category}
                                      </Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No related FIRs found
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
            {selectedHotspot && (
              <CardFooter>
                <Button variant="outline" onClick={() => setSelectedHotspot(null)} className="w-full">
                  Back to Summary
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}