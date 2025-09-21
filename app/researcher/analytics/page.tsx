'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { CollectionEvent } from '@/lib/db';
import { NotificationCenter } from '@/components/notification-center';
import { BarChart, PieChart, LineChart, RefreshCw, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ResearcherAnalyticsPage() {
  const [events, setEvents] = useState<CollectionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('species');
  const [speciesData, setSpeciesData] = useState<{name: string, count: number}[]>([]);
  const [locationData, setLocationData] = useState<{region: string, count: number}[]>([]);
  const [timelineData, setTimelineData] = useState<{month: string, count: number}[]>([]);
  const [qualityData, setQualityData] = useState<{range: string, count: number}[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const allEvents = await db.collectionEvents.toArray();
      setEvents(allEvents);
      processData(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processData = (events: CollectionEvent[]) => {
    // Process species data
    const speciesCount: Record<string, number> = {};
    events.forEach(event => {
      speciesCount[event.species] = (speciesCount[event.species] || 0) + 1;
    });
    const speciesArray = Object.entries(speciesCount).map(([name, count]) => ({ name, count }));
    setSpeciesData(speciesArray.sort((a, b) => b.count - a.count));

    // Process location data (simplified by using lat/lon rounded to 1 decimal place as region)
    const locationCount: Record<string, number> = {};
    events.forEach(event => {
      const region = `${event.location.lat.toFixed(1)},${event.location.lon.toFixed(1)}`;
      locationCount[region] = (locationCount[region] || 0) + 1;
    });
    const locationArray = Object.entries(locationCount).map(([region, count]) => ({ region, count }));
    setLocationData(locationArray.sort((a, b) => b.count - a.count));

    // Process timeline data (by month)
    const timelineCount: Record<string, number> = {};
    events.forEach(event => {
      const date = new Date(event.timestamp);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      timelineCount[month] = (timelineCount[month] || 0) + 1;
    });
    const timelineArray = Object.entries(timelineCount).map(([month, count]) => ({ month, count }));
    setTimelineData(timelineArray.sort((a, b) => a.month.localeCompare(b.month)));

    // Process quality data (moisture percentage ranges)
    const qualityCount: Record<string, number> = {
      'Low (0-25%)': 0,
      'Medium (26-50%)': 0,
      'High (51-75%)': 0,
      'Very High (76-100%)': 0
    };
    events.forEach(event => {
      const moisture = event.quality.moisturePct;
      if (moisture <= 25) qualityCount['Low (0-25%)']++;
      else if (moisture <= 50) qualityCount['Medium (26-50%)']++;
      else if (moisture <= 75) qualityCount['High (51-75%)']++;
      else qualityCount['Very High (76-100%)']++;
    });
    const qualityArray = Object.entries(qualityCount).map(([range, count]) => ({ range, count }));
    setQualityData(qualityArray);
  };

  const renderBarChart = (data: any[], labelKey: string, valueKey: string, title: string) => {
    const maxValue = Math.max(...data.map(item => item[valueKey]));
    
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item[labelKey]}</span>
                <span>{item[valueKey]}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2" 
                  style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTimelineChart = () => {
    const maxValue = Math.max(...timelineData.map(item => item.count));
    const months = timelineData.map(item => item.month);
    
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Collection Timeline</h3>
        <div className="h-40 flex items-end space-x-2">
          {timelineData.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-primary rounded-t-sm" 
                style={{ height: `${(item.count / maxValue) * 100}%` }}
              />
              <span className="text-xs mt-1 rotate-45 origin-left">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    const total = qualityData.reduce((sum, item) => sum + item.count, 0);
    let startAngle = 0;
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Moisture Distribution</h3>
        <div className="flex justify-center">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {qualityData.map((item, index) => {
                const percentage = (item.count / total) * 100;
                const angle = (percentage / 100) * 360;
                const endAngle = startAngle + angle;
                
                // Calculate SVG arc path
                const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
                
                const largeArcFlag = angle > 180 ? 1 : 0;
                
                const pathData = [
                  `M 50 50`,
                  `L ${x1} ${y1}`,
                  `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  `Z`
                ].join(' ');
                
                const result = (
                  <path 
                    key={index}
                    d={pathData}
                    fill={colors[index % colors.length]}
                  />
                );
                
                startAngle = endAngle;
                return result;
              })}
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {qualityData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm">{item.range}: {item.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AuthGuard requiredRole="researcher">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Research Analytics</h1>
          <div className="flex items-center gap-2">
            <Link href="/researcher">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/researcher/lab">
              <Button variant="outline" size="sm">
                Lab Certificates
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadEvents}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <NotificationCenter />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Species Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <div className="text-sm text-muted-foreground">Total samples collected</div>
              <div className="text-sm text-muted-foreground">{speciesData.length} unique species</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Collection Sites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{locationData.length}</div>
              <div className="text-sm text-muted-foreground">Unique collection locations</div>
              <div className="text-sm text-muted-foreground">
                Most active: {locationData[0]?.region.split(',').map(coord => parseFloat(coord).toFixed(1)).join(', ')}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Collection Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {timelineData.length > 0 ? `${timelineData[0].month} - ${timelineData[timelineData.length - 1].month}` : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">{timelineData.length} months of data</div>
              <div className="text-sm text-muted-foreground">
                Peak: {timelineData.sort((a, b) => b.count - a.count)[0]?.month || 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="species" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="species">Species</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
          </TabsList>
          
          <Card>
            <CardContent className="pt-6">
              <TabsContent value="species">
                {renderBarChart(speciesData.slice(0, 10), 'name', 'count', 'Top 10 Species Collected')}
              </TabsContent>
              
              <TabsContent value="location">
                {renderBarChart(locationData.slice(0, 10), 'region', 'count', 'Top 10 Collection Locations')}
              </TabsContent>
              
              <TabsContent value="timeline">
                {renderTimelineChart()}
              </TabsContent>
              
              <TabsContent value="quality">
                {renderPieChart()}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </AuthGuard>
  );
}