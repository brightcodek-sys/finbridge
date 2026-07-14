import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className = '' }: StatCardProps) {
  return (
    <div className={`bg-card border border-card-border rounded-lg p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-card-foreground mt-2 font-mono">
            {value}
          </p>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.positive ? 'text-primary' : 'text-destructive'}`}>
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
