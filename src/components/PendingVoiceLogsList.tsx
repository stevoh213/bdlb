import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalClimb, Session } from '@/types/climbing';
import { RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Mock for Supabase access token (replace with actual implementation)
const getSupabaseAccessToken = async (): Promise<string | null> => {
  // In a real app, this would come from your Supabase client
  // For example: const session = await supabase.auth.getSession(); return session?.data?.session?.access_token || null;
  return 'mock-supabase-token';
};

interface Preview {
  id: string;
  original_audio_filename: string;
  status: 'pending_review' | 'processing_failed' | 'processing' | 'confirmed' | 'pending_upload'; // Added more known statuses
  error_message?: string;
  created_at: string; // ISO string
  extracted_data_json?: { // For potential future use, though not explicitly listed for display
    session_details: Partial<Session>;
    climbs: Partial<LocalClimb>[];
  }
}

interface PendingVoiceLogsListProps {
  refreshKey?: number; // Used to trigger refresh from parent
}

const PendingVoiceLogsList: React.FC<PendingVoiceLogsListProps> = ({ refreshKey }) => {
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getSupabaseAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Assuming Supabase functions are proxied to /api/ or this is the direct URL
      const response = await fetch('/api/voice-log-previews', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch pending voice logs' }));
        throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
      }

      const data: Preview[] = await response.json();
      setPreviews(data);
    } catch (err) {
      const typedError = err as Error;
      console.error('Error fetching previews:', typedError);
      setError(typedError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreviews();
  }, [fetchPreviews, refreshKey]);

  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleString();
    } catch (e) {
      return isoString; // if already formatted or invalid
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pending Voice Logs</CardTitle>
          <CardDescription>Review or manage your uploaded voice logs.</CardDescription>
        </div>
        <Button onClick={fetchPreviews} variant="outline" size="icon" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading previews...</p>}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && previews.length === 0 && (
          <p>No voice logs currently pending review or failed.</p>
        )}
        {!isLoading && !error && previews.length > 0 && (
          <ul className="space-y-4">
            {previews.map((preview) => (
              <li key={preview.id} className="p-4 border rounded-md hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{preview.original_audio_filename}</h3>
                    <p className="text-sm text-muted-foreground">
                      Uploaded: {formatDateTime(preview.created_at)}
                    </p>
                  </div>
                  <Badge variant={preview.status === 'processing_failed' ? 'destructive' : (preview.status === 'pending_review' ? 'default' : 'outline')}>
                    {preview.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
                {preview.status === 'processing_failed' && preview.error_message && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTitle>Processing Failed</AlertTitle>
                    <AlertDescription>{preview.error_message}</AlertDescription>
                  </Alert>
                )}
                {(preview.status === 'pending_review' || preview.status === 'processing_failed') && (
                   <Button asChild size="sm" className="mt-3">
                    <Link to={`/voice-logs/review/${preview.id}`}>Review Log</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingVoiceLogsList;
