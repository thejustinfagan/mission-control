import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

const FLEET_DB_PATH = path.join(process.env.HOME || '', 'projects', 'fleet-intel-enrich', 'data', 'fmcsa_carriers_prod.db');

export async function GET(request: Request) {
  try {
    if (!existsSync(FLEET_DB_PATH)) {
      return NextResponse.json({ error: 'Fleet Intel database not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const highValueOnly = searchParams.get('high_value') === 'true';

    const db = new Database(FLEET_DB_PATH, { readonly: true });

    let query = 'SELECT * FROM facility_analysis';
    if (highValueOnly) {
      query += ' WHERE trucks_visible > 10';
    }
    query += ' ORDER BY trucks_visible DESC, analyzed_at DESC';

    const rows = db.prepare(query).all();
    db.close();

    if (rows.length === 0) {
      return new NextResponse('No data available', { status: 404 });
    }

    // Convert to CSV
    const headers = Object.keys(rows[0] as object);
    const csvRows = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => {
          const value = (row as any)[header];
          // Escape commas and quotes in CSV
          if (value === null || value === undefined) return '';
          const str = String(value).replace(/"/g, '""');
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        }).join(',')
      )
    ];

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fleet-intel-${highValueOnly ? 'high-value-' : ''}${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Fleet Intel CSV export error:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
