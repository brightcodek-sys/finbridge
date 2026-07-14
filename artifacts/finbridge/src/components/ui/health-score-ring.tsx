interface HealthScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function HealthScoreRing({ score, size = 'md' }: HealthScoreRingProps) {
  const getColor = (score: number) => {
    if (score >= 75) return 'text-primary';
    if (score >= 50) return 'text-accent';
    return 'text-destructive';
  };

  const getStrokeColor = (score: number) => {
    if (score >= 75) return 'stroke-primary';
    if (score >= 50) return 'stroke-accent';
    return 'stroke-destructive';
  };

  const sizeMap = {
    sm: { outer: 80, stroke: 6, text: 'text-xl' },
    md: { outer: 120, stroke: 8, text: 'text-3xl' },
    lg: { outer: 160, stroke: 10, text: 'text-5xl' },
  };

  const { outer, stroke, text } = sizeMap[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={outer} height={outer} className="transform -rotate-90">
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={`${getStrokeColor(score)} transition-all duration-1000 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${text} font-bold font-mono ${getColor(score)}`}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground font-medium">HEALTH</span>
      </div>
    </div>
  );
}
