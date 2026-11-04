import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), '.hauntview', 'screenshots');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    if (!safeFilename.endsWith('.png')) {
      return NextResponse.json({ error: 'Invalid file requested' }, { status: 400 });
    }

    const filePath = path.join(SCREENSHOTS_DIR, safeFilename);

    try {
      const buffer = await fs.readFile(filePath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Screenshot retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve screenshot' }, { status: 500 });
  }
}
