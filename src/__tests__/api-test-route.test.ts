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

describe('POST /api/test - Concurrency & Hosted Guards (Phase 2)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.RENDER;
    delete process.env.HAUNT_HOSTED;
    delete process.env.HAUNT_ALLOW_CONCURRENCY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects concurrent request with 400 when RENDER=true', async () => {
    process.env.RENDER = 'true';

    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        concurrency: true,
        concurrencyAmount: 3,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/concurrent execution is disabled on the hosted deployment/i);
  });

  it('rejects concurrent request with 400 when HAUNT_HOSTED=1', async () => {
    process.env.HAUNT_HOSTED = '1';

    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        concurrency: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/hosted deployment/i);
  });

  it('permits concurrency when HAUNT_ALLOW_CONCURRENCY=1 even if RENDER=true', async () => {
    process.env.RENDER = 'true';
    process.env.HAUNT_ALLOW_CONCURRENCY = '1';

    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        concurrency: true,
        concurrencyAmount: 2,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('permits concurrency in unconstrained local/self-hosted environments', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        concurrency: true,
        concurrencyAmount: 4,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
