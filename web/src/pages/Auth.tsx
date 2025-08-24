import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  LogIn,
  RefreshCw,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";

interface LoginResponse {
  status: string;
  message: string;
  loggedIn: boolean;
  needsLogin: boolean;
  cookieFile?: string;
}

interface CheckLoginResponse {
  status: string;
  message: string;
  loggedIn: boolean;
  cookieCount: number;
  lastValidated: string;
  timestamp: string;
}

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

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<LoginResponse | null>(null);
  const [checkResult, setCheckResult] = useState<CheckLoginResponse | null>(
    null
  );
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoginResult(data);

      if (data.loggedIn) {
        toast({
          title: "Login Successful",
          description: data.message,
        });
      } else {
        toast({
          title: "Login Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login request failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckLogin = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/check-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setCheckResult(data);

      if (data.loggedIn) {
        toast({
          title: "Login Check",
          description: data.message,
        });
      } else {
        toast({
          title: "Login Check",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login check failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Authentication</h1>
        <p className="text-muted-foreground mt-1">
          Login to Kleinanzeigen and check authentication status
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Login Form */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-blue-600" />
              Login to Kleinanzeigen
            </CardTitle>
            <CardDescription>
              Enter your credentials to authenticate with the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email Address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login Check */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Check Login Status
            </CardTitle>
            <CardDescription>
              Verify if a user is currently logged in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="check-email">Email Address</Label>
              <Input
                id="check-email"
                type="email"
                placeholder="user@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCheckLogin}
              disabled={loading || !email.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {loading ? "Checking..." : "Check Status"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Display */}
      {loginResult && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Login Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={loginResult.loggedIn ? "default" : "destructive"}
                  className="text-sm"
                >
                  {loginResult.loggedIn ? "Logged In" : "Not Logged In"}
                </Badge>
                {loginResult.needsLogin && (
                  <Badge variant="outline" className="text-sm">
                    Password Required
                  </Badge>
                )}
              </div>
              <p className="text-sm">{loginResult.message}</p>
              {loginResult.cookieFile && (
                <p className="text-xs text-muted-foreground">
                  Cookie file: {loginResult.cookieFile}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {checkResult && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Login Check Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Badge
                  variant={checkResult.loggedIn ? "default" : "destructive"}
                  className="text-sm"
                >
                  {checkResult.loggedIn ? "Logged In" : "Not Logged In"}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Cookie Count
                </p>
                <p className="text-lg font-bold">{checkResult.cookieCount}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Last Validated
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatGermanDate(checkResult.lastValidated)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeDifference(checkResult.lastValidated)} ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">{checkResult.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Checked at: {formatGermanDate(checkResult.timestamp)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Panel */}
      <Card className="border-l-4 border-l-gray-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-gray-600" />
            How It Works
          </CardTitle>
          <CardDescription>
            Understanding the authentication process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600">Login Process</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Opens Chrome browser visibly</li>
                <li>• Navigates to Kleinanzeigen login page</li>
                <li>• Enters credentials automatically</li>
                <li>• Saves cookies for future use</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600">Cookie Validation</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Checks existing cookies first</li>
                <li>• Validates login status</li>
                <li>• Shows detailed cookie information</li>
                <li>• Handles expired cookies gracefully</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
