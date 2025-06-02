
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const LocationSelector = ({ value, onChange, placeholder = "Select or enter location...", className }: LocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLocation, setCustomLocation] = useState("");
  const [savedLocations, setSavedLocations] = useState<string[]>([]);

  // Load saved locations from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('climbingLocations');
    if (saved) {
      setSavedLocations(JSON.parse(saved));
    }
  }, []);

  // Save locations to localStorage whenever the list changes
  const saveLocation = (location: string) => {
    if (!location.trim()) return;
    
    const updatedLocations = [...new Set([...savedLocations, location.trim()])].sort();
    setSavedLocations(updatedLocations);
    localStorage.setItem('climbingLocations', JSON.stringify(updatedLocations));
  };

  const handleSelectLocation = (selectedLocation: string) => {
    onChange(selectedLocation);
    setOpen(false);
    setSearchValue("");
    setShowCustomInput(false);
  };

  const handleAddCustomLocation = () => {
    if (customLocation.trim()) {
      saveLocation(customLocation.trim());
      onChange(customLocation.trim());
      setCustomLocation("");
      setShowCustomInput(false);
      setOpen(false);
      setSearchValue("");
    }
  };

  const filteredLocations = savedLocations.filter(location =>
    location.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showAddOption = searchValue && !filteredLocations.some(loc => 
    loc.toLowerCase() === searchValue.toLowerCase()
  );

  return (
    <div className={className}>
      <Label className="text-stone-700 font-medium">Location *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full h-12 justify-between text-left font-normal border-stone-300 focus:border-amber-500"
          >
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search locations..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {showAddOption ? (
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        saveLocation(searchValue);
                        handleSelectLocation(searchValue);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{searchValue}"
                    </Button>
                  </div>
                ) : (
                  "No locations found."
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredLocations.map((location) => (
                  <CommandItem
                    key={location}
                    value={location}
                    onSelect={() => handleSelectLocation(location)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === location ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {location}
                  </CommandItem>
                ))}
              </CommandGroup>
              {savedLocations.length > 0 && (
                <CommandGroup>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowCustomInput(true);
                      setOpen(false);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new location
                  </Button>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Custom location input dialog */}
      {showCustomInput && (
        <div className="mt-2 p-3 border border-stone-200 rounded-md bg-stone-50">
          <Label htmlFor="customLocation" className="text-sm text-stone-700">
            Enter new location:
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="customLocation"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="e.g. Red Rocks, Joshua Tree"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustomLocation();
                }
              }}
            />
            <Button
              onClick={handleAddCustomLocation}
              disabled={!customLocation.trim()}
              size="sm"
            >
              Add
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomInput(false);
                setCustomLocation("");
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
