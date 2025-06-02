
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LocalClimb } from "@/types/climbing";
import SkillsSelector from "./SkillsSelector";

interface EditClimbDialogProps {
  climb: LocalClimb;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (climbId: string, updates: Partial<LocalClimb>) => void;
}

const EditClimbDialog = ({ climb, open, onOpenChange, onSave }: EditClimbDialogProps) => {
  const [formData, setFormData] = useState({
    name: climb.name,
    grade: climb.grade,
    tickType: climb.tickType,
    attempts: climb.attempts || 1,
    height: climb.height || "",
    timeOnWall: climb.timeOnWall || "",
    effort: climb.effort || "",
    notes: climb.notes || "",
    physicalSkills: climb.physicalSkills || [],
    technicalSkills: climb.technicalSkills || []
  });

  const handleSave = () => {
    const updates: Partial<LocalClimb> = {
      name: formData.name,
      grade: formData.grade,
      tickType: formData.tickType as LocalClimb['tickType'],
      attempts: formData.tickType === 'attempt' ? formData.attempts : undefined,
      height: formData.height ? Number(formData.height) : undefined,
      timeOnWall: formData.timeOnWall ? Number(formData.timeOnWall) : undefined,
      effort: formData.effort ? Number(formData.effort) : undefined,
      notes: formData.notes || undefined,
      physicalSkills: formData.physicalSkills.length > 0 ? formData.physicalSkills : undefined,
      technicalSkills: formData.technicalSkills.length > 0 ? formData.technicalSkills : undefined
    };

    onSave(climb.id, updates);
    onOpenChange(false);
  };

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
              placeholder="Route name"
            />
          </div>

          <div>
            <Label htmlFor="grade">Grade</Label>
            <Input
              id="grade"
              value={formData.grade}
              onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
              placeholder="5.10a, V4, etc."
            />
          </div>

          <div>
            <Label>Tick Type</Label>
            <Select 
              value={formData.tickType} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                tickType: value as LocalClimb['tickType'],
                attempts: value !== 'attempt' ? 1 : prev.attempts
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="send">Send</SelectItem>
                <SelectItem value="attempt">Attempt</SelectItem>
                <SelectItem value="flash">Flash</SelectItem>
                <SelectItem value="onsight">Onsight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.tickType === 'attempt' && (
            <div>
              <Label htmlFor="attempts">Number of Attempts</Label>
              <Select 
                value={formData.attempts.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, attempts: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} attempt{num !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="height">Height (ft)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                placeholder="Height"
              />
            </div>
            <div>
              <Label htmlFor="timeOnWall">Time (min)</Label>
              <Input
                id="timeOnWall"
                type="number"
                value={formData.timeOnWall}
                onChange={(e) => setFormData(prev => ({ ...prev, timeOnWall: e.target.value }))}
                placeholder="Time"
              />
            </div>
            <div>
              <Label htmlFor="effort">Effort (1-10)</Label>
              <Input
                id="effort"
                type="number"
                min="1"
                max="10"
                value={formData.effort}
                onChange={(e) => setFormData(prev => ({ ...prev, effort: e.target.value }))}
                placeholder="Effort"
              />
            </div>
          </div>

          <SkillsSelector
            selectedPhysicalSkills={formData.physicalSkills}
            selectedTechnicalSkills={formData.technicalSkills}
            onPhysicalSkillsChange={(skills) => setFormData(prev => ({ ...prev, physicalSkills: skills }))}
            onTechnicalSkillsChange={(skills) => setFormData(prev => ({ ...prev, technicalSkills: skills }))}
          />

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClimbDialog;
