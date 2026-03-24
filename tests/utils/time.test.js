import { describe, it, expect, vi, afterEach } from 'vitest';
import { relativeTime } from '../../src/utils/time.js';

describe('relativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for very recent dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T15:00:30'));
    expect(relativeTime('2026-03-24 15:00:20')).toBe('just now');
    vi.useRealTimers();
  });

  it('returns minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T15:10:00'));
    expect(relativeTime('2026-03-24 15:05:00')).toBe('5 minutes ago');
    vi.useRealTimers();
  });

  it('returns singular minute', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T15:01:30'));
    expect(relativeTime('2026-03-24 15:00:00')).toBe('1 minute ago');
    vi.useRealTimers();
  });

  it('returns hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T18:00:00'));
    expect(relativeTime('2026-03-24 15:00:00')).toBe('3 hours ago');
    vi.useRealTimers();
  });

  it('returns singular hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T16:00:00'));
    expect(relativeTime('2026-03-24 15:00:00')).toBe('1 hour ago');
    vi.useRealTimers();
  });

  it('returns days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T15:00:00'));
    expect(relativeTime('2026-03-24 15:00:00')).toBe('3 days ago');
    vi.useRealTimers();
  });

  it('returns singular day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T15:00:00'));
    expect(relativeTime('2026-03-24 15:00:00')).toBe('1 day ago');
    vi.useRealTimers();
  });

  it('returns months ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T15:00:00'));
    expect(relativeTime('2026-03-24 15:00:00')).toBe('3 months ago');
    vi.useRealTimers();
  });

  it('returns "just now" for future dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T14:00:00'));
    expect(relativeTime('2026-03-24 15:00:00')).toBe('just now');
    vi.useRealTimers();
  });
});
