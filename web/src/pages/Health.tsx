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
import { appClient } from "@/lib/app-client";
import {
  AppOverview,
  HealthResponse,
  MessageHealthResponse,
  SessionProfileState,
} from "@/lib/app-types";
import { Activity, Database, RefreshCw, ShieldCheck, Terminal } from "lucide-react";
import { useEffect, useState } from "react";

function formatDate(value?: string | null): string {
  if (!value) {
    return "n/a";
  }

  return new Date(value).toLocaleString("de-DE");
}

function getSessionLabel(state?: SessionProfileState): string {
  switch (state) {
    case "authenticated":
      return "Session aktiv";
    case "pending_manual_login":
      return "Wartet auf Login";
    case "needs_reauth":
      return "Re-Login noetig";
    case "blocked":
      return "Blockiert";
    case "error":
      return "Fehler";
    default:
      return "Nicht gestartet";
  }
}

function getSessionVariant(state?: SessionProfileState) {
  switch (state) {
    case "authenticated":
      return "default" as const;
    case "blocked":
    case "error":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default function Health() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [messageHealth, setMessageHealth] = useState<MessageHealthResponse | null>(
    null
  );
  const [overview, setOverview] = useState<AppOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadHealth = async () => {
    try {
      setLoading(true);
      const [nextHealth, nextMessageHealth, nextOverview] = await Promise.all([
        appClient.getHealth(),
        appClient.getMessageHealth(),
        appClient.getOverview(),
      ]);

      setHealth(nextHealth);
      setMessageHealth(nextMessageHealth);
      setOverview(nextOverview);
    } catch (error) {
      toast({
        title: "Health konnte nicht geladen werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health</h1>
          <p className="text-muted-foreground">
            Live-Zustand von API, Message-Service, Cookie-Statistiken und aktuellem Storage-Modus.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadHealth()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">API</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={health?.ok ? "default" : "destructive"}>
              {health?.ok ? "OK" : "Fehler"}
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              {health?.message ?? "Kein Status"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Modus: {health?.runtime.manualModeOnly ? "Manual only" : "Automation aktiv"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chrome Automation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.account.debugPort ?? health?.chrome.port ?? 9222}
            </div>
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              {health?.account.chromeRunning
                ? "Profil-Chrome offen"
                : health?.chrome.status ?? "unbekannt"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Message Service</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={messageHealth?.status === "ok" ? "default" : "destructive"}>
              {messageHealth?.status ?? "unbekannt"}
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              {messageHealth?.service ?? "message"} • {formatDate(messageHealth?.timestamp)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Session</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getSessionVariant(health?.account.sessionState)}>
              {getSessionLabel(health?.account.sessionState)}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {health?.platformGuard.blocked && health?.platformGuard.state
                ? `Blockiert bis ${formatDate(health.platformGuard.state.blockedUntil)}`
                : `Letzte Verifikation: ${formatDate(health?.account.lastVerifiedAt)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Cookie und Laufzeitdaten
            </CardTitle>
            <CardDescription>
              Dieselben Werte, die auch vom Dashboard genutzt werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Cookie-Dateien:</span>{" "}
                {health?.cookies.totalFiles ?? 0}
              </div>
              <div>
                <span className="font-medium">Gueltige Dateien:</span>{" "}
                {health?.cookies.validFiles ?? 0}
              </div>
              <div>
                <span className="font-medium">Abgelaufene Dateien:</span>{" "}
                {health?.cookies.expiredFiles ?? 0}
              </div>
              <div>
                <span className="font-medium">Gesamtanzahl Cookies:</span>{" "}
                {health?.cookies.totalCookieCount ?? 0}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Naechster Ablauf:</span>{" "}
                {formatDate(health?.cookies.nextExpiry)}
              </div>
              <div>
                <span className="font-medium">Gueltigkeitsdauer:</span>{" "}
                {health?.cookies.validityDuration ?? "n/a"}
              </div>
              <div>
                <span className="font-medium">Health Timestamp:</span>{" "}
                {formatDate(health?.timestamp)}
              </div>
              <div>
                <span className="font-medium">Account Login:</span>{" "}
                {health?.account.isLoggedIn ? "erkannt" : "nicht erkannt"}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Session-Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Account:</span>{" "}
                {health?.account.email || "nicht gesetzt"}
              </div>
              <div>
                <span className="font-medium">Session-Zustand:</span>{" "}
                {getSessionLabel(health?.account.sessionState)}
              </div>
              <div>
                <span className="font-medium">Profil-Chrome:</span>{" "}
                {health?.account.chromeRunning ? "offen" : "zu"}
              </div>
              <div>
                <span className="font-medium">Letzter Login:</span>{" "}
                {formatDate(health?.account.lastSuccessfulLoginAt)}
              </div>
              {health?.account.lastError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
                  {health.account.lastError}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Konfiguration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Account:</span>{" "}
                {overview?.account.email || "nicht gesetzt"}
              </div>
              <div>
                <span className="font-medium">.env:</span>{" "}
                {overview?.config.envFilePresent ? "vorhanden" : "fehlt"}
              </div>
              <div>
                <span className="font-medium">Config-Datei:</span>{" "}
                {overview?.config.configPath ?? "n/a"}
              </div>
              <div>
                <span className="font-medium">Schema:</span>{" "}
                {overview?.database.schemaPath ?? "n/a"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Plattform-Guard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Block aktiv:</span>{" "}
                {health?.platformGuard.blocked ? "ja" : "nein"}
              </div>
              <div>
                <span className="font-medium">Quelle:</span>{" "}
                {health?.platformGuard.state?.source ?? "n/a"}
              </div>
              <div>
                <span className="font-medium">Bis:</span>{" "}
                {formatDate(health?.platformGuard.state?.blockedUntil)}
              </div>
              <div>
                <span className="font-medium">Ref:</span>{" "}
                {health?.platformGuard.state?.refCode ?? "n/a"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Relevante Endpunkte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>`GET /health`</div>
              <div>`GET /app/overview`</div>
              <div>`GET /cookies/stats`</div>
              <div>`POST /auth/check-login`</div>
              <div>`POST /app/telegram/test`</div>
            </CardContent>
          </Card>

          {overview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Hinweise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {overview.warnings.map((warning) => (
                  <div key={warning} className="rounded-lg bg-muted px-3 py-2">
                    {warning}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
