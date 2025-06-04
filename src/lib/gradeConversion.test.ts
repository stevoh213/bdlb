import { describe, it, expect } from 'vitest';
import { normalizeGrade, GradeSystem, detectGradeSystem } from './gradeConversion';

describe('detectGradeSystem', () => {
  it('should detect YDS', () => {
    expect(detectGradeSystem('5.10a')).toBe(GradeSystem.YDS);
    expect(detectGradeSystem('5.9+')).toBe(GradeSystem.YDS);
  });

  it('should detect V-Scale', () => {
    expect(detectGradeSystem('V5')).toBe(GradeSystem.VSCALE);
    expect(detectGradeSystem('V0+')).toBe(GradeSystem.VSCALE);
    expect(detectGradeSystem('VB')).toBe(GradeSystem.VSCALE);
  });

  it('should detect French with hint or specific pattern', () => {
    expect(detectGradeSystem('6a+')).toBe(GradeSystem.FRENCH);
    expect(detectGradeSystem('7b')).toBe(GradeSystem.FRENCH);
    expect(detectGradeSystem('4c')).toBe(GradeSystem.FRENCH); // common low French
  });

  it('should detect Font with hint or specific pattern', () => {
    expect(detectGradeSystem('6A+')).toBe(GradeSystem.FONT);
    expect(detectGradeSystem('7B')).toBe(GradeSystem.FONT);
    expect(detectGradeSystem('8A')).toBe(GradeSystem.FONT); // common higher Font
  });

  it('should return undefined for unknown patterns', () => {
    expect(detectGradeSystem('unknown')).toBeUndefined();
    expect(detectGradeSystem('')).toBeUndefined();
  });
});

describe('normalizeGrade', () => {
  // YDS <-> French
  it('should convert YDS to French', () => {
    expect(normalizeGrade('5.10a', GradeSystem.YDS, GradeSystem.FRENCH, false)).toBe('6a');
    expect(normalizeGrade('5.12b', GradeSystem.YDS, GradeSystem.FRENCH, false)).toBe('7b');
  });

  it('should convert French to YDS', () => {
    expect(normalizeGrade('6a+', GradeSystem.FRENCH, GradeSystem.YDS, false)).toBe('5.10b');
    expect(normalizeGrade('7c', GradeSystem.FRENCH, GradeSystem.YDS, false)).toBe('5.12d');
    expect(normalizeGrade('7C', GradeSystem.FRENCH, GradeSystem.YDS, false)).toBe('5.12d'); // Test uppercase French
  });

  // V-Scale <-> Font
  it('should convert V-Scale to Font', () => {
    expect(normalizeGrade('V5', GradeSystem.VSCALE, GradeSystem.FONT, true)).toBe('6C');
    expect(normalizeGrade('V2', GradeSystem.VSCALE, GradeSystem.FONT, true)).toBe('5+');
    expect(normalizeGrade('v7', GradeSystem.VSCALE, GradeSystem.FONT, true)).toBe('7A+'); // Test lowercase V-scale
  });

  it('should convert Font to V-Scale', () => {
    expect(normalizeGrade('6C', GradeSystem.FONT, GradeSystem.VSCALE, true)).toBe('V5');
    expect(normalizeGrade('7A+', GradeSystem.FONT, GradeSystem.VSCALE, true)).toBe('V7');
    expect(normalizeGrade('6a+', GradeSystem.FONT, GradeSystem.VSCALE, true)).toBe('V3+'); // Test lowercase Font
  });

  // Normalization to default target systems
  it('should normalize to French by default for routes if target is undefined', () => {
    expect(normalizeGrade('5.10a', GradeSystem.YDS, undefined, false)).toBe('6a');
  });

  it('should normalize to Font by default for boulders if target is undefined', () => {
    expect(normalizeGrade('V5', GradeSystem.VSCALE, undefined, true)).toBe('6C');
  });

  it('should return original if YDS grade has no direct French mapping and target is French', () => {
    expect(normalizeGrade('5.12', GradeSystem.YDS, GradeSystem.FRENCH, false)).toBe('5.12');
  });

  // No conversion path
  it('should return original if no direct conversion path exists (e.g., YDS to Font)', () => {
    expect(normalizeGrade('5.10a', GradeSystem.YDS, GradeSystem.FONT, false)).toBe('5.10a');
    expect(normalizeGrade('V5', GradeSystem.VSCALE, GradeSystem.YDS, true)).toBe('V5');
  });

  // Original system unknown
  it('should attempt conversion if original system is undefined but detectable and target is default', () => {
    // normalizeGrade by default converts to French for routes, Font for boulders
    expect(normalizeGrade('5.11a', undefined, undefined, false)).toBe('6c'); // YDS -> French
    expect(normalizeGrade('V3', undefined, undefined, true)).toBe('6A');    // VScale -> Font
    expect(normalizeGrade('7a', undefined, undefined, false)).toBe('7a'); // French -> French (no change)
    expect(normalizeGrade('7A', undefined, undefined, true)).toBe('7A');    // Font -> Font (no change)
  });

  it('should return original if original system is undefined and not easily detectable for the target', () => {
    expect(normalizeGrade('SomethingWeird', undefined, GradeSystem.YDS, false)).toBe('SomethingWeird');
  });

  // Identity conversion
  it('should return original if original and target systems are the same', () => {
    expect(normalizeGrade('5.10a', GradeSystem.YDS, GradeSystem.YDS, false)).toBe('5.10a');
    expect(normalizeGrade('V5', GradeSystem.VSCALE, GradeSystem.VSCALE, true)).toBe('V5');
  });

  it('should return original for empty or undefined grade string', () => {
    expect(normalizeGrade('', GradeSystem.YDS, GradeSystem.FRENCH, false)).toBe('');
    expect(normalizeGrade(' ', GradeSystem.YDS, GradeSystem.FRENCH, false)).toBe(' ');
    // expect(normalizeGrade(undefined as any, GradeSystem.YDS, GradeSystem.FRENCH, false)).toBeUndefined(); // Function expects string
  });
});
