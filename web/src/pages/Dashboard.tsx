import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Monitor,
  Play,
  RefreshCw,
  Square,
} from "lucide-react";
import { useEffect, useState } from "react";

interface HealthData {
  status: string;
  timestamp: string;
  cookieFiles: number;
  cookiesInFile: number;
  totalFiles: number;
  validFiles: number;
  expiredFiles: number;
  totalCookieCount: number;
  nextExpiry: string;
  validityDuration: string;
}

interface ChromeStatus {
  isRunning: boolean;
  port: number;
  lastCheck: string;
}

// Utility function to format time differences
const formatTimeDifference = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
      return "Expired";
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
    } else {
      return "Less than 1 minute";
    }
  } catch (error) {
    return "Invalid date";
  }
};

// Utility function to format date in German timezone
const formatGermanDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  } catch (error) {
    return "Invalid date";
  }
};

export default function Dashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [chromeStatus, setChromeStatus] = useState<ChromeStatus>({
    isRunning: false,
    port: 9222,
    lastCheck: new Date().toISOString(),
  });
  const [chromeActionLoading, setChromeActionLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/health");
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
        setChromeStatus((prev) => ({
          ...prev,
          isRunning: true,
          lastCheck: new Date().toISOString(),
        }));
      } else {
        setChromeStatus((prev) => ({
          ...prev,
          isRunning: false,
          lastCheck: new Date().toISOString(),
        }));
        toast({
          title: "Error",
          description: "Failed to fetch health data",
          variant: "destructive",
        });
      }
    } catch (error) {
      setChromeStatus((prev) => ({
        ...prev,
        isRunning: false,
        lastCheck: new Date().toISOString(),
      }));
      toast({
        title: "Error",
        description: "API server is not responding",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startChrome = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setChromeActionLoading(true);
      const response = await fetch("/api/server/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });
        // Wait a moment then check status
        setTimeout(() => {
          fetchHealthData();
        }, 2000);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to start Chrome browser",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start Chrome browser",
        variant: "destructive",
      });
    } finally {
      setChromeActionLoading(false);
    }
  };

  const stopChrome = async () => {
    try {
      setChromeActionLoading(true);
      const response = await fetch("/api/server/stop", {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Chrome browser stopped successfully",
        });
        setChromeStatus((prev) => ({
          ...prev,
          isRunning: false,
          lastCheck: new Date().toISOString(),
        }));
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to stop Chrome browser",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop Chrome browser",
        variant: "destructive",
      });
    } finally {
      setChromeActionLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and control your Kleinanzeigen API system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchHealthData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Chrome Browser Control Section */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            Chrome Browser Control
          </CardTitle>
          <CardDescription>
            Start or stop the Chrome browser for web scraping operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email for login"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password (Optional)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password if needed"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  chromeStatus.isRunning ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <Activity
                  className={`h-5 w-5 ${
                    chromeStatus.isRunning ? "text-green-600" : "text-red-600"
                  }`}
                />
              </div>
              <div>
                <p className="font-medium">
                  Status: {chromeStatus.isRunning ? "Running" : "Stopped"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Port: {chromeStatus.port} | Last check:{" "}
                  {formatGermanDate(chromeStatus.lastCheck)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={startChrome}
                disabled={
                  chromeActionLoading || chromeStatus.isRunning || !email.trim()
                }
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Chrome
              </Button>
              <Button
                onClick={stopChrome}
                disabled={chromeActionLoading || !chromeStatus.isRunning}
                variant="destructive"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Chrome
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Status */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            API Health Status
          </CardTitle>
          <CardDescription>
            Current status of the Kleinanzeigen API and cookie system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Badge
                  variant={
                    healthData.status === "healthy" ? "default" : "destructive"
                  }
                  className="text-sm"
                >
                  {healthData.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Cookie Files
                </p>
                <p className="text-2xl font-bold">{healthData.totalFiles}</p>
                <div className="flex gap-2 text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {healthData.validFiles} valid
                  </span>
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {healthData.expiredFiles} expired
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Cookies
                </p>
                <p className="text-2xl font-bold">
                  {healthData.totalCookieCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Across all users
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Next Expiry
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatGermanDate(healthData.nextExpiry)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeDifference(healthData.nextExpiry)} remaining
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Validity Duration
                </p>
                <p className="text-sm font-medium">
                  {healthData.validityDuration}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </p>
                <p className="text-sm">
                  {formatGermanDate(healthData.timestamp)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {loading
                  ? "Loading health data..."
                  : "No health data available"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 hover:bg-blue-50 hover:border-blue-200"
            >
              <div className="text-center">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Auto-Refresh</p>
                <p className="text-xs text-muted-foreground">
                  Manage cookie refresh
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 hover:bg-green-50 hover:border-green-200"
            >
              <div className="text-center">
                <Activity className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Health Check</p>
                <p className="text-xs text-muted-foreground">Detailed status</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
