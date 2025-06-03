/**
 * @file Grade conversion and normalization logic.
 */

export enum GradeSystem {
  YDS = 'YDS', // Yosemite Decimal System (Sport/Trad)
  FRENCH = 'French', // French (Sport/Trad)
  VSCALE = 'V-Scale', // Hueco (Boulder)
  FONT = 'Font', // Fontainebleau (Boulder)
  UIAA = 'UIAA', // (Sport/Trad)
  AUSTRALIAN = 'Australian', // (Sport/Trad)
  // Add more systems as needed
}

// Basic mapping tables - these are simplified and need to be expanded significantly.
// For a real system, these would be much larger or use algorithmic conversions for some parts.

const ydsToFrenchMap: Record<string, string> = {
  '5.6': '4c',
  '5.7': '5a',
  '5.8': '5b',
  '5.9': '5c',
  '5.10a': '6a',
  '5.10b': '6a+',
  '5.10c': '6b',
  '5.10d': '6b+',
  '5.11a': '6c',
  '5.11b': '6c', // Often 6c/6c+
  '5.11c': '6c+',
  '5.11d': '7a',
  '5.12a': '7a+',
  '5.12b': '7b',
  '5.12c': '7b+',
  '5.12d': '7c',
  '5.13a': '7c+',
  '5.13b': '8a',
  '5.13c': '8a+',
  '5.13d': '8b',
  '5.14a': '8b+',
  '5.14b': '8c',
  '5.14c': '8c+',
  '5.14d': '9a',
  '5.15a': '9a+',
};

const frenchToYdsMap: Record<string, string> = Object.fromEntries(
  Object.entries(ydsToFrenchMap).map(([yds, fr]) => [fr, yds])
);

const vScaleToFontMap: Record<string, string> = {
  'VB': '3', // Or 4a
  'V0': '4', // Or 4b/4c
  'V1': '5', // Or 5a/5b
  'V2': '5+', // Or 5c
  'V3': '6A',
  'V4': '6B',
  'V5': '6C',
  'V6': '7A',
  'V7': '7A+',
  'V8': '7B',
  'V9': '7B+',
  'V10': '7C+', // Often 7C/7C+
  'V11': '8A',
  'V12': '8A+',
  'V13': '8B',
  'V14': '8B+',
  'V15': '8C',
  'V16': '8C+',
  'V17': '9A', // Hypothetical
};

const fontToVScaleMap: Record<string, string> = Object.fromEntries(
  Object.entries(vScaleToFontMap).map(([v, font]) => [font, v])
);


/**
 * Tries to detect the grade system from a grade string.
 * This is very basic and unreliable for ambiguous grades.
 * @param grade The grade string.
 * @returns A guessed GradeSystem or undefined.
 */
export function detectGradeSystem(grade: string): GradeSystem | undefined {
  if (!grade) return undefined;
  grade = grade.toUpperCase();

  if (grade.startsWith('5.')) return GradeSystem.YDS;
  if (grade.startsWith('V')) return GradeSystem.VSCALE;
  if (grade.match(/^[3-9][ABC]?\+?$/) || grade.match(/^[3-9][abc]\+?$/)) { // e.g., 6a, 7B+, 8a
      // Ambiguous: Could be French or Font. Font less likely to have lowercase 'a/b/c' for lower grades.
      // If it has 'a/b/c' it's more likely French for easier sport grades.
      // If it's a single digit or digit with A/B/C, could be Font.
      // This is where context (like climb type: bouldering/sport) is crucial.
      // For now, a very rough heuristic:
      if (grade.length === 1 && parseInt(grade) >= 3 && parseInt(grade) <= 8) return GradeSystem.FONT; // e.g. 4, 5, 6
      if (grade.match(/^[6-9][ABC]\+?$/)) return GradeSystem.FONT; // e.g. 6A, 7B+
      if (grade.match(/^[4-8][abc]\+?$/)) return GradeSystem.FRENCH; // e.g. 6a, 7b+
      // Needs more rules or external context.
  }
  // Add more detection rules here...
  return undefined;
}

/**
 * Normalizes a grade to a target system.
 * For now, primarily supports YDS <-> French and V-Scale <-> Font.
 * Target system defaults to YDS for sport/trad and V-Scale for bouldering if not specified.
 *
 * @param grade The grade string to normalize.
 * @param originalSystem The original grading system of the input grade.
 * @param targetSystem The desired target grading system.
 * @param isBoulder Optional hint if the climb is bouldering, helps with ambiguous grades or default target.
 * @returns The normalized grade string, or the original grade if conversion is not possible.
 */
