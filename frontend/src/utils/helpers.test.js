import { describe, test, expect } from 'vitest';
import { formatDate, getInitials, capitalize } from './helpers';

describe('getInitials', () => {
  test('two-word name → two uppercase initials', () => {
    expect(getInitials('Fawad Abbasi')).toBe('FA');
  });
  test('single word → one initial', () => {
    expect(getInitials('Carbon')).toBe('C');
  });
  test('caps at two initials', () => {
    expect(getInitials('One Two Three')).toBe('OT');
  });
  test('empty/undefined is safe', () => {
    expect(getInitials()).toBe('');
  });
});

describe('capitalize', () => {
  test('lowercases the rest', () => {
    expect(capitalize('aDMIN')).toBe('Admin');
  });
  test('empty string is safe', () => {
    expect(capitalize()).toBe('');
  });
});

describe('formatDate', () => {
  test('formats an ISO date to a readable string', () => {
    expect(formatDate('2026-06-08')).toMatch(/Jun.*2026/);
  });
});
