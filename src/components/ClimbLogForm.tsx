
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SkillsSelector from "./SkillsSelector";
import LocationSelector from "./LocationSelector";
import { useClimbForm, ClimbFormData, TickType } from "@/hooks/useClimbForm";
import { cn } from "@/lib/utils"; // Import cn utility
import styles from "./ClimbLogForm.module.css"; // Import CSS module

interface ClimbLogFormProps {
  onSubmit: (climb: ClimbFormData) => void;
  onCancel: () => void;
  gradeSystem?: string;
  sessionLocation?: string;
}

const ClimbLogForm = ({ onSubmit, onCancel, gradeSystem = 'yds', sessionLocation }: ClimbLogFormProps) => {
  const {
    name,
    setName,
    grade,
    setGrade,
    location,
    setLocation,
    tickType,
    setTickType,
    attempts,
    setAttempts,
    height,
    setHeight,
    timeOnWall,
    setTimeOnWall,
    effort,
    setEffort,
    notes,
    setNotes,
    physicalSkills,
    setPhysicalSkills,
    technicalSkills,
    setTechnicalSkills,
    showOptional,
    setShowOptional,
    handleSubmit,
    // resetForm, // Not directly called here, but part of handleSubmit
    availableGrades,
  } = useClimbForm({
    onSubmit,
    sessionLocation,
    gradeSystem,
  });

  // const tickTypeColors: Record<TickType, string> = { // Removed this object
  //   send: "bg-green-100 text-green-800 border-green-200",
  //   attempt: "bg-orange-100 text-orange-800 border-orange-200",
  //   flash: "bg-blue-100 text-blue-800 border-blue-200",
  //   onsight: "bg-purple-100 text-purple-800 border-purple-200"
  // };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Essential Fields */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="name" className="text-stone-700 font-medium">Route Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter route name"
            className="h-12 text-lg border-stone-300 focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <Label htmlFor="grade" className="text-stone-700 font-medium">Grade *</Label>
          <Select value={grade} onValueChange={setGrade} required>
            <SelectTrigger className="h-12 text-lg border-stone-300 focus:border-emerald-500">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {availableGrades.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-stone-700 font-medium">Tick Type *</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {(['send', 'attempt', 'flash', 'onsight'] as const).map((typeValue) => (
              <Badge
                key={typeValue}
                variant="outline" // Keep variant if it provides other base styles from <Badge>
                className={cn(
                  "h-12 flex items-center justify-center cursor-pointer transition-all capitalize", // Common Tailwind classes
                  // Apply CSS module class based on active state and type
                  tickType === typeValue ? styles[typeValue] : styles.inactive 
                )}
                onClick={() => setTickType(typeValue)}
              >
                {typeValue}
              </Badge>
            ))}
          </div>
        </div>

        {/* Attempts field - only show for attempt tick type */}
        {tickType === 'attempt' && (
          <div>
            <Label htmlFor="attempts" className="text-stone-700 font-medium">Number of Attempts *</Label>
            <Select value={attempts.toString()} onValueChange={(value) => setAttempts(Number(value))} required>
              <SelectTrigger className="h-12 text-lg border-stone-300 focus:border-emerald-500">
                <SelectValue placeholder="Select attempts" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>{num} attempt{num !== 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Optional Fields Toggle */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => setShowOptional(!showOptional)}
        className="w-full text-stone-600 hover:text-stone-800"
      >
        {showOptional ? "Hide" : "Show"} Optional Fields
      </Button>

      {/* Optional Fields */}
      {showOptional && (
        <Card className="border-stone-200 bg-stone-50">
          <CardContent className="p-4 space-y-4">
            <LocationSelector
              value={location}
              onChange={setLocation}
              placeholder={sessionLocation ? `Using session location: ${sessionLocation}` : "Enter specific location (optional)"}
              className="mb-4"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="height" className="text-stone-700">Height (ft)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height || ""}
                  onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                  className="border-stone-300"
                />
              </div>
              <div>
                <Label htmlFor="timeOnWall" className="text-stone-700">Time (min)</Label>
                <Input
                  id="timeOnWall"
                  type="number"
                  value={timeOnWall || ""}
                  onChange={(e) => setTimeOnWall(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                  className="border-stone-300"
                />
              </div>
            </div>

            <div>
              <Label className="text-stone-700">Perceived Effort: {effort[0]}/10</Label>
              <div className="mt-2 px-2">
                <Slider
                  value={effort}
                  onValueChange={setEffort}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <SkillsSelector
              selectedPhysicalSkills={physicalSkills}
              selectedTechnicalSkills={technicalSkills}
              onPhysicalSkillsChange={setPhysicalSkills}
              onTechnicalSkillsChange={setTechnicalSkills}
            />

            <div>
              <Label htmlFor="notes" className="text-stone-700">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Beta, conditions, thoughts..."
                className="border-stone-300 resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
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
          disabled={!name || !grade}
          className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Log Climb
        </Button>
      </div>
    </form>
  );
};

export default ClimbLogForm;
