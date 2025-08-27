export interface RadialScoreProps {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}

export function RadialScore({
  value,
  size = 140,
  stroke = 10,
  color = "#22c55e",
  trackColor = "#1f2937",
  label,
}: RadialScoreProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          fill="none"
        />
      </g>
      <g>
        <text
          x="50%"
          y="48%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={28}
          fontWeight={700}
          fill="white"
        >
          {Math.round(clamped)}
        </text>
        <text
          x="50%"
          y="63%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={12}
          fill="#9ca3af"
        >
          {label ?? "Gut"}
        </text>
      </g>
    </svg>
  );
}
