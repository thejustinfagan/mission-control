import { NextResponse } from 'next/server';

// TODO: Connect to actual reseller DB when available
// For now, return mock data based on known state

export async function GET() {
  try {
    // Mock data - replace with actual DB query when reseller DB path is known
    return NextResponse.json({
      scraped: 829,
      total: 10000,
      lastRun: 'March 9, 2026',
      status: 'STOPPED',
      daysRemaining: 12
    });
  } catch (error) {
    console.error('Reseller Intel API error:', error);
    return NextResponse.json({ error: 'Failed to fetch reseller stats' }, { status: 500 });
  }
}
