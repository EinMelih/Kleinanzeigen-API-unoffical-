import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { appClient } from "@/lib/app-client";
import { ProfileResponse } from "@/lib/app-types";
import {
  Database,
  RefreshCw,
  Save,
  Search,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

function formatDate(value?: string): string {
  if (!value) {
    return "n/a";
  }

  return new Date(value).toLocaleString("de-DE");
}

export default function Profile() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await appClient.getProfile();
      setData(response);
      setDisplayName(response.profile.displayName);
      setSummary(response.profile.summary);
    } catch (error) {
      toast({
        title: "Profil konnte nicht geladen werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await appClient.updateProfile({ displayName, summary });
      await loadProfile();
      toast({
        title: "Profil gespeichert",
        description: "Lokale Profilwerte wurden aktualisiert.",
      });
    } catch (error) {
      toast({
        title: "Profil konnte nicht gespeichert werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await appClient.syncProfile(data?.profile.email || undefined);
      await loadProfile();
      toast({
        title: "Profil synchronisiert",
        description: "Die Plattformdaten wurden aus dem eingeloggten Profil aktualisiert.",
      });
    } catch (error) {
      toast({
        title: "Profil-Sync fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
          <p className="text-muted-foreground">
            Lokaler App-Status plus optionaler Sync gegen dein echtes Kleinanzeigen-Profil.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadProfile()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Neu laden
          </Button>
          <Button onClick={() => void handleSync()} disabled={syncing}>
            {syncing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            Plattform syncen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-lg font-semibold">{data?.profile.email || "n/a"}</div>
            <div className="text-sm text-muted-foreground">Account</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{data?.profile.trackedItemCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Tracked Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{data?.profile.conversationCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Konversationen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{data?.profile.savedSearchCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Gespeicherte Suchen</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              App-Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">Display Name</div>
                <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Account-Typ</div>
                <div className="rounded-lg border px-3 py-2 text-sm">
                  {data?.profile.accountType || "unknown"}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Zusammenfassung</div>
              <Textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                className="min-h-[140px]"
              />
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <Badge variant="outline">
                Aktiv seit {data?.profile.memberSince || "n/a"}
              </Badge>
              <Badge variant="outline">
                Anzeigen online {data?.profile.activeAds ?? 0}
              </Badge>
              <Badge variant="outline">
                Letzter Sync {formatDate(data?.profile.lastSyncedAt)}
              </Badge>
            </div>
            <Button onClick={() => void handleSave()} disabled={saving}>
              <Save className={`mr-2 h-4 w-4 ${saving ? "animate-pulse" : ""}`} />
              Lokales Profil speichern
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Lokaler Store
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">State-Datei:</span>{" "}
              {data?.statePath || "wird geladen..."}
            </div>
            <div>
              <span className="font-medium">Ungelesene Notifications:</span>{" "}
              {data?.profile.unreadNotificationCount ?? 0}
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-muted-foreground">
              Diese Seite nutzt jetzt dieselbe lokale JSON-Persistenz wie Items, Messages und Radar.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Gespeicherte Suchen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                Lade Suchlaeufe...
              </div>
            ) : data?.savedSearches.length ? (
              data.savedSearches.map((search) => (
                <div key={search.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{search.title}</div>
                    <Badge variant={search.notificationsEnabled ? "default" : "outline"}>
                      {search.notificationsEnabled ? "Notify an" : "Notify aus"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Query: {search.query}
                    {search.location ? ` • Ort: ${search.location}` : ""}
                    {search.lastMatchCount !== undefined
                      ? ` • letzte Treffer: ${search.lastMatchCount}`
                      : ""}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Letzter Lauf: {formatDate(search.lastRunAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                Noch keine gespeicherten Suchen gefunden.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                Lade Items...
              </div>
            ) : data?.recentItems.length ? (
              data.recentItems.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="line-clamp-1 font-medium">{item.title}</div>
                    <Badge variant="outline">{item.source}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {item.price} • {item.location}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Zuletzt gesehen: {formatDate(item.lastSeenAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                Noch keine Items im lokalen Store.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
