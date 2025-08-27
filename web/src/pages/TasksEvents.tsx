import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Monitor,
  Pause,
  Play,
  RefreshCw,
  Server,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface Job {
  id: string;
  status: "running" | "pending" | "completed" | "failed";
  type: "scrape" | "sync" | "refresh" | "send_confirm";
  description: string;
  progress?: number;
  startedAt: string;
}

interface Event {
  id: string;
  type: "ad.edited" | "message.new" | "rate_limit" | "system.error";
  message: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
}

const mockJobs: Job[] = [
  {
    id: "1",
    status: "running",
    type: "scrape",
    description: "Scraping new listings",
    progress: 65,
    startedAt: "2 min ago",
  },
  {
    id: "2",
    status: "running",
    type: "sync",
    description: "Syncing user data",
    progress: 45,
    startedAt: "5 min ago",
  },
  {
    id: "3",
    status: "running",
    type: "refresh",
    description: "Refreshing cache",
    progress: 89,
    startedAt: "1 min ago",
  },
  {
    id: "4",
    status: "running",
    type: "send_confirm",
    description: "Sending confirmations",
    progress: 23,
    startedAt: "8 min ago",
  },
  {
    id: "5",
    status: "pending",
    type: "scrape",
    description: "Pending scrape job",
    startedAt: "10 min ago",
  },
  {
    id: "6",
    status: "completed",
    type: "sync",
    description: "Data sync completed",
    startedAt: "15 min ago",
  },
  {
    id: "7",
    status: "failed",
    type: "refresh",
    description: "Cache refresh failed",
    startedAt: "20 min ago",
  },
  {
    id: "8",
    status: "running",
    type: "scrape",
    description: "Background scraping",
    progress: 78,
    startedAt: "3 min ago",
  },
  {
    id: "9",
    status: "running",
    type: "sync",
    description: "Real-time sync",
    progress: 92,
    startedAt: "1 min ago",
  },
  {
    id: "10",
    status: "pending",
    type: "send_confirm",
    description: "Queued confirmations",
    startedAt: "12 min ago",
  },
];

const mockEvents: Event[] = [
  {
    id: "1",
    type: "ad.edited",
    message: "ad.edited / message.new / rate_limit",
    timestamp: "2 min ago",
    severity: "info",
  },
  {
    id: "2",
    type: "message.new",
    message: "ad.edited / message.new / rate_limit",
    timestamp: "3 min ago",
    severity: "info",
  },
  {
    id: "3",
    type: "rate_limit",
    message: "ad.edited / message.new / rate_limit",
    timestamp: "5 min ago",
    severity: "warning",
  },
  {
    id: "4",
    type: "ad.edited",
    message: "ad.edited / message.new / rate_limit",
    timestamp: "7 min ago",
    severity: "info",
  },
  {
    id: "5",
    type: "message.new",
    message: "ad.edited / message.new / rate_limit",
    timestamp: "8 min ago",
    severity: "info",
  },
  {
    id: "6",
    type: "rate_limit",
    message: "ad.edited / message.new / rate_limit",
    timestamp: "10 min ago",
    severity: "warning",
  },
  {
    id: "7",
    type: "system.error",
    message: "ad.edited / message.new / rate_limit",
    timestamp: "12 min ago",
    severity: "error",
  },
  {
    id: "8",
    type: "ad.edited",
    message: "ad.edited / message.new / rate_limit",
    timestamp: "15 min ago",
    severity: "info",
  },
];

const jobStatusColors = {
  running: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

const eventSeverityColors = {
  info: "border-l-info",
  warning: "border-l-warning",
  error: "border-l-destructive",
};

const systemStats = {
  proxy: { status: "OK", details: "Healthy connections" },
  captcha: { status: "0/24h", details: "No captcha challenges" },
  rate: { status: "SLOW", details: "Throttled to prevent limits" },
  safeBlocks: { status: "2", details: "Safety interventions active" },
  worker: { status: "4", details: "Background workers running" },
  uptime: { status: "99.9%", details: "System reliability" },
};

export default function TasksEvents() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [events] = useState<Event[]>(mockEvents);
  const [_filter] = useState<string>("all");

  const runningJobs = jobs.filter((job) => job.status === "running").length;
  const pendingJobs = jobs.filter((job) => job.status === "pending").length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const failedJobs = jobs.filter((job) => job.status === "failed").length;

  const pauseAllJobs = () => {
    setJobs(
      jobs.map((job) =>
        job.status === "running" ? { ...job, status: "pending" as const } : job
      )
    );
  };

  const resumeAllJobs = () => {
    setJobs(
      jobs.map((job) =>
        job.status === "pending" ? { ...job, status: "running" as const } : job
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks & Events</h1>
          <p className="text-muted-foreground mt-1">
            Monitor job queue, system events, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={pauseAllJobs} variant="outline" size="sm">
            <Pause className="h-4 w-4 mr-2" />
            Pause All
          </Button>
          <Button onClick={resumeAllJobs} variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Resume All
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Queue (Jobs) */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Queue (Jobs)
              </span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>scrape</span>
                <span>•</span>
                <span>sync</span>
                <span>•</span>
                <span>refresh</span>
                <span>•</span>
                <span>send_confirm</span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{runningJobs} running</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span>{pendingJobs} pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>{completedJobs} completed</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`p-3 rounded-lg border text-sm ${
                  jobStatusColors[job.status]
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Job {job.id}</span>
                  <Badge variant="secondary" className="text-xs">
                    {job.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {job.description}
                </div>
                {job.progress && job.status === "running" && (
                  <div className="w-full bg-background rounded-full h-1.5 mb-1">
                    <div
                      className="bg-current h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Started {job.startedAt}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Eventlog */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-accent" />
              Eventlog
            </CardTitle>
            <CardDescription>chronologisch • filterbar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border-l-4 bg-muted/20 ${
                  eventSeverityColors[event.severity]
                }`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    [{event.id}] {event.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {event.timestamp}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {event.message}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Systemstatus */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-info" />
              Systemstatus
            </CardTitle>
            <CardDescription>Proxy • Captcha • SAFE</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Proxy</span>
                </div>
                <div className="text-lg font-bold text-success">
                  {systemStats.proxy.status}
                </div>
                <div className="text-xs text-muted-foreground">
                  {systemStats.proxy.details}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Rate</span>
                </div>
                <div className="text-lg font-bold text-warning">
                  {systemStats.rate.status}
                </div>
                <div className="text-xs text-muted-foreground">
                  {systemStats.rate.details}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Captcha</span>
                </div>
                <div className="text-lg font-bold">
                  {systemStats.captcha.status}
                </div>
                <div className="text-xs text-muted-foreground">
                  {systemStats.captcha.details}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">SAFE Blocks</span>
                </div>
                <div className="text-lg font-bold text-destructive">
                  {systemStats.safeBlocks.status}
                </div>
                <div className="text-xs text-muted-foreground">
                  {systemStats.safeBlocks.details}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Worker</span>
                </div>
                <div className="text-lg font-bold text-primary">
                  {systemStats.worker.status}
                </div>
                <div className="text-xs text-muted-foreground">
                  {systemStats.worker.details}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Uptime</span>
                </div>
                <div className="text-lg font-bold text-success">
                  {systemStats.uptime.status}
                </div>
                <div className="text-xs text-muted-foreground">
                  {systemStats.uptime.details}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold text-primary">{runningJobs}</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Queue Length</p>
                <p className="text-2xl font-bold text-warning">{pendingJobs}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">
                  {completedJobs}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-destructive">
                  {failedJobs}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
