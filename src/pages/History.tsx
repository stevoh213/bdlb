
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import SessionStats from "@/components/SessionStats";
import ClimbList from "@/components/ClimbList";
import { Session } from "@/types/climbing";

const History = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('sessions');
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      parsedSessions.forEach((session: Session) => {
        session.startTime = new Date(session.startTime);
        if (session.endTime) session.endTime = new Date(session.endTime);
        session.climbs.forEach((climb: any) => {
          climb.timestamp = new Date(climb.timestamp);
        });
      });
      setSessions(parsedSessions);
    }
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  if (selectedSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3 py-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedSession(null)}
              className="text-stone-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-stone-800">Session Details</h1>
          </div>

          <Card className="border-stone-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-stone-600" />
                    <span className="text-lg">{selectedSession.location}</span>
                  </div>
                  <Badge variant="outline" className={`capitalize ${climbingTypeColors[selectedSession.climbingType]}`}>
                    {selectedSession.climbingType}
                  </Badge>
                </div>
                <div className="text-right text-sm text-stone-600">
                  <div>{formatDate(selectedSession.startTime)}</div>
                  <div>{formatTime(selectedSession.startTime)}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">Duration</span>
                  <span className="font-semibold">{getSessionDuration(selectedSession)}m</span>
                </div>
                {selectedSession.notes && (
                  <div className="text-sm">
                    <span className="text-stone-600">Notes: </span>
                    <span className="italic">{selectedSession.notes}</span>
                  </div>
                )}
                <SessionStats session={selectedSession} />
              </div>
            </CardContent>
          </Card>

          {selectedSession.climbs.length > 0 && (
            <Card className="border-stone-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Climbs ({selectedSession.climbs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClimbList climbs={selectedSession.climbs} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-stone-600">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-stone-800">Session History</h1>
        </div>

        {sessions.length === 0 ? (
          <Card className="border-stone-200 shadow-lg">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-stone-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-stone-700 mb-2">No Sessions Yet</h3>
              <p className="text-stone-600 mb-4">Start your first climbing session to see it here!</p>
              <Link to="/">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Start Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card 
                key={session.id} 
                className="border-stone-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setSelectedSession(session)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-stone-600" />
                        <span className="font-semibold text-stone-800">{session.location}</span>
                      </div>
                      <Badge variant="outline" className={`capitalize ${climbingTypeColors[session.climbingType]}`}>
                        {session.climbingType}
                      </Badge>
                    </div>
                    <div className="text-right text-sm text-stone-600">
                      <div>{formatDate(session.startTime)}</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getSessionDuration(session)}m
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">Climbs logged</span>
                    <span className="font-semibold text-emerald-600">{session.climbs.length}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
