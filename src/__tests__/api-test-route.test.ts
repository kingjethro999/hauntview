import { NextRequest } from 'next/server';

jest.mock('@/src/engine', () => ({
  HauntViewEngine: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    executeTests: jest.fn(),
    cleanup: jest.fn(),
  })),
}));

jest.mock('@/src/core/report-store', () => ({
  ReportStore: {
    saveReport: jest.fn(),
  },
}));

jest.mock('@/src/lib/server/database', () => ({
  saveTestReportToDb: jest.fn(),
}));

import { POST } from '@/app/api/test/route';

describe('POST /api/test - URL safety validation', () => {
  it('rejects AWS metadata endpoint with 400 and safety error', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data/' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/safety|blocked/i);
  });

  it('rejects non-http/https protocol like file:// with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'file:///etc/passwd' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/protocol|safety|supported/i);
  });

  it('rejects URLs with embedded credentials with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://user:password@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/credentials|safety/i);
  });
});
