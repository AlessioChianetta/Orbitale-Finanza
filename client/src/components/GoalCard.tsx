import { Progress } from "@/components/ui/progress";
import { Home, Shield, Plane, Target } from "lucide-react";
import { formatEuro } from "@/lib/financial";

interface Goal {
  id: number;
  name: string;
  type: string;
  targetAmount: string;
  currentAmount: string;
  monthlyContribution: string;
  targetDate: string;
  priority: number;
}

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const targetAmount = parseFloat(goal.targetAmount);
  const currentAmount = parseFloat(goal.currentAmount);
  const monthlyContribution = parseFloat(goal.monthlyContribution || '0');
  
  const progressPercentage = (currentAmount / targetAmount) * 100;
  
  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'home_purchase': return Home;
      case 'emergency_fund': return Shield;
      case 'travel': return Plane;
      default: return Target;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'home_purchase': return 'text-trust-blue bg-blue-100';
      case 'emergency_fund': return 'text-growth-green bg-green-100';
      case 'travel': return 'text-amber-500 bg-amber-100';
      default: return 'text-purple-500 bg-purple-100';
    }
  };

  const getProgressColor = (type: string) => {
    switch (type) {
      case 'home_purchase': return 'bg-trust-blue';
      case 'emergency_fund': return 'bg-growth-green';
      case 'travel': return 'bg-amber-500';
      default: return 'bg-purple-500';
    }
  };

  const getMonthsRemaining = () => {
    if (!goal.targetDate) return null;
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    if (diffMonths <= 0) return "Scaduto";
    if (diffMonths === 1) return "1 mese rimasto";
    if (diffMonths < 12) return `${diffMonths} mesi rimasti`;
    
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 1 && months === 0) return "1 anno rimasto";
    if (years === 1) return `1 anno, ${months} mesi rimasti`;
    if (months === 0) return `${years} anni rimasti`;
    return `${years} anni, ${months} mesi rimasti`;
  };

  const IconComponent = getGoalIcon(goal.type);
  const iconColorClass = getIconColor(goal.type);
  const progressColorClass = getProgressColor(goal.type);

  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColorClass}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-dark-gray">{goal.name}</h4>
            <p className="text-sm text-medium-gray">
              {formatEuro(targetAmount)} {goal.targetDate && `entro ${new Date(goal.targetDate).getFullYear()}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-dark-gray">
            {formatEuro(monthlyContribution)}/mese
          </p>
          <p className="text-xs text-medium-gray">necessari</p>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div 
          className={`h-3 rounded-full ${progressColorClass}`}
          style={{ width: `${Math.min(100, progressPercentage)}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-medium-gray">
          {formatEuro(currentAmount)} / {formatEuro(targetAmount)}
        </span>
        <span className="text-medium-gray">
          {getMonthsRemaining()}
        </span>
      </div>
    </div>
  );
}
