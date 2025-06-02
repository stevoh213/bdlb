import useLocalStorage from './useLocalStorage';
import { toast } from '@/hooks/use-toast';
// Import available grade systems if needed for validation or providing options
// For now, assuming the component will handle fetching/displaying system options
// import { routeGradeSystems, boulderGradeSystems } from "@/utils/gradeSystem"; 

// Default values, can be adjusted or fetched from a config
const DEFAULT_ROUTE_GRADE_SYSTEM = 'yds';
const DEFAULT_BOULDER_GRADE_SYSTEM = 'v_scale';

export const useGradeSettings = () => {
  const [preferredRouteGradeSystem, setPreferredRouteGradeSystem] = useLocalStorage<string>(
    'preferredRouteGradeSystem',
    DEFAULT_ROUTE_GRADE_SYSTEM
  );

  const [preferredBoulderGradeSystem, setPreferredBoulderGradeSystem] = useLocalStorage<string>(
    'preferredBoulderGradeSystem',
    DEFAULT_BOULDER_GRADE_SYSTEM
  );

  // Handle legacy preferredGradeSystem - one-time read and migration if necessary
  // This might be better handled directly in Settings.tsx on initial load once,
  // or when the application first runs after an update.
  // For simplicity in the hook, we'll assume new keys are primary.
  // If direct migration is needed here, it adds complexity.

  const handleRouteGradeSystemChange = (value: string) => {
    setPreferredRouteGradeSystem(value);
    // Also update the legacy key for older versions if they might still be used,
    // or if other parts of the app read the legacy key.
    // window.localStorage.setItem('preferredGradeSystem', value); // Example of legacy support
    toast({
      title: "Route grade system updated",
      // description: `Default route grade system set to ${routeGradeSystems[value]?.name}`, // Needs routeGradeSystems map
      description: `Default route grade system updated.`,
    });
  };

  const handleBoulderGradeSystemChange = (value: string) => {
    setPreferredBoulderGradeSystem(value);
    toast({
      title: "Boulder grade system updated",
      // description: `Default boulder grade system set to ${boulderGradeSystems[value]?.name}`, // Needs boulderGradeSystems map
      description: `Default boulder grade system updated.`,
    });
  };

  return {
    preferredRouteGradeSystem,
    setPreferredRouteGradeSystem: handleRouteGradeSystemChange, // Renaming for clarity if preferred
    preferredBoulderGradeSystem,
    setPreferredBoulderGradeSystem: handleBoulderGradeSystemChange, // Renaming for clarity
  };
};
