
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useClimbsSync } from "@/hooks/useClimbsSync";
import EditClimbDialog from "@/components/EditClimbDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Climbs = () => {
  const { climbs, isLoading, updateClimb, deleteClimb, isUpdatingClimb, isDeletingClimb } = useClimbsSync();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [editingClimb, setEditingClimb] = useState<any>(null);

  const handleLogout = () => {
    signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const sendTypeColors = {
    send: "bg-green-100 text-green-800 border-green-200",
    attempt: "bg-orange-100 text-orange-800 border-orange-200",
    flash: "bg-blue-100 text-blue-800 border-blue-200",
    onsight: "bg-purple-100 text-purple-800 border-purple-200",
    project: "bg-red-100 text-red-800 border-red-200"
  };

  const typeColors = {
    sport: "bg-blue-100 text-blue-800 border-blue-200",
    trad: "bg-purple-100 text-purple-800 border-purple-200",
    boulder: "bg-orange-100 text-orange-800 border-orange-200",
    "top rope": "bg-green-100 text-green-800 border-green-200",
    alpine: "bg-red-100 text-red-800 border-red-200"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 flex items-center justify-center">
        <div className="text-lg">Loading climbs...</div>
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
          <h1 className="text-2xl font-bold text-stone-800 flex-1">All Climbs</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-stone-600 hover:text-stone-800"
            title={`Logout (${user?.email})`}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {climbs.length === 0 ? (
          <Card className="border-stone-200 shadow-lg">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-stone-700 mb-2">No Climbs Yet</h3>
              <p className="text-stone-600 mb-4">Start logging climbs to see them here!</p>
              <Link to="/">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Start Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {climbs.map((climb) => (
              <Card key={climb.id} className="border-stone-200 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2 flex-1">
                      <h3 className="font-semibold text-stone-800 text-lg">{climb.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-stone-700 border-stone-300">
                          {climb.grade}
                        </Badge>
                        <Badge variant="outline" className={`capitalize ${typeColors[climb.type]}`}>
                          {climb.type}
                        </Badge>
                        <Badge variant="outline" className={`capitalize ${sendTypeColors[climb.send_type]}`}>
                          {climb.send_type}
                        </Badge>
                      </div>
                      <div className="text-sm text-stone-600">
                        <div>{climb.location}</div>
                        <div>{new Date(climb.date).toLocaleDateString()}</div>
                        {climb.attempts > 1 && <div>{climb.attempts} attempts</div>}
                        {climb.rating && <div>Rating: {climb.rating}/10</div>}
                        {climb.duration && <div>Duration: {climb.duration}min</div>}
                      </div>
                      {climb.notes && (
                        <p className="text-sm text-stone-600 italic">{climb.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingClimb(climb)}
                      className="text-stone-600 hover:text-stone-800"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {editingClimb && (
          <EditClimbDialog
            climb={editingClimb}
            open={!!editingClimb}
            onOpenChange={(open) => !open && setEditingClimb(null)}
            onSave={updateClimb}
            onDelete={deleteClimb}
            isLoading={isUpdatingClimb || isDeletingClimb}
          />
        )}
      </div>
    </div>
  );
};

export default Climbs;
