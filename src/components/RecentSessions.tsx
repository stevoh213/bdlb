
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, MapPin, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Session } from "@/types/climbing";

interface RecentSessionsProps {
  sessions: Session[];
}

const RecentSessions = ({ sessions }: RecentSessionsProps) => {
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  const getSessionDuration = (session: Session) => {
    if (!session.endTime) return 0;
    return Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60);
  };

  const climbingTypeColors = {
    sport: "bg-blue-100 text-blue-800 border-blue-200",
    trad: "bg-purple-100 text-purple-800 border-purple-200",
    boulder: "bg-orange-100 text-orange-800 border-orange-200",
    toprope: "bg-green-100 text-green-800 border-green-200",
    multipitch: "bg-red-100 text-red-800 border-red-200"
  };

  const handleSessionClick = (session: Session) => {
    navigate('/history', { state: { selectedSessionId: session.id } });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-stone-600" />
          <h2 className="text-lg font-semibold text-stone-800">Recent Sessions</h2>
        </div>
        <Link to="/history">
          <Button variant="ghost" size="sm" className="text-stone-600">
            View All
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card className="border-stone-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-stone-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-stone-700 mb-2">No Sessions Yet</h3>
            <p className="text-stone-600 mb-4">Start your first climbing session to see it here!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {sessions.slice(0, 10).map((session) => (
            <Card key={session.id} className="border-stone-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleSessionClick(session)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-stone-600" />
                      <span className="font-semibold text-stone-800">{session.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`capitalize ${climbingTypeColors[session.climbingType]}`}>
                        {session.climbingType}
                      </Badge>
                      {session.aiAnalysis && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          AI Analyzed
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-stone-600">
                    <div>{formatDate(session.startTime)}</div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getSessionDuration(session)}m
                    </div>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-stone-600">Climbs logged: </span>
                  <span className="font-semibold text-emerald-600">{session.climbs.length}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentSessions;
