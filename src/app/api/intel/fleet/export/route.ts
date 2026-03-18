import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const FLEET_DB_PATH = path.join(process.env.HOME || '', 'projects', 'fleet-intel-enrich', 'data', 'fmcsa_carriers_prod.db');

export async function GET() {
  try {
    if (!existsSync(FLEET_DB_PATH)) {
      return NextResponse.json({ error: 'Fleet Intel database not found' }, { status: 404 });
    }

    const dbBuffer = readFileSync(FLEET_DB_PATH);
    
    return new NextResponse(dbBuffer, {
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="fleet-intel-${new Date().toISOString().slice(0, 10)}.db"`,
        'Content-Length': dbBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Fleet Intel export error:', error);
    return NextResponse.json({ error: 'Failed to export database' }, { status: 500 });
  }
}
