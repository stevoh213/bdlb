import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, XCircle } from 'lucide-react';
import React, { useState } from 'react';

import { ClimbTypeSpec, CsvClimb, SendTypeSpec } from '@/lib/importSpec';
import { validateClimbRecord } from '@/lib/importValidation';
import { importClimbsFromCsv } from '@/services/importService';
// import { useAuth } from '@/contexts/AuthContext'; // Assuming auth context for user ID

const MOCK_USER_ID = "mock-user-id-bulk-entry"; // Replace with actual user ID from context

type ManualClimbEntry = Partial<CsvClimb> & { id: string; errors?: Record<string, string> };

const createNewClimbRow = (): ManualClimbEntry => ({
  id: crypto.randomUUID(),
  name: '',
  grade: '',
  type: undefined, // Default to undefined for placeholder
  send_type: undefined, // Default to undefined for placeholder
  date: '',
  location: '',
  attempts: undefined,
  rating: undefined,
  notes: '',
  errors: {},
});

const BulkManualEntryForm: React.FC = () => {
  const [manualClimbs, setManualClimbs] = useState<ManualClimbEntry[]>([createNewClimbRow()]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);

  const handleInputChange = (index: number, field: keyof CsvClimb, value: string | number | undefined) => {
    const updatedClimbs = [...manualClimbs];
    const climbToUpdate = { ...updatedClimbs[index] };

    // Type assertion to satisfy TypeScript for field assignment
    (climbToUpdate as any)[field] = value;

    // Basic validation on change (can be expanded)
    if (field === 'name' && !value) {
        climbToUpdate.errors = { ...climbToUpdate.errors, [field]: 'Name is required' };
    } else if (field === 'grade' && !value) {
        climbToUpdate.errors = { ...climbToUpdate.errors, [field]: 'Grade is required' };
    } else if (field === 'date' && !value) {
        climbToUpdate.errors = { ...climbToUpdate.errors, [field]: 'Date is required' };
    } else {
        if (climbToUpdate.errors) delete climbToUpdate.errors[field];
    }

    updatedClimbs[index] = climbToUpdate;
    setManualClimbs(updatedClimbs);
  };

  const addRow = () => {
    setManualClimbs([...manualClimbs, createNewClimbRow()]);
  };

  const removeRow = (index: number) => {
    if (manualClimbs.length <= 1) return; // Keep at least one row
    const updatedClimbs = manualClimbs.filter((_, i) => i !== index);
    setManualClimbs(updatedClimbs);
  };

  const validateAllRows = (): boolean => {
    let allValid = true;
    const validatedClimbs = manualClimbs.map(climb => {
      // Create a CsvClimb object for validation, ensuring required fields are strings for validateClimbRecord
      const climbForValidation: CsvClimb = {
        name: climb.name || '',
        grade: climb.grade || '',
        type: climb.type || ('' as ClimbTypeSpec),
        send_type: climb.send_type || ('' as SendTypeSpec),
        date: climb.date || '',
        location: climb.location || '',
        attempts: climb.attempts,
        rating: climb.rating,
        notes: climb.notes,
        // other optional fields can be undefined
      };
      const errors = validateClimbRecord(climbForValidation);
      const rowErrors: Record<string, string> = {};
      if (errors.length > 0) {
        allValid = false;
        // Simplistic mapping of error messages to fields; can be improved
        errors.forEach(err => {
            if (err.toLowerCase().includes('name')) rowErrors.name = err;
            else if (err.toLowerCase().includes('grade')) rowErrors.grade = err;
            else if (err.toLowerCase().includes('date')) rowErrors.date = err;
            else if (err.toLowerCase().includes('type') && !err.toLowerCase().includes('send')) rowErrors.type = err;
            else if (err.toLowerCase().includes('send type')) rowErrors.send_type = err;
            else if (err.toLowerCase().includes('location')) rowErrors.location = err;
            else if (err.toLowerCase().includes('attempts')) rowErrors.attempts = err;
            else if (err.toLowerCase().includes('rating')) rowErrors.rating = err;
            else rowErrors.general = (rowErrors.general ? rowErrors.general + "; " : "") + err;
        });
      }
      return { ...climb, errors: rowErrors };
    });
    setManualClimbs(validatedClimbs);
    return allValid;
  };

  const handleSubmit = async () => {
    setImportResult(null);
    if (!validateAllRows()) {
      alert('Please correct the errors in the form before submitting.');
      return;
    }

    const climbsToSubmit: CsvClimb[] = manualClimbs
      .filter(climb => climb.name && climb.grade && climb.date) // Filter out potentially empty rows again
      .map(climb => ({
        name: climb.name!,
        grade: climb.grade!,
        type: climb.type!, // Already validated to be present or correctly defaulted
        send_type: climb.send_type!, // "
        date: climb.date!, // "
        location: climb.location || '', // Default to empty string if null/undefined
        attempts: climb.attempts,
        rating: climb.rating,
        notes: climb.notes || '',
        // Fill in other CsvClimb optional fields if they were part of ManualClimbEntry and added to the form
        color: climb.color,
        country: climb.country,
        duration: climb.duration,
        elevation_gain: climb.elevation_gain,
        gym: climb.gym,
        physical_skills: climb.physical_skills,
        skills: climb.skills,
        stiffness: climb.stiffness,
        technical_skills: climb.technical_skills,
      }));

    if (climbsToSubmit.length === 0) {
      alert('No valid climbs to submit.');
      return;
    }

    setIsLoading(true);
    // const userId = auth.user?.id; // Replace with actual user ID
    const userId = MOCK_USER_ID;
    if (!userId) {
        alert("User not authenticated.");
        setIsLoading(false);
        return;
    }

    try {
      const result = await importClimbsFromCsv({ userId, preParsedData: climbsToSubmit });
      setImportResult(result);
      if (result.successCount > 0) {
        // Optionally reset form or just some rows
        // setManualClimbs([createNewClimbRow()]);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error submitting bulk manual entries:", error);
      setImportResult({ successCount: 0, errorCount: climbsToSubmit.length, errors: [`An unexpected error occurred: ${errorMessage}`] });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Bulk Entry</CardTitle>
        <CardDescription>Add multiple climbs directly. Ensure all required fields are filled for each climb.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Name*</TableHead>
                  <TableHead className="min-w-[100px]">Grade*</TableHead>
                  <TableHead className="min-w-[150px]">Type*</TableHead>
                  <TableHead className="min-w-[150px]">Send Type*</TableHead>
                  <TableHead className="min-w-[150px]">Date*</TableHead>
                  <TableHead className="min-w-[150px]">Location</TableHead>
                  <TableHead className="min-w-[100px]">Attempts</TableHead>
                  <TableHead className="min-w-[100px]">Rating (1-5)</TableHead>
                  <TableHead className="min-w-[200px]">Notes</TableHead>
                  <TableHead className="w-[50px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manualClimbs.map((climb, index) => (
                  <TableRow key={climb.id}>
                    <TableCell>
                      <Input
                        type="text"
                        value={climb.name || ''}
                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                        className={climb.errors?.name ? 'border-red-500' : ''}
                      />
                      {climb.errors?.name && <p className="text-xs text-red-500 mt-1">{climb.errors.name}</p>}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={climb.grade || ''}
                        onChange={(e) => handleInputChange(index, 'grade', e.target.value)}
                        className={climb.errors?.grade ? 'border-red-500' : ''}
                      />
                       {climb.errors?.grade && <p className="text-xs text-red-500 mt-1">{climb.errors.grade}</p>}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={climb.type || ''}
                        onValueChange={(value) => handleInputChange(index, 'type', value as ClimbTypeSpec)}
                      >
                        <SelectTrigger className={climb.errors?.type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ClimbTypeSpec).map(type => (
                            <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {climb.errors?.type && <p className="text-xs text-red-500 mt-1">{climb.errors.type}</p>}
                    </TableCell>
                     <TableCell>
                      <Select
                        value={climb.send_type || ''}
                        onValueChange={(value) => handleInputChange(index, 'send_type', value as SendTypeSpec)}
                      >
                        <SelectTrigger className={climb.errors?.send_type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select send type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SendTypeSpec).map(type => (
                            <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                       {climb.errors?.send_type && <p className="text-xs text-red-500 mt-1">{climb.errors.send_type}</p>}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={climb.date || ''}
                        onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                        className={climb.errors?.date ? 'border-red-500' : ''}
                      />
                      {climb.errors?.date && <p className="text-xs text-red-500 mt-1">{climb.errors.date}</p>}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={climb.location || ''}
                        onChange={(e) => handleInputChange(index, 'location', e.target.value)}
                         className={climb.errors?.location ? 'border-red-500' : ''}
                      />
                       {climb.errors?.location && <p className="text-xs text-red-500 mt-1">{climb.errors.location}</p>}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={climb.attempts === undefined ? '' : climb.attempts}
                        onChange={(e) => handleInputChange(index, 'attempts', e.target.value ? parseInt(e.target.value) : undefined)}
                        min="0"
                        className={climb.errors?.attempts ? 'border-red-500' : ''}
                      />
                      {climb.errors?.attempts && <p className="text-xs text-red-500 mt-1">{climb.errors.attempts}</p>}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={climb.rating === undefined ? '' : climb.rating}
                        onChange={(e) => handleInputChange(index, 'rating', e.target.value ? parseInt(e.target.value) : undefined)}
                        min="1" max="5"
                        className={climb.errors?.rating ? 'border-red-500' : ''}
                      />
                      {climb.errors?.rating && <p className="text-xs text-red-500 mt-1">{climb.errors.rating}</p>}
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={climb.notes || ''}
                        onChange={(e) => handleInputChange(index, 'notes', e.target.value)}
                        rows={1}
                      />
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)} disabled={manualClimbs.length <= 1}>
                        <XCircle className="h-5 w-5 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" onClick={addRow} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Row
          </Button>
        </form>
         {importResult && (
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Import Results</h3>
            <div className="space-y-1">
                <p>Successfully imported: <span className="font-bold text-green-600">{importResult.successCount}</span> climbs.</p>
                <p>Failed imports: <span className="font-bold text-red-600">{importResult.errorCount}</span> climbs.</p>
            </div>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-gray-700">Error Details:</h4>
                <Alert variant="destructive" className="mt-2 max-h-48 overflow-y-auto">
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm">
                      {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end pt-6 border-t">
        <Button onClick={handleSubmit} disabled={isLoading || manualClimbs.length === 0}>
          {isLoading ? 'Submitting...' : `Submit All ${manualClimbs.filter(c => c.name && c.grade && c.date).length} Climb(s)`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BulkManualEntryForm;
