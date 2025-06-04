import React from 'react';
import { LocalClimb, Session } from '@/types/climbing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { importClimbsFromCsv } from '@/services/importService';

interface HistoryDialogsProps {
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  importDialogOpen: boolean;
  setImportDialogOpen: (open: boolean) => void;
  editingItem: LocalClimb | Session | null;
  setEditingItem: (item: LocalClimb | Session | null) => void;
  editForm: any;
  setEditForm: (form: any) => void;
  handleSaveEdit: () => void;
  handleDelete: () => void;
  handleImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const HistoryDialogs: React.FC<HistoryDialogsProps> = ({
  editDialogOpen,
  setEditDialogOpen,
  deleteDialogOpen,
  setDeleteDialogOpen,
  importDialogOpen,
  setImportDialogOpen,
  editingItem,
  setEditingItem,
  editForm,
  setEditForm,
  handleSaveEdit,
  handleDelete,
  handleImport,
}) => {
  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingItem && 'name' in editingItem ? 'Climb' : 'Session'}</DialogTitle>
          </DialogHeader>
          {editingItem && 'name' in editingItem ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={editForm.grade || ''}
                  onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tickType">Tick Type</Label>
                <Input
                  id="tickType"
                  value={editForm.tickType || ''}
                  onChange={(e) => setEditForm({ ...editForm, tickType: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="timestamp">Date</Label>
                <Input
                  id="timestamp"
                  type="datetime-local"
                  value={editForm.timestamp ? new Date(editForm.timestamp).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditForm({ ...editForm, timestamp: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editForm.location || ''}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveEdit}>Save</Button>
            </div>
          ) : (
            <div>Session editing form here</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleImport}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HistoryDialogs;
