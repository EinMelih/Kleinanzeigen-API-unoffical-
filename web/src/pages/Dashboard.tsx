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
import { AppOverview, FeatureStatus } from "@/lib/app-types";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Database,
  FolderSearch,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

function formatDate(value: string | null): string {
  if (!value) {
    return "n/a";
  }

  return new Date(value).toLocaleString("de-DE");
}

function getStatusBadgeVariant(status: FeatureStatus) {
  switch (status) {
    case "live":
      return "default" as const;
    case "partial":
      return "secondary" as const;
    case "preview":
      return "outline" as const;
    case "planned":
      return "outline" as const;
  }
}

function getStatusLabel(status: FeatureStatus): string {
  switch (status) {
    case "live":
      return "Live";
    case "partial":
      return "Teilweise";
    case "preview":
      return "Vorschau";
    case "planned":
      return "Geplant";
  }
}

export default function Dashboard() {
  const [overview, setOverview] = useState<AppOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadOverview = async () => {
    try {
      setLoading(true);
      const nextOverview = await appClient.getOverview();
      setOverview(nextOverview);
    } catch (error) {
      toast({
        title: "Dashboard konnte nicht geladen werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  if (loading && !overview) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 rounded-lg bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!overview) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Kein Dashboard-Status verfuegbar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const liveCount = overview.features.filter((item) => item.status === "live").length;
  const partialCount = overview.features.filter((item) => item.status === "partial").length;
  const previewCount = overview.features.filter((item) => item.status === "preview").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Echte API-Zustände, sichtbarer Implementierungsstand und vorbereitete Settings fuer den naechsten Ausbau.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadOverview()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              API Zustand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.status === "success" ? "Online" : "Fehler"}
            </div>
            <p className="text-sm text-muted-foreground">
              Stand: {formatDate(overview.generatedAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Standard-Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {overview.account.email || "nicht gesetzt"}
            </div>
            <p className="text-sm text-muted-foreground">
              {overview.account.isLoggedIn
                ? `Cookie aktiv, ${overview.account.cookieCount} Cookies`
                : overview.account.configured
                ? "Noch kein gueltiger Login-Cookie erkannt"
                : "Noch kein Account konfiguriert"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-pink-500" />
              Search Speicher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.localSearches.folderCount}
            </div>
            <p className="text-sm text-muted-foreground">
              {overview.localSearches.articleFolders} lokale Artikelordner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-violet-500" />
              Persistenz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Local</div>
            <p className="text-sm text-muted-foreground">
              Ziel: {overview.database.target}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Was ist wirklich implementiert?</CardTitle>
            <CardDescription>
              Live, teilweise live, reine UI-Vorschau und geplante Bausteine auf einen Blick.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{liveCount} live</Badge>
              <Badge variant="secondary">{partialCount} teilweise</Badge>
              <Badge variant="outline">{previewCount} Vorschau</Badge>
              <Badge variant="outline">
                {overview.features.length - liveCount - partialCount - previewCount} geplant
              </Badge>
            </div>

            <div className="space-y-3">
              {overview.features.map((feature) => (
                <div
                  key={feature.key}
                  className="rounded-xl border border-border/60 bg-card/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{feature.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {feature.summary}
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(feature.status)}>
                      {getStatusLabel(feature.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>UI: {feature.page}</span>
                    {feature.endpoint && <span>API: {feature.endpoint}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Offene Punkte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {overview.warnings.map((warning) => (
                <div
                  key={warning}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3"
                >
                  {warning}
                </div>
              ))}
              {overview.platformGuard.blocked && overview.platformGuard.state && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm">
                  Plattform-Block aktiv bis {formatDate(overview.platformGuard.state.blockedUntil)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderSearch className="h-5 w-5 text-primary" />
                Account & Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Cookie-Datei:</span>{" "}
                {overview.account.cookieFileExists ? "vorhanden" : "fehlt"}
              </div>
              <div>
                <span className="font-medium">Letzte Validierung:</span>{" "}
                {formatDate(overview.account.lastValidated)}
              </div>
              <div>
                <span className="font-medium">Naechster Ablauf:</span>{" "}
                {formatDate(overview.account.nextExpiry)}
              </div>
              <div>
                <span className="font-medium">Gueltigkeit:</span>{" "}
                {overview.account.validityDuration}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Telegram & DB
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Telegram Token:</span>{" "}
                {overview.config.hasTelegramBotToken ? "gesetzt" : "fehlt"}
              </div>
              <div>
                <span className="font-medium">Telegram Chat ID:</span>{" "}
                {overview.config.hasTelegramChatId ? "gesetzt" : "fehlt"}
              </div>
              <div>
                <span className="font-medium">Plattform-Block:</span>{" "}
                {overview.platformGuard.blocked ? "aktiv" : "nein"}
              </div>
              <div>
                <span className="font-medium">Storage:</span>{" "}
                {overview.database.mode}
              </div>
              <div>
                <span className="font-medium">Schema:</span>{" "}
                {overview.database.schemaPath}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
