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
import { appClient } from "@/lib/app-client";
import { AppOverview } from "@/lib/app-types";
import {
  CheckCircle,
  Clock,
  LogIn,
  RefreshCw,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface LoginResponse {
  status: string;
  message: string;
  loggedIn?: boolean;
  needsLogin?: boolean;
  requiresEmailVerification?: boolean;
  verificationReason?: string;
  cookieFile?: string;
  error?: string;
}

interface CheckLoginResponse {
  status: string;
  message: string;
  loggedIn?: boolean;
  cookiesInFile?: number;
  lastValidated?: string;
  timestamp: string;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "n/a";
  }

  return new Date(value).toLocaleString("de-DE");
}

export default function Auth() {
  const [overview, setOverview] = useState<AppOverview | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<LoginResponse | null>(null);
  const [checkResult, setCheckResult] = useState<CheckLoginResponse | null>(null);
  const { toast } = useToast();

  const loadOverview = async () => {
    try {
      const nextOverview = await appClient.getOverview();
      setOverview(nextOverview);
      setEmail((current) => current || nextOverview.config.accountEmail);
      setPassword((current) => current || nextOverview.config.accountPassword);
    } catch (error) {
      toast({
        title: "Auth-Status konnte nicht geladen werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as LoginResponse;
      setLoginResult(data);

      toast({
        title:
          data.loggedIn || data.requiresEmailVerification
            ? "Login-Request gesendet"
            : "Login fehlgeschlagen",
        description: data.message,
        variant:
          data.loggedIn || data.requiresEmailVerification
            ? "default"
            : "destructive",
      });

      await loadOverview();
    } catch (error) {
      toast({
        title: "Login fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckLogin = async () => {
    if (!email.trim()) {
      toast({
        title: "Email fehlt",
        description: "Bitte gib zuerst eine Email-Adresse ein.",
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

      const data = (await response.json()) as CheckLoginResponse;
      setCheckResult(data);

      toast({
        title: data.loggedIn ? "Login aktiv" : "Login nicht aktiv",
        description: data.message,
        variant: data.loggedIn ? "default" : "destructive",
      });

      await loadOverview();
    } catch (error) {
      toast({
        title: "Login-Check fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Authentication</h1>
          <p className="text-muted-foreground">
            Login, Live-Check und Cookie-Status fuer den in den Settings hinterlegten Kleinanzeigen-Account.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadOverview()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Status neu laden
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Standard-Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">
              {overview?.account.email || "nicht gesetzt"}
            </div>
            <p className="text-sm text-muted-foreground">
              {overview?.config.hasAccountPassword
                ? "Passwort ist gespeichert"
                : "Kein Passwort gespeichert"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cookie-Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={overview?.account.isLoggedIn ? "default" : "outline"}>
              {overview?.account.isLoggedIn ? "Cookie aktiv" : "Kein aktiver Cookie"}
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              {overview?.account.cookieCount ?? 0} Cookies • {overview?.account.validityDuration ?? "n/a"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Letzte Validierung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">
              {formatDate(overview?.account.lastValidated)}
            </div>
            <p className="text-sm text-muted-foreground">
              Nächster Ablauf: {formatDate(overview?.account.nextExpiry)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Login starten
            </CardTitle>
            <CardDescription>
              Startet die vorhandene Browser-Automation und speichert neue Cookies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Passwort</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Login ausfuehren
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Live Login-Check
            </CardTitle>
            <CardDescription>
              Prueft mit den gespeicherten Cookies direkt gegen Kleinanzeigen, ob der Account wirklich eingeloggt ist.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="check-email">Email</Label>
              <Input
                id="check-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button onClick={handleCheckLogin} disabled={loading || !email.trim()}>
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Jetzt pruefen
            </Button>
            <p className="text-sm text-muted-foreground">
              Das ist der aussagekraeftigste Check, weil dafuer eine echte Browser-Session verwendet wird.
            </p>
          </CardContent>
        </Card>
      </div>

      {loginResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Letztes Login-Ergebnis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Badge
              variant={
                loginResult.loggedIn || loginResult.requiresEmailVerification
                  ? "default"
                  : "destructive"
              }
            >
              {loginResult.status}
            </Badge>
            <div>{loginResult.message}</div>
            {loginResult.verificationReason && (
              <div>
                <span className="font-medium">Verifikationsgrund:</span>{" "}
                {loginResult.verificationReason}
              </div>
            )}
            {loginResult.cookieFile && (
              <div>
                <span className="font-medium">Cookie-Datei:</span>{" "}
                {loginResult.cookieFile}
              </div>
            )}
            {loginResult.error && (
              <div>
                <span className="font-medium">Fehler:</span> {loginResult.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {checkResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Letzter Live-Check
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <div className="font-medium">Status</div>
              <Badge variant={checkResult.loggedIn ? "default" : "destructive"}>
                {checkResult.loggedIn ? "eingeloggt" : "nicht eingeloggt"}
              </Badge>
            </div>
            <div>
              <div className="font-medium">Cookies in Datei</div>
              <div>{checkResult.cookiesInFile ?? 0}</div>
            </div>
            <div>
              <div className="font-medium">Geprueft um</div>
              <div>{formatDate(checkResult.timestamp)}</div>
            </div>
            {checkResult.lastValidated && (
              <div className="md:col-span-3 text-muted-foreground">
                Letzte Backend-Validierung: {formatDate(checkResult.lastValidated)}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
