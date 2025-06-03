import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import Papa from 'papaparse';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CsvClimb, ClimbTypeSpec, SendTypeSpec } from '@/lib/importSpec';
import { importClimbsFromCsv } from '@/services/importService';
import type { Climb } from '@/types/climbing';
import { ALL_IMPORT_TEMPLATES, ImportMappingTemplate, ImportSourceType, getInitialMappingsFromTemplate, GenericJsonClimbObject } from '@/lib/importTemplates';

const TARGET_CLIMB_FIELDS: (keyof Omit<Climb, 'id' | 'user_id' | 'session_id' | 'created_at' | 'updated_at'>)[] = [
  'name', 'grade', 'type', 'send_type', 'date', 'location',
  'attempts', 'rating', 'notes', 'duration', 'elevation_gain',
  'color', 'gym', 'country', 'skills', 'stiffness',
  'physical_skills', 'technical_skills'
];

const REQUIRED_FIELDS: (keyof CsvClimb)[] = ['name', 'grade', 'type', 'send_type', 'date', 'location'];

interface ParsedDataState {
  fileName: string;
  isJson: boolean;
  // For CSV: actual CSV headers. For JSON: unique keys from all objects.
  headersOrKeys: string[];
  // For CSV: array of row objects. For JSON: array of original JSON objects.
  data: Record<string, any>[];
  // For table preview (headers/keys + first few rows/objects as strings)
  previewData: string[][];
}

