import useLocalStorage from './useLocalStorage';
import { toast } from '@/hooks/use-toast';
import { physicalSkills as defaultPhysicalSkills, technicalSkills as defaultTechnicalSkills } from "@/utils/skills";

const PHYSICAL_SKILLS_KEY = 'customPhysicalSkills';
const TECHNICAL_SKILLS_KEY = 'customTechnicalSkills';

// Helper function for skill operations to avoid code duplication
const manageSkill = (
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

  // Physical Skills Management
  const addPhysicalSkill = (skill: string) => manageSkill(physicalSkills, setPhysicalSkills, 'add', skill);
  const deletePhysicalSkill = (skill: string) => manageSkill(physicalSkills, setPhysicalSkills, 'delete', skill);
  const editPhysicalSkill = (originalSkill: string, newSkill: string) => manageSkill(physicalSkills, setPhysicalSkills, 'edit', originalSkill, newSkill);

  // Technical Skills Management
  const addTechnicalSkill = (skill: string) => manageSkill(technicalSkills, setTechnicalSkills, 'add', skill);
  const deleteTechnicalSkill = (skill: string) => manageSkill(technicalSkills, setTechnicalSkills, 'delete', skill);
  const editTechnicalSkill = (originalSkill: string, newSkill: string) => manageSkill(technicalSkills, setTechnicalSkills, 'edit', originalSkill, newSkill);
  
  return {
    physicalSkills,
    addPhysicalSkill,
    deletePhysicalSkill,
    editPhysicalSkill,
    technicalSkills,
    addTechnicalSkill,
    deleteTechnicalSkill,
    editTechnicalSkill,
  };
};
