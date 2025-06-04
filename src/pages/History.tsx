import React from 'react';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import HistorySessionListView from '@/components/HistorySessionListView';
import HistorySessionDetailsView from '@/components/HistorySessionDetailsView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, FileUp } from 'lucide-react';
import { exportClimbsToCsv, importClimbsFromCsv } from '@/services/importService';
import { useToast } from '@/hooks/use-toast';
import { useClimbs } from '@/hooks/useClimbs';

const History = () => {
  const { toast } = useToast();
  const { climbs, addClimb } = useClimbs();
  
  const {
    sessions,
    selectedSession,
    climbsForSelectedSession,
    currentUser,
    isLoadingSessions,
    editingClimb,
    editingSession,
    deleteConfirm,
    showAnalysisDrawer,
    handleSelectSession,
    handleBackFromDetails,
    handleEditSession,
    handleDeleteSession,
    handleResumeSession,
    handleShowAnalysisDrawer,
    handleEditClimb,
    handleDeleteClimb,
    handleLogout,
    handleCloseEditClimb,
    handleCloseEditSession,
    handleCloseDeleteDialog,
    handleSaveClimb,
    handleSaveSession,
    handleConfirmDelete,
    handleOpenDeleteDialog,
  } = useSessionHistory();

  const handleExport = () => {
    const csvContent = exportClimbsToCsv(climbs);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'climbing-history.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Your climbing history has been exported to CSV.",
    });
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const importedClimbs = importClimbsFromCsv(csvContent);
          
          importedClimbs.forEach(climb => {
            addClimb(climb);
          });
          
          toast({
            title: "Import Complete",
            description: `Successfully imported ${importedClimbs.length} climbs.`,
          });
        } catch (error) {
          toast({
            title: "Import Error",
            description: error instanceof Error ? error.message : "Failed to import CSV file.",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsText(file);
    };
    input.click();
  };

  if (isLoadingSessions) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Climbing History</h1>
        <div className="flex gap-2">
          <Button onClick={handleImportClick} variant="outline">
            <FileUp className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={handleExport} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="climbs">All Climbs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sessions">
          {selectedSession ? (
            <HistorySessionDetailsView
              session={selectedSession}
              climbs={climbsForSelectedSession}
              currentUser={currentUser}
              editingClimb={editingClimb}
              editingSession={editingSession}
              deleteConfirm={deleteConfirm}
              onClose={handleBackFromDetails}
              onEditSession={handleEditSession}
              onDeleteSession={handleDeleteSession}
              onResumeSession={handleResumeSession}
              onShowAnalysisDrawer={handleShowAnalysisDrawer}
              onEditClimb={handleEditClimb}
              onDeleteClimb={handleDeleteClimb}
              onLogout={handleLogout}
              onCloseEditClimb={handleCloseEditClimb}
              onCloseEditSession={handleCloseEditSession}
              onCloseDeleteDialog={handleCloseDeleteDialog}
              onSaveClimb={handleSaveClimb}
              onSaveSession={handleSaveSession}
              onConfirmDelete={handleConfirmDelete}
              onOpenDeleteDialog={handleOpenDeleteDialog}
            />
          ) : (
            <HistorySessionListView
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onEditSession={handleEditSession}
              onDeleteSession={handleDeleteSession}
            />
          )}
        </TabsContent>
        
        <TabsContent value="climbs">
          <Card>
            <CardHeader>
              <CardTitle>All Climbs</CardTitle>
            </CardHeader>
            <CardContent>
              {climbs.length === 0 ? (
                <p className="text-muted-foreground">No climbs recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {climbs.map((climb) => (
                    <div key={climb.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{climb.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {climb.grade} • {climb.send_type} • {new Date(climb.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditClimb(climb as any)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteClimb(climb as any)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;