const ImportCsvForm: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<ImportSourceType>("generic");
  const [parsedData, setParsedData] = useState<ParsedDataState | null>(null);
  // For CSV: maps CSV header to CsvClimb field. For JSON: maps JSON key to CsvClimb field.
  const [columnMappings, setColumnMappings] = useState<Record<string, keyof CsvClimb | ''>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const MOCK_USER_ID = "mock-user-id-123";
  const activeTemplate = ALL_IMPORT_TEMPLATES.find(t => t.sourceType === selectedTemplateKey);

  const resetState = (clearFileInput: boolean = true) => {
    setSelectedFile(null);
    setParsedData(null);
    setColumnMappings({});
    setImportResult(null);
    setParseError(null);
    if (clearFileInput) {
        const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };

  const guessGenericMappings = (keys: string[]): Record<string, keyof CsvClimb | ''> => {
    const newMappings: Record<string, keyof CsvClimb | ''> = {};
    
    // Common field name patterns for intelligent mapping
    const fieldPatterns: Record<keyof CsvClimb, RegExp[]> = {
      name: [/^(route|climb|problem|boulder)[\s_-]?(name|title)?$/i, /^name$/i, /^title$/i, /^route$/i, /^climb$/i],
      grade: [/^(route|climb)?[\s_-]?grade$/i, /^difficulty$/i, /^rating$/i, /^your[\s_-]?rating$/i],
      type: [/^(climb|route|style)[\s_-]?type$/i, /^style$/i, /^discipline$/i, /^category$/i],
      send_type: [/^(send|tick|ascent)[\s_-]?type$/i, /^(lead|tick)[\s_-]?style$/i, /^status$/i, /^result$/i],
      date: [/^(climb|send|tick|log|ascent)[\s_-]?date$/i, /^date$/i, /^when$/i, /^logged$/i],
      location: [/^(climb)?[\s_-]?location$/i, /^(area|crag|sector|wall|gym|venue|site)$/i, /^where$/i, /^place$/i, /^climbing[\s_-]?(area|gym|crag)$/i],
      attempts: [/^(num|number)?[\s_-]?(of)?[\s_-]?attempts$/i, /^tries$/i, /^goes$/i],
      rating: [/^(star|quality)[\s_-]?rating$/i, /^stars$/i, /^quality$/i, /^score$/i],
      notes: [/^(climb)?[\s_-]?(notes|comments?|description|memo|beta)$/i, /^feedback$/i],
      duration: [/^(climb|time)[\s_-]?(duration|time|length)$/i, /^time[\s_-]?on[\s_-]?wall$/i],
      elevation_gain: [/^elevation[\s_-]?(gain)?$/i, /^height$/i, /^vertical$/i],
      color: [/^(route|hold)?[\s_-]?colou?r$/i, /^tape$/i],
      gym: [/^gym[\s_-]?(name)?$/i, /^(climbing)?[\s_-]?center$/i, /^facility$/i],
      country: [/^country$/i, /^nation$/i, /^region$/i],
      skills: [/^skills?$/i, /^techniques?$/i, /^style[\s_-]?tags?$/i],
      stiffness: [/^(grade)?[\s_-]?stiffness$/i, /^(feels?|felt)$/i, /^sandbagged?$/i],
      physical_skills: [/^physical[\s_-]?skills?$/i, /^strength$/i, /^power$/i],
      technical_skills: [/^technical[\s_-]?skills?$/i, /^technique$/i, /^footwork$/i]
    };
    
    keys.forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/[\s_-]+/g, '');
      let bestMatch: keyof CsvClimb | '' = '';
      let highestScore = 0;
      
      // Check each field pattern
      for (const [field, patterns] of Object.entries(fieldPatterns) as [keyof CsvClimb, RegExp[]][]) {
        for (const pattern of patterns) {
          if (pattern.test(key)) {
            bestMatch = field;
            highestScore = 1;
            break;
          }
        }
        
        // Fuzzy matching based on similarity
        if (highestScore < 1) {
          const fieldNorm = field.toLowerCase().replace(/_/g, '');
          const similarity = calculateSimilarity(normalizedKey, fieldNorm);
          if (similarity > highestScore && similarity > 0.6) {
            highestScore = similarity;
            bestMatch = field;
          }
        }
      }
      
      newMappings[key] = bestMatch;
    });
    
    return newMappings;
  };
  
  // Helper function for fuzzy string matching
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = (s1: string, s2: string): number => {
      const costs: number[] = [];
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) costs[j] = j;
          else if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    };
    
    return (longer.length - editDistance(longer, shorter)) / longer.length;
  };

  const applyTemplateOrGuessMappings = (keys: string[], isJsonContext: boolean) => {
    const currentTemplate = ALL_IMPORT_TEMPLATES.find(t => t.sourceType === selectedTemplateKey);
    if (currentTemplate && currentTemplate.isJson === isJsonContext) { // Ensure template type matches file type
        setColumnMappings(getInitialMappingsFromTemplate(keys, currentTemplate));
    } else if (!isJsonContext && selectedTemplateKey === "generic") { // Generic CSV
        setColumnMappings(guessGenericMappings(keys));
    } else if (isJsonContext && selectedTemplateKey === "genericJson") { // Generic JSON
        setColumnMappings(guessGenericMappings(keys)); // Use same guessing for JSON keys
    } else { // Mismatch or no specific generic selected
        setColumnMappings(getInitialMappingsFromTemplate(keys)); // Empty mappings
    }
  };

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    resetState(false);
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const textContent = e.target?.result as string;
      if (!textContent) {
        setIsLoading(false);
        setParseError("File is empty or could not be read.");
        return;
      }

      const isJsonFile = file.name.endsWith('.json') || file.type === 'application/json';
      // If a JSON template is selected, assume JSON regardless of extension for flexibility
      const treatAsJson = isJsonFile || activeTemplate?.isJson;

      if (treatAsJson) {
        try {
          const jsonData: GenericJsonClimbObject[] = JSON.parse(textContent);
          if (!Array.isArray(jsonData)) {
            throw new Error("JSON data must be an array of climb objects.");
          }
          if (jsonData.length === 0) {
            setParseError("JSON file is empty or contains no climb data.");
            setParsedData(null);
            setIsLoading(false);
            return;
          }
          const allKeys = new Set<string>();
          jsonData.forEach(obj => Object.keys(obj).forEach(key => allKeys.add(key)));
          const uniqueKeys = Array.from(allKeys);

          const previewJsonData = [uniqueKeys, ...jsonData.slice(0, 5).map(obj => uniqueKeys.map(key => String(obj[key] ?? '')))];

          setParsedData({
            fileName: file.name,
            isJson: true,
            headersOrKeys: uniqueKeys,
            data: jsonData,
            previewData: previewJsonData,
          });
          if (selectedTemplateKey !== "genericJson" && !activeTemplate?.isJson) {
            setSelectedTemplateKey("genericJson"); // Switch to generic JSON if a CSV template was selected
          } else {
            applyTemplateOrGuessMappings(uniqueKeys, true);
          }

        } catch (err: any) {
          console.error("JSON parsing error:", err);
          setParseError(`Invalid JSON file: ${err.message}`);
          setParsedData(null);
        } finally {
          setIsLoading(false);
        }
      } else { // CSV Handling
        Papa.parse<Record<string, string>>(textContent, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error("Papaparse errors:", results.errors);
              setParseError(`Error parsing CSV: ${results.errors.map(e => e.message).join(', ')}`);
              setParsedData(null);
              setIsLoading(false);
              return;
            }
            if (!results.meta.fields || results.meta.fields.length === 0) {
              setParseError("Could not parse CSV headers. Ensure the file is a valid CSV with a header row.");
              setParsedData(null);
              setIsLoading(false);
              return;
            }
            const headers = results.meta.fields;
            const previewCsvData = [headers, ...results.data.slice(0, 5).map(row => headers.map(h => row[h] || ''))];
            setParsedData({
              fileName: file.name,
              isJson: false,
              headersOrKeys: headers,
              data: results.data,
              previewData: previewCsvData,
            });
            if (activeTemplate?.isJson) { // If a JSON template was mistakenly selected for a CSV
                setSelectedTemplateKey("generic");
            } else {
                applyTemplateOrGuessMappings(headers, false);
            }
            setIsLoading(false);
          },
          error: (error: Error) => {
            console.error("Papaparse critical error:", error);
            setParseError(`Failed to parse CSV file: ${error.message}`);
            setParsedData(null);
            setIsLoading(false);
          }
        });
      }
    };
    reader.onerror = () => {
        setIsLoading(false);
        setParseError("Failed to read the file.");
    };
    reader.readAsText(file);
  }, [activeTemplate, selectedTemplateKey]); // Dependencies for handleFileChange

 useEffect(() => {
    if (parsedData) {
      applyTemplateOrGuessMappings(parsedData.headersOrKeys, parsedData.isJson);
    }
  }, [selectedTemplateKey, parsedData]);


  const handleMappingChange = (key: string, targetField: keyof CsvClimb | '') => {
    setColumnMappings(prev => ({ ...prev, [key]: targetField }));
  };

  const handleSubmit = async () => {
    if (!parsedData || !selectedFile) {
      alert('Please select and parse a file first.');
      return;
    }
    const userId = MOCK_USER_ID;
    if (!userId) {
      alert('User ID not found. Please ensure you are logged in.');
      return;
    }

    setIsLoading(true);
    setImportResult(null);

    try {
      const currentTemplateForTransform = ALL_IMPORT_TEMPLATES.find(t => t.sourceType === selectedTemplateKey);

      const climbsToImport: CsvClimb[] = parsedData.data.map((rawRowObject) => { // rawRowObject is a row from CSV or a JSON object
        let baseCsvClimb: Partial<CsvClimb> = {};

        if (currentTemplateForTransform?.transform) {
          baseCsvClimb = currentTemplateForTransform.transform(rawRowObject, columnMappings);
        } else { // Generic CSV/JSON transformation (if no specific template transform)
          for (const sourceKey in columnMappings) { // sourceKey is CSV header or JSON key
            const targetField = columnMappings[sourceKey];
            if (targetField && TARGET_CLIMB_FIELDS.includes(targetField as any)) {
              const rawValue = rawRowObject[sourceKey];
              if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
                if (['attempts', 'rating', 'elevation_gain', 'stiffness'].includes(targetField)) {
                    const num = parseFloat(String(rawValue));
                    if (!isNaN(num)) (baseCsvClimb as any)[targetField] = num;
                } else if (targetField === 'type') {
                  baseCsvClimb.type = String(rawValue).toLowerCase() as ClimbTypeSpec;
                } else if (targetField === 'send_type') {
                  baseCsvClimb.send_type = String(rawValue).toLowerCase() as SendTypeSpec;
                } else if (['skills', 'physical_skills', 'technical_skills'].includes(targetField)) {
                    if (Array.isArray(rawValue)) {
                        (baseCsvClimb as any)[targetField] = rawValue.map(String);
                    } else {
                         (baseCsvClimb as any)[targetField] = String(rawValue).split(',').map(s => s.trim()).filter(s => s !== '');
                    }
                } else {
                  (baseCsvClimb as any)[targetField] = String(rawValue);
                }
              }
            }
          }
        }

        return {
          name: baseCsvClimb.name || '', grade: baseCsvClimb.grade || '',
          type: baseCsvClimb.type || '' as ClimbTypeSpec, send_type: baseCsvClimb.send_type || '' as SendTypeSpec,
          date: baseCsvClimb.date || '', location: baseCsvClimb.location || '',
          ...baseCsvClimb
        } as CsvClimb;
      });

      const result = await importClimbsFromCsv({ userId, preParsedData: climbsToImport });
      setImportResult(result);

    } catch (error: any) {
      console.error("Error during import submission:", error);
      setImportResult({ successCount: 0, errorCount: parsedData.data.length, errors: [`An unexpected error occurred: ${error.message}`] });
    } finally {
      setIsLoading(false);
    }
  };

  const currentSourceKeys = parsedData?.headersOrKeys || [];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Upload and Map File</CardTitle>
        <CardDescription>Select a CSV or JSON file, choose a template (optional), map columns/keys, and import.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
                id="file-upload-input" type="file" accept=".csv,.json" onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 md:col-span-1"
                disabled={isLoading}
            />
            <Select
                value={selectedTemplateKey}
                onValueChange={(value) => setSelectedTemplateKey(value as ImportSourceType)}
                disabled={isLoading || !parsedData}
            >
                <SelectTrigger className="md:col-span-1"><SelectValue placeholder="Select Import Template" /></SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>CSV Templates</SelectLabel>
                        <SelectItem value="generic">Generic CSV</SelectItem>
                        {ALL_IMPORT_TEMPLATES.filter(t => !t.isJson).map(template => (
                            <SelectItem key={template.sourceType} value={template.sourceType}>{template.name}</SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup>
                        <SelectLabel>JSON Templates</SelectLabel>
                         <SelectItem value="genericJson">Generic JSON</SelectItem>
                        {ALL_IMPORT_TEMPLATES.filter(t => t.isJson && t.sourceType !== 'genericJson').map(template => (
                            <SelectItem key={template.sourceType} value={template.sourceType}>{template.name}</SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>

        {isLoading && <div className="flex flex-col items-center space-y-2 pt-4"><Progress value={undefined} className="w-full" /><p>Processing file...</p></div>}
        {parseError && <Alert variant="destructive" className="mt-4"><AlertTitle>File Error</AlertTitle><AlertDescription>{parseError}</AlertDescription></Alert>}

        {parsedData && !isLoading && (
          <>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {parsedData.isJson ? "JSON Object Preview" : "CSV Preview"} (First 5 entries/rows)
              </h3>
              <CardDescription>File: {parsedData.fileName}</CardDescription>
              <div className="overflow-x-auto border rounded-md mt-2">
                <Table>
                  <TableHeader><TableRow>{parsedData.previewData[0].map((h, i) => <TableHead key={i}>{h}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {parsedData.previewData.slice(1).map((r, ri) => <TableRow key={ri}>{r.map((c, ci) => <TableCell key={ci}>{c}</TableCell>)}</TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {parsedData.isJson ? "JSON Key Mapping" : "Column Mapping"}
              </h3>
              <CardDescription className="mb-3">
                Map {parsedData.isJson ? "JSON keys" : "CSV columns"} to the application's climb fields. 
                Fields marked with <span className="text-red-500 font-bold">*</span> are required.
              </CardDescription>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-md bg-gray-50/50">
                {currentSourceKeys.map(sourceKey => ( // Use currentSourceKeys which is headersOrKeys
                  <div key={sourceKey} className="flex flex-col space-y-1">
                    <label htmlFor={`map-${sourceKey}`} className="text-sm font-medium text-gray-700 truncate" title={sourceKey}>
                      <span className="font-semibold">{sourceKey}</span>
                    </label>
                    <Select
                      value={columnMappings[sourceKey] || 'none'}
                      onValueChange={(value) => handleMappingChange(sourceKey, value === 'none' ? '' : value as keyof CsvClimb | '')}
                    >
                      <SelectTrigger id={`map-${sourceKey}`} className="bg-white"><SelectValue placeholder="Do not import" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Do not import</SelectItem>
                        {TARGET_CLIMB_FIELDS.map(field => (
                          <SelectItem key={field} value={field}>
                            {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            {REQUIRED_FIELDS.includes(field as keyof CsvClimb) && (
                              <span className="text-red-500 font-bold ml-1">*</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              {/* Show unmapped required fields */}
              {(() => {
                const mappedFields = Object.values(columnMappings).filter(v => v !== '');
                const unmappedRequired = REQUIRED_FIELDS.filter(field => !mappedFields.includes(field));
                if (unmappedRequired.length > 0) {
                  return (
                    <Alert className="mt-3">
                      <AlertTitle className="text-amber-600">Missing Required Mappings</AlertTitle>
                      <AlertDescription>
                        The following required fields are not yet mapped:
                        <ul className="list-disc list-inside mt-1">
                          {unmappedRequired.map(field => (
                            <li key={field}>
                              <strong>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                              <span className="text-red-500 font-bold ml-1">*</span>
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()}
            </div>
          </>
        )}
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
                {importResult.successCount === 0 && importResult.errors.some(err => 
                  err.includes('Name is required') || 
                  err.includes('Location is required') || 
                  err.includes('Date must be in YYYY-MM-DD format')
                ) && (
                  <Alert className="mt-2 mb-2">
                    <AlertTitle>Mapping Required</AlertTitle>
                    <AlertDescription>
                      It looks like required fields are not mapped correctly. Please ensure you've mapped:
                      <ul className="list-disc list-inside mt-2">
                        <li><strong>Name</strong> - The climb/route name column</li>
                        <li><strong>Grade</strong> - The difficulty rating column</li>
                        <li><strong>Type</strong> - The climb style (sport, boulder, etc.)</li>
                        <li><strong>Send Type</strong> - How you completed it (send, attempt, etc.)</li>
                        <li><strong>Date</strong> - When you climbed it (YYYY-MM-DD or MM/DD/YYYY format)</li>
                        <li><strong>Location</strong> - Where you climbed (crag, gym, area)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                <Alert variant="destructive" className="mt-2 max-h-48 overflow-y-auto">
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm">
                      {importResult.errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                      {importResult.errors.length > 10 && (
                        <li className="font-semibold">... and {importResult.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
         <Button variant="outline" onClick={() => resetState(true)} disabled={isLoading}>Cancel / New File</Button>
        <Button onClick={handleSubmit} disabled={!parsedData || isLoading || parseError !== null} className="w-full sm:w-auto">
          {isLoading ? 'Importing...' : `Import ${parsedData?.data.length || 0} Climbs`}
        </Button>
      </CardFooter>
    </Card>
  );
};
export default ImportCsvForm;
