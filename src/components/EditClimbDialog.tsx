
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SupabaseClimb } from "@/hooks/useClimbsSync";

interface EditClimbDialogProps {
  climb: SupabaseClimb;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, climb: Partial<SupabaseClimb>) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const EditClimbDialog = ({ 
  climb, 
  open, 
  onOpenChange, 
  onSave, 
  onDelete, 
  isLoading 
}: EditClimbDialogProps) => {
  const [formData, setFormData] = useState({
    name: climb.name,
    grade: climb.grade,
    type: climb.type,
    send_type: climb.send_type,
    location: climb.location,
    attempts: climb.attempts,
    rating: climb.rating || undefined,
    notes: climb.notes || '',
    duration: climb.duration || undefined,
  });

  const handleSave = () => {
    onSave(climb.id, formData);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this climb?')) {
      onDelete(climb.id);
      onOpenChange(false);
    }
  };

  const commonGrades = ["5.6", "5.7", "5.8", "5.9", "5.10a", "5.10b", "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d", "5.12a", "5.12b", "5.12c", "5.12d"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Climb</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Route Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="grade">Grade</Label>
            <Select value={formData.grade} onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonGrades.map((grade) => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sport">Sport</SelectItem>
                <SelectItem value="trad">Trad</SelectItem>
                <SelectItem value="boulder">Boulder</SelectItem>
                <SelectItem value="top rope">Top Rope</SelectItem>
                <SelectItem value="alpine">Alpine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="send_type">Send Type</Label>
            <Select value={formData.send_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, send_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="send">Send</SelectItem>
                <SelectItem value="attempt">Attempt</SelectItem>
                <SelectItem value="flash">Flash</SelectItem>
                <SelectItem value="onsight">Onsight</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="attempts">Attempts</Label>
            <Input
              id="attempts"
              type="number"
              value={formData.attempts}
              onChange={(e) => setFormData(prev => ({ ...prev, attempts: Number(e.target.value) }))}
            />
          </div>

          <div>
            <Label htmlFor="rating">Rating (1-10)</Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="10"
              value={formData.rating || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClimbDialog;
