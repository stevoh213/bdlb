import { useState, useCallback } from "react";
import { getGradesForSystem } from "@/utils/gradeSystem"; // Assuming this utility is needed

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
  onSubmit: (climb: ClimbFormData) => void;
  initialData?: Partial<ClimbFormData>; // For editing, though not explicitly requested for this task
  sessionLocation?: string;
  gradeSystem?: string;
}

export const useClimbForm = ({
  onSubmit,
  initialData = {},
  sessionLocation,
  gradeSystem = 'yds',
}: UseClimbFormProps) => {
  const [name, setName] = useState(initialData.name || "");
  const [grade, setGrade] = useState(initialData.grade || "");
  const [location, setLocation] = useState(initialData.location || sessionLocation || "");
  const [tickType, setTickType] = useState<TickType>(initialData.tickType || 'send');
  const [attempts, setAttempts] = useState(initialData.attempts || 1);
  const [height, setHeight] = useState<number | undefined>(initialData.height);
  const [timeOnWall, setTimeOnWall] = useState<number | undefined>(initialData.timeOnWall);
  const [effort, setEffort] = useState([initialData.effort || 7]);
  const [notes, setNotes] = useState(initialData.notes || "");
  const [physicalSkills, setPhysicalSkills] = useState<string[]>(initialData.physicalSkills || []);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>(initialData.technicalSkills || []);
  const [showOptional, setShowOptional] = useState(false); // This could also be managed outside if preferred

  const handleGradeChange = useCallback((newGrade: string) => {
    setGrade(newGrade);
  }, []);

  const handleTickTypeChange = useCallback((newTickType: TickType) => {
    setTickType(newTickType);
    if (newTickType !== 'attempt') {
      setAttempts(1); // Reset attempts if not 'attempt'
    }
  }, []);

  const handleAttemptsChange = useCallback((newAttempts: number) => {
    setAttempts(newAttempts);
  }, []);
  
  const handleEffortChange = useCallback((newEffort: number[]) => {
    setEffort(newEffort);
  }, []);

  const resetForm = useCallback(() => {
    setName(initialData.name || "");
    setGrade(initialData.grade || "");
    setLocation(initialData.location || sessionLocation || "");
    setTickType(initialData.tickType || 'send');
    setAttempts(initialData.attempts || 1);
    setHeight(initialData.height);
    setTimeOnWall(initialData.timeOnWall);
    setEffort([initialData.effort || 7]);
    setNotes(initialData.notes || "");
    setPhysicalSkills(initialData.physicalSkills || []);
    setTechnicalSkills(initialData.technicalSkills || []);
    setShowOptional(false);
  }, [initialData, sessionLocation]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !grade) {
      // Basic validation, can be expanded
      console.warn("Name and grade are required.");
      return;
    }

    onSubmit({
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

    resetForm();
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
    setGrade: handleGradeChange, // Using specific handler
    location,
    setLocation,
    tickType,
    setTickType: handleTickTypeChange, // Using specific handler
    attempts,
    setAttempts: handleAttemptsChange, // Using specific handler
    height,
    setHeight,
    timeOnWall,
    setTimeOnWall,
    effort,
    setEffort: handleEffortChange, // Using specific handler
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
    availableGrades, // Pass available grades to the component
  };
};
