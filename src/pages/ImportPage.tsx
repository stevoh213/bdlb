import React from 'react';
import ImportCsvForm from '@/components/ImportCsvForm';
import BulkManualEntryForm from '@/components/BulkManualEntryForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ImportPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Import Climbs</h1>
        <p className="text-gray-600 mt-2">
          Choose your preferred method to import your climbing data.
        </p>
      </header>

      <Tabs defaultValue="fileImport" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto mb-6">
          <TabsTrigger value="fileImport">File Import (CSV/JSON)</TabsTrigger>
          <TabsTrigger value="manualEntry">Manual Bulk Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="fileImport">
          <div className="max-w-4xl mx-auto">
             <p className="text-center text-sm text-gray-500 mb-4">
                Upload a CSV or JSON file. Use templates for common formats or map fields manually.
            </p>
            <ImportCsvForm />
          </div>
        </TabsContent>

        <TabsContent value="manualEntry">
          <div className="max-w-6xl mx-auto"> {/* Allow wider for table */}
             <p className="text-center text-sm text-gray-500 mb-4">
                Enter multiple climbs directly into a table.
            </p>
            <BulkManualEntryForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportPage;
