
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Session } from "@/types/climbing";
import SessionList from "./SessionList";

interface RecentSessionsProps {
  sessions: Session[];
}

const RecentSessions = ({ sessions }: RecentSessionsProps) => {
  const navigate = useNavigate();

  const handleSessionClick = (sessionId: string) => {
    navigate('/history', { state: { selectedSessionId: sessionId, autoOpen: true } });
  };

  // Limit to 3 most recent sessions for the dashboard
  const recentSessions = sessions.slice(0, 3);

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
        <SessionList 
          sessions={recentSessions} 
          onSelectSession={handleSessionClick}
          showLoadMore={false}
        />
      )}
    </div>
  );
};

export default RecentSessions;
