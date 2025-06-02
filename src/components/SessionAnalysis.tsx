
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, CheckCircle, AlertCircle, Target, TrendingUp, X, RefreshCcw } from 'lucide-react';
import { Session } from '@/types/climbing';
import { AIAnalysisService, AnalysisResult } from '@/services/aiAnalysis';
import AISettingsForm from './AISettingsForm';
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

  useEffect(() => {
    // If session already has saved analysis, use it
    if (session.aiAnalysis) {
      setAnalysis({
        summary: session.aiAnalysis.summary,
        strengths: session.aiAnalysis.strengths,
        areasForImprovement: session.aiAnalysis.areasForImprovement,
        recommendations: session.aiAnalysis.recommendations,
        progressInsights: session.aiAnalysis.progressInsights
      });
      return;
    }

    // Only auto-start if explicitly requested and API key is available
    if (autoStart) {
      const savedApiKey = localStorage.getItem('openrouter_api_key') || OPENROUTER_CONFIG.defaultApiKey;
      const savedModel = localStorage.getItem('openrouter_model') || OPENROUTER_CONFIG.defaultModel;
      
      if (savedApiKey) {
        performAnalysis(savedApiKey, savedModel);
      } else {
        setShowSettings(true);
      }
    }
  }, [autoStart]);

  const performAnalysis = async (apiKey: string, model?: string) => {
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
  };

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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-800">AI Session Analysis</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <AISettingsForm 
          onSave={handleSettingsSave}
          onCancel={onClose}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          AI Session Analysis
        </h2>
        <div className="flex items-center gap-2">
          {analysis && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRegenerate}
              disabled={loading}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            Settings
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {!analysis && !loading && !error && (
        <Card className="border-stone-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-stone-700 mb-2">Generate AI Analysis</h3>
            <p className="text-stone-600 mb-4">Get personalized insights about your climbing performance</p>
            <Button 
              onClick={handleStartAnalysis}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Brain className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="border-stone-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-stone-700 mb-2">Analyzing Your Session</h3>
            <p className="text-stone-600">AI is reviewing your performance data...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Analysis Error</span>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => setShowSettings(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Check Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="space-y-4">
          {session.aiAnalysis && (
            <div className="text-sm text-stone-500 text-center">
              Generated on {session.aiAnalysis.generatedAt.toLocaleDateString()} at {session.aiAnalysis.generatedAt.toLocaleTimeString()}
            </div>
          )}
          
          {/* Summary */}
          <Card className="border-stone-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-700">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Card className="border-green-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-stone-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Areas for Improvement */}
          {analysis.areasForImprovement.length > 0 && (
            <Card className="border-amber-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Target className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span className="text-stone-700">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Brain className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-semibold">{index + 1}</span>
                      </div>
                      <span className="text-stone-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Progress Insights */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <TrendingUp className="h-5 w-5" />
                Progress Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-700">{analysis.progressInsights}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SessionAnalysis;
