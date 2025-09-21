import { NextRequest, NextResponse } from 'next/server';
import { EvidenceUploadService } from '@/services/evidenceUploadService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Simple rate limiting implementation
const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(options: { interval: number; uniqueTokenPerInterval: number; limit: number }) {
  return async function checkRateLimit(req: NextRequest) {
    // Use headers to get IP or fallback to a default value
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const now = Date.now();
    
    const record = ipRequestMap.get(ip) || { count: 0, resetTime: now + options.interval };
    
    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + options.interval;
    } else {
      record.count += 1;
    }
    
    ipRequestMap.set(ip, record);
    
    const remaining = Math.max(0, options.limit - record.count);
    
    // If rate limit exceeded
    if (record.count > options.limit) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        { status: 429 }
      );
    }
    
    return null;
  };
}

// Create a limiter that allows 10 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 100, // Max 100 users per interval
  limit: 10, // 10 requests per interval
});

/**
 * POST handler for evidence uploads
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting
  const limitResult = await limiter(req);
  if (limitResult) return limitResult;
  
  // Get user session
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use a default ID if not available in the session
  const userId = (session.user as any).id || `user-${Date.now()}`;
  
  try {
    // Parse form data
    const formData = await req.formData();
    
    // Validate upload
    const validation = await EvidenceUploadService.validateUpload(formData as any, userId);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    // Process upload
    const result = await EvidenceUploadService.processUpload(
      validation.file as Blob,
      validation.metadata,
      userId
    );
    
    // Get file from form data
    const file = validation.file as File;
    if (!file) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No file provided' },
        { status: 400 }
      );
    }

    // Get metadata from validation result
    const { uploaderRole = 'other', deviceType = 'other', evidenceType = 'other', firId, caseId, description, tags = '', isPublic = false } = validation.metadata;
    
    // Parse location if provided
    let location;
    const lat = formData.get('lat');
    const lng = formData.get('lng');
    if (lat && lng) {
      location = {
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string),
        altitude: formData.get('altitude') ? parseFloat(formData.get('altitude') as string) : undefined,
        accuracy: formData.get('accuracy') ? parseFloat(formData.get('accuracy') as string) : undefined,
        address: formData.get('address') as string || undefined
      };
    }

    // Validate file type based on evidenceType
    const validMimeTypes: Record<string, string[]> = {
      video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      other: []
    };

    if (evidenceType !== 'other' && 
        validMimeTypes[evidenceType] && 
        !validMimeTypes[evidenceType].includes(file.type)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `Invalid file type for ${evidenceType}` },
        { status: 400 }
      );
    }

    // In a real implementation, we would save the file to storage
    // For demo purposes, we'll just create a mock storage path
    const storagePath = `/uploads/${Date.now()}-${file.name}`;
    const thumbnailPath = evidenceType === 'video' || evidenceType === 'image' 
      ? `/thumbnails/${Date.now()}-${file.name.split('.')[0]}.jpg`
      : undefined;

    // Create evidence upload
    const { success, evidenceUploadId } = await EvidenceUploadService.createEvidenceUpload({
      uploaderId: userId, // Using the userId we defined earlier
      uploaderName: session.user.name || 'Unknown',
      uploaderRole: uploaderRole as any,
      deviceType: deviceType as any,
      deviceId: formData.get('deviceId') as string || undefined,
      timestamp: new Date(),
      location,
      evidenceType: evidenceType as any,
      fileSize: file.size,
      duration: formData.get('duration') ? parseFloat(formData.get('duration') as string) : undefined,
      resolution: formData.get('resolution') as string || undefined,
      mimeType: file.type,
      originalFilename: file.name,
      storagePath,
      thumbnailPath,
      firId,
      caseId,
      tags: tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
      description,
      verificationStatus: 'pending',
      processingStatus: 'pending',
      accessControl: {
        isPublic,
        accessList: formData.get('accessList') ? (formData.get('accessList') as string).split(',') : undefined,
        expiresAt: formData.get('expiresAt') ? new Date(formData.get('expiresAt') as string) : undefined
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Evidence upload created successfully',
      evidenceUploadId,
      processingStatus: 'pending'
    });
  } catch (error) {
    console.error('Error handling evidence upload:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to process evidence upload' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for evidence uploads
 */
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter(req);
    if (rateLimitResult) {
      return rateLimitResult; // Returns 429 response if rate limit exceeded
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const firId = url.searchParams.get('firId');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') as string, 10) : 50;
    const uploaderRole = url.searchParams.get('uploaderRole') as string || undefined;

    // Create evidence upload service
    const evidenceUploadService = new EvidenceUploadService();

    // Get evidence uploads based on parameters
    if (id) {
      // Get specific evidence upload
      const evidenceUpload = await EvidenceUploadService.getEvidenceUploadById(id);
      
      // Check if evidence upload exists
      if (!evidenceUpload) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Evidence upload not found' },
          { status: 404 }
        );
      }
      
      // Check if user has access
      const userId = (session?.user as any)?.id || '';
      const hasAccess = await EvidenceUploadService.hasAccess(id, userId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You do not have access to this evidence upload' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(evidenceUpload);
    } else if (firId) {
      // Get evidence uploads for FIR
      const evidenceUploads = await EvidenceUploadService.getEvidenceUploadsByFIR(firId);
      return NextResponse.json(evidenceUploads);
    } else {
      // Get recent evidence uploads
      const evidenceUploads = await EvidenceUploadService.getRecentEvidenceUploads(limit.toString(), 10, uploaderRole);
      return NextResponse.json(evidenceUploads);
    }
  } catch (error) {
    console.error('Error getting evidence uploads:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get evidence uploads' },
      { status: 500 }
    );
  }
}