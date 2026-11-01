/**
 * API route for running HauntView tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { HauntViewEngine } from '@/src/engine';

/**
 * POST /api/test
 * Execute tests on provided URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, profiles } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Initialize engine
    const engine = new HauntViewEngine();
    await engine.initialize();

    // Execute tests
    const report = await engine.executeTests({
      url,
      profiles,
      includeScreenshots: true,
    });

    // Cleanup
    await engine.cleanup();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Test execution error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test
 * Get test status and available profiles
 */
export async function GET() {
  try {
    const engine = new HauntViewEngine();
    const stats = engine.getStats();

    return NextResponse.json({
      status: 'ready',
      stats,
      version: '0.1.0',
    });
  } catch (error) {
    console.error('Error getting test status:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
