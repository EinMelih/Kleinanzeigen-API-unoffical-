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
  manualLoginRequired?: boolean;
  requiresEmailVerification?: boolean;
  verificationReason?: string;
  cookieFile?: string;
  debugPort?: number;
  profileDir?: string;
  sessionMode?: string;
  error?: string;
}

interface SessionProfileStatus {
  email: string;
  profileDir: string;
  debugPort: number;
  cookiePath: string;
  profileExists: boolean;
  cookieFileExists: boolean;
  chromeRunning: boolean;
  state:
    | "not_started"
    | "pending_manual_login"
    | "authenticated"
    | "needs_reauth"
    | "blocked"
    | "error";
  wsEndpoint?: string;
  createdAt?: string;
  updatedAt?: string;
  lastManualLoginStartedAt?: string;
  lastVerifiedAt?: string;
  lastSuccessfulLoginAt?: string;
  lastError?: string;
}

interface CheckLoginResponse {
  status: string;
  message: string;
  loggedIn?: boolean;
  cookiesInFile?: number;
  lastValidated?: string;
  profile?: SessionProfileStatus;
  error?: string;
  timestamp: string;
}

interface ManualLoginResponse {
  status: string;
  message: string;
  email: string;
  loginUrl?: string;
  alreadyRunning?: boolean;
  loggedIn?: boolean;
  cookiesInFile?: number;
  profile?: SessionProfileStatus;
  error?: string;
  timestamp: string;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "n/a";
  }

  return new Date(value).toLocaleString("de-DE");
}

function getSessionStateLabel(
  state?: SessionProfileStatus["state"]
): string {
  switch (state) {
    case "authenticated":
      return "Session aktiv";
    case "pending_manual_login":
      return "Wartet auf Login";
    case "needs_reauth":
      return "Re-Login noetig";
    case "blocked":
      return "Plattform blockiert";
    case "error":
      return "Fehler";
    default:
      return "Kein Profil";
  }
}

export default function Auth() {
  const [overview, setOverview] = useState<AppOverview | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<LoginResponse | null>(null);
  const [checkResult, setCheckResult] = useState<CheckLoginResponse | null>(null);
  const [manualResult, setManualResult] = useState<ManualLoginResponse | null>(null);
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

  const handleStartManualLogin = async () => {
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
      const response = await fetch("/api/auth/manual-login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as ManualLoginResponse;
      setManualResult(data);

      toast({
        title: response.ok ? "Manueller Login gestartet" : "Start fehlgeschlagen",
        description: data.message,
        variant: response.ok ? "default" : "destructive",
      });

      await loadOverview();
    } catch (error) {
      toast({
        title: "Manueller Login fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteManualLogin = async () => {
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
      const response = await fetch("/api/auth/manual-login/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as ManualLoginResponse;
      setManualResult(data);

      toast({
        title: response.ok ? "Session verifiziert" : "Session noch nicht aktiv",
        description: data.message,
        variant: response.ok ? "default" : "destructive",
      });

      await loadOverview();
    } catch (error) {
      toast({
        title: "Session-Check fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sessionProfile =
    overview?.account.sessionProfile ?? manualResult?.profile ?? null;

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

      {overview?.platformGuard.blocked && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plattform-Sperre aktiv</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Kleinanzeigen meldet aktuell eine Sperre fuer diesen IP-Bereich. Manueller
            oder automatischer Login wird erst nach Ablauf des Cooldowns wieder sinnvoll.
            Blockiert bis: {formatDate(overview.platformGuard.state?.blockedUntil)}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <CardTitle className="text-base">Profil-Session</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                sessionProfile?.state === "authenticated"
                  ? "default"
                  : sessionProfile?.state === "blocked" ||
                    sessionProfile?.state === "error"
                  ? "destructive"
                  : "outline"
              }
            >
              {getSessionStateLabel(sessionProfile?.state)}
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              Port {sessionProfile?.debugPort ?? "n/a"} •{" "}
              {sessionProfile?.chromeRunning ? "Chrome offen" : "Chrome zu"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Letzte Validierung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">
              {formatDate(
                sessionProfile?.lastVerifiedAt || overview?.account.lastValidated
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Letzter Login:{" "}
              {formatDate(sessionProfile?.lastSuccessfulLoginAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Automatischer Login
            </CardTitle>
            <CardDescription>
              Nutzt Passwort + persistentes Browser-Profil. Wenn bereits eine gueltige
              Session existiert, wird sie direkt wiederverwendet.
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
              <Shield className="h-5 w-5 text-primary" />
              Manueller Profil-Login
            </CardTitle>
            <CardDescription>
              Oeffnet Chrome mit persistentem Profil. Du loggst dich einmal manuell ein,
              danach kann die Session wiederverwendet und als Cookie-Datei exportiert
              werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-email">Email</Label>
              <Input
                id="manual-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={handleStartManualLogin}
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Browser oeffnen
              </Button>
              <Button
                onClick={handleCompleteManualLogin}
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Session verifizieren
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Profilpfad: {sessionProfile?.profileDir || "noch nicht erstellt"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Live Login-Check
            </CardTitle>
            <CardDescription>
              Prueft bevorzugt das persistente Profil und faellt sonst auf die
              exportierten Cookies zurueck.
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
            {loginResult.profileDir && (
              <div>
                <span className="font-medium">Profil:</span>{" "}
                {loginResult.profileDir}
              </div>
            )}
            {loginResult.debugPort && (
              <div>
                <span className="font-medium">Debug-Port:</span>{" "}
                {loginResult.debugPort}
              </div>
            )}
            {loginResult.sessionMode && (
              <div>
                <span className="font-medium">Session-Modus:</span>{" "}
                {loginResult.sessionMode}
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

      {manualResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Manueller Login-Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Badge
              variant={
                manualResult.loggedIn ||
                manualResult.status === "manual_login_started"
                  ? "default"
                  : "destructive"
              }
            >
              {manualResult.status}
            </Badge>
            <div>{manualResult.message}</div>
            {manualResult.loginUrl && (
              <div>
                <span className="font-medium">Login-URL:</span>{" "}
                {manualResult.loginUrl}
              </div>
            )}
            {manualResult.profile?.profileDir && (
              <div>
                <span className="font-medium">Profil:</span>{" "}
                {manualResult.profile.profileDir}
              </div>
            )}
            {manualResult.profile?.debugPort && (
              <div>
                <span className="font-medium">Port:</span>{" "}
                {manualResult.profile.debugPort}
              </div>
            )}
            {manualResult.error && (
              <div>
                <span className="font-medium">Fehler:</span>{" "}
                {manualResult.error}
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
            {checkResult.profile?.profileDir && (
              <div className="md:col-span-3 text-muted-foreground">
                Profil: {checkResult.profile.profileDir} • Port{" "}
                {checkResult.profile.debugPort} •{" "}
                {getSessionStateLabel(checkResult.profile.state)}
              </div>
            )}
            {checkResult.error && (
              <div className="md:col-span-3 text-destructive">
                {checkResult.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