export function normalizeGrade(
  grade: string,
  originalSystem?: GradeSystem,
  targetSystem?: GradeSystem,
  isBoulder: boolean = false
): string {
  if (!grade || grade.trim() === '') return grade;

  const detectedOriginalSystem = originalSystem || detectGradeSystem(grade);
  let effectiveTargetSystem = targetSystem;

  if (!effectiveTargetSystem) {
    effectiveTargetSystem = isBoulder ? GradeSystem.VSCALE : GradeSystem.YDS;
  }

  if (!detectedOriginalSystem) {
    // If original system is unknown, and target is different from a simple YDS/VScale interpretation,
    // it's hard to proceed. Return original.
    if ( (isBoulder && effectiveTargetSystem !== GradeSystem.VSCALE && effectiveTargetSystem !== GradeSystem.FONT) ||
         (!isBoulder && effectiveTargetSystem !== GradeSystem.YDS && effectiveTargetSystem !== GradeSystem.FRENCH) ) {
        // console.warn(`normalizeGrade: Original system for grade "${grade}" is unknown and target is ${effectiveTargetSystem}. Cannot convert.`);
        return grade;
    }
    // If target is VScale/Font for a boulder or YDS/French for a route, and original is unknown,
    // we can try direct lookup in the target system's reverse map, assuming it might already BE in the target system or its partner.
  }

  const upperGrade = grade.toUpperCase(); // Use uppercase for V-scale consistency e.g. v5 -> V5

  try {
    if (detectedOriginalSystem === effectiveTargetSystem) return grade;

    // YDS <-> French
    if (detectedOriginalSystem === GradeSystem.YDS && effectiveTargetSystem === GradeSystem.FRENCH) {
      return ydsToFrenchMap[grade] || grade;
    }
    if (detectedOriginalSystem === GradeSystem.FRENCH && effectiveTargetSystem === GradeSystem.YDS) {
      return frenchToYdsMap[grade] || grade;
    }

    // V-Scale <-> Font
    if (detectedOriginalSystem === GradeSystem.VSCALE && effectiveTargetSystem === GradeSystem.FONT) {
      return vScaleToFontMap[upperGrade] || grade;
    }
    if (detectedOriginalSystem === GradeSystem.FONT && effectiveTargetSystem === GradeSystem.VSCALE) {
      return fontToVScaleMap[grade] || grade;
    }

    // Cross-category conversions (e.g., YDS to V-Scale) are generally not done directly
    // unless through an intermediate "difficulty score" system, which is out of scope here.

    // TODO: Add more conversion paths (e.g., to/from UIAA, Australian)
    // console.warn(`normalizeGrade: Conversion from ${detectedOriginalSystem} to ${effectiveTargetSystem} for grade "${grade}" is not supported yet.`);
  } catch (error) {
    // console.error(`normalizeGrade: Error during conversion of "${grade}" from ${originalSystem} to ${targetSystem}:`, error);
  }
  return grade; // Return original if no conversion path found or error
}

// Basic tests (would be in a .test.ts file)
// console.log("5.10a (YDS) to French:", normalizeGrade("5.10a", GradeSystem.YDS, GradeSystem.FRENCH)); // Expected: 6a
// console.log("7a+ (French) to YDS:", normalizeGrade("7a+", GradeSystem.FRENCH, GradeSystem.YDS)); // Expected: 5.12a
// console.log("V5 (VSCALE) to Font:", normalizeGrade("V5", GradeSystem.VSCALE, GradeSystem.FONT)); // Expected: 6C
// console.log("7A (Font) to VSCALE:", normalizeGrade("7A", GradeSystem.FONT, GradeSystem.VSCALE)); // Expected: V6
// console.log("5.11c (YDS) to YDS:", normalizeGrade("5.11c", GradeSystem.YDS, GradeSystem.YDS)); // Expected: 5.11c
// console.log("V不明 (VSCALE) to Font:", normalizeGrade("V不明", GradeSystem.VSCALE, GradeSystem.FONT)); // Expected: V不明
// console.log("5.10a (Unknown) to French (Route):", normalizeGrade("5.10a", undefined, GradeSystem.FRENCH, false)); // Expected: 6a
// console.log("V5 (Unknown) to Font (Boulder):", normalizeGrade("V5", undefined, GradeSystem.FONT, true)); // Expected: 6C
// console.log("6a (Unknown) to YDS (Route):", normalizeGrade("6a", undefined, GradeSystem.YDS, false)); // Should try French to YDS
// console.log("6C (Unknown) to VSCALE (Boulder):", normalizeGrade("6C", undefined, GradeSystem.VSCALE, true)); // Should try Font to VScale
// console.log("5.12 (YDS - no letter) to French:", normalizeGrade("5.12", GradeSystem.YDS, GradeSystem.FRENCH)); // Expected: 5.12 (no direct map)
// console.log("V5 (YDS - wrong system) to Font:", normalizeGrade("V5", GradeSystem.YDS, GradeSystem.FONT)); // Expected: V5 (no conversion path)

// console.log("Defaulting YDS to YDS (route):", normalizeGrade("5.12a", GradeSystem.YDS, undefined, false)); // 5.12a
// console.log("Defaulting French to YDS (route):", normalizeGrade("7a+", GradeSystem.FRENCH, undefined, false)); // 5.12a
// console.log("Defaulting VScale to VScale (boulder):", normalizeGrade("V5", GradeSystem.VSCALE, undefined, true)); // V5
// console.log("Defaulting Font to VScale (boulder):", normalizeGrade("6C", GradeSystem.FONT, undefined, true)); // V5
