import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Pause, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VoiceLog {
  id: string;
  date: string;
  duration: string;
  status: 'recording' | 'completed' | 'reviewed';
  previewId?: string;
}

const VoiceLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([
    {
      id: '1',
      date: '2024-03-20 14:30',
      duration: '15:23',
      status: 'completed',
      previewId: 'preview-1'
    },
    {
      id: '2',
      date: '2024-03-19 16:45',
      duration: '08:45',
      status: 'reviewed',
      previewId: 'preview-2'
    }
  ]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording logic here
      console.log('Started recording');
    } else {
      // Stop recording logic here
      console.log('Stopped recording');
    }
  };

  const handleReview = (previewId: string) => {
    navigate(`/voice-logs/review/${previewId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Voice Logs</h1>
            <p className="text-muted-foreground">
              Record and manage your climbing session voice logs
            </p>
          </div>
          <Button
            onClick={toggleRecording}
            className={`flex items-center gap-2 ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>
        </div>

        {isRecording && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="animate-pulse">
                    <Mic className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Recording in progress</h3>
                    <p className="text-sm text-muted-foreground">00:00</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={toggleRecording}
                  className="text-red-500 border-red-200 hover:bg-red-50"
                >
                  Stop Recording
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {voiceLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{log.date}</h3>
                    <p className="text-sm text-muted-foreground">
                      Duration: {log.duration}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => log.previewId && handleReview(log.previewId)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceLogsPage;
