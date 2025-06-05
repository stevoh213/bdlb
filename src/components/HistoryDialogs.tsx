import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EditClimbDialog from '@/components/EditClimbDialog';
import EditSessionDialog from '@/components/EditSessionDialog';
import { LocalClimb, Session } from '@/types/climbing';
import React from 'react';

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
          open={!!editingClimb}
          onOpenChange={(open) => !open && onCloseEditClimb()}
          onSave={onSaveClimb}
          onDelete={() => onOpenDeleteDialog(editingClimb, 'climb')}
        />
      )}

      {editingSession && (
        <EditSessionDialog
          session={editingSession}
          open={!!editingSession}
          onOpenChange={(open) => !open && onCloseEditSession()}
          onSave={onSaveSession}
        />
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={onCloseDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteConfirm?.type === 'session' ? 'Session' : 'Climb'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteConfirm?.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HistoryDialogs;
