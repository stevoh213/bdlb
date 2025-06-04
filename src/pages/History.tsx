
import React, { useState, useEffect } from 'react';
import { LocalClimb, Session } from '@/types/climbing';
import { useClimbingSessions } from '@/hooks/useClimbingSessions';
import { useClimbs } from '@/hooks/useClimbs';
import HistorySessionListView from '@/components/HistorySessionListView';
import HistorySessionDetailsView from '@/components/HistorySessionDetailsView';
import HistoryDialogs from '@/components/HistoryDialogs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, FileUp } from 'lucide-react';
import { exportClimbsToCsv, importClimbsFromCsv } from '@/services/importService';
import { useToast } from '@/hooks/use-toast';

const History = () => {
  const { sessions, isLoading: sessionsLoading } = useClimbingSessions();
  const { climbs, addClimb, updateClimb, deleteClimb } = useClimbs();
  const { toast } = useToast();
  
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LocalClimb | Session | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Convert sessions data to proper format with Date objects
  const formattedSessions: Session[] = sessions?.map(session => ({
    ...session,
    startTime: new Date(session.startTime),
    endTime: new Date(session.endTime),
    climbs: session.climbs?.map(climb => ({
      ...climb,
      timestamp: new Date(climb.timestamp || new Date()),
      tickType: climb.tickType || 'attempt'
    })) || []
  })) || [];

  const handleEditItem = (item: LocalClimb | Session) => {
    setEditingItem(item);
    setEditForm(item);
    setEditDialogOpen(true);
  };

  const handleDeleteItem = (item: LocalClimb | Session) => {
    setEditingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    
    if ('name' in editingItem) {
      // It's a climb - convert to proper format
      const climbUpdate = {
        ...editForm,
        timestamp: editForm.timestamp ? new Date(editForm.timestamp) : new Date()
      };
      updateClimb(editingItem.id, climbUpdate);
    }
    // Session editing would go here
    
    setEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = () => {
    if (!editingItem) return;
    
    if ('name' in editingItem) {
      // It's a climb
      deleteClimb(editingItem.id);
    }
    // Session deletion would go here
    
    setDeleteDialogOpen(false);
    setEditingItem(null);
  };

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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
        
        setImportDialogOpen(false);
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

  if (sessionsLoading) {
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
          <Button onClick={() => setImportDialogOpen(true)} variant="outline">
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
              onBack={() => setSelectedSession(null)}
              onEditClimb={handleEditItem}
              onDeleteClimb={handleDeleteItem}
            />
          ) : (
            <HistorySessionListView
              sessions={formattedSessions}
              onSelectSession={setSelectedSession}
              onEditSession={handleEditItem}
              onDeleteSession={handleDeleteItem}
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
                          {climb.grade} • {climb.tickType} • {new Date(climb.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditItem(climb)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteItem(climb)}>
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

      <HistoryDialogs
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        importDialogOpen={importDialogOpen}
        setImportDialogOpen={setImportDialogOpen}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        editForm={editForm}
        setEditForm={setEditForm}
        handleSaveEdit={handleSaveEdit}
        handleDelete={handleDelete}
        handleImport={handleImport}
      />
    </div>
  );
};

export default History;
