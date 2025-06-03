import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkDuplicateClimb, importClimbsFromCsv } from './importService';
import { supabase } from '@/integrations/supabase/client';
import { validateClimbRecord } from '../lib/importValidation';
import type { Climb } from '@/types/climbing';
import { CsvClimb, ClimbTypeSpec, SendTypeSpec } from '../lib/importSpec';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  const mockEq = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnThis();
  const mockMaybeSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
  }));
  return {
    supabase: {
      from: mockFrom,
      auth: { // Mock auth if getCurrentUserId or similar is used directly/indirectly
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
      }
    },
    // Re-export mock functions for easy access in tests
    __mockSupabaseFrom: mockFrom,
    __mockSupabaseSelect: mockSelect,
    __mockSupabaseInsert: mockInsert,
    __mockSupabaseEq: mockEq,
    __mockSupabaseMaybeSingle: mockMaybeSingle,
  };
});

// Mock importValidation
vi.mock('../lib/importValidation', () => ({
  validateClimbRecord: vi.fn(),
}));

// Helper to access mocked Supabase functions
const { __mockSupabaseMaybeSingle, __mockSupabaseInsert, __mockSupabaseEq } =
  vi.mocked(supabase) as any;


describe('importService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDuplicateClimb', () => {
    const basicClimb: Partial<Climb> & { user_id: string } = {
      name: 'Test Climb',
      grade: '5.10a',
      date: '2024-01-01',
      location: 'Test Location',
      user_id: 'test-user-id',
    };

    it('should return the climb if a duplicate is found', async () => {
      const duplicateClimb: Climb = { ...basicClimb, id: 'dup-id' } as Climb;
      __mockSupabaseMaybeSingle.mockResolvedValueOnce({ data: duplicateClimb, error: null });

      const result = await checkDuplicateClimb(basicClimb);
      expect(result).toEqual(duplicateClimb);
      expect(__mockSupabaseEq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(__mockSupabaseEq).toHaveBeenCalledWith('name', 'Test Climb');
    });

    it('should return null if no duplicate is found', async () => {
      __mockSupabaseMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      const result = await checkDuplicateClimb(basicClimb);
      expect(result).toBeNull();
    });

    it('should return null and log error if database query fails', async () => {
      const dbError = { message: 'Database error', code: '500', details: '', hint: '' };
      __mockSupabaseMaybeSingle.mockResolvedValueOnce({ data: null, error: dbError });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await checkDuplicateClimb(basicClimb);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[checkDuplicateClimb] Supabase error checking for duplicate climb'),
        dbError.message
      );
      consoleErrorSpy.mockRestore();
    });

     it('should return null if required fields are missing', async () => {
      const incompleteClimb = { user_id: 'test-user-id' } as Partial<Climb> & { user_id: string };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await checkDuplicateClimb(incompleteClimb);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[checkDuplicateClimb] Error: Missing required fields')
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('importClimbsFromCsv', () => {
    const userId = 'test-user-id';
    const mockDate = '2024-03-15';

    beforeEach(() => {
      // Default mock for validateClimbRecord: valid record
      vi.mocked(validateClimbRecord).mockReturnValue([]);
      // Default mock for checkDuplicateClimb: no duplicate
      __mockSupabaseMaybeSingle.mockResolvedValue({ data: null, error: null });
      // Default mock for insert: success
      __mockSupabaseInsert.mockResolvedValue({ error: null });
    });

    it('should import valid climbs with no duplicates', async () => {
      const csvString = `name,grade,type,send_type,date,location,attempts,rating,notes,duration,elevation_gain,skills,stiffness
Climb A,5.11a,sport,send,${mockDate},Loc A,1,3,Good,00:30:00,100,crimpy,2
Climb B,V5,boulder,flash,${mockDate},Loc B,2,4,Fun,600,50,"slopers, dynamic",1`;

      const { successCount, errorCount, errors } = await importClimbsFromCsv(csvString, userId);

      expect(successCount).toBe(2);
      expect(errorCount).toBe(0);
      expect(errors.length).toBe(0);
      expect(__mockSupabaseInsert).toHaveBeenCalledTimes(2);
      expect(__mockSupabaseInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Climb A', duration: 1800, skills: ['crimpy'], stiffness: 2 }),
          expect.objectContaining({ name: 'Climb B', duration: 600, skills: ['slopers', 'dynamic'], stiffness: 1 }),
        ])
      );
    });

    it('should handle validation errors', async () => {
      const csvString = `name,grade,type,send_type,date,location
Climb Valid,5.10a,sport,send,${mockDate},Valid Loc
,5.9,trad,attempt,,Missing Loc Info`; // Invalid: name empty, date empty, location empty

      vi.mocked(validateClimbRecord)
        .mockReturnValueOnce([]) // First climb is valid
        .mockReturnValueOnce(['Name is required', 'Date is required', 'Location is required']); // Second climb has errors

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { successCount, errorCount, errors } = await importClimbsFromCsv(csvString, userId);

      expect(successCount).toBe(1);
      expect(errorCount).toBe(1);
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('Row 3');
      expect(errors[0]).toContain('Validation failed - Name is required, Date is required, Location is required');
      expect(__mockSupabaseInsert).toHaveBeenCalledTimes(1); // Only valid climb inserted
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Validation failed'), expect.any(Object));
      consoleErrorSpy.mockRestore();
    });

    it('should handle duplicate entries', async () => {
      const csvString = `name,grade,type,send_type,date,location
Climb C,5.12a,trad,project,${mockDate},Loc C
Climb C,5.12a,trad,project,${mockDate},Loc C`; // Duplicate

      // First call to checkDuplicateClimb (for the first Climb C) -> no duplicate
      // Second call to checkDuplicateClimb (for the second Climb C) -> duplicate found
      const duplicateClimbData = { id: 'existing-id', name: 'Climb C' } as Climb;
      __mockSupabaseMaybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: duplicateClimbData, error: null });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { successCount, errorCount, errors } = await importClimbsFromCsv(csvString, userId);

      expect(successCount).toBe(1);
      expect(errorCount).toBe(1); // Duplicate is counted as an error in import summary
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('Row 3: Duplicate climb already exists');
      expect(errors[0]).toContain('Climb C');
      expect(__mockSupabaseInsert).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicate climb already exists'));
      consoleWarnSpy.mockRestore();
    });

    it('should handle malformed CSV string (Papaparse error)', async () => {
      // This CSV is malformed because of unescaped quotes within a field
      const malformedCsvString = `name,grade\n"Bad "Name",5.8`;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { successCount, errorCount, errors } = await importClimbsFromCsv(malformedCsvString, userId);

      expect(successCount).toBe(0);
      expect(errorCount).toBeGreaterThanOrEqual(1); // Papaparse might report 1 error for the whole file or per bad row
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]).toMatch(/CSV Parsing Error|Critical CSV Parsing Error/);
      expect(__mockSupabaseInsert).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('CSV Parsing Error'), expect.any(Object));
      consoleErrorSpy.mockRestore();
    });

    it('should handle empty CSV string', async () => {
      const csvString = ``;
      const { successCount, errorCount, errors } = await importClimbsFromCsv(csvString, userId);
      expect(successCount).toBe(0);
      expect(errorCount).toBe(0);
      expect(errors.length).toBe(0);
    });

    it('should correctly transform various data types', async () => {
      const csvString = `name,grade,type,send_type,date,location,duration,skills,physical_skills,technical_skills,stiffness
Transform Test,V3,boulder,send,${mockDate},Gym,"01:15:30","crux, dyno",power,"heel hook, toe hook","3"`;
      await importClimbsFromCsv(csvString, userId);

      expect(__mockSupabaseInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Transform Test',
            duration: 1 * 3600 + 15 * 60 + 30, // 4530 seconds
            skills: ['crux', 'dyno'],
            physical_skills: ['power'],
            technical_skills: ['heel hook', 'toe hook'],
            stiffness: 3,
          }),
        ])
      );
    });

    it('should handle numeric duration and stiffness from CSV', async () => {
      const csvString = `name,grade,type,send_type,date,location,duration,stiffness
Numeric Duration,5.10a,sport,send,${mockDate},Rockies,3600,4`; // duration in seconds
      await importClimbsFromCsv(csvString, userId);
      expect(__mockSupabaseInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Numeric Duration',
            duration: 3600,
            stiffness: 4,
          }),
        ])
      );
    });


    it('should handle database insertion errors', async () => {
      const csvString = `name,grade,type,send_type,date,location
Climb D,5.13a,sport,onsight,${mockDate},Loc D`;
      const dbError = { message: 'Insert failed', code: 'DB001', details: '', hint: '' };
      __mockSupabaseInsert.mockResolvedValueOnce({ error: dbError });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { successCount, errorCount, errors } = await importClimbsFromCsv(csvString, userId);

      expect(successCount).toBe(0);
      expect(errorCount).toBe(1);
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('Row 2: Error inserting climb "Climb D"');
      expect(errors[0]).toContain('Insert failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error inserting climb'), expect.any(Object));
      consoleErrorSpy.mockRestore();
    });

    it('should handle unexpected error during checkDuplicateClimb', async () => {
        const csvString = `name,grade,type,send_type,date,location\nErrorDup,5.10a,sport,send,${mockDate},Loc E`;
        const dupError = new Error("Network failure");
        __mockSupabaseMaybeSingle.mockRejectedValueOnce(dupError); // Simulate unexpected error
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { successCount, errorCount, errors } = await importClimbsFromCsv(csvString, userId);
        expect(successCount).toBe(0);
        expect(errorCount).toBe(1);
        expect(errors[0]).toContain('Row 2 (Climb: "ErrorDup"): Error during duplicate check: Network failure');
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/\[importClimbsFromCsv\] Row 2 \(Climb: "ErrorDup"\): Error during duplicate check: Network failure/), expect.any(String) );
        consoleErrorSpy.mockRestore();
    });

    it('should handle unexpected error during insert', async () => {
        const csvString = `name,grade,type,send_type,date,location\nErrorInsert,5.10b,sport,send,${mockDate},Loc F`;
        const insertCatchError = new Error("Max retries");
        __mockSupabaseInsert.mockRejectedValueOnce(insertCatchError); // Simulate unexpected error
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { successCount, errorCount, errors } = await importClimbsFromCsv(csvString, userId);
        expect(successCount).toBe(0);
        expect(errorCount).toBe(1);
        expect(errors[0]).toContain('Row 2 (Climb: "ErrorInsert"): Unexpected error during database insertion: Max retries');
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/\[importClimbsFromCsv\] Row 2 \(Climb: "ErrorInsert"\): Unexpected error during database insertion: Max retries/), expect.any(String) );
        consoleErrorSpy.mockRestore();
    });
  });
});
