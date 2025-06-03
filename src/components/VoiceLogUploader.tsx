import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mic, MicOff, AlertCircle } from 'lucide-react';

// Mock for Supabase access token (replace with actual implementation)
const getSupabaseAccessToken = async (): Promise<string | null> => {
  return 'mock-supabase-token';
};

// SpeechRecognition interface (typescript doesn't have it by default)
interface CustomSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: typeof CustomSpeechRecognition;
    webkitSpeechRecognition: typeof CustomSpeechRecognition;
  }
}


interface VoiceLogUploaderProps {
  onUploadSuccess?: () => void;
}

const VoiceLogUploader: React.FC<VoiceLogUploaderProps> = ({ onUploadSuccess }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [originalFilename, setOriginalFilename] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // For form submission
  const [error, setError] = useState<string | null>(null); // For form submission errors
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Speech Recognition State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null);
  const [isSpeechApiSupported, setIsSpeechApiSupported] = useState<boolean>(true);
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSpeechApiSupported(false);
      console.warn("Speech Recognition API not supported in this browser.");
    }
    // Cleanup recognition on component unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setOriginalFilename(file.name);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleTranscriptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(event.target.value);
  };

  const handleToggleRecording = () => {
    if (!isSpeechApiSupported) {
      setSpeechRecognitionError("Speech Recognition is not supported by your browser.");
      return;
    }

    setSpeechRecognitionError(null);

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) { // Should be caught by useEffect check, but as a safeguard
          setSpeechRecognitionError("Cannot start recording: Speech Recognition API not available.");
          return;
      }
      recognitionRef.current = new SpeechRecognitionAPI() as CustomSpeechRecognition;
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // Or make this configurable

      let finalTranscript = transcript; // Use a local variable to build upon

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '; // Add space after final segment
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript + interimTranscript); // Show interim results live
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setSpeechRecognitionError(`Error: ${event.error}`);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        // finalTranscript already contains the full text up to this point
        // if continuous is false, this is where you'd get the 'final' final transcript
      };

      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        setSpeechRecognitionError(`Could not start recording: ${(e as Error).message}`);
        setIsRecording(false);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!audioFile || !transcript) {
      setError('Audio file and transcript are required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await getSupabaseAccessToken();
      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('original_audio_filename', originalFilename);
      formData.append('transcript_text', transcript);

      const response = await fetch('/api/voice-log-upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `Upload failed with status ${response.status}`);
      }

      setSuccessMessage(responseData.message || 'Upload successful! Your voice log is being processed.');
      setAudioFile(null);
      setTranscript('');
      setOriginalFilename('');
      const fileInput = document.getElementById('audioFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      const typedError = err as Error;
      console.error('Upload error:', typedError);
      setError(typedError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Voice Log</CardTitle>
        <CardDescription>
          Record your voice to fill the transcript, or type/paste it directly.
          Then, select the corresponding audio file for upload.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="audioFile">Audio File (Required for upload)</Label>
            <Input
              id="audioFile"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="transcript">Transcript (Required)</Label>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleToggleRecording}
                disabled={!isSpeechApiSupported || isLoading}
                title={isSpeechApiSupported ? (isRecording ? 'Stop Recording' : 'Start Recording') : 'Speech recognition not supported'}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={handleTranscriptChange}
              placeholder={isSpeechApiSupported ? "Click the microphone to start recording, or type/paste transcript here..." : "Type or paste transcript here. Speech recognition not supported."}
              rows={6}
              disabled={isLoading}
            />
            {!isSpeechApiSupported && (
              <p className="text-xs text-destructive mt-1">
                <AlertCircle className="inline-block h-3 w-3 mr-1" />
                Speech recognition is not supported by your browser. Please type or paste the transcript manually.
              </p>
            )}
            {speechRecognitionError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" /> {speechRecognitionError}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Upload Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="default" className="bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading || !audioFile || !transcript} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Voice Log'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VoiceLogUploader;
