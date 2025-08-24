import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Cookie,
  FileText,
  LogIn,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Square,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface CookieUser {
  email: string;
  cookieCount: number;
  lastValidated: string;
  isValid: boolean;
}

interface CookieStats {
  totalFiles: number;
  validFiles: number;
  expiredFiles: number;
  totalCookieCount: number;
  nextExpiry: string;
  validityDuration: string;
}

interface CookieDetails {
  email: string;
  cookieCount: number;
  expiresAt: string;
  lastValidated: string;
  isValid: boolean;
  needsRefresh: boolean;
}

interface AutoRefreshStatus {
  isRunning: boolean;
  interval: number;
  lastRefresh: string;
}

export default function Cookies() {
  const [selectedEmail, setSelectedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cookieUsers, setCookieUsers] = useState<CookieUser[]>([]);
  const [cookieStats, setCookieStats] = useState<CookieStats | null>(null);
  const [selectedCookieDetails, setSelectedCookieDetails] =
    useState<CookieDetails | null>(null);
  const [autoRefreshStatus, setAutoRefreshStatus] = useState<AutoRefreshStatus>(
    {
      isRunning: false,
      interval: 0.25,
      lastRefresh: new Date().toISOString(),
    }
  );
  const { toast } = useToast();

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

  // Fetch all available cookie users
  const fetchCookieUsers = async () => {
    try {
      const response = await fetch("/api/cookies/status");
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.cookies) {
          const users = data.cookies.map((cookie: any) => ({
            email: cookie.email || "Unknown",
            cookieCount: cookie.cookieCount || 0,
            lastValidated: cookie.lastValidated || new Date().toISOString(),
            isValid: cookie.isValid || false,
          }));
          setCookieUsers(users);
        }
      }
    } catch (error) {
      console.log("Could not fetch cookie users");
    }
  };

  // Fetch cookie statistics
  const fetchCookieStats = async () => {
    try {
      const response = await fetch("/api/cookies/stats");
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.stats) {
          setCookieStats(data.stats);
        }
      }
    } catch (error) {
      console.log("Could not fetch cookie stats");
    }
  };

  // Fetch detailed cookie information for selected user
  const fetchCookieDetails = async (email: string) => {
    if (!email) return;

    try {
      const response = await fetch(`/api/cookies/details/${email}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.result) {
          setSelectedCookieDetails({
            email,
            cookieCount: data.result.cookieCount || 0,
            expiresAt: data.result.expiresAt || new Date().toISOString(),
            lastValidated:
              data.result.lastValidated || new Date().toISOString(),
            isValid: data.result.isValid || false,
            needsRefresh: data.result.needsRefresh || false,
          });
        }
      }
    } catch (error) {
      console.log("Could not fetch cookie details");
    }
  };

  // Handle email selection change
  const handleEmailChange = (email: string) => {
    setSelectedEmail(email);
    if (email) {
      fetchCookieDetails(email);
    } else {
      setSelectedCookieDetails(null);
    }
  };

  // Login via cookie (without password)
  const handleLoginViaCookie = async () => {
    if (!selectedEmail) {
      toast({
        title: "Error",
        description: "Please select an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/cookies/test/" + selectedEmail, {
        method: "POST",
      });
      const data = await response.json();

      if (data.status === "success") {
        toast({
          title: "Login via Cookie Successful",
          description: "Successfully logged in using stored cookies",
        });
        // Refresh data after successful login
        fetchCookieUsers();
        fetchCookieStats();
        fetchCookieDetails(selectedEmail);
      } else {
        toast({
          title: "Login via Cookie Failed",
          description: data.message || "Could not login with cookies",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login via cookie failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Test cookies for selected user
  const handleTestCookies = async () => {
    if (!selectedEmail) {
      toast({
        title: "Error",
        description: "Please select an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/cookies/test/${selectedEmail}`, {
        method: "POST",
      });
      const data = await response.json();

      toast({
        title: "Cookie Test Completed",
        description: data.message,
        variant: data.status === "success" ? "default" : "destructive",
      });

      // Refresh details after test
      fetchCookieDetails(selectedEmail);
    } catch (error) {
      toast({
        title: "Error",
        description: "Cookie test failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cleanup expired cookies
  const handleCleanup = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cookies/cleanup", {
        method: "POST",
      });
      const data = await response.json();

      toast({
        title: "Cleanup Completed",
        description: data.message,
      });

      // Refresh data after cleanup
      fetchCookieUsers();
      fetchCookieStats();
      if (selectedEmail) {
        fetchCookieDetails(selectedEmail);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Cleanup failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Start auto-refresh
  const handleStartAutoRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cookies/auto-refresh/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: autoRefreshStatus.interval }),
      });
      const data = await response.json();

      if (data.status === "success") {
        setAutoRefreshStatus((prev) => ({
          ...prev,
          isRunning: true,
          lastRefresh: new Date().toISOString(),
        }));
        toast({
          title: "Auto-Refresh Started",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to start auto-refresh",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start auto-refresh",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Stop auto-refresh
  const handleStopAutoRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cookies/auto-refresh/stop", {
        method: "POST",
      });
      const data = await response.json();

      if (data.status === "success") {
        setAutoRefreshStatus((prev) => ({
          ...prev,
          isRunning: false,
        }));
        toast({
          title: "Auto-Refresh Stopped",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to stop auto-refresh",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not stop auto-refresh",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh cookies for selected user
  const handleRefreshCookies = async () => {
    if (!selectedEmail) {
      toast({
        title: "Error",
        description: "Please select an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/cookies/refresh/${selectedEmail}`, {
        method: "POST",
      });
      const data = await response.json();

      toast({
        title: "Cookie Refresh Completed",
        description: data.message || "Cookies refreshed successfully",
      });

      // Refresh data after refresh
      fetchCookieUsers();
      fetchCookieStats();
      fetchCookieDetails(selectedEmail);
    } catch (error) {
      toast({
        title: "Error",
        description: "Cookie refresh failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check auto-refresh status on component mount
  useEffect(() => {
    fetchCookieUsers();
    fetchCookieStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cookie Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage, test, and refresh your cookie system
        </p>
      </div>

      {/* Cookie Statistics Overview */}
      {cookieStats && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Cookie System Overview
            </CardTitle>
            <CardDescription>
              Current status of all cookies in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Cookie Files
                </p>
                <p className="text-2xl font-bold">{cookieStats.totalFiles}</p>
                <div className="flex gap-2 text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {cookieStats.validFiles} valid
                  </span>
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {cookieStats.expiredFiles} expired
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Cookies
                </p>
                <p className="text-2xl font-bold">
                  {cookieStats.totalCookieCount}
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
                      {formatGermanDate(cookieStats.nextExpiry)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeDifference(cookieStats.nextExpiry)} remaining
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Selection and Cookie Login */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Login via Cookie
          </CardTitle>
          <CardDescription>
            Select a user and login using their stored cookies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-select">Select User</Label>
            <select
              id="email-select"
              value={selectedEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">-- Select an email address --</option>
              {cookieUsers.map((user) => (
                <option key={user.email} value={user.email}>
                  {user.email} ({user.cookieCount} cookies,{" "}
                  {user.isValid ? "Valid" : "Invalid"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleLoginViaCookie}
              disabled={loading || !selectedEmail}
              className="bg-green-600 hover:bg-green-700"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? "Logging in..." : "Login via Cookie"}
            </Button>

            <Button
              onClick={handleTestCookies}
              disabled={loading || !selectedEmail}
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Cookies
            </Button>

            <Button
              onClick={handleRefreshCookies}
              disabled={loading || !selectedEmail}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Cookies
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected User Cookie Details */}
      {selectedCookieDetails && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-purple-600" />
              Cookie Details for {selectedCookieDetails.email}
            </CardTitle>
            <CardDescription>
              Detailed information about the selected user's cookies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Cookie Count
                  </p>
                  <p className="text-2xl font-bold">
                    {selectedCookieDetails.cookieCount}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedCookieDetails.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span
                      className={
                        selectedCookieDetails.isValid
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {selectedCookieDetails.isValid ? "Valid" : "Invalid"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Refresh Needed
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedCookieDetails.needsRefresh ? (
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <span
                      className={
                        selectedCookieDetails.needsRefresh
                          ? "text-orange-600"
                          : "text-green-600"
                      }
                    >
                      {selectedCookieDetails.needsRefresh ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Expires At
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {formatGermanDate(selectedCookieDetails.expiresAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeDifference(selectedCookieDetails.expiresAt)}{" "}
                        remaining
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Validated
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {formatGermanDate(selectedCookieDetails.lastValidated)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeDifference(
                          selectedCookieDetails.lastValidated
                        )}{" "}
                        ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cookie Cleanup */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-orange-600" />
            Cleanup Expired Cookies
          </CardTitle>
          <CardDescription>
            Remove expired cookies to free up storage space
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleCleanup}
            disabled={loading}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {loading ? "Cleaning..." : "Cleanup Expired Cookies"}
          </Button>
        </CardContent>
      </Card>

      {/* Auto-Refresh Control */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Auto-Refresh System
          </CardTitle>
          <CardDescription>
            Automatically refresh cookies to maintain login status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  autoRefreshStatus.isRunning ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <RefreshCw
                  className={`h-5 w-5 ${
                    autoRefreshStatus.isRunning
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                />
              </div>
              <div>
                <p className="font-medium">
                  Status: {autoRefreshStatus.isRunning ? "Running" : "Stopped"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Interval: {autoRefreshStatus.interval} hours
                  {autoRefreshStatus.isRunning && (
                    <span className="ml-2">
                      | Last refresh:{" "}
                      {formatGermanDate(autoRefreshStatus.lastRefresh)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleStartAutoRefresh}
                disabled={loading || autoRefreshStatus.isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Auto-Refresh
              </Button>
              <Button
                onClick={handleStopAutoRefresh}
                disabled={loading || !autoRefreshStatus.isRunning}
                variant="destructive"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Auto-Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Panel */}
      <Card className="border-l-4 border-l-gray-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            How Cookie Login Works
          </CardTitle>
          <CardDescription>
            Understanding the cookie-based authentication system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600">
                Cookie Login Process
              </h4>
              <p className="text-muted-foreground">
                When you select a user and click "Login via Cookie", the system
                uses stored cookies to authenticate without requiring a
                password.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600">Cookie Validation</h4>
              <p className="text-muted-foreground">
                Cookies are tested by attempting to access protected pages and
                checking for login indicators like the #user-email element.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
