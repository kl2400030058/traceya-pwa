import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Mock data for demonstration purposes
  const mockProofs = [
    { id: '1', name: 'Proof 1', date: new Date().toISOString() },
    { id: '2', name: 'Proof 2', date: new Date().toISOString() }
  ];

  return NextResponse.json(mockProofs);
}