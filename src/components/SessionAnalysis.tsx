
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, CheckCircle, AlertCircle, Target, TrendingUp, X } from 'lucide-react';
import { Session } from '@/types/climbing';
import { AIAnalysisService, AnalysisResult } from '@/services/aiAnalysis';
import AISettingsForm from './AISettingsForm';
import { useToast } from '@/hooks/use-toast';

interface SessionAnalysisProps {
  session: Session;
  onClose: () => void;
}

const SessionAnalysis = ({ session, onClose }: SessionAnalysisProps) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if API key is already configured
    const savedApiKey = localStorage.getItem('openrouter_api_key');
    if (savedApiKey) {
      performAnalysis(savedApiKey);
    } else {
      setShowSettings(true);
    }
  }, []);

  const performAnalysis = async (apiKey: string, model?: string) => {
    setLoading(true);
    setError(null);
    setShowSettings(false);

    try {
      const analysisService = new AIAnalysisService(apiKey, model);
      const result = await analysisService.analyzeSession(session);
      setAnalysis(result);
      
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
