import HistorySessionDetailsView from '@/components/HistorySessionDetailsView';
import HistorySessionListView from '@/components/HistorySessionListView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useClimbs } from '@/hooks/useClimbs';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { mapDbClimbToLocalClimb, mapLocalClimbToNewClimbData } from '@/lib/utils';
import { exportClimbsToCsv, importClimbsFromCsv } from '@/services/importService';
import { LocalClimb } from '@/types/climbing';
import { FileDown, FileUp } from 'lucide-react';

const History = () => {
  const { toast } = useToast();
  const { climbs: allUserClimbs, addClimb } = useClimbs();
  
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
    const localClimbsForExport = allUserClimbs.map(mapDbClimbToLocalClimb);
    const csvContent = exportClimbsToCsv(localClimbsForExport);
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
          const importedClimbs: LocalClimb[] = importClimbsFromCsv(csvContent);
          
          // TODO: This needs a proper way to assign climbs to a session.
          // Using a placeholder ID will likely lead to errors or orphaned climbs.
          const sessionIdForImportedClimbs: string | null = null; // Placeholder - needs UI to select/create session

          if (!sessionIdForImportedClimbs) {
            toast({
              title: "Import Warning",
              description: "Climbs parsed, but no session selected for import. Climbs not saved to database.",
              variant: "default", // Changed from destructive for a warning
              duration: 5000,
            });
            console.warn("Imported climbs parsed but not saved: No session ID available.", importedClimbs);
            return; // Do not proceed to addClimb if no sessionId
          }

          importedClimbs.forEach(localClimb => {
            const newClimbData = mapLocalClimbToNewClimbData(localClimb);
            addClimb({
              ...newClimbData,
              sessionId: sessionIdForImportedClimbs, // This is the critical missing piece
            });
          });
          
          toast({
            title: "Import Complete",
            description: `Successfully imported and attempted to save ${importedClimbs.length} climbs. Check console for details.`,
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
              allUserClimbs={allUserClimbs}
              onSelectSession={handleSelectSession}
              isLoadingSessions={isLoadingSessions}
              editingClimb={editingClimb}
              editingSession={editingSession}
              deleteConfirm={deleteConfirm}
              onExportData={handleExport}
              onCloseEditClimb={handleCloseEditClimb}
              onCloseEditSession={handleCloseEditSession}
              onCloseDeleteDialog={handleCloseDeleteDialog}
              onSaveClimb={handleSaveClimb}
              onSaveSession={handleSaveSession}
              onConfirmDelete={handleConfirmDelete}
              onOpenDeleteDialog={handleOpenDeleteDialog}
            />
          )}
        </TabsContent>
        
        <TabsContent value="climbs">
          <Card>
            <CardHeader>
              <CardTitle>All Climbs</CardTitle>
            </CardHeader>
            <CardContent>
              {allUserClimbs.length === 0 ? (
                <p className="text-muted-foreground">No climbs recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {allUserClimbs.map((climb) => (
                    <div key={climb.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{climb.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {climb.grade} • {climb.send_type} • {new Date(climb.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          const localClimb = mapDbClimbToLocalClimb(climb);
                          handleEditClimb(localClimb);
                        }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          const localClimb = mapDbClimbToLocalClimb(climb);
                          handleDeleteClimb(localClimb);
                        }}>
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