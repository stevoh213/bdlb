import { toast } from '@/hooks/use-toast';
import { physicalSkills as defaultPhysicalSkills, technicalSkills as defaultTechnicalSkills } from "@/utils/skills";
import { useCallback, useEffect, useState } from 'react';
import useLocalStorage from './useLocalStorage';

const PHYSICAL_SKILLS_KEY = 'customPhysicalSkills';
const TECHNICAL_SKILLS_KEY = 'customTechnicalSkills';

// Helper function for skill operations to avoid code duplication
const manageSkillInternal = (
  skills: string[],
  setSkills: (skills: string[]) => void,
  action: 'add' | 'delete' | 'edit',
  skillName: string,
  newSkillName?: string
): boolean => {
  skillName = skillName.trim();
  newSkillName = newSkillName?.trim();

  if (action === 'add') {
    if (!skillName) return false;
    if (skills.some(s => s.toLowerCase() === skillName.toLowerCase())) {
      toast({ title: "Skill already exists", description: `"${skillName}" is already in the list.`, variant: "default" });
      return false;
    }
    setSkills([...skills, skillName].sort((a, b) => a.localeCompare(b)));
    toast({ title: "Skill added", description: `"${skillName}" has been added.` });
    return true;
  }

  if (action === 'delete') {
    setSkills(skills.filter(s => s !== skillName));
    toast({ title: "Skill removed", description: `"${skillName}" has been removed.` });
    return true;
  }

  if (action === 'edit') {
    if (!newSkillName) {
        toast({ title: "Skill name cannot be empty", variant: "destructive" });
        return false;
    }
    if (newSkillName.toLowerCase() !== skillName.toLowerCase() &&
        skills.some(s => s.toLowerCase() === newSkillName!.toLowerCase())) {
      toast({ title: "Skill already exists", description: `"${newSkillName}" is already in the list.`, variant: "default" });
      return false;
    }
    setSkills(skills.map(s => (s === skillName ? newSkillName! : s)).sort((a, b) => a.localeCompare(b)));
    toast({ title: "Skill updated", description: `Skill "${skillName}" updated to "${newSkillName}".` });
    return true;
  }
  return false;
};


export const useSkillsSettings = () => {
  const [physicalSkills, setPhysicalSkills] = useLocalStorage<string[]>(
    PHYSICAL_SKILLS_KEY,
    defaultPhysicalSkills
  );
  const [technicalSkills, setTechnicalSkills] = useLocalStorage<string[]>(
    TECHNICAL_SKILLS_KEY,
    defaultTechnicalSkills
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddingPhysicalSkill, setIsAddingPhysicalSkill] = useState(false);
  const [isDeletingPhysicalSkill, setIsDeletingPhysicalSkill] = useState(false);
  const [isEditingPhysicalSkill, setIsEditingPhysicalSkill] = useState(false);

  const [isAddingTechnicalSkill, setIsAddingTechnicalSkill] = useState(false);
  const [isDeletingTechnicalSkill, setIsDeletingTechnicalSkill] = useState(false);
  const [isEditingTechnicalSkill, setIsEditingTechnicalSkill] = useState(false);

  useEffect(() => {
    // Simulate loading completion as useLocalStorage initializes synchronously for the hook consumer
    setIsLoading(false);
  }, []);

  // Generic handler creator - not a hook itself, so no useCallback here.
  const createSkillHandler = <Args extends unknown[]>(
    setLoading: (loading: boolean) => void,
    actionFn: (...args: Args) => boolean // The core logic function
  ) => {
    return async (...args: Args): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const success = actionFn(...args);
        // If manageSkillInternal needed to signal a critical save error beyond validation,
        // it would need a different return type or mechanism. For now, its boolean 
        // indicates if the operation proceeded past basic validation and was attempted.
        // Toasts within manageSkillInternal handle user feedback for known validation issues.
        return success;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "An unexpected error occurred while managing skills.";
        setError(message);
        toast({ title: "Operation Failed", description: message, variant: "destructive" });
        return false;
      } finally {
        setLoading(false);
      }
    };
  };

  // Physical Skills Management
  const addPhysicalSkill = useCallback(createSkillHandler(setIsAddingPhysicalSkill, (skill: string) => 
    manageSkillInternal(physicalSkills, setPhysicalSkills, 'add', skill)
  ), [physicalSkills, setPhysicalSkills]);
  
  const deletePhysicalSkill = useCallback(createSkillHandler(setIsDeletingPhysicalSkill, (skill: string) => 
    manageSkillInternal(physicalSkills, setPhysicalSkills, 'delete', skill)
  ), [physicalSkills, setPhysicalSkills]);
  
  const editPhysicalSkill = useCallback(createSkillHandler(setIsEditingPhysicalSkill, (originalSkill: string, newSkill: string) => 
    manageSkillInternal(physicalSkills, setPhysicalSkills, 'edit', originalSkill, newSkill)
  ), [physicalSkills, setPhysicalSkills]);

  // Technical Skills Management
  const addTechnicalSkill = useCallback(createSkillHandler(setIsAddingTechnicalSkill, (skill: string) => 
    manageSkillInternal(technicalSkills, setTechnicalSkills, 'add', skill)
  ), [technicalSkills, setTechnicalSkills]);
  
  const deleteTechnicalSkill = useCallback(createSkillHandler(setIsDeletingTechnicalSkill, (skill: string) => 
    manageSkillInternal(technicalSkills, setTechnicalSkills, 'delete', skill)
  ), [technicalSkills, setTechnicalSkills]);
  
  const editTechnicalSkill = useCallback(createSkillHandler(setIsEditingTechnicalSkill, (originalSkill: string, newSkill: string) => 
    manageSkillInternal(technicalSkills, setTechnicalSkills, 'edit', originalSkill, newSkill)
  ), [technicalSkills, setTechnicalSkills]);
  
  return {
    physicalSkills,
    addPhysicalSkill,
    deletePhysicalSkill,
    editPhysicalSkill,
    technicalSkills,
    addTechnicalSkill,
    deleteTechnicalSkill,
    editTechnicalSkill,
    isLoading,
    error,
    isAddingPhysicalSkill,
    isDeletingPhysicalSkill,
    isEditingPhysicalSkill,
    isAddingTechnicalSkill,
    isDeletingTechnicalSkill,
    isEditingTechnicalSkill,
  };
};
