import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGradeSettings } from "@/hooks/useGradeSettings";
import { getGradeSystemsForType } from "@/utils/gradeSystem"; // To get options for select

const GradeSettings = () => {
  const {
    preferredRouteGradeSystem,
    setPreferredRouteGradeSystem,
    preferredBoulderGradeSystem,
    setPreferredBoulderGradeSystem,
  } = useGradeSettings();

  const routeGradeSystems = getGradeSystemsForType('route');
  const boulderGradeSystems = getGradeSystemsForType('boulder');

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-stone-800">Default Grade Systems</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="routeGradeSystem">Route Grade System</Label>
          <Select 
            value={preferredRouteGradeSystem} 
            onValueChange={setPreferredRouteGradeSystem}
          >
            <SelectTrigger id="routeGradeSystem" className="w-full">
              <SelectValue placeholder="Select route grade system" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(routeGradeSystems).map(([key, system]) => (
                <SelectItem key={key} value={key}>
                  {system.name} ({key.toUpperCase()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-stone-600">
            Default system for sport, trad, top rope, and alpine climbs.
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="boulderGradeSystem">Boulder Grade System</Label>
          <Select 
            value={preferredBoulderGradeSystem} 
            onValueChange={setPreferredBoulderGradeSystem}
          >
            <SelectTrigger id="boulderGradeSystem" className="w-full">
              <SelectValue placeholder="Select boulder grade system" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(boulderGradeSystems).map(([key, system]) => (
                <SelectItem key={key} value={key}>
                  {system.name} ({key.toUpperCase()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-stone-600">
            Default system for boulder problems.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GradeSettings;
