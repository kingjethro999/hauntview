/**
 * src/__tests__/navigation.test.ts
 *
 * Unit tests for resilient page navigation utility.
 */

import { describe, it, expect, jest } from '@jest/globals';
import { Page } from 'playwright';
import { navigateResilient } from '../profiles/navigation';

describe('Resilient Page Navigation', () => {
  it('navigates with domcontentloaded and settles quickly without hanging', async () => {
    const mockGoto = jest.fn().mockResolvedValue(undefined as never);
    const mockWaitForLoadState = jest.fn().mockResolvedValue(undefined as never);

    const mockPage = {
      goto: mockGoto,
      waitForLoadState: mockWaitForLoadState,
    } as unknown as Page;

    await navigateResilient(mockPage, 'https://example.com');

    expect(mockGoto).toHaveBeenCalledWith('https://example.com', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    expect(mockWaitForLoadState).toHaveBeenCalledWith('load', {
      timeout: 2500,
    });
  });

  it('safely handles mock pages where waitForLoadState is undefined', async () => {
    const mockGoto = jest.fn().mockResolvedValue(undefined as never);
    const mockPage = {
      goto: mockGoto,
    } as unknown as Page;

    await expect(navigateResilient(mockPage, 'https://example.com')).resolves.not.toThrow();
    expect(mockGoto).toHaveBeenCalledWith('https://example.com', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
  });

  it('respects custom timeout and settleTimeout options', async () => {
    const mockGoto = jest.fn().mockResolvedValue(undefined as never);
    const mockWaitForLoadState = jest.fn().mockResolvedValue(undefined as never);

    const mockPage = {
      goto: mockGoto,
      waitForLoadState: mockWaitForLoadState,
    } as unknown as Page;

    await navigateResilient(mockPage, 'https://example.com', {
      timeout: 8000,
      settleTimeout: 1000,
    });

    expect(mockGoto).toHaveBeenCalledWith('https://example.com', {
      waitUntil: 'domcontentloaded',
      timeout: 8000,
    });
    expect(mockWaitForLoadState).toHaveBeenCalledWith('load', {
      timeout: 1000,
    });
  });

  it('swallows settle errors when background connections keep running', async () => {
    const mockGoto = jest.fn().mockResolvedValue(undefined as never);
    const mockWaitForLoadState = jest
      .fn()
      .mockRejectedValue(new Error('Timeout 2500ms exceeded') as never);

    const mockPage = {
      goto: mockGoto,
      waitForLoadState: mockWaitForLoadState,
    } as unknown as Page;

    // Should complete cleanly without throwing
    await expect(navigateResilient(mockPage, 'https://example.com')).resolves.not.toThrow();
  });
});
