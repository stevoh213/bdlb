
import SessionDetails from "@/components/SessionDetails";
import HistoryDialogs from "@/components/HistoryDialogs";
import { Session, LocalClimb } from "@/types/climbing";
import { User } from '@supabase/supabase-js';

interface HistorySessionDetailsViewProps {
  session: Session;
  climbs: LocalClimb[];
  currentUser: User | null;
  editingClimb: LocalClimb | null;
  editingSession: Session | null;
  deleteConfirm: { type: 'session' | 'climb'; item: Session | LocalClimb } | null;
  onClose: () => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
  onResumeSession: (sessionId: string) => void;
  onShowAnalysisDrawer: () => void;
  onEditClimb: (climb: LocalClimb) => void;
  onDeleteClimb: (climb: LocalClimb) => void;
  onLogout: () => void;
  onCloseEditClimb: () => void;
  onCloseEditSession: () => void;
  onCloseDeleteDialog: () => void;
  onSaveClimb: (climbId: string, updates: Partial<LocalClimb>) => void;
  onSaveSession: (sessionId: string, updates: Partial<Session>) => void;
  onConfirmDelete: () => void;
  onOpenDeleteDialog: (item: Session | LocalClimb, type: 'session' | 'climb') => void;
}

const HistorySessionDetailsView = ({
  session,
  climbs,
  currentUser,
  editingClimb,
  editingSession,
  deleteConfirm,
  onClose,
  onEditSession,
  onDeleteSession,
  onResumeSession,
  onShowAnalysisDrawer,
  onEditClimb,
  onDeleteClimb,
  onLogout,
  onCloseEditClimb,
  onCloseEditSession,
  onCloseDeleteDialog,
  onSaveClimb,
  onSaveSession,
  onConfirmDelete,
  onOpenDeleteDialog,
}: HistorySessionDetailsViewProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
      <SessionDetails
        session={session}
        climbs={climbs}
        onClose={onClose}
        onEditSession={onEditSession}
        onDeleteSession={onDeleteSession}
        onResumeSession={onResumeSession}
        onShowAnalysisDrawer={onShowAnalysisDrawer}
        onEditClimb={onEditClimb}
        onDeleteClimb={onDeleteClimb}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      
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
  );
};

export default HistorySessionDetailsView;
