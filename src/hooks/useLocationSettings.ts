import useLocalStorage from './useLocalStorage';
import { toast } from '@/hooks/use-toast';

const SAVED_LOCATIONS_KEY = 'climbingLocations';

export const useLocationSettings = () => {
  const [savedLocations, setSavedLocations] = useLocalStorage<string[]>(SAVED_LOCATIONS_KEY, []);

  const addLocation = (newLocation: string) => {
    if (!newLocation.trim()) return;
    const trimmedLocation = newLocation.trim();
    if (savedLocations.some(loc => loc.toLowerCase() === trimmedLocation.toLowerCase())) {
      toast({
        title: "Location already exists",
        description: `"${trimmedLocation}" is already in your saved locations.`,
        variant: "default", // Or "warning" if available/appropriate
      });
      return;
    }
    const updatedLocations = [...savedLocations, trimmedLocation].sort((a, b) => a.localeCompare(b));
    setSavedLocations(updatedLocations);
    toast({
      title: "Location added",
      description: `"${trimmedLocation}" has been added to your saved locations.`,
    });
  };

  const deleteLocation = (locationToDelete: string) => {
    // In Settings.tsx, deletion was by index. Deleting by value is safer if order can change.
    // If multiple identical locations could exist (though addLocation prevents this for case-insensitive),
    // this would only delete the first. For unique items, it's fine.
    const updatedLocations = savedLocations.filter(loc => loc !== locationToDelete);
    setSavedLocations(updatedLocations);
    toast({
      title: "Location removed",
      description: `"${locationToDelete}" has been removed from your saved locations.`,
    });
  };
  
  const editLocation = (originalLocation: string, newLocationValue: string) => {
    if (!newLocationValue.trim()) {
        toast({ title: "Location cannot be empty", variant: "destructive" });
        return;
    }
    const trimmedNewValue = newLocationValue.trim();
    if (trimmedNewValue.toLowerCase() !== originalLocation.toLowerCase() && 
        savedLocations.some(loc => loc.toLowerCase() === trimmedNewValue.toLowerCase())) {
      toast({
        title: "Location already exists",
        description: `"${trimmedNewValue}" is already in your saved locations.`,
        variant: "default",
      });
      return;
    }

    const updatedLocations = savedLocations.map(loc => 
      loc === originalLocation ? trimmedNewValue : loc
    ).sort((a, b) => a.localeCompare(b));
    setSavedLocations(updatedLocations);
    toast({
      title: "Location updated",
      description: `Location "${originalLocation}" has been updated to "${trimmedNewValue}".`,
    });
  };

  return {
    savedLocations,
    addLocation,
    deleteLocation,
    editLocation,
  };
};
