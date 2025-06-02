import { useState, useCallback, useMemo } from "react";
import { Session } from "@/types/climbing"; // Assuming Session type is relevant
import { getGradeSystemForClimbType, GradeSystemName } from "@/utils/gradeSystem";

export type ClimbingType = 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine';

export interface SessionFormData {
  location: string;
  climbingType: ClimbingType;
  gradeSystem: GradeSystemName; // This will be derived
  notes?: string;
  // Add other fields from Session that are part of the form if any
  // e.g. date, duration, summary, participants - based on original task description
  // For now, sticking to what's in the current SessionForm.tsx
}

// Props for the hook
interface UseSessionFormProps {
  onSubmit: (sessionData: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => void;
  initialData?: Partial<SessionFormData>; // For potential future edit functionality
}

export const useSessionForm = ({
  onSubmit,
  initialData = {},
}: UseSessionFormProps) => {
  const [location, setLocation] = useState(initialData.location || "");
  const [climbingType, setClimbingType] = useState<ClimbingType>(initialData.climbingType || 'sport');
  const [notes, setNotes] = useState(initialData.notes || "");

  // Derived state: gradeSystem changes when climbingType changes
  const gradeSystem = useMemo(() => getGradeSystemForClimbType(climbingType), [climbingType]);

  const handleClimbingTypeChange = useCallback((newType: ClimbingType) => {
    setClimbingType(newType);
  }, []);

  const resetForm = useCallback(() => {
    setLocation(initialData.location || "");
    setClimbingType(initialData.climbingType || 'sport');
    setNotes(initialData.notes || "");
  }, [initialData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      // Basic validation
      console.warn("Location is required.");
      return;
    }

    const sessionDataToSubmit: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'> = {
      location,
      climbingType,
      gradeSystem, // This is crucial
      notes: notes || undefined,
      // Ensure all fields expected by onSubmit are here.
      // The original SessionFormProps['onSubmit'] expects:
      // Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>
      // The Session type itself might have more fields like 'date', 'duration', etc.
      // For now, we are only handling what was in the original form's state.
      // If other fields like 'date', 'participants' etc. were meant to be part of this form,
      // they'd need corresponding useState hooks and inclusion here.
      // The original subtask mentioned: (e.g., date, location, notes, duration, summary, participants)
      // but the provided SessionForm.tsx only had location, climbingType, notes.
      // Assuming we stick to the existing form's scope for now.
    };

    onSubmit(sessionDataToSubmit);
    resetForm();
  }, [location, climbingType, gradeSystem, notes, onSubmit, resetForm]);

  return {
    location,
    setLocation,
    climbingType,
    setClimbingType: handleClimbingTypeChange,
    notes,
    setNotes,
    gradeSystem, // Expose the derived grade system
    handleSubmit,
    resetForm,
  };
};
