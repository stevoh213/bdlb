
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';

interface AnalysisPromptProps {
  onStartAnalysis: () => void;
}

const AnalysisPrompt = ({ onStartAnalysis }: AnalysisPromptProps) => {
  return (
    <Card className="border-stone-200 shadow-lg">
      <CardContent className="p-8 text-center">
        <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-stone-700 mb-2">Generate AI Analysis</h3>
        <p className="text-stone-600 mb-4">Get personalized insights about your climbing performance</p>
        <Button 
          onClick={onStartAnalysis}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Brain className="h-4 w-4 mr-2" />
          Start Analysis
        </Button>
      </CardContent>
    </Card>
  );
};

export default AnalysisPrompt;
