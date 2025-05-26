
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Session } from "@/types/climbing";
import { getGradeSystemForClimbType, gradeSystems } from "@/utils/gradeSystem";

interface SessionFormProps {
  onSubmit: (session: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => void;
  onCancel: () => void;
}

const SessionForm = ({ onSubmit, onCancel }: SessionFormProps) => {
  const [location, setLocation] = useState("");
  const [climbingType, setClimbingType] = useState<'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine'>('sport');
  const [notes, setNotes] = useState("");

  const gradeSystem = getGradeSystemForClimbType(climbingType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    onSubmit({
      location,
      climbingType,
      gradeSystem,
      notes: notes || undefined
    });

    // Reset form
    setLocation("");
    setClimbingType('sport');
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="location" className="text-stone-700 font-medium">Location *</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Red Rocks, Joshua Tree"
          className="h-12 text-lg border-stone-300 focus:border-amber-500"
          required
        />
      </div>

      <div>
        <Label htmlFor="climbingType" className="text-stone-700 font-medium">Climbing Type *</Label>
        <Select value={climbingType} onValueChange={(value: 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine') => setClimbingType(value)} required>
          <SelectTrigger className="h-12 text-lg border-stone-300 focus:border-amber-500">
            <SelectValue placeholder="Select climbing type" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="sport">Sport Climbing</SelectItem>
            <SelectItem value="trad">Traditional</SelectItem>
            <SelectItem value="boulder">Bouldering</SelectItem>
            <SelectItem value="top rope">Top Rope</SelectItem>
            <SelectItem value="alpine">Alpine</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-stone-500 mt-1">
          Grade system: {gradeSystems[gradeSystem]?.name}
        </p>
      </div>

      <div>
        <Label htmlFor="notes" className="text-stone-700">Session Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Weather, conditions, goals..."
          className="border-stone-300 resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 border-stone-300 text-stone-600"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!location}
          className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white"
        >
          Start Session
        </Button>
      </div>
    </form>
  );
};

export default SessionForm;
