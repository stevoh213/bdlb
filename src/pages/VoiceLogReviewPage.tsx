import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; // For client-side temporary IDs

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Trash2, PlusCircle, ArrowLeft, Save, Play, Pause, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock for Supabase access token
const getSupabaseAccessToken = async (): Promise<string | null> => {
  return 'mock-supabase-token';
};

// --- Type Definitions ---
interface ConfirmedSessionDetails {
  location: string;
  date: string; // YYYY-MM-DD format
  climbingType: string;
  session_notes?: string | null;
}

interface ConfirmedClimb {
  id: string; // Client-side temporary ID for list management
  name: string;
  grade: string;
  tick_type: 'send' | 'attempt' | 'flash' | 'onsight' | 'unknown';
  attempts?: number;
  climb_notes?: string;
  skills?: string[];
}

// For data fetched from /api/voice-log-preview-detail
interface FetchedVoiceLogPreview {
  id: string;
  original_audio_filename: string;
  status: string;
  error_message?: string;
  created_at: string;
  transcript_text?: string;
  // This is what comes from the AI, might have slightly different structure before confirmation
  extracted_data_json?: {
    session_details: {
      location: string;
      date_hint?: string; // AI might provide this
      date?: string; // Or this, client should ensure one is chosen for ConfirmedSessionDetails
      climbingType?: string; // AI might not provide this initially
      session_notes?: string;
    };
    climbs: Array<{
      name?: string;
      grade: string;
      tick_type: 'send' | 'attempt' | 'flash' | 'onsight' | 'unknown';
      attempts?: number;
      climb_notes?: string;
      skills?: string[];
    }>;
  };
}

// Hardcoded options for selects
const CLIMBING_TYPES = ['boulder', 'sport', 'trad', 'top_rope', 'ice', 'mixed', 'alpine'];
const TICK_TYPES: ConfirmedClimb['tick_type'][] = ['send', 'attempt', 'flash', 'onsight', 'unknown'];
const GRADES = { // Simplified example grades
  boulder: ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10+'],
  sport: ['5.6', '5.7', '5.8', '5.9', '5.10a', '5.10b', '5.10c', '5.10d', '5.11a', '5.11b', '5.11c', '5.11d', '5.12a', '5.12b', '5.12c', '5.12d', '5.13+'],
  // Add more for other types if needed
};

interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: string;
  isEdited: boolean;
}

