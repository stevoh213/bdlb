
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Session } from "@/types/climbing";
import { gradeSystems } from "@/utils/gradeSystem"; // getGradeSystemForClimbType moved to hook
import LocationSelector from "./LocationSelector";
import { useSessionForm, ClimbingType } from "@/hooks/useSessionForm"; // Import the hook

interface SessionFormProps {
  onSubmit: (session: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => void;
  onCancel: () => void;
}

const SessionForm = ({ onSubmit, onCancel }: SessionFormProps) => {
  const {
    location,
    setLocation,
    climbingType,
    setClimbingType,
    notes,
    setNotes,
    gradeSystem, // Get from hook
    handleSubmit,
    // resetForm, // Not directly called here, part of handleSubmit
  } = useSessionForm({ onSubmit });

  // const gradeSystem = getGradeSystemForClimbType(climbingType); // Logic moved to hook

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LocationSelector
        value={location}
        onChange={setLocation}
        placeholder="e.g. Red Rocks, Joshua Tree"
      />

      <div>
        <Label htmlFor="climbingType" className="text-stone-700 font-medium">Climbing Type *</Label>
        <Select value={climbingType} onValueChange={(value: ClimbingType) => setClimbingType(value)} required>
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
          Grade system: {gradeSystem ? gradeSystems[gradeSystem]?.name : 'N/A'}
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
