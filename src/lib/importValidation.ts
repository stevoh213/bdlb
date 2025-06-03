/**
 * @file Defines functions for validating imported climb data.
 */

import { CsvClimb, ClimbTypeSpec, SendTypeSpec } from './importSpec';

/**
 * Checks if a string is a valid date in YYYY-MM-DD format.
 * @param dateStr The string to validate.
 * @returns True if the string is a valid date, false otherwise.
 */
function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // Check if the date object correctly parsed the string
  return (
    year === parseInt(dateStr.substring(0, 4), 10) &&
    month === parseInt(dateStr.substring(5, 7), 10) &&
    day === parseInt(dateStr.substring(8, 10), 10)
  );
}

/**
 * Checks if a value is a non-negative integer.
 * @param value The value to check.
 * @returns True if the value is a non-negative integer, false otherwise.
 */
function isNonNegativeInteger(value: any): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Checks if a value is a positive number.
 * @param value The value to check.
 * @returns True if the value is a positive number, false otherwise.
 */
function isPositiveNumber(value: any): boolean {
  return typeof value === 'number' && value > 0;
}


/**
 * Validates a climb record.
 * @param record The climb record to validate.
 * @returns An array of error messages. If the record is valid, returns an empty array.
 */
export function validateClimbRecord(record: CsvClimb): string[] {
  const errors: string[] = [];

  // Required fields
  if (!record.name || record.name.trim() === '') {
    errors.push('Name is required and cannot be empty.');
  }
  if (!record.grade || record.grade.trim() === '') {
    errors.push('Grade is required and cannot be empty.');
  }
  if (!record.type || record.type.trim() === '') {
    errors.push('Type is required and cannot be empty.');
  }
  if (!record.send_type || record.send_type.trim() === '') {
    errors.push('Send type is required and cannot be empty.');
  }
  if (!record.date || record.date.trim() === '') {
    errors.push('Date is required and cannot be empty.');
  }
  if (!record.location || record.location.trim() === '') {
    errors.push('Location is required and cannot be empty.');
  }

  // Date validation
  if (record.date && !isValidDate(record.date)) {
    errors.push('Date must be in YYYY-MM-DD format.');
  }

  // Type validation
  if (record.type && !Object.values(ClimbTypeSpec).includes(record.type as ClimbTypeSpec)) {
    errors.push(`Invalid climb type: ${record.type}. Allowed values are: ${Object.values(ClimbTypeSpec).join(', ')}.`);
  }

  // Send type validation
  if (record.send_type && !Object.values(SendTypeSpec).includes(record.send_type as SendTypeSpec)) {
    errors.push(`Invalid send type: ${record.send_type}. Allowed values are: ${Object.values(SendTypeSpec).join(', ')}.`);
  }

  // Optional fields validation
  if (record.attempts !== undefined && !isNonNegativeInteger(record.attempts)) {
    errors.push('Attempts must be a non-negative integer.');
  }

  if (record.rating !== undefined) {
    if (typeof record.rating !== 'number' || record.rating < 1 || record.rating > 5) {
      errors.push('Rating must be a number between 1 and 5.');
    }
  }

  if (record.duration !== undefined) {
    // Try to parse duration if it's a string like HH:MM:SS or just seconds
    let durationSeconds: number | undefined;
    if (typeof record.duration === 'string') {
        const parts = record.duration.split(':');
        if (parts.length === 3) {
            durationSeconds = parseInt(parts[0],10) * 3600 + parseInt(parts[1],10) * 60 + parseInt(parts[2],10);
        } else if (parts.length === 1 && !isNaN(Number(parts[0]))) {
            durationSeconds = Number(parts[0]);
        }
    } else if (typeof record.duration === 'number') {
        durationSeconds = record.duration;
    }

    if (durationSeconds === undefined || !isPositiveNumber(durationSeconds)) {
        errors.push('Duration must be a positive number (e.g., seconds or HH:MM:SS).');
    }
  }


  if (record.elevation_gain !== undefined && !isPositiveNumber(record.elevation_gain)) {
    errors.push('Elevation gain must be a positive number.');
  }

  if (record.stiffness !== undefined) {
    // Allowing stiffness to be a string like "Soft", "Hard", or a number.
    // If it can be parsed as a number, it should be a number.
    // Otherwise, it's treated as a descriptive string.
    // For this validation, we'll check if it's a number, it should be a valid number.
    // If it's intended to be a number but fails parsing, it's an error.
    // However, the prompt says "Validate as a number if present".
    // This implies that if it's present, it MUST be a number.
    // This might conflict with a user wanting to input "Hard for the grade".
    // For now, sticking to the prompt: "Validate as a number if present".
    if (typeof record.stiffness !== 'number') {
        // Try to parse if it's a string representation of a number
        const stiffnessAsNumber = Number(record.stiffness);
        if (isNaN(stiffnessAsNumber)) {
             // If it's not a number and cannot be parsed into one, it's an error
             // based on the strict interpretation of "Validate as a number if present".
             // However, if string values like "Hard" are allowed, this check needs to be different.
             // Given the prompt focuses on "number", this is the current interpretation.
             // errors.push('Stiffness, if present and intended as a numerical value, must be a number.');
             // Re-evaluating: "Validate as a number if present" might mean if the *field* is present, its *value* must be a number.
             // This seems more aligned with other numeric validations.
            errors.push('Stiffness must be a number if present.');
        }
    }
  }

  return errors;
}
