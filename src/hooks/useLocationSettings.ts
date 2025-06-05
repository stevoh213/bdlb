import { toast } from '@/hooks/use-toast';
import { useCallback, useEffect, useState } from 'react';
import useLocalStorage from './useLocalStorage';

const SAVED_LOCATIONS_KEY = 'climbingLocations';

export const useLocationSettings = () => {
  const [savedLocations, setSavedLocationsStorage] = useLocalStorage<string[]>(SAVED_LOCATIONS_KEY, []);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState<boolean>(false);
  const [isDeletingLocation, setIsDeletingLocation] = useState<boolean>(false);
  const [isEditingLocation, setIsEditingLocation] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const addLocation = useCallback((newLocation: string) => {
    if (!newLocation.trim()) return;
    setIsAddingLocation(true);
    setError(null);
    try {
      const trimmedLocation = newLocation.trim();
      if (savedLocations.some(loc => loc.toLowerCase() === trimmedLocation.toLowerCase())) {
        toast({
          title: "Location already exists",
          description: `"${trimmedLocation}" is already in your saved locations.`,
          variant: "default",
        });
        setIsAddingLocation(false);
        return;
      }
      const updatedLocations = [...savedLocations, trimmedLocation].sort((a, b) => a.localeCompare(b));
      setSavedLocationsStorage(updatedLocations);
      toast({
        title: "Location added",
        description: `"${trimmedLocation}" has been added to your saved locations.`,
      });
    } catch (e) {
      const newError = e instanceof Error ? e : new Error('Failed to add location');
      setError(newError);
      toast({ title: "Error", description: newError.message, variant: "destructive" });
    }
    setIsAddingLocation(false);
  }, [savedLocations, setSavedLocationsStorage, toast]);

  const deleteLocation = useCallback((locationToDelete: string) => {
    setIsDeletingLocation(true);
    setError(null);
    try {
      const updatedLocations = savedLocations.filter(loc => loc !== locationToDelete);
      setSavedLocationsStorage(updatedLocations);
      toast({
        title: "Location removed",
        description: `"${locationToDelete}" has been removed from your saved locations.`,
      });
    } catch (e) {
      const newError = e instanceof Error ? e : new Error('Failed to delete location');
      setError(newError);
      toast({ title: "Error", description: newError.message, variant: "destructive" });
    }
    setIsDeletingLocation(false);
  }, [savedLocations, setSavedLocationsStorage, toast]);
  
  const editLocation = useCallback((originalLocation: string, newLocationValue: string) => {
    if (!newLocationValue.trim()) {
        toast({ title: "Location cannot be empty", variant: "destructive" });
        return;
    }
    setIsEditingLocation(true);
    setError(null);
    try {
      const trimmedNewValue = newLocationValue.trim();
      if (trimmedNewValue.toLowerCase() !== originalLocation.toLowerCase() && 
          savedLocations.some(loc => loc.toLowerCase() === trimmedNewValue.toLowerCase())) {
        toast({
          title: "Location already exists",
          description: `"${trimmedNewValue}" is already in your saved locations.`,
          variant: "default",
        });
        setIsEditingLocation(false);
        return;
      }

      const updatedLocations = savedLocations.map(loc => 
        loc === originalLocation ? trimmedNewValue : loc
      ).sort((a, b) => a.localeCompare(b));
      setSavedLocationsStorage(updatedLocations);
      toast({
        title: "Location updated",
        description: `Location "${originalLocation}" has been updated to "${trimmedNewValue}".`,
      });
    } catch (e) {
      const newError = e instanceof Error ? e : new Error('Failed to edit location');
      setError(newError);
      toast({ title: "Error", description: newError.message, variant: "destructive" });
    }
    setIsEditingLocation(false);
  }, [savedLocations, setSavedLocationsStorage, toast]);

  return {
    savedLocations,
    addLocation,
    deleteLocation,
    editLocation,
    isLoading,
    error,
    isAddingLocation,
    isDeletingLocation,
    isEditingLocation,
  };
};
