import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Mock data for demonstration purposes
  const mockFiles = [
    { id: '1', name: 'File 1.pdf', cid: 'Qm123456789', date: new Date().toISOString() },
    { id: '2', name: 'File 2.jpg', cid: 'Qm987654321', date: new Date().toISOString() }
  ];

  return NextResponse.json(mockFiles);
}