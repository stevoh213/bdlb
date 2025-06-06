import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const AnalysisLoading = () => {
  return (
    <Card className="border-stone-200 shadow-lg">
      <CardContent className="p-8 text-center">
        <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-semibold text-stone-700 mb-2">
          Analyzing Your Session
        </h3>
        <p className="text-stone-600">
          AI is reviewing your performance data...
        </p>
      </CardContent>
    </Card>
  );
};

export default AnalysisLoading;
