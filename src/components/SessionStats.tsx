import { Badge } from "@/components/ui/badge";
import { Session } from "@/types/climbing";

interface SessionStatsProps {
  session: Session;
}

const SessionStats = ({ session }: SessionStatsProps) => {
  const climbs = session.climbs || [];
  const sends = climbs.filter(c => c.tickType === 'send').length;
  const attempts = climbs.filter(c => c.tickType === 'attempt').length;
  const flashes = climbs.filter(c => c.tickType === 'flash').length;
  const onsights = climbs.filter(c => c.tickType === 'onsight').length;

  if (climbs.length === 0) {
    return null; // Don't render anything if there are no climbs for the badges part
  }

  return (
    <div className="grid grid-cols-2 gap-1.5 pt-2"> {/* Added some top padding as it's now standalone */}
        {sends > 0 && (
        <Badge variant="outline" className="border-green-200 text-green-700 justify-center py-1 text-xs">
            {sends} Send{sends !== 1 ? 's' : ''}
        </Badge>
        )}
        {attempts > 0 && (
        <Badge variant="outline" className="border-orange-200 text-orange-700 justify-center py-1 text-xs">
            {attempts} Attempt{attempts !== 1 ? 's' : ''}
        </Badge>
        )}
        {flashes > 0 && (
        <Badge variant="outline" className="border-blue-200 text-blue-700 justify-center py-1 text-xs">
            {flashes} Flash{flashes !== 1 ? 'es' : ''}
        </Badge>
        )}
        {onsights > 0 && (
        <Badge variant="outline" className="border-purple-200 text-purple-700 justify-center py-1 text-xs">
            {onsights} Onsight{onsights !== 1 ? 's' : ''}
        </Badge>
        )}
    </div>
  );
};

export default SessionStats;
