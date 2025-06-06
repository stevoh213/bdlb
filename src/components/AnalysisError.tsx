import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface AnalysisErrorProps {
  error: string;
  onShowSettings: () => void;
}

const AnalysisError = ({ error, onShowSettings }: AnalysisErrorProps) => {
  return (
    <Card className="border-red-200 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">Analysis Error</span>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <Button
          onClick={onShowSettings}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Check Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default AnalysisError;
