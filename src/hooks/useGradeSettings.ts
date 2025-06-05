import { toast } from '@/hooks/use-toast';
import { useCallback, useEffect, useState } from 'react';
import useLocalStorage from './useLocalStorage';
// Import available grade systems if needed for validation or providing options
// For now, assuming the component will handle fetching/displaying system options
// import { routeGradeSystems, boulderGradeSystems } from "@/utils/gradeSystem"; 

// Default values, can be adjusted or fetched from a config
const DEFAULT_ROUTE_GRADE_SYSTEM = 'yds';
const DEFAULT_BOULDER_GRADE_SYSTEM = 'v_scale';

export const useGradeSettings = () => {
  const [preferredRouteGradeSystem, setPreferredRouteGradeSystemStorage] = useLocalStorage<string>(
    'preferredRouteGradeSystem',
    DEFAULT_ROUTE_GRADE_SYSTEM
  );

  const [preferredBoulderGradeSystem, setPreferredBoulderGradeSystemStorage] = useLocalStorage<string>(
    'preferredBoulderGradeSystem',
    DEFAULT_BOULDER_GRADE_SYSTEM
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdatingRouteSystem, setIsUpdatingRouteSystem] = useState<boolean>(false);
  const [isUpdatingBoulderSystem, setIsUpdatingBoulderSystem] = useState<boolean>(false);

  // Simulate initial loading completion
  useEffect(() => {
    setIsLoading(false);
  }, []); // Corrected to useEffect for one-time effect

  const handleRouteGradeSystemChange = useCallback((value: string) => {
    setIsUpdatingRouteSystem(true);
    setError(null);
    try {
      setPreferredRouteGradeSystemStorage(value);
      toast({
        title: "Route grade system updated",
        description: `Default route grade system updated.`,
      });
    } catch (e) {
      const newError = e instanceof Error ? e : new Error('Failed to update route grade system');
      setError(newError);
      toast({
        title: "Update Error",
        description: newError.message,
        variant: "destructive",
      });
    }
    setIsUpdatingRouteSystem(false);
  }, [setPreferredRouteGradeSystemStorage, toast]);

  const handleBoulderGradeSystemChange = useCallback((value: string) => {
    setIsUpdatingBoulderSystem(true);
    setError(null);
    try {
      setPreferredBoulderGradeSystemStorage(value);
      toast({
        title: "Boulder grade system updated",
        description: `Default boulder grade system updated.`,
      });
    } catch (e) {
      const newError = e instanceof Error ? e : new Error('Failed to update boulder grade system');
      setError(newError);
      toast({
        title: "Update Error",
        description: newError.message,
        variant: "destructive",
      });
    }
    setIsUpdatingBoulderSystem(false);
  }, [setPreferredBoulderGradeSystemStorage, toast]);

  return {
    preferredRouteGradeSystem,
    setPreferredRouteGradeSystem: handleRouteGradeSystemChange,
    preferredBoulderGradeSystem,
    setPreferredBoulderGradeSystem: handleBoulderGradeSystemChange,
    isLoading,
    error,
    isUpdatingRouteSystem,
    isUpdatingBoulderSystem,
  };
};
