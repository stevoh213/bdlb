import { getGradesForSystem } from "@/utils/gradeSystem"; // Assuming this utility is needed
import { useCallback, useState } from "react";

export type TickType = 'send' | 'attempt' | 'flash' | 'onsight';

export interface ClimbFormData {
  name: string;
  grade: string;
  location?: string;
  tickType: TickType;
  attempts?: number;
  height?: number;
  timeOnWall?: number;
  effort: number;
  notes?: string;
  physicalSkills?: string[];
  technicalSkills?: string[];
}

interface UseClimbFormProps {
  onSubmit: (climb: ClimbFormData) => Promise<void>;
  initialData?: Partial<ClimbFormData>;
  sessionLocation?: string;
  gradeSystem?: string;
}

export const useClimbForm = ({
  onSubmit,
  initialData = {},
  sessionLocation,
  gradeSystem = 'yds',
}: UseClimbFormProps) => {
  const [name, setNameState] = useState(initialData.name || "");
  const [grade, setGradeState] = useState(initialData.grade || "");
  const [location, setLocationState] = useState(initialData.location || sessionLocation || "");
  const [tickType, setTickTypeState] = useState<TickType>(initialData.tickType || 'send');
  const [attempts, setAttemptsState] = useState(initialData.attempts || 1);
  const [height, setHeightState] = useState<number | undefined>(initialData.height);
  const [timeOnWall, setTimeOnWallState] = useState<number | undefined>(initialData.timeOnWall);
  const [effort, setEffortState] = useState([initialData.effort || 7]);
  const [notes, setNotesState] = useState(initialData.notes || "");
  const [physicalSkills, setPhysicalSkillsState] = useState<string[]>(initialData.physicalSkills || []);
  const [technicalSkills, setTechnicalSkillsState] = useState<string[]>(initialData.technicalSkills || []);
  const [showOptional, setShowOptionalState] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setName = useCallback((value: string) => {
    setNameState(value);
    setError(null);
  }, []);

  const setGrade = useCallback((value: string) => {
    setGradeState(value);
    setError(null);
  }, []);

  const setLocation = useCallback((value: string) => {
    setLocationState(value);
    setError(null);
  }, []);

  const setTickType = useCallback((newTickType: TickType) => {
    setTickTypeState(newTickType);
    if (newTickType !== 'attempt') {
      setAttemptsState(1); // Reset attempts if not 'attempt'
    }
    setError(null);
  }, []);

  const setAttempts = useCallback((newAttempts: number) => {
    setAttemptsState(newAttempts);
    setError(null);
  }, []);

  const setHeight = useCallback((value: number | undefined) => {
    setHeightState(value);
    setError(null);
  }, []);

  const setTimeOnWall = useCallback((value: number | undefined) => {
    setTimeOnWallState(value);
    setError(null);
  }, []);

  const setEffort = useCallback((newEffort: number[]) => {
    setEffortState(newEffort);
    setError(null);
  }, []);

  const setNotes = useCallback((value: string) => {
    setNotesState(value);
    setError(null);
  }, []);

  const setPhysicalSkills = useCallback((value: string[]) => {
    setPhysicalSkillsState(value);
    setError(null);
  }, []);

  const setTechnicalSkills = useCallback((value: string[]) => {
    setTechnicalSkillsState(value);
    setError(null);
  }, []);
  
  const setShowOptional = useCallback((value: boolean) => {
    setShowOptionalState(value);
    // setError(null); // Typically UI state changes like this don't clear form submission errors
  }, []);


  const resetForm = useCallback(() => {
    setNameState(initialData.name || "");
    setGradeState(initialData.grade || "");
    setLocationState(initialData.location || sessionLocation || "");
    setTickTypeState(initialData.tickType || 'send');
    setAttemptsState(initialData.attempts || 1);
    setHeightState(initialData.height);
    setTimeOnWallState(initialData.timeOnWall);
    setEffortState([initialData.effort || 7]);
    setNotesState(initialData.notes || "");
    setPhysicalSkillsState(initialData.physicalSkills || []);
    setTechnicalSkillsState(initialData.technicalSkills || []);
    setShowOptionalState(false);
    setError(null); // Clear error on reset
  }, [initialData, sessionLocation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!name || !grade) {
      setError("Name and grade are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        name,
        grade,
        location: location || undefined,
        tickType,
        attempts: tickType === 'attempt' ? attempts : undefined,
        height,
        timeOnWall,
        effort: effort[0],
        notes: notes || undefined,
        physicalSkills: physicalSkills.length > 0 ? physicalSkills : undefined,
        technicalSkills: technicalSkills.length > 0 ? technicalSkills : undefined,
      });
      resetForm(); // Reset form only on successful submission
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else if (typeof e === 'string') {
        setError(e);
      } else {
        setError("An unexpected error occurred during submission.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name,
    grade,
    location,
    tickType,
    attempts,
    height,
    timeOnWall,
    effort,
    notes,
    physicalSkills,
    technicalSkills,
    onSubmit,
    resetForm,
  ]);
  
  const availableGrades = getGradesForSystem(gradeSystem);

  return {
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
    resetForm,
    availableGrades,
    isSubmitting,
    error,
  };
};
