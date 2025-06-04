import HistoryDialogs from "@/components/HistoryDialogs";
import SessionList from "@/components/SessionList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Climb, LocalClimb, Session } from "@/types/climbing";
import { ArrowLeft, Calendar, Download, Upload } from "lucide-react";
import { Link } from "react-router-dom";

interface HistorySessionListViewProps {
  sessions: Session[];
  allUserClimbs: Climb[];
  isLoadingSessions: boolean;
  editingClimb: LocalClimb | null;
  editingSession: Session | null;
  deleteConfirm: { type: 'session' | 'climb'; item: Session | LocalClimb } | null;
  onSelectSession: (sessionId: string) => void;
  onExportData: () => void;
  onCloseEditClimb: () => void;
  onCloseEditSession: () => void;
  onCloseDeleteDialog: () => void;
  onSaveClimb: (climbId: string, updates: Partial<LocalClimb>) => void;
  onSaveSession: (sessionId: string, updates: Partial<Session>) => void;
  onConfirmDelete: () => void;
  onOpenDeleteDialog: (item: Session | LocalClimb, type: 'session' | 'climb') => void;
}

const HistorySessionListView = ({
  sessions,
  allUserClimbs,
  isLoadingSessions,
  editingClimb,
  editingSession,
  deleteConfirm,
  onSelectSession,
  onExportData,
  onCloseEditClimb,
  onCloseEditSession,
  onCloseDeleteDialog,
  onSaveClimb,
  onSaveSession,
  onConfirmDelete,
  onOpenDeleteDialog,
}: HistorySessionListViewProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-stone-600">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 flex-1">Session History</h1>
          <div className="flex items-center gap-2">
            <Link to="/import">
              <Button variant="outline" size="sm" className="text-stone-600 border-stone-300">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </Link>
            {sessions.length > 0 && (
              <Button variant="outline" size="sm" onClick={onExportData} className="text-stone-600 border-stone-300">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {isLoadingSessions ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <Card className="border-stone-200 shadow-lg">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-stone-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-stone-700 mb-2">No Sessions Yet</h3>
              <p className="text-stone-600 mb-4">Start your first climbing session to see it here!</p>
              <Link to="/">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Start Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <SessionList 
            sessions={sessions} 
            onSelectSession={onSelectSession}
            allUserClimbs={allUserClimbs}
          />
        )}
        
        <HistoryDialogs
          editingClimb={editingClimb}
          editingSession={editingSession}
          deleteConfirm={deleteConfirm}
          onCloseEditClimb={onCloseEditClimb}
          onCloseEditSession={onCloseEditSession}
          onCloseDeleteDialog={onCloseDeleteDialog}
          onSaveClimb={onSaveClimb}
          onSaveSession={onSaveSession}
          onConfirmDelete={onConfirmDelete}
          onOpenDeleteDialog={onOpenDeleteDialog}
        />
      </div>
    </div>
  );
};

export default HistorySessionListView;
