import ClimbingHeatMap from "@/components/ClimbingHeatMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClimbs } from "@/hooks/useClimbs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Metrics() {
  const { climbs, isLoading } = useClimbs();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const climbsInYear = climbs.filter(climb => {
    const climbYear = new Date(climb.date).getFullYear();
    return climbYear === selectedYear;
  });

  const totalClimbs = climbsInYear.length;
  const uniqueDays = new Set(climbsInYear.map(climb => 
    new Date(climb.date).toDateString()
  )).size;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Climbing Metrics</h1>
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Activity Heat Map</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousYear}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium px-4">{selectedYear}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextYear}
              disabled={selectedYear >= new Date().getFullYear()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-4 text-sm text-muted-foreground">
              <span>{totalClimbs} total climbs</span>
              <span>•</span>
              <span>{uniqueDays} active days</span>
            </div>
            <ClimbingHeatMap climbs={climbs} year={selectedYear} />
          </>
        )}
      </Card>
    </div>
  );
}