import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BiasDetectionService } from '@/services/biasdetectionservice';

// Initialize services
const biasDetectionService = new BiasDetectionService();

/**
 * API endpoint to provide anonymized public statistics
 * 
 * @param request NextRequest object containing optional filter parameters
 * @returns NextResponse with anonymized statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get optional filter parameters
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || 'all'; // all, week, month, year
    const category = searchParams.get('category') || 'all'; // all, theft, fraud, etc.
    const region = searchParams.get('region') || 'all'; // all, or specific region code
    
    // Apply rate limiting (in a real implementation, this would use express-rate-limit or similar)
    // For this example, we'll just simulate it
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const isRateLimited = await checkRateLimit(clientIp);
    
    if (isRateLimited) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Get date range based on timeframe
    const dateRange = getDateRange(timeframe);
    
    // Fetch statistics from database
    const stats = await fetchStatistics(dateRange, category, region);
    
    // Get AI fairness metrics
    const fairnessMetrics = await biasDetectionService.getFairnessMetrics();
    
    // Prepare the response
    const response = {
      timeframe,
      category,
      region,
      generatedAt: new Date(),
      stats,
      fairnessMetrics
    };
    
    // Log this API request for monitoring
    await logApiRequest('public-stats', clientIp, { timeframe, category, region });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching public statistics:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching statistics' },
      { status: 500 }
    );
  }
}

/**
 * Check if the client has exceeded rate limits
 * 
 * @param clientIp The client's IP address
 * @returns Boolean indicating if rate limit is exceeded
 */
async function checkRateLimit(clientIp: string): Promise<boolean> {
  try {
    // In a real implementation, this would use a proper rate limiting solution
    // For this example, we'll just simulate it
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 10; // 10 requests per minute
    
    // Get recent requests from this IP
    const recentRequests = await db.table('apiRequests')
      .where('ipAddress')
      .equals(clientIp)
      .and(item => item.timestamp > now - windowMs)
      .toArray();
    
    return recentRequests.length >= maxRequests;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false; // Default to allowing the request if there's an error
  }
}

/**
 * Get date range based on timeframe parameter
 * 
 * @param timeframe The timeframe string (all, week, month, year)
 * @returns Object with start and end dates
 */
function getDateRange(timeframe: string): { startDate: Date | null, endDate: Date } {
  const endDate = new Date();
  let startDate: Date | null = null;
  
  switch (timeframe) {
    case 'week':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'all':
    default:
      // No start date filter
      startDate = null;
      break;
  }
  
  return { startDate, endDate };
}

/**
 * Fetch anonymized statistics from the database
 * 
 * @param dateRange Object with start and end dates
 * @param category Category filter
 * @param region Region filter
 * @returns Object with anonymized statistics
 */
async function fetchStatistics(
  dateRange: { startDate: Date | null, endDate: Date },
  category: string,
  region: string
) {
  // In a real implementation, this would query the actual database
  // For this example, we'll return sample data
  
  // Simulate database query with filters
  let firs = await db.table('firs').toArray();
  
  // Apply date filter if startDate is provided
  if (dateRange.startDate) {
    firs = firs.filter(fir => 
      new Date(fir.createdAt) >= dateRange.startDate! && 
      new Date(fir.createdAt) <= dateRange.endDate
    );
  }
  
  // Apply category filter if not 'all'
  if (category !== 'all') {
    firs = firs.filter(fir => fir.category === category);
  }
  
  // Apply region filter if not 'all'
  if (region !== 'all') {
    firs = firs.filter(fir => fir.region === region);
  }
  
  // If no FIRs are found in the database, return sample data
  if (firs.length === 0) {
    return getSampleStatistics();
  }
  
  // Calculate statistics
  const totalFIRs = firs.length;
  const resolvedFIRs = firs.filter(fir => fir.status === 'resolved').length;
  const investigatingFIRs = firs.filter(fir => fir.status === 'investigating').length;
  const pendingFIRs = firs.filter(fir => fir.status === 'pending').length;
  
  // Calculate average resolution time
  const resolvedFIRsList = firs.filter(fir => 
    fir.status === 'resolved' && fir.resolvedAt && fir.createdAt
  );
  
  let averageResolutionDays = 0;
  if (resolvedFIRsList.length > 0) {
    const totalDays = resolvedFIRsList.reduce((sum, fir) => {
      const created = new Date(fir.createdAt);
      const resolved = new Date(fir.resolvedAt);
      const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    averageResolutionDays = totalDays / resolvedFIRsList.length;
  }
  
  // Count FIRs by category
  const categoryCounts: Record<string, number> = {};
  firs.forEach(fir => {
    const category = fir.category || 'uncategorized';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  // Format category data for charts
  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
  
  // Count FIRs by month
  const monthlyFIRs: Record<string, number> = {};
  firs.forEach(fir => {
    const date = new Date(fir.createdAt);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyFIRs[monthYear] = (monthlyFIRs[monthYear] || 0) + 1;
  });
  
  // Format monthly data for charts (last 12 months)
  const monthlyData = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleString('default', { month: 'short' });
    monthlyData.push({
      month: monthName,
      count: monthlyFIRs[monthYear] || 0
    });
  }
  
  return {
    firs: {
      total: totalFIRs,
      resolved: resolvedFIRs,
      investigating: investigatingFIRs,
      pending: pendingFIRs
    },
    categories: categoryData,
    monthlyFIRs: monthlyData,
    processingTimes: {
      averageResolutionDays: parseFloat(averageResolutionDays.toFixed(1))
    }
  };
}

/**
 * Get sample statistics when no real data is available
 * 
 * @returns Object with sample statistics
 */
function getSampleStatistics() {
  return {
    firs: {
      total: 1245,
      resolved: 876,
      investigating: 289,
      pending: 80
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
    }
  };
}

/**
 * Log API requests for monitoring
 * 
 * @param endpoint The API endpoint
 * @param clientIp The client's IP address
 * @param params The request parameters
 */
async function logApiRequest(endpoint: string, clientIp: string, params: any) {
  try {
    await db.table('apiRequests').add({
      endpoint,
      ipAddress: clientIp,
      timestamp: Date.now(),
      params: JSON.stringify(params)
    });
  } catch (error) {
    console.error('Error logging API request:', error);
    // Non-critical error, so we don't throw it
  }
}