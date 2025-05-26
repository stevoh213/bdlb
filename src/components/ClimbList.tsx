
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Climb } from "@/types/climbing";

interface ClimbListProps {
  climbs: Climb[];
}

const ClimbList = ({ climbs }: ClimbListProps) => {
  const tickTypeColors = {
    send: "bg-green-100 text-green-800 border-green-200",
    attempt: "bg-orange-100 text-orange-800 border-orange-200",
    flash: "bg-blue-100 text-blue-800 border-blue-200",
    onsight: "bg-purple-100 text-purple-800 border-purple-200"
  };

  const formatTime = (timestamp: Date) => {
    // Ensure we have a proper Date object
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-3">
      {climbs.map((climb) => (
        <Card key={climb.id} className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-stone-800 text-lg">{climb.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-stone-700 border-stone-300">
                    {climb.grade}
                  </Badge>
                  <Badge variant="outline" className={`capitalize ${tickTypeColors[climb.tickType]}`}>
                    {climb.tickType}
                  </Badge>
                </div>
              </div>
              <div className="text-right text-sm text-stone-500">
                {formatTime(climb.timestamp)}
              </div>
            </div>
            
            {(climb.height || climb.timeOnWall || climb.effort) && (
              <div className="flex gap-4 text-sm text-stone-600 mt-2">
                {climb.height && <span>{climb.height}ft</span>}
                {climb.timeOnWall && <span>{climb.timeOnWall}min</span>}
                {climb.effort && <span>Effort: {climb.effort}/10</span>}
              </div>
            )}
            
            {climb.notes && (
              <p className="text-sm text-stone-600 mt-2 italic">{climb.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClimbList;
