
import { Badge } from "@/components/ui/badge";
import { Session } from "@/pages/Index";

interface SessionStatsProps {
  session: Session;
}

const SessionStats = ({ session }: SessionStatsProps) => {
  const climbs = session.climbs || [];
  const sends = climbs.filter(c => c.tickType === 'send').length;
  const attempts = climbs.filter(c => c.tickType === 'attempt').length;
  const flashes = climbs.filter(c => c.tickType === 'flash').length;
  const onsights = climbs.filter(c => c.tickType === 'onsight').length;

  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className="text-2xl font-bold text-stone-800">{climbs.length}</div>
        <div className="text-sm text-stone-600">Total Climbs</div>
      </div>
      
      {climbs.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {sends > 0 && (
            <Badge variant="outline" className="border-green-200 text-green-700 justify-center py-2">
              {sends} Send{sends !== 1 ? 's' : ''}
            </Badge>
          )}
          {attempts > 0 && (
            <Badge variant="outline" className="border-orange-200 text-orange-700 justify-center py-2">
              {attempts} Attempt{attempts !== 1 ? 's' : ''}
            </Badge>
          )}
          {flashes > 0 && (
            <Badge variant="outline" className="border-blue-200 text-blue-700 justify-center py-2">
              {flashes} Flash{flashes !== 1 ? 'es' : ''}
            </Badge>
          )}
          {onsights > 0 && (
            <Badge variant="outline" className="border-purple-200 text-purple-700 justify-center py-2">
              {onsights} Onsight{onsights !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionStats;
