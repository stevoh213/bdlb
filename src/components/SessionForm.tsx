
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessionForm, type ClimbingType } from "@/hooks/useSessionForm";
import { Session } from "@/types/climbing";
import { gradeSystems } from "@/utils/gradeSystem";
import LocationSelector from "./LocationSelector";

interface SessionFormProps {
  onSubmit: (sessionData: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => Promise<void>;
  onCancel?: () => void;
}

const SessionForm = ({ onSubmit, onCancel }: SessionFormProps) => {
  const {
    location,
    handleLocationChange,
    climbingType,
    handleClimbingTypeChange,
    notes,
    handleNotesChange,
    gradeSystem,
    handleSubmit,
    isSubmitting,
    error
  } = useSessionForm({ onSubmit });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LocationSelector
        value={location}
        onChange={handleLocationChange}
        placeholder="e.g. Red Rocks, Joshua Tree"
      />

      <div>
        <Label htmlFor="climbingType" className="text-stone-700 font-medium">Climbing Type *</Label>
        <Select value={climbingType} onValueChange={(value: ClimbingType) => handleClimbingTypeChange(value)} required>
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
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Weather, conditions, goals..."
          className="border-stone-300 resize-none"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white">
          {isSubmitting ? 'Starting Session...' : 'Start Session'}
        </Button>
      </div>
    </form>
  );
};

export default SessionForm;
