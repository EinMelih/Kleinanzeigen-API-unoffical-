import * as React from "react";

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  showGradient?: boolean;
}

export function Sparkline({
  values,
  width = 280,
  height = 64,
  color = "#22c55e",
  showGradient = true,
}: SparklineProps) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const step = width / Math.max(1, values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const pathD = React.useMemo(() => {
    if (values.length === 0) return "";
    return points
      .split(" ")
      .map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`))
      .join(" ");
  }, [points, values.length]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {showGradient && (
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {showGradient && pathD && (
        <path
          d={`${pathD} L ${width},${height} L 0,${height} Z`}
          fill="url(#spark-grad)"
          stroke="none"
        />
      )}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}
