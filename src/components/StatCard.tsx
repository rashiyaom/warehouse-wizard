import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: "primary" | "info" | "warning" | "success" | "destructive";
  subtitle?: string;
}

const colorMap = {
  primary: {
    icon: "bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-100",
    accent: "text-blue-600"
  },
  info: {
    icon: "bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 text-cyan-600 border-cyan-100",
    accent: "text-cyan-600"
  },
  warning: {
    icon: "bg-gradient-to-br from-orange-500/10 to-orange-600/5 text-orange-600 border-orange-100",
    accent: "text-orange-600"
  },
  success: {
    icon: "bg-gradient-to-br from-green-500/10 to-green-600/5 text-green-600 border-green-100",
    accent: "text-green-600"
  },
  destructive: {
    icon: "bg-gradient-to-br from-red-500/10 to-red-600/5 text-red-600 border-red-100",
    accent: "text-red-600"
  },
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  color = "primary",
  subtitle 
}: StatCardProps) {
  return (
    <div className="stat-card group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/80 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`
          p-3 rounded-2xl border transition-all duration-300 group-hover:shadow-lg group-hover:scale-110
          ${colorMap[color].icon}
        `}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center gap-2">
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
            ${trendUp 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
            }
          `}>
            <span className="text-lg leading-none">{trendUp ? "↗" : "↘"}</span>
            {trend}
          </div>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
}
