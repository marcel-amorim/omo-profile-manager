import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isCacheFresh,
  isCacheStale,
  getCachedResult,
  setCachedResult,
  resetCacheState,
} from '../ipc/handlers/models';

const SAMPLE_RESULT = {
  models: ['model-a', 'model-b'],
  modelInfos: [],
  rawStdout: 'model-a\nmodel-b',
  rawStderr: '',
};

describe('Cache Freshness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    resetCacheState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isCacheFresh', () => {
    it('returns false when cache is empty', () => {
      expect(isCacheFresh()).toBe(false);
    });

    it('returns true within TTL', () => {
      setCachedResult(SAMPLE_RESULT);
      expect(isCacheFresh()).toBe(true);
    });

    it('returns false exactly at TTL boundary', () => {
      setCachedResult(SAMPLE_RESULT);
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(isCacheFresh()).toBe(false);
    });

    it('returns true just before TTL expires', () => {
      setCachedResult(SAMPLE_RESULT);
      vi.advanceTimersByTime(5 * 60 * 1000 - 1);
      expect(isCacheFresh()).toBe(true);
    });
  });

  describe('isCacheStale', () => {
    it('returns false when cache is empty', () => {
      expect(isCacheStale()).toBe(false);
    });

    it('returns false within TTL', () => {
      setCachedResult(SAMPLE_RESULT);
      expect(isCacheStale()).toBe(false);
    });

    it('returns true exactly at TTL boundary', () => {
      setCachedResult(SAMPLE_RESULT);
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(isCacheStale()).toBe(true);
    });

    it('returns true well past TTL', () => {
      setCachedResult(SAMPLE_RESULT);
      vi.advanceTimersByTime(10 * 60 * 1000);
      expect(isCacheStale()).toBe(true);
    });
  });

  describe('getCachedResult', () => {
    it('returns null when cache is empty', () => {
      expect(getCachedResult()).toBeNull();
    });

    it('returns stored result', () => {
      setCachedResult(SAMPLE_RESULT);
      expect(getCachedResult()).toEqual(SAMPLE_RESULT);
    });

    it('returns stale result even past TTL', () => {
      setCachedResult(SAMPLE_RESULT);
      vi.advanceTimersByTime(10 * 60 * 1000);
      expect(getCachedResult()).toEqual(SAMPLE_RESULT);
    });
  });

  describe('setCachedResult', () => {
    it('updates timestamp on set', () => {
      setCachedResult(SAMPLE_RESULT);
      expect(isCacheFresh()).toBe(true);

      vi.advanceTimersByTime(6 * 60 * 1000);
      expect(isCacheStale()).toBe(true);

      setCachedResult(SAMPLE_RESULT);
      expect(isCacheFresh()).toBe(true);
    });
  });

  describe('resetCacheState', () => {
    it('clears all cache state', () => {
      setCachedResult(SAMPLE_RESULT);
      expect(getCachedResult()).not.toBeNull();

      resetCacheState();

      expect(getCachedResult()).toBeNull();
      expect(isCacheFresh()).toBe(false);
      expect(isCacheStale()).toBe(false);
    });
  });

  describe('Cache TTL boundaries', () => {
    it('transitions from fresh to stale at exactly 5 minutes', () => {
      setCachedResult(SAMPLE_RESULT);

      expect(isCacheFresh()).toBe(true);
      expect(isCacheStale()).toBe(false);

      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(isCacheFresh()).toBe(false);
      expect(isCacheStale()).toBe(true);
    });

    it('stale cache still returns data', () => {
      setCachedResult(SAMPLE_RESULT);
      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(isCacheStale()).toBe(true);
      expect(getCachedResult()).toEqual(SAMPLE_RESULT);
    });

    it('fresh cache returns data immediately without fetch needed', () => {
      setCachedResult(SAMPLE_RESULT);

      expect(isCacheFresh()).toBe(true);
      expect(getCachedResult()).toEqual(SAMPLE_RESULT);
      expect(isCacheStale()).toBe(false);
    });
  });

  describe('Concurrent caller coalescing (unit-level)', () => {
    it('multiple sets within same tick share same timestamp', () => {
      const resultA = { ...SAMPLE_RESULT, models: ['model-a'] };
      const resultB = { ...SAMPLE_RESULT, models: ['model-b'] };

      setCachedResult(resultA);
      setCachedResult(resultB);

      expect(getCachedResult()).toEqual(resultB);
      expect(isCacheFresh()).toBe(true);
    });
  });
});
