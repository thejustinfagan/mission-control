import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { existsSync } from 'fs';

const FLEET_DB_PATH = path.join(process.env.HOME || '', 'projects', 'fleet-intel-enrich', 'data', 'fmcsa_carriers_prod.db');

export async function GET() {
  try {
    if (!existsSync(FLEET_DB_PATH)) {
      return NextResponse.json({ 
        error: 'Fleet Intel database not found',
        total: 0,
        highValue: 0,
        lastRun: 'Never',
        nextRun: 'Saturday 2am CT',
        avgPerDay: 750,
        coverage: 'Louisville 40217 + 50mi'
      });
    }

    const db = new Database(FLEET_DB_PATH, { readonly: true });

    const totalRow = db.prepare('SELECT COUNT(*) as count FROM facility_analysis').get() as { count: number };
    const highValueRow = db.prepare('SELECT COUNT(*) as count FROM facility_analysis WHERE trucks_visible > 10').get() as { count: number };
    const lastRunRow = db.prepare('SELECT MAX(DATE(analyzed_at)) as date FROM facility_analysis').get() as { date: string | null };
    
    db.close();

    return NextResponse.json({
      total: totalRow.count,
      highValue: highValueRow.count,
      lastRun: lastRunRow.date || 'Never',
      nextRun: 'Saturday 2am CT',
      avgPerDay: 750,
      coverage: 'Louisville 40217 + 50mi'
    });
  } catch (error) {
    console.error('Fleet Intel API error:', error);
    return NextResponse.json({ error: 'Failed to fetch fleet stats' }, { status: 500 });
  }
}
