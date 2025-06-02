
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AnalysisCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  borderColor: string;
  children: React.ReactNode;
}

const AnalysisCard = ({ title, icon: Icon, iconColor, borderColor, children }: AnalysisCardProps) => {
  return (
    <Card className={`${borderColor} shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 ${iconColor}`}>
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default AnalysisCard;
