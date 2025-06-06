
import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types/climbing';
import { AIAnalysisService, AnalysisResult } from '@/services/aiAnalysis';
import AISettingsForm from './AISettingsForm';
import SessionAnalysisHeader from './SessionAnalysisHeader';
import AnalysisPrompt from './AnalysisPrompt';
import AnalysisLoading from './AnalysisLoading';
import AnalysisError from './AnalysisError';
import AnalysisContent from './AnalysisContent';
import { useToast } from '@/hooks/use-toast';
import { OPENROUTER_CONFIG } from '@/config/openrouter';

interface SessionAnalysisProps {
  session: Session;
  onClose: () => void;
  onAnalysisSaved?: (sessionId: string, analysis: Session['aiAnalysis']) => void;
  autoStart?: boolean;
}

const SessionAnalysis = ({ session, onClose, onAnalysisSaved, autoStart = false }: SessionAnalysisProps) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const performAnalysis = useCallback(
    async (apiKey: string, model?: string) => {
      setLoading(true);
      setError(null);
      setShowSettings(false);

    try {
      const analysisService = new AIAnalysisService(apiKey, model || OPENROUTER_CONFIG.defaultModel);
      const result = await analysisService.analyzeSession(session);
      setAnalysis(result);
      
      // Save analysis to session
      const analysisData = {
        ...result,
        generatedAt: new Date()
      };
      
      if (onAnalysisSaved) {
        onAnalysisSaved(session.id, analysisData);
      }
      
      toast({
        title: "Analysis Complete",
        description: "Your session has been analyzed successfully!",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
    },
    [onAnalysisSaved, session, toast]
  );

  useEffect(() => {
    // If session already has saved analysis, use it
    if (session.aiAnalysis) {
      setAnalysis({
        summary: session.aiAnalysis.summary,
        strengths: session.aiAnalysis.strengths,
        areasForImprovement: session.aiAnalysis.areasForImprovement,
        recommendations: session.aiAnalysis.recommendations,
        progressInsights: session.aiAnalysis.progressInsights,
      });
      return;
    }

    // Only auto-start if explicitly requested and API key is available
    if (autoStart) {
      const savedApiKey =
        localStorage.getItem('openrouter_api_key') || OPENROUTER_CONFIG.defaultApiKey;
      const savedModel =
        localStorage.getItem('openrouter_model') || OPENROUTER_CONFIG.defaultModel;

      if (savedApiKey) {
        performAnalysis(savedApiKey, savedModel);
      } else {
        setShowSettings(true);
      }
    }
  }, [autoStart, performAnalysis, session.aiAnalysis]);

  const handleSettingsSave = (apiKey: string, model: string) => {
    performAnalysis(apiKey, model);
  };

  const handleStartAnalysis = () => {
    const savedApiKey = localStorage.getItem('openrouter_api_key') || OPENROUTER_CONFIG.defaultApiKey;
    const savedModel = localStorage.getItem('openrouter_model') || OPENROUTER_CONFIG.defaultModel;
    
    if (savedApiKey) {
      performAnalysis(savedApiKey, savedModel);
    } else {
      setShowSettings(true);
    }
  };

  const handleRegenerate = () => {
    const savedApiKey = localStorage.getItem('openrouter_api_key') || OPENROUTER_CONFIG.defaultApiKey;
    const savedModel = localStorage.getItem('openrouter_model') || OPENROUTER_CONFIG.defaultModel;
    
    if (savedApiKey) {
      performAnalysis(savedApiKey, savedModel);
    } else {
      setShowSettings(true);
    }
  };

  if (showSettings) {
    return (
      <div className="space-y-4">
        <SessionAnalysisHeader
          onClose={onClose}
          onRegenerate={handleRegenerate}
          onShowSettings={() => setShowSettings(true)}
          hasAnalysis={!!analysis}
          loading={loading}
        />
        <AISettingsForm 
          onSave={handleSettingsSave}
          onCancel={onClose}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SessionAnalysisHeader
        onClose={onClose}
        onRegenerate={handleRegenerate}
        onShowSettings={() => setShowSettings(true)}
        hasAnalysis={!!analysis}
        loading={loading}
      />

      {!analysis && !loading && !error && (
        <AnalysisPrompt onStartAnalysis={handleStartAnalysis} />
      )}

      {loading && <AnalysisLoading />}

      {error && (
        <AnalysisError 
          error={error} 
          onShowSettings={() => setShowSettings(true)} 
        />
      )}

      {analysis && (
        <AnalysisContent analysis={analysis} session={session} />
      )}
    </div>
  );
};

export default SessionAnalysis;
