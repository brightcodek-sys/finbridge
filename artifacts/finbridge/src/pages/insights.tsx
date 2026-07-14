import { useListInsights } from '@workspace/api-client-react';
import { AlertTriangle, Lightbulb, Trophy, Bell } from 'lucide-react';

export default function Insights() {
  const { data: insights, isLoading } = useListInsights();

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'tip':
        return Lightbulb;
      case 'achievement':
        return Trophy;
      case 'alert':
        return Bell;
      default:
        return Lightbulb;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'tip':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'achievement':
        return 'text-accent bg-accent/10 border-accent/20';
      case 'alert':
        return 'text-chart-4 bg-chart-4/10 border-chart-4/20';
      default:
        return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-destructive/10 text-destructive',
      medium: 'bg-accent/10 text-accent',
      low: 'bg-muted text-muted-foreground',
    };
    return colors[impact as keyof typeof colors] || colors.low;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial Insights</h1>
        <p className="text-muted-foreground mt-1">
          Personalized recommendations to improve your financial health
        </p>
      </div>

      {!insights || insights.length === 0 ? (
        <div className="bg-card border border-card-border rounded-lg p-12 text-center">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No insights available yet
          </h3>
          <p className="text-muted-foreground">
            Keep using FinBridge to receive personalized recommendations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => {
            const Icon = getIcon(insight.type);
            const colorClass = getColor(insight.type);

            return (
              <div
                key={insight.id}
                className={`bg-card border rounded-lg p-6 ${colorClass}`}
                data-testid={`insight-${insight.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 bg-current/10">
                    <Icon className="w-5 h-5 opacity-70" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-card-foreground">
                        {insight.title}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${getImpactBadge(
                          insight.impact
                        )}`}
                      >
                        {insight.impact.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-card-foreground/80 mb-3">
                      {insight.description}
                    </p>
                    <div className="bg-background/50 rounded-md p-3 border border-current/10">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        RECOMMENDATION
                      </p>
                      <p className="text-sm text-card-foreground font-medium">
                        {insight.recommendation}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(insight.createdAt).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
