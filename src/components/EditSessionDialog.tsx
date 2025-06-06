import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Session } from "@/types/climbing";
import { useState } from "react";

interface EditSessionDialogProps {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sessionId: string, updates: Partial<Session>) => void;
}

const EditSessionDialog = ({
  session,
  open,
  onOpenChange,
  onSave,
}: EditSessionDialogProps) => {
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const formatTime = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    location: session.location,
    climbingType: session.climbingType,
    date: formatDate(session.startTime),
    startTime: formatTime(session.startTime),
    endTime: session.endTime ? formatTime(session.endTime) : "",
    notes: session.notes || "",
  });

  const handleSave = () => {
    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = formData.endTime
      ? new Date(`${formData.date}T${formData.endTime}`)
      : undefined;

    const updates: Partial<Session> = {
      location: formData.location,
      climbingType: formData.climbingType as Session["climbingType"],
      startTime: start,
      endTime: end,
      notes: formData.notes || undefined,
    };

    onSave(session.id, updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Climbing location"
            />
          </div>

          <div>
            <Label>Climbing Type</Label>
            <Select
              value={formData.climbingType}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  climbingType: value as Session["climbingType"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sport">Sport</SelectItem>
                <SelectItem value="trad">Trad</SelectItem>
                <SelectItem value="boulder">Boulder</SelectItem>
                <SelectItem value="toprope">Top Rope</SelectItem>
                <SelectItem value="multipitch">Multi-pitch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Session notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
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

export default EditSessionDialog;
