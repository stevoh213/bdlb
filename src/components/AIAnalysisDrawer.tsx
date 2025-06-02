
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Brain, X, CheckCircle, AlertCircle, TrendingUp, Target, ChevronRight } from 'lucide-react';
import { Session } from '@/types/climbing';
import AnalysisCard from './AnalysisCard';

interface AIAnalysisDrawerProps {
  session: Session;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAnalysisSaved?: (analysis: Session['aiAnalysis']) => void;
}

const AIAnalysisDrawer = ({ session, children, open, onOpenChange, onAnalysisSaved }: AIAnalysisDrawerProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  if (!session.aiAnalysis) {
    return null;
  }

  const { aiAnalysis } = session;

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      {children && (
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
      )}
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-blue-700">
            <Brain className="h-6 w-6" />
            AI Session Analysis
          </SheetTitle>
          <div className="text-sm text-stone-500">
            Generated on {aiAnalysis.generatedAt.toLocaleDateString()} at {aiAnalysis.generatedAt.toLocaleTimeString()}
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Summary */}
          <AnalysisCard
            title="Session Summary"
            icon={CheckCircle}
            iconColor="text-green-600"
            borderColor="border-stone-200"
          >
            <p className="text-stone-700">{aiAnalysis.summary}</p>
          </AnalysisCard>

          {/* Strengths */}
          {aiAnalysis.strengths.length > 0 && (
            <AnalysisCard
              title="Strengths"
              icon={TrendingUp}
              iconColor="text-green-700"
              borderColor="border-green-200"
            >
              <ul className="space-y-2">
                {aiAnalysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-stone-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </AnalysisCard>
          )}

          {/* Areas for Improvement */}
          {aiAnalysis.areasForImprovement.length > 0 && (
            <AnalysisCard
              title="Areas for Improvement"
              icon={Target}
              iconColor="text-amber-700"
              borderColor="border-amber-200"
            >
              <ul className="space-y-2">
                {aiAnalysis.areasForImprovement.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-stone-700">{area}</span>
                  </li>
                ))}
              </ul>
            </AnalysisCard>
          )}

          {/* Recommendations */}
          {aiAnalysis.recommendations.length > 0 && (
            <AnalysisCard
              title="Recommendations"
              icon={Brain}
              iconColor="text-blue-700"
              borderColor="border-blue-200"
            >
              <ul className="space-y-2">
                {aiAnalysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">{index + 1}</span>
                    </div>
                    <span className="text-stone-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </AnalysisCard>
          )}

          {/* Progress Insights */}
          <AnalysisCard
            title="Progress Insights"
            icon={TrendingUp}
            iconColor="text-purple-700"
            borderColor="border-purple-200"
          >
            <p className="text-stone-700">{aiAnalysis.progressInsights}</p>
          </AnalysisCard>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AIAnalysisDrawer;
