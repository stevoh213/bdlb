
import EditClimbDialog from "@/components/EditClimbDialog";
import EditSessionDialog from "@/components/EditSessionDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Session, LocalClimb } from "@/types/climbing";

interface HistoryDialogsProps {
  editingClimb: LocalClimb | null;
  editingSession: Session | null;
  deleteConfirm: { type: 'session' | 'climb'; item: Session | LocalClimb } | null;
  onCloseEditClimb: () => void;
  onCloseEditSession: () => void;
  onCloseDeleteDialog: () => void;
  onSaveClimb: (climbId: string, updates: Partial<LocalClimb>) => void;
  onSaveSession: (sessionId: string, updates: Partial<Session>) => void;
  onConfirmDelete: () => void;
  onOpenDeleteDialog: (item: Session | LocalClimb, type: 'session' | 'climb') => void;
}

const HistoryDialogs = ({
  editingClimb,
  editingSession,
  deleteConfirm,
  onCloseEditClimb,
  onCloseEditSession,
  onCloseDeleteDialog,
  onSaveClimb,
  onSaveSession,
  onConfirmDelete,
  onOpenDeleteDialog,
}: HistoryDialogsProps) => {
  return (
    <>
      {editingClimb && (
        <EditClimbDialog 
          climb={editingClimb} 
          open={true} 
          onOpenChange={(open) => !open && onCloseEditClimb()} 
          onSave={(updates) => onSaveClimb(editingClimb.id, updates)}
          onDelete={(climb) => onOpenDeleteDialog(climb, 'climb')}
        />
      )}
      {editingSession && (
        <EditSessionDialog 
          session={editingSession} 
          open={true} 
          onOpenChange={(open) => !open && onCloseEditSession()} 
          onSave={(updates) => onSaveSession(editingSession.id, updates)} 
        />
      )}
      {deleteConfirm && (
        <DeleteConfirmDialog 
          open={true} 
          onOpenChange={(open) => !open && onCloseDeleteDialog()} 
          onConfirm={onConfirmDelete} 
          title={deleteConfirm.type === 'session' ? 'Delete Session' : 'Delete Climb'} 
          description={deleteConfirm.type === 'session' ? 'Are you sure you want to delete this entire climbing session? This will also delete all climbs in this session.' : 'Are you sure you want to delete this climb?'} 
          itemName={deleteConfirm.type === 'session' ? (deleteConfirm.item as Session).location : (deleteConfirm.item as LocalClimb).name} 
        />
      )}
    </>
  );
};

export default HistoryDialogs;
