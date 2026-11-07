import { TrendingUp, Clock, Zap, Target } from "lucide-react";

interface PerformanceMetricProps {
  title: string;
  value: number;
  target: number;
  unit?: string;
  icon: typeof TrendingUp;
  color: "blue" | "green" | "orange" | "red";
}

const colorMap = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", bar: "bg-blue-500" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", bar: "bg-green-500" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", bar: "bg-orange-500" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", bar: "bg-red-500" },
};

export function PerformanceMetric({ title, value, target, unit = "%", icon: Icon, color }: PerformanceMetricProps) {
  const percentage = Math.min(100, (value / target) * 100);
  const styles = colorMap[color];
  
  return (
    <div className="stat-card group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${styles.bg} border ${styles.border}`}>
          <Icon className={`w-5 h-5 ${styles.text}`} />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{value}{unit}</p>
          <p className="text-xs text-muted-foreground">Target: {target}{unit}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
            percentage >= 90 ? "bg-green-50 text-green-700" :
            percentage >= 75 ? "bg-orange-50 text-orange-700" :
            "bg-red-50 text-red-700"
          }`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        
        <div className="w-full bg-muted/30 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${styles.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
