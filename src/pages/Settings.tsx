
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit } from "lucide-react";
import { gradeSystems } from "@/utils/gradeSystem";
import { physicalSkills as defaultPhysicalSkills, technicalSkills as defaultTechnicalSkills } from "@/utils/skills";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const [preferredGradeSystem, setPreferredGradeSystem] = useState<string>('yds');
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [physicalSkills, setPhysicalSkills] = useState<string[]>(defaultPhysicalSkills);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>(defaultTechnicalSkills);
  
  // Form states for adding/editing
  const [newLocation, setNewLocation] = useState('');
  const [newPhysicalSkill, setNewPhysicalSkill] = useState('');
  const [newTechnicalSkill, setNewTechnicalSkill] = useState('');
  const [editingLocation, setEditingLocation] = useState<{ index: number; value: string } | null>(null);
  const [editingPhysicalSkill, setEditingPhysicalSkill] = useState<{ index: number; value: string } | null>(null);
  const [editingTechnicalSkill, setEditingTechnicalSkill] = useState<{ index: number; value: string } | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedGradeSystem = localStorage.getItem('preferredGradeSystem');
    if (savedGradeSystem) {
      setPreferredGradeSystem(savedGradeSystem);
    }

    const locations = localStorage.getItem('climbingLocations');
    if (locations) {
      setSavedLocations(JSON.parse(locations));
    }

    const customPhysicalSkills = localStorage.getItem('customPhysicalSkills');
    if (customPhysicalSkills) {
      setPhysicalSkills(JSON.parse(customPhysicalSkills));
    }

    const customTechnicalSkills = localStorage.getItem('customTechnicalSkills');
    if (customTechnicalSkills) {
      setTechnicalSkills(JSON.parse(customTechnicalSkills));
    }
  }, []);

  // Save grade system preference
  const handleGradeSystemChange = (value: string) => {
    setPreferredGradeSystem(value);
    localStorage.setItem('preferredGradeSystem', value);
    toast({
      title: "Grade system updated",
      description: `Default grade system set to ${gradeSystems[value]?.name}`,
    });
  };

  // Location management
  const addLocation = () => {
    if (newLocation.trim()) {
      const updatedLocations = [...savedLocations, newLocation.trim()].sort();
      setSavedLocations(updatedLocations);
      localStorage.setItem('climbingLocations', JSON.stringify(updatedLocations));
      setNewLocation('');
      toast({
        title: "Location added",
        description: `"${newLocation.trim()}" has been added to your saved locations`,
      });
    }
  };

  const deleteLocation = (index: number) => {
    const locationToDelete = savedLocations[index];
    const updatedLocations = savedLocations.filter((_, i) => i !== index);
    setSavedLocations(updatedLocations);
    localStorage.setItem('climbingLocations', JSON.stringify(updatedLocations));
    toast({
      title: "Location removed",
      description: `"${locationToDelete}" has been removed from your saved locations`,
    });
  };

  const editLocation = (index: number, newValue: string) => {
    const updatedLocations = [...savedLocations];
    updatedLocations[index] = newValue.trim();
    setSavedLocations(updatedLocations.sort());
    localStorage.setItem('climbingLocations', JSON.stringify(updatedLocations.sort()));
    setEditingLocation(null);
    toast({
      title: "Location updated",
      description: `Location has been updated to "${newValue.trim()}"`,
    });
  };

  // Physical skills management
  const addPhysicalSkill = () => {
    if (newPhysicalSkill.trim()) {
      const updatedSkills = [...physicalSkills, newPhysicalSkill.trim()].sort();
      setPhysicalSkills(updatedSkills);
      localStorage.setItem('customPhysicalSkills', JSON.stringify(updatedSkills));
      setNewPhysicalSkill('');
      toast({
        title: "Physical skill added",
        description: `"${newPhysicalSkill.trim()}" has been added to physical skills`,
      });
    }
  };

  const deletePhysicalSkill = (index: number) => {
    const skillToDelete = physicalSkills[index];
    const updatedSkills = physicalSkills.filter((_, i) => i !== index);
    setPhysicalSkills(updatedSkills);
    localStorage.setItem('customPhysicalSkills', JSON.stringify(updatedSkills));
    toast({
      title: "Physical skill removed",
      description: `"${skillToDelete}" has been removed from physical skills`,
    });
  };

  const editPhysicalSkill = (index: number, newValue: string) => {
    const updatedSkills = [...physicalSkills];
    updatedSkills[index] = newValue.trim();
    setPhysicalSkills(updatedSkills.sort());
    localStorage.setItem('customPhysicalSkills', JSON.stringify(updatedSkills.sort()));
    setEditingPhysicalSkill(null);
    toast({
      title: "Physical skill updated",
      description: `Physical skill has been updated to "${newValue.trim()}"`,
    });
  };

  // Technical skills management
  const addTechnicalSkill = () => {
    if (newTechnicalSkill.trim()) {
      const updatedSkills = [...technicalSkills, newTechnicalSkill.trim()].sort();
      setTechnicalSkills(updatedSkills);
      localStorage.setItem('customTechnicalSkills', JSON.stringify(updatedSkills));
      setNewTechnicalSkill('');
      toast({
        title: "Technical skill added",
        description: `"${newTechnicalSkill.trim()}" has been added to technical skills`,
      });
    }
  };

  const deleteTechnicalSkill = (index: number) => {
    const skillToDelete = technicalSkills[index];
    const updatedSkills = technicalSkills.filter((_, i) => i !== index);
    setTechnicalSkills(updatedSkills);
    localStorage.setItem('customTechnicalSkills', JSON.stringify(updatedSkills));
    toast({
      title: "Technical skill removed",
      description: `"${skillToDelete}" has been removed from technical skills`,
    });
  };

  const editTechnicalSkill = (index: number, newValue: string) => {
    const updatedSkills = [...technicalSkills];
    updatedSkills[index] = newValue.trim();
    setTechnicalSkills(updatedSkills.sort());
    localStorage.setItem('customTechnicalSkills', JSON.stringify(updatedSkills.sort()));
    setEditingTechnicalSkill(null);
    toast({
      title: "Technical skill updated",
      description: `Technical skill has been updated to "${newValue.trim()}"`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-stone-800">Settings</h1>
      
      {/* Grade System Preference */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800">Default Grade System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="gradeSystem">Preferred Grade System</Label>
            <Select value={preferredGradeSystem} onValueChange={handleGradeSystemChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(gradeSystems).map(([key, system]) => (
                  <SelectItem key={key} value={key}>
                    {system.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-stone-600">
              This will be the default grade system used when creating new climbing sessions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Saved Locations */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800">Saved Locations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add new location..."
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLocation()}
              className="flex-1"
            />
            <Button onClick={addLocation} disabled={!newLocation.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {savedLocations.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-2 border border-stone-200 rounded">
                {editingLocation?.index === index ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      value={editingLocation.value}
                      onChange={(e) => setEditingLocation({ index, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') editLocation(index, editingLocation.value);
                        if (e.key === 'Escape') setEditingLocation(null);
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => editLocation(index, editingLocation.value)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingLocation(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="text-stone-700">{location}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingLocation({ index, value: location })}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteLocation(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Physical Skills */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800">Physical Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add new physical skill..."
              value={newPhysicalSkill}
              onChange={(e) => setNewPhysicalSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPhysicalSkill()}
              className="flex-1"
            />
            <Button onClick={addPhysicalSkill} disabled={!newPhysicalSkill.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {physicalSkills.map((skill, index) => (
              <div key={index} className="relative group">
                {editingPhysicalSkill?.index === index ? (
                  <div className="flex gap-1 items-center">
                    <Input
                      value={editingPhysicalSkill.value}
                      onChange={(e) => setEditingPhysicalSkill({ index, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') editPhysicalSkill(index, editingPhysicalSkill.value);
                        if (e.key === 'Escape') setEditingPhysicalSkill(null);
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => editPhysicalSkill(index, editingPhysicalSkill.value)}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-blue-200 text-blue-800 bg-blue-50 pr-8 relative"
                    onClick={() => setEditingPhysicalSkill({ index, value: skill })}
                  >
                    {skill}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhysicalSkill(index);
                      }}
                      className="absolute right-0 top-0 h-full w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Skills */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800">Technical Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add new technical skill..."
              value={newTechnicalSkill}
              onChange={(e) => setNewTechnicalSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTechnicalSkill()}
              className="flex-1"
            />
            <Button onClick={addTechnicalSkill} disabled={!newTechnicalSkill.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {technicalSkills.map((skill, index) => (
              <div key={index} className="relative group">
                {editingTechnicalSkill?.index === index ? (
                  <div className="flex gap-1 items-center">
                    <Input
                      value={editingTechnicalSkill.value}
                      onChange={(e) => setEditingTechnicalSkill({ index, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') editTechnicalSkill(index, editingTechnicalSkill.value);
                        if (e.key === 'Escape') setEditingTechnicalSkill(null);
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => editTechnicalSkill(index, editingTechnicalSkill.value)}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-green-200 text-green-800 bg-green-50 pr-8 relative"
                    onClick={() => setEditingTechnicalSkill({ index, value: skill })}
                  >
                    {skill}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTechnicalSkill(index);
                      }}
                      className="absolute right-0 top-0 h-full w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
