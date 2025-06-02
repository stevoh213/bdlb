import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Clock, TrendingUp, Download, LogOut, Edit, Trash2, Brain, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import SessionStats from "@/components/SessionStats";
import ClimbList from "@/components/ClimbList";
import EditClimbDialog from "@/components/EditClimbDialog";
import EditSessionDialog from "@/components/EditSessionDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import SessionAnalysis from "@/components/SessionAnalysis";
import AIAnalysisDrawer from "@/components/AIAnalysisDrawer";
import { Session, LocalClimb } from "@/types/climbing";
import { exportToCSV } from "@/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const History = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [editingClimb, setEditingClimb] = useState<LocalClimb | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'session' | 'climb';
    item: Session | LocalClimb;
  } | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { toast } = useToast();
  const { signOut, user } = useAuth();

  useEffect(() => {
    const savedSessions = localStorage.getItem('sessions');
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      parsedSessions.forEach((session: Session) => {
        session.startTime = new Date(session.startTime);
        if (session.endTime) session.endTime = new Date(session.endTime);
        if (session.aiAnalysis?.generatedAt) {
          session.aiAnalysis.generatedAt = new Date(session.aiAnalysis.generatedAt);
        }
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
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
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

  const handleExportCSV = () => {
    if (sessions.length === 0) {
      toast({
        title: "No Data to Export",
        description: "You don't have any sessions to export yet.",
        variant: "destructive"
      });
      return;
    }
    exportToCSV(sessions);
    toast({
      title: "Export Complete",
      description: `Exported ${sessions.length} sessions to CSV`
    });
  };

  const handleLogout = () => {
    signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
  };

  const handleEditClimb = (climb: LocalClimb) => {
    setEditingClimb(climb);
  };

  const handleDeleteClimb = (climb: LocalClimb) => {
    setDeleteConfirm({
      type: 'climb',
      item: climb
    });
  };

  const handleSaveClimb = (climbId: string, updates: Partial<LocalClimb>) => {
    const updatedSessions = sessions.map(session => ({
      ...session,
      climbs: session.climbs.map(climb => climb.id === climbId ? {
        ...climb,
        ...updates
      } : climb)
    }));
    setSessions(updatedSessions);
    localStorage.setItem('sessions', JSON.stringify(updatedSessions));

    // Update selectedSession if it's the one being edited
    if (selectedSession) {
      const updatedSelectedSession = updatedSessions.find(s => s.id === selectedSession.id);
      if (updatedSelectedSession) {
        setSelectedSession(updatedSelectedSession);
      }
    }
    toast({
      title: "Climb Updated",
      description: "Your climb has been successfully updated."
    });
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
  };

  const handleDeleteSession = (session: Session) => {
    setDeleteConfirm({
      type: 'session',
      item: session
    });
  };

  const handleSaveSession = (sessionId: string, updates: Partial<Session>) => {
    const updatedSessions = sessions.map(session => session.id === sessionId ? {
      ...session,
      ...updates
    } : session);
    setSessions(updatedSessions);
    localStorage.setItem('sessions', JSON.stringify(updatedSessions));

    // Update selectedSession if it's the one being edited
    if (selectedSession?.id === sessionId) {
      setSelectedSession(prev => prev ? {
        ...prev,
        ...updates
      } : null);
    }
    toast({
      title: "Session Updated",
      description: "Your session has been successfully updated."
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'session') {
      const sessionToDelete = deleteConfirm.item as Session;
      const updatedSessions = sessions.filter(s => s.id !== sessionToDelete.id);
      setSessions(updatedSessions);
      localStorage.setItem('sessions', JSON.stringify(updatedSessions));
      if (selectedSession?.id === sessionToDelete.id) {
        setSelectedSession(null);
      }
      toast({
        title: "Session Deleted",
        description: "The session has been permanently deleted."
      });
    } else if (deleteConfirm.type === 'climb') {
      const climbToDelete = deleteConfirm.item as LocalClimb;
      const updatedSessions = sessions.map(session => ({
        ...session,
        climbs: session.climbs.filter(climb => climb.id !== climbToDelete.id)
      }));
      setSessions(updatedSessions);
      localStorage.setItem('sessions', JSON.stringify(updatedSessions));

      // Update selectedSession if it contains the deleted climb
      if (selectedSession) {
        const updatedSelectedSession = updatedSessions.find(s => s.id === selectedSession.id);
        if (updatedSelectedSession) {
          setSelectedSession(updatedSelectedSession);
        }
      }
      toast({
        title: "Climb Deleted",
        description: "The climb has been permanently deleted."
      });
    }
    setDeleteConfirm(null);
  };

  const handleAnalysisSaved = (sessionId: string, analysis: Session['aiAnalysis']) => {
    const updatedSessions = sessions.map(session => session.id === sessionId ? {
      ...session,
      aiAnalysis: analysis
    } : session);
    setSessions(updatedSessions);
    localStorage.setItem('sessions', JSON.stringify(updatedSessions));

    // Update selectedSession if it's the one being analyzed
    if (selectedSession?.id === sessionId) {
      setSelectedSession(prev => prev ? {
        ...prev,
        aiAnalysis: analysis
      } : null);
    }
  };

  if (showAnalysis && selectedSession) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
        <div className="max-w-md mx-auto">
          <SessionAnalysis session={selectedSession} onClose={() => setShowAnalysis(false)} onAnalysisSaved={handleAnalysisSaved} />
        </div>
      </div>;
  }

  if (selectedSession) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3 py-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSession(null)} className="text-stone-600">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-stone-800 flex-1">Session Details</h1>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-stone-600 hover:text-stone-800" title={`Logout (${user?.email})`}>
              <LogOut className="h-5 w-5" />
            </Button>
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
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-stone-600">
                    <div>{formatDate(selectedSession.startTime)}</div>
                    <div>{formatTime(selectedSession.startTime)}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEditSession(selectedSession)} className="h-8 w-8 text-stone-500 hover:text-stone-700">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSession(selectedSession)} className="h-8 w-8 text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">Duration</span>
                  <span className="font-semibold">{getSessionDuration(selectedSession)}m</span>
                </div>
                {selectedSession.notes && <div className="text-sm">
                    <span className="text-stone-600">Notes: </span>
                    <span className="italic">{selectedSession.notes}</span>
                  </div>}
                <SessionStats session={selectedSession} />
                
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => setShowAnalysis(true)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Brain className="h-4 w-4 mr-2" />
                    {selectedSession.aiAnalysis ? 'View Analysis' : 'AI Analysis'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedSession.aiAnalysis && (
            <AIAnalysisDrawer session={selectedSession}>
              <Card className="border-blue-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Brain className="h-5 w-5" />
                    AI Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-stone-700 mb-2 line-clamp-2">{selectedSession.aiAnalysis.summary}</p>
                      <div className="text-xs text-stone-500">
                        Generated on {selectedSession.aiAnalysis.generatedAt.toLocaleDateString()}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>
            </AIAnalysisDrawer>
          )}

          {selectedSession.climbs.length > 0 && <Card className="border-stone-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Climbs ({selectedSession.climbs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClimbList climbs={selectedSession.climbs} onEdit={handleEditClimb} onDelete={handleDeleteClimb} showEditButton={true} showDeleteButton={true} />
              </CardContent>
            </Card>}

          {editingClimb && <EditClimbDialog climb={editingClimb} open={true} onOpenChange={open => !open && setEditingClimb(null)} onSave={handleSaveClimb} />}

          {editingSession && <EditSessionDialog session={editingSession} open={true} onOpenChange={open => !open && setEditingSession(null)} onSave={handleSaveSession} />}

          {deleteConfirm && <DeleteConfirmDialog open={true} onOpenChange={open => !open && setDeleteConfirm(null)} onConfirm={handleConfirmDelete} title={deleteConfirm.type === 'session' ? 'Delete Session' : 'Delete Climb'} description={deleteConfirm.type === 'session' ? 'Are you sure you want to delete this entire climbing session? This will also delete all climbs in this session.' : 'Are you sure you want to delete this climb?'} itemName={deleteConfirm.type === 'session' ? (deleteConfirm.item as Session).location : (deleteConfirm.item as LocalClimb).name} />}
        </div>
      </div>;
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
          <h1 className="text-2xl font-bold text-stone-800 flex-1">Session History</h1>
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV} 
                className="text-stone-600 border-stone-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
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
                className="border-stone-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow bg-white" 
                onClick={() => setSelectedSession(session)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-stone-600" />
                        <span className="font-semibold text-stone-800">{session.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${climbingTypeColors[session.climbingType]}`}
                        >
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
                      <div className="flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {getSessionDuration(session)}m
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-600">Climbs logged</span>
                      <span className="font-semibold text-emerald-600 text-lg">
                        {session.climbs.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {deleteConfirm && (
          <DeleteConfirmDialog 
            open={true} 
            onOpenChange={(open) => !open && setDeleteConfirm(null)} 
            onConfirm={handleConfirmDelete} 
            title={deleteConfirm.type === 'session' ? 'Delete Session' : 'Delete Climb'} 
            description={deleteConfirm.type === 'session' 
              ? 'Are you sure you want to delete this entire climbing session? This will also delete all climbs in this session.' 
              : 'Are you sure you want to delete this climb?'
            } 
            itemName={deleteConfirm.type === 'session' 
              ? (deleteConfirm.item as Session).location 
              : (deleteConfirm.item as LocalClimb).name
            } 
          />
        )}
      </div>
    </div>
  );
};

export default History;
