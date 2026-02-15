import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercent,
  formatMonth,
  parseMonth,
  addMonths,
} from '@/lib/formatters';

describe('formatCurrency', () => {
  it('formats positive values in GBP', () => {
    expect(formatCurrency(1000)).toBe('£1,000');
    expect(formatCurrency(1500000)).toBe('£1,500,000');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('£0');
  });

  it('formats negative values', () => {
    expect(formatCurrency(-5000)).toBe('-£5,000');
  });
});

describe('formatPercent', () => {
  it('converts decimal to percentage string', () => {
    expect(formatPercent(0.05)).toBe('5.0%');
    expect(formatPercent(0.125)).toBe('12.5%');
    expect(formatPercent(0)).toBe('0.0%');
  });
});

describe('parseMonth', () => {
  it('parses YYYY-MM format', () => {
    expect(parseMonth('2026-03')).toEqual({ year: 2026, month: 3 });
    expect(parseMonth('2025-12')).toEqual({ year: 2025, month: 12 });
  });
});

describe('addMonths', () => {
  it('adds months within the same year', () => {
    expect(addMonths('2026-01', 2)).toBe('2026-03');
    expect(addMonths('2026-06', 3)).toBe('2026-09');
  });

  it('rolls over to next year', () => {
    expect(addMonths('2026-11', 2)).toBe('2027-01');
    expect(addMonths('2026-10', 6)).toBe('2027-04');
  });

  it('handles adding zero months', () => {
    expect(addMonths('2026-05', 0)).toBe('2026-05');
  });

  it('handles large month additions', () => {
    expect(addMonths('2026-01', 24)).toBe('2028-01');
  });
});

describe('formatMonth', () => {
  it('formats YYYY-MM to human-readable month year', () => {
    const result = formatMonth('2026-03');
    expect(result).toContain('Mar');
    expect(result).toContain('2026');
  });
});
