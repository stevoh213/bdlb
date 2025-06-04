
import Papa from 'papaparse';
import { LocalClimb, Session } from '@/types/climbing';
import { CsvRow } from '@/types/csv';

export const importClimbsFromCsv = (csvContent: string): LocalClimb[] => {
  const results = Papa.parse<CsvRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase()
  });

  if (results.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
  }

  return results.data.map((row, index) => {
    const requiredFields = ['name', 'grade', 'date'];
    const missingFields = requiredFields.filter(field => !row[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Row ${index + 1}: Missing required fields: ${missingFields.join(', ')}`);
    }

    return {
      id: `csv-import-${Date.now()}-${index}`,
      name: row.name || '',
      grade: row.grade || '',
      tickType: (row.ticktype as LocalClimb['tickType']) || 'attempt',
      timestamp: row.date ? new Date(row.date) : new Date(),
      location: row.location || '',
      notes: row.notes || '',
      attempts: row.attempts ? parseInt(row.attempts) : 1,
      mentalSkills: row.mentalskills ? row.mentalskills.split(',').map(s => s.trim()) : [],
      technicalSkills: row.technicalskills ? row.technicalskills.split(',').map(s => s.trim()) : [],
      physicalSkills: row.physicalskills ? row.physicalskills.split(',').map(s => s.trim()) : []
    };
  });
};

export const exportClimbsToCsv = (climbs: LocalClimb[]): string => {
  const csvData = climbs.map(climb => ({
    name: climb.name,
    grade: climb.grade,
    tickType: climb.tickType,
    date: climb.timestamp instanceof Date ? climb.timestamp.toISOString() : climb.timestamp,
    location: climb.location || '',
    notes: climb.notes || '',
    attempts: climb.attempts || 1,
    mentalSkills: climb.mentalSkills?.join(', ') || '',
    technicalSkills: climb.technicalSkills?.join(', ') || '',
    physicalSkills: climb.physicalSkills?.join(', ') || ''
  }));

  return Papa.unparse(csvData);
};
