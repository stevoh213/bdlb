
import { Button } from '@/components/ui/button';
import { Brain, X, RefreshCcw } from 'lucide-react';

interface SessionAnalysisHeaderProps {
  onClose: () => void;
  onRegenerate: () => void;
  onShowSettings: () => void;
  hasAnalysis: boolean;
  loading: boolean;
}

const SessionAnalysisHeader = ({ 
  onClose, 
  onRegenerate, 
  onShowSettings, 
  hasAnalysis, 
  loading 
}: SessionAnalysisHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
        <Brain className="h-6 w-6 text-blue-600" />
        AI Session Analysis
      </h2>
      <div className="flex items-center gap-2">
        {hasAnalysis && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRegenerate}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onShowSettings}
        >
          Settings
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default SessionAnalysisHeader;
