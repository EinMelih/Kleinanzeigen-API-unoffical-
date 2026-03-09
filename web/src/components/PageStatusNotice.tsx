import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureStatus } from "@/lib/app-types";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FlaskConical,
} from "lucide-react";

interface PageStatusNoticeProps {
  status: FeatureStatus;
  title: string;
  description: string;
}

const STATUS_MAP = {
  live: {
    label: "Live angebunden",
    icon: CheckCircle2,
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    badgeVariant: "default" as const,
  },
  partial: {
    label: "Teilweise live",
    icon: Clock3,
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    badgeVariant: "secondary" as const,
  },
  preview: {
    label: "UI Vorschau",
    icon: FlaskConical,
    className:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    badgeVariant: "outline" as const,
  },
  planned: {
    label: "Geplant",
    icon: AlertTriangle,
    className:
      "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    badgeVariant: "outline" as const,
  },
};

export function PageStatusNotice({
  status,
  title,
  description,
}: PageStatusNoticeProps) {
  const entry = STATUS_MAP[status];
  const Icon = entry.icon;

  return (
    <Card className={entry.className}>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-background/70 p-2">
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="font-medium">{title}</div>
            <p className="text-sm opacity-90">{description}</p>
          </div>
        </div>
        <Badge variant={entry.badgeVariant}>{entry.label}</Badge>
      </CardContent>
    </Card>
  );
}
