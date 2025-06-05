import { Session } from "@/types/climbing"; // Assuming Session type is relevant
import { getGradeSystemForClimbType } from "@/utils/gradeSystem";
import { useCallback, useMemo, useState } from "react";

export type ClimbingType = 'sport' | 'trad' | 'boulder' | 'top rope' | 'alpine';

export interface SessionFormData {
  location: string;
  climbingType: ClimbingType;
  gradeSystem: string; // Changed from GradeSystemName
  notes?: string;
  // Add other fields from Session that are part of the form if any
  // e.g. date, duration, summary, participants - based on original task description
  // For now, sticking to what's in the current SessionForm.tsx
}

// Props for the hook
interface UseSessionFormProps {
  onSubmit: (sessionData: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'>) => Promise<void>;
  initialData?: Partial<SessionFormData>; // For potential future edit functionality
}

export const useSessionForm = ({
  onSubmit,
  initialData = {},
}: UseSessionFormProps) => {
  const [location, setLocation] = useState(initialData.location || "");
  const [climbingType, setClimbingType] = useState<ClimbingType>(initialData.climbingType || 'sport');
  const [notes, setNotes] = useState(initialData.notes || "");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state: gradeSystem changes when climbingType changes
  const gradeSystem = useMemo(() => getGradeSystemForClimbType(climbingType), [climbingType]);

  const handleLocationChange = useCallback((newLocation: string) => {
    setLocation(newLocation);
    setError(null);
  }, []);

  const handleClimbingTypeChange = useCallback((newType: ClimbingType) => {
    setClimbingType(newType);
    setError(null);
  }, []);

  const handleNotesChange = useCallback((newNotes: string) => {
    setNotes(newNotes);
    setError(null);
  }, []);

  const resetForm = useCallback(() => {
    setLocation(initialData.location || "");
    setClimbingType(initialData.climbingType || 'sport');
    setNotes(initialData.notes || "");
    setError(null);
  }, [initialData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!location.trim()) {
      setError("Location is required.");
      return;
    }

    setIsSubmitting(true);
    const sessionDataToSubmit: Omit<Session, 'id' | 'startTime' | 'endTime' | 'climbs' | 'isActive' | 'breaks' | 'totalBreakTime'> = {
      location: location.trim(),
      climbingType,
      gradeSystem,
      notes: notes.trim() || undefined,
    };

    try {
      await onSubmit(sessionDataToSubmit);
      resetForm();
    } catch (submissionError: unknown) {
      const message = submissionError instanceof Error ? submissionError.message : "An unexpected error occurred during submission.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [location, climbingType, gradeSystem, notes, onSubmit, resetForm]);

  return {
    location,
    handleLocationChange,
    climbingType,
    handleClimbingTypeChange,
    notes,
    handleNotesChange,
    gradeSystem,
    handleSubmit,
    resetForm,
    isSubmitting,
    error,
  };
};
