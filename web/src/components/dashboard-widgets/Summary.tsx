import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

interface CircularProgressProps {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  color?: string;
}

function CircularProgress({
  value,
  max,
  label,
  sublabel,
  color = "rgb(45,225,118)",
}: CircularProgressProps) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgb(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${color}40)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
      {sublabel && (
        <div className="mt-2 flex flex-wrap gap-1 justify-center">
          {sublabel.split(" • ").map((item, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Summary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.4 }}
    >
      <Card className="dash-card">
        <CardHeader className="dash-card-header">
          <CardTitle className="dash-title flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Zusammenfassung
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-around pt-3">
          <CircularProgress
            value={75}
            max={100}
            label="Gut"
            color="rgb(45,225,118)"
          />
          <div className="w-px h-16 bg-border"></div>
          <CircularProgress
            value={85}
            max={100}
            label="Score"
            sublabel="Seltenes Angebot • Fisramis"
            color="rgb(45,225,118)"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