const VoiceLogReviewPage: React.FC = () => {
  const { previewId } = useParams<{ previewId: string }>();
  const navigate = useNavigate();

  const [originalPreviewData, setOriginalPreviewData] = useState<FetchedVoiceLogPreview | null>(null);
  const [sessionDetails, setSessionDetails] = useState<ConfirmedSessionDetails | null>(null);
  const [climbs, setClimbs] = useState<ConfirmedClimb[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([
    {
      id: '1',
      text: "Started climbing at 2 PM, did some warm-up boulders",
      timestamp: "00:00",
      isEdited: false
    },
    {
      id: '2',
      text: "Projected V5 in the corner, got to the last move",
      timestamp: "00:15",
      isEdited: false
    },
    {
      id: '3',
      text: "Switched to V4s, completed 3 problems",
      timestamp: "00:45",
      isEdited: false
    }
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false); // General loading for page actions
  const [isFetching, setIsFetching] = useState<boolean>(true); // Specific for initial data fetch
  const [error, setError] = useState<string | null>(null);

  // Fetch initial preview data
  useEffect(() => {
    if (!previewId) {
      setError("No preview ID provided.");
      setIsFetching(false);
      return;
    }
    const fetchPreviewDetail = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const token = await getSupabaseAccessToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch(`/api/voice-log-preview-detail?id=${previewId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch preview details: ${response.status}`);
        }
        const data: FetchedVoiceLogPreview = await response.json();
        setOriginalPreviewData(data);

        if (data.extracted_data_json) {
          const { session_details: extractedSession, climbs: extractedClimbs } = data.extracted_data_json;
          setSessionDetails({
            location: extractedSession.location || 'Unknown Location',
            // Ensure date is YYYY-MM-DD. AI might send date_hint or a pre-formatted date.
            // For this form, we expect a concrete date. Defaulting if not present.
            date: extractedSession.date || extractedSession.date_hint || new Date().toISOString().split('T')[0],
            climbingType: extractedSession.climbingType || CLIMBING_TYPES[0],
            session_notes: extractedSession.session_notes || '',
          });
          setClimbs(extractedClimbs.map(climb => ({
            ...climb,
            id: uuidv4(), // Assign client-side ID
            name: climb.name || 'Unnamed Climb',
            grade: climb.grade || (GRADES[extractedSession.climbingType as keyof typeof GRADES] || GRADES.boulder)[0],
            tick_type: climb.tick_type || 'unknown',
            attempts: climb.attempts === undefined || climb.attempts === null ? 1 : climb.attempts,
            climb_notes: climb.climb_notes || '',
            skills: climb.skills || [],
          })));
        } else if (data.status === 'pending_review') {
            // Handle case where extracted_data_json might be null but status is pending_review
            // This might indicate an issue upstream or require default empty forms
            setError("Preview data is missing extraction details. Please check the log or try re-processing.");
            setSessionDetails({ location: '', date: new Date().toISOString().split('T')[0], climbingType: CLIMBING_TYPES[0], session_notes: '' });
            setClimbs([]);
        } else {
            // If status is not pending_review and no data, it might be an issue or already processed/failed state not meant for this page
             setError(`This log (status: ${data.status}) may not be editable or has no data.`);
        }

      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsFetching(false);
      }
    };
    fetchPreviewDetail();
  }, [previewId]);

  // Form field handlers
  const handleSessionChange = (field: keyof ConfirmedSessionDetails, value: string | null) => {
    setSessionDetails(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleClimbChange = (climbId: string, field: keyof Omit<ConfirmedClimb, 'id'>, value: string | number | string[] | null) => {
    setClimbs(prevClimbs => prevClimbs.map(climb =>
      climb.id === climbId ? { ...climb, [field]: value } : climb
    ));
  };

  const handleAddClimb = () => {
    setClimbs(prevClimbs => [
      ...prevClimbs,
      {
        id: uuidv4(),
        name: '',
        grade: (sessionDetails?.climbingType && GRADES[sessionDetails.climbingType as keyof typeof GRADES] ? GRADES[sessionDetails.climbingType as keyof typeof GRADES][0] : GRADES.boulder[0]),
        tick_type: 'attempt',
        attempts: 1,
        climb_notes: '',
        skills: [],
      }
    ]);
  };

  const handleRemoveClimb = (climbId: string) => {
    setClimbs(prevClimbs => prevClimbs.filter(climb => climb.id !== climbId));
  };

  // API Actions
  const handleConfirm = async () => {
    if (!sessionDetails || !previewId) {
        setError("Session details are missing or invalid.");
        return;
    }
    // Basic validation
    if (!sessionDetails.location || !sessionDetails.date || !sessionDetails.climbingType) {
        setError("Location, Date, and Climbing Type are required for the session.");
        return;
    }
    for (const climb of climbs) {
        if (!climb.grade || !climb.tick_type) {
            setError(`Climb "${climb.name || 'Unnamed'}" is missing Grade or Tick Type.`);
            return;
        }
    }

    setIsLoading(true);
    setError(null);
    try {
        const token = await getSupabaseAccessToken();
        if (!token) throw new Error("Not authenticated");

        const payload = {
            preview_id: previewId,
            confirmed_data: {
                session_details: sessionDetails,
                climbs: climbs.map(({id, ...rest}) => rest), // Remove client-side ID before sending
            },
        };

        const response = await fetch('/api/voice-log-confirm', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to confirm: ${response.status}`);
        }
        navigate('/voice-logs'); // Or to a success page or the new session page
    } catch (err) {
        setError((err as Error).message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDiscard = async () => {
    if (!previewId) return;
    setIsLoading(true);
    setError(null);
    try {
        const token = await getSupabaseAccessToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch('/api/voice-log-discard', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ preview_id: previewId }),
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to discard: ${response.status}`);
        }
        navigate('/voice-logs');
    } catch (err) {
        setError((err as Error).message);
    } finally {
        setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // Implement audio playback logic here
  };

  const handleSegmentEdit = (id: string, newText: string) => {
    setTranscription(prev =>
      prev.map(segment =>
        segment.id === id
          ? { ...segment, text: newText, isEdited: true }
          : segment
      )
    );
  };

  // Render logic
  if (isFetching) {
    return <div className="container mx-auto p-4 text-center"><Loader2 className="mr-2 h-8 w-8 animate-spin inline-block" /> Loading preview data...</div>;
  }
  if (error && !sessionDetails && !originalPreviewData) { // Show critical error if initial load failed badly
    return <div className="container mx-auto p-4"><Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>;
  }
  if (!sessionDetails || !originalPreviewData) {
     return <div className="container mx-auto p-4"><Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Could not load session data for review. The log might be corrupted or already processed.</AlertDescription></Alert></div>;
  }

  const currentClimbingTypeKey = sessionDetails.climbingType as keyof typeof GRADES;
  const availableGrades = GRADES[currentClimbingTypeKey] || GRADES.boulder;


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/voice-logs')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Voice Logs
          </Button>
          <h1 className="text-4xl font-bold">Review Voice Log</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Audio Playback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={togglePlayback}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Play
                  </>
                )}
              </Button>
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '30%' }} />
              </div>
              <span className="text-sm text-muted-foreground">00:45 / 02:30</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {transcription.map((segment) => (
            <Card key={segment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-16 flex-shrink-0">
                    <span className="text-sm text-muted-foreground">{segment.timestamp}</span>
                  </div>
                  <Textarea
                    value={segment.text}
                    onChange={(e) => handleSegmentEdit(segment.id, e.target.value)}
                    className="flex-1 min-h-[60px]"
                  />
                  {segment.isEdited && (
                    <div className="flex-shrink-0 flex items-center">
                      <span className="text-xs text-blue-600">Edited</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/voice-logs')}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceLogReviewPage;
