
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { physicalSkills as defaultPhysicalSkills, technicalSkills as defaultTechnicalSkills } from "@/utils/skills";

interface SkillsSelectorProps {
  selectedPhysicalSkills: string[];
  selectedTechnicalSkills: string[];
  onPhysicalSkillsChange: (skills: string[]) => void;
  onTechnicalSkillsChange: (skills: string[]) => void;
}

const SkillsSelector = ({ 
  selectedPhysicalSkills, 
  selectedTechnicalSkills, 
  onPhysicalSkillsChange, 
  onTechnicalSkillsChange 
}: SkillsSelectorProps) => {
  const [physicalSkills, setPhysicalSkills] = useState<string[]>(defaultPhysicalSkills);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>(defaultTechnicalSkills);

  // Load custom skills from localStorage
  useEffect(() => {
    const customPhysicalSkills = localStorage.getItem('customPhysicalSkills');
    if (customPhysicalSkills) {
      setPhysicalSkills(JSON.parse(customPhysicalSkills));
    }

    const customTechnicalSkills = localStorage.getItem('customTechnicalSkills');
    if (customTechnicalSkills) {
      setTechnicalSkills(JSON.parse(customTechnicalSkills));
    }
  }, []);

  const togglePhysicalSkill = (skill: string) => {
    const newSkills = selectedPhysicalSkills.includes(skill)
      ? selectedPhysicalSkills.filter(s => s !== skill)
      : [...selectedPhysicalSkills, skill];
    onPhysicalSkillsChange(newSkills);
  };

  const toggleTechnicalSkill = (skill: string) => {
    const newSkills = selectedTechnicalSkills.includes(skill)
      ? selectedTechnicalSkills.filter(s => s !== skill)
      : [...selectedTechnicalSkills, skill];
    onTechnicalSkillsChange(newSkills);
  };

  return (
    <div className="space-y-4">
      <Card className="border-stone-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-stone-700">Physical Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {physicalSkills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className={`cursor-pointer transition-all ${
                  selectedPhysicalSkills.includes(skill)
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "border-stone-300 text-stone-600 hover:bg-stone-50"
                }`}
                onClick={() => togglePhysicalSkill(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-stone-700">Technical Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {technicalSkills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className={`cursor-pointer transition-all ${
                  selectedTechnicalSkills.includes(skill)
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "border-stone-300 text-stone-600 hover:bg-stone-50"
                }`}
                onClick={() => toggleTechnicalSkill(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillsSelector;
