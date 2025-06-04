import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, Plus } from "lucide-react";
import { physicalSkills as defaultPhysicalSkills, technicalSkills as defaultTechnicalSkills } from "@/utils/skills";
import { useToast } from "@/hooks/use-toast";

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
  const [allPhysicalSkills, setAllPhysicalSkills] = useState<string[]>([]);
  const [allTechnicalSkills, setAllTechnicalSkills] = useState<string[]>([]);
  
  const [newPhysicalSkillInput, setNewPhysicalSkillInput] = useState("");
  const [newTechnicalSkillInput, setNewTechnicalSkillInput] = useState("");
  
  const [physicalSearchQuery, setPhysicalSearchQuery] = useState("");
  const [technicalSearchQuery, setTechnicalSearchQuery] = useState("");
  const [showPhysicalAdd, setShowPhysicalAdd] = useState(false);
  const [showTechnicalAdd, setShowTechnicalAdd] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSkills = () => {
      const customPhysical = JSON.parse(localStorage.getItem('customPhysicalSkills') || '[]');
      setAllPhysicalSkills([...new Set([...defaultPhysicalSkills, ...customPhysical])].sort((a, b) => a.localeCompare(b)));

      const customTechnical = JSON.parse(localStorage.getItem('customTechnicalSkills') || '[]');
      setAllTechnicalSkills([...new Set([...defaultTechnicalSkills, ...customTechnical])].sort((a, b) => a.localeCompare(b)));
    };
    loadSkills();
  }, []);

  const toggleSkill = (skill: string, type: 'physical' | 'technical') => {
    const selectedSkills = type === 'physical' ? selectedPhysicalSkills : selectedTechnicalSkills;
    const onChange = type === 'physical' ? onPhysicalSkillsChange : onTechnicalSkillsChange;
    
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    onChange(newSkills);
  };

  const handleAddNewSkill = (type: 'physical' | 'technical') => {
    let newSkillInput = type === 'physical' ? newPhysicalSkillInput.trim() : newTechnicalSkillInput.trim();
    const allSkills = type === 'physical' ? allPhysicalSkills : allTechnicalSkills;
    const setAllSkills = type === 'physical' ? setAllPhysicalSkills : setAllTechnicalSkills;
    const selectedSkills = type === 'physical' ? selectedPhysicalSkills : selectedTechnicalSkills;
    const onSkillsChange = type === 'physical' ? onPhysicalSkillsChange : onTechnicalSkillsChange;
    const storageKey = type === 'physical' ? 'customPhysicalSkills' : 'customTechnicalSkills';
    const setNewInput = type === 'physical' ? setNewPhysicalSkillInput : setNewTechnicalSkillInput;

    if (!newSkillInput) {
      toast({ title: "Skill cannot be empty", variant: "destructive" });
      return;
    }
    
    // Case-insensitive check and find for existing skill
    const existingSkill = allSkills.find(s => s.toLowerCase() === newSkillInput.toLowerCase()) || 
                          selectedSkills.find(s => s.toLowerCase() === newSkillInput.toLowerCase());

    if (existingSkill) {
      toast({ title: "Skill already exists", description: `"${existingSkill}" is already in the list or selected.`, variant: "default" });
      if (!selectedSkills.map(s => s.toLowerCase()).includes(existingSkill.toLowerCase())) {
        onSkillsChange([...selectedSkills, existingSkill]);
        toast({ title: "Skill Selected", description: `Existing skill "${existingSkill}" has been selected.` });
      }
      setNewInput("");
      return;
    }

    const skillToAdd = newSkillInput; // Keep original casing

    const updatedAllSkills = [...allSkills, skillToAdd].sort((a, b) => a.localeCompare(b));
    setAllSkills(updatedAllSkills);
    
    const customSkillsFromStorage = JSON.parse(localStorage.getItem(storageKey) || '[]');
    // Ensure no case-variant duplicates in localStorage
    const uniqueCustomSkills = [...new Set([...customSkillsFromStorage.map((s: string) => s.toLowerCase()), skillToAdd.toLowerCase()])];
    const finalCustomSkillsToStore = defaultPhysicalSkills.includes(skillToAdd) || defaultTechnicalSkills.includes(skillToAdd) ? 
        customSkillsFromStorage : // Don't add default skills to custom list
        [...new Set([...customSkillsFromStorage, skillToAdd])]; // Store with original casing

    localStorage.setItem(storageKey, JSON.stringify(finalCustomSkillsToStore.sort((a,b) => a.localeCompare(b))));

    onSkillsChange([...selectedSkills, skillToAdd]);
    setNewInput("");
    toast({ title: "Skill Added", description: `"${skillToAdd}" added and selected.` });
  };

  const filteredPhysicalSkills = useMemo(() => {
    return allPhysicalSkills
      .filter(skill => skill.toLowerCase().includes(physicalSearchQuery.toLowerCase()))
      .sort((a, b) => a.localeCompare(b)); // Ensure sorting after filtering
  }, [allPhysicalSkills, physicalSearchQuery]);

  const filteredTechnicalSkills = useMemo(() => {
    return allTechnicalSkills
      .filter(skill => skill.toLowerCase().includes(technicalSearchQuery.toLowerCase()))
      .sort((a, b) => a.localeCompare(b)); // Ensure sorting after filtering
  }, [allTechnicalSkills, technicalSearchQuery]);

  const renderSkillSection = (
    type: 'physical' | 'technical',
    skills: string[],
    selectedSkills: string[],
    searchQuery: string,
    setSearchQuery: (query: string) => void,
    newSkillInput: string,
    setNewSkillInput: (input: string) => void,
    showAdd: boolean,
    setShowAdd: (show: boolean) => void
  ) => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input 
          placeholder={`Search ${type} skills...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 pl-10 text-sm"
        />
      </div>
      
      <div className="flex flex-wrap gap-3 min-h-[120px]">
        {skills.map((skill) => (
          <Badge
            key={skill}
            variant="outline"
            className={`cursor-pointer transition-all min-h-[44px] px-4 py-2 text-sm font-medium ${
              selectedSkills.includes(skill)
                ? type === 'physical' 
                  ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-150"
                  : "bg-green-100 text-green-800 border-green-200 hover:bg-green-150"
                : "border-stone-300 text-stone-600 hover:bg-stone-50 hover:border-stone-400"
            }`}
            onClick={() => toggleSkill(skill, type)}
          >
            {skill}
          </Badge>
        ))}
      </div>
      
      <div className="pt-3 border-t border-stone-200">
        {!showAdd ? (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowAdd(true)}
            className="h-10 px-4 text-stone-600 border-stone-300 hover:bg-stone-50"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Custom {type === 'physical' ? 'Physical' : 'Technical'} Skill
          </Button>
        ) : (
          <div className="flex gap-2 items-center">
            <Input 
              placeholder={`Add new ${type} skill...`}
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              className="h-10 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddNewSkill(type);
                  setShowAdd(false);
                }
                if (e.key === 'Escape') {
                  setShowAdd(false);
                  setNewSkillInput('');
                }
              }}
              autoFocus
            />
            <Button 
              size="sm" 
              onClick={() => {
                handleAddNewSkill(type);
                setShowAdd(false);
              }} 
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PlusCircle className="h-4 w-4 mr-1.5" /> Add
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setShowAdd(false);
                setNewSkillInput('');
              }}
              className="h-10 px-3 border-stone-300 text-stone-600"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-stone-700">Skills Used</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="physical" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11 mb-4">
            <TabsTrigger value="physical" className="text-sm font-medium">
              Physical ({selectedPhysicalSkills.length})
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-sm font-medium">
              Technical ({selectedTechnicalSkills.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="physical" className="mt-0">
            {renderSkillSection(
              'physical',
              filteredPhysicalSkills,
              selectedPhysicalSkills,
              physicalSearchQuery,
              setPhysicalSearchQuery,
              newPhysicalSkillInput,
              setNewPhysicalSkillInput,
              showPhysicalAdd,
              setShowPhysicalAdd
            )}
          </TabsContent>
          
          <TabsContent value="technical" className="mt-0">
            {renderSkillSection(
              'technical',
              filteredTechnicalSkills,
              selectedTechnicalSkills,
              technicalSearchQuery,
              setTechnicalSearchQuery,
              newTechnicalSkillInput,
              setNewTechnicalSkillInput,
              showTechnicalAdd,
              setShowTechnicalAdd
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SkillsSelector;
