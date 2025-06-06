import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Brain,
  Target,
} from "lucide-react";
import { AnalysisResult } from "@/services/aiAnalysis";
import { Session } from "@/types/climbing";
import AnalysisCard from "./AnalysisCard";

interface AnalysisContentProps {
  analysis: AnalysisResult;
  session: Session;
}

const AnalysisContent = ({ analysis, session }: AnalysisContentProps) => {
  return (
    <div className="space-y-4">
      {session.aiAnalysis && (
        <div className="text-sm text-stone-500 text-center">
          Generated on {session.aiAnalysis.generatedAt.toLocaleDateString()} at{" "}
          {session.aiAnalysis.generatedAt.toLocaleTimeString()}
        </div>
      )}

      {/* Summary */}
      <AnalysisCard
        title="Session Summary"
        icon={CheckCircle}
        iconColor="text-green-600"
        borderColor="border-stone-200"
      >
        <p className="text-stone-700">{analysis.summary}</p>
      </AnalysisCard>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <AnalysisCard
          title="Strengths"
          icon={TrendingUp}
          iconColor="text-green-700"
          borderColor="border-green-200"
        >
          <ul className="space-y-2">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-stone-700">{strength}</span>
              </li>
            ))}
          </ul>
        </AnalysisCard>
      )}

      {/* Areas for Improvement */}
      {analysis.areasForImprovement.length > 0 && (
        <AnalysisCard
          title="Areas for Improvement"
          icon={Target}
          iconColor="text-amber-700"
          borderColor="border-amber-200"
        >
          <ul className="space-y-2">
            {analysis.areasForImprovement.map((area, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-stone-700">{area}</span>
              </li>
            ))}
          </ul>
        </AnalysisCard>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <AnalysisCard
          title="Recommendations"
          icon={Brain}
          iconColor="text-blue-700"
          borderColor="border-blue-200"
        >
          <ul className="space-y-2">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">
                    {index + 1}
                  </span>
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
        <p className="text-stone-700">{analysis.progressInsights}</p>
      </AnalysisCard>
    </div>
  );
};

export default AnalysisContent;
