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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { appClient } from "@/lib/app-client";
import {
  AppConfigSummary,
  AppConfigUpdatePayload,
  TelegramTestResponse,
} from "@/lib/app-types";
import {
  BellRing,
  Database,
  RefreshCw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

const EMPTY_FORM: AppConfigUpdatePayload = {
  accountEmail: "",
  accountPassword: "",
  telegramBotToken: "",
  telegramChatId: "",
  telegramNotificationsEnabled: false,
  notifyOnSuccessfulLogin: true,
  notifyOnSearchRuns: true,
};

export default function Settings() {
  const [config, setConfig] = useState<AppConfigSummary | null>(null);
  const [form, setForm] = useState<AppConfigUpdatePayload>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [lastTelegramResult, setLastTelegramResult] =
    useState<TelegramTestResponse | null>(null);
  const { toast } = useToast();

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await appClient.getConfig();
      setConfig(response.config);
      setForm({
        accountEmail: response.config.accountEmail,
        accountPassword: response.config.accountPassword,
        telegramBotToken: response.config.telegramBotToken,
        telegramChatId: response.config.telegramChatId,
        telegramNotificationsEnabled:
          response.config.telegramNotificationsEnabled,
        notifyOnSuccessfulLogin: response.config.notifyOnSuccessfulLogin,
        notifyOnSearchRuns: response.config.notifyOnSearchRuns,
      });
    } catch (error) {
      toast({
        title: "Settings konnten nicht geladen werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, []);

  const updateField = <K extends keyof AppConfigUpdatePayload>(
    key: K,
    value: AppConfigUpdatePayload[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await appClient.updateConfig(form);
      setConfig(response.config);
      toast({
        title: "Settings gespeichert",
        description: "Lokale Konfiguration wurde aktualisiert.",
      });
    } catch (error) {
      toast({
        title: "Speichern fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTelegramTest = async () => {
    try {
      setTesting(true);
      const result = await appClient.sendTelegramTest(testMessage);
      setLastTelegramResult(result);
      toast({
        title: result.success ? "Telegram Test gesendet" : "Telegram Test fehlgeschlagen",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      setLastTelegramResult({
        success: false,
        message: "Telegram Test fehlgeschlagen",
        error: message,
        timestamp: new Date().toISOString(),
      });
      toast({
        title: "Telegram Test fehlgeschlagen",
        description: message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Standard-Account, Telegram und lokale Persistenz fuer den aktuellen Stand der App.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadConfig()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Neu laden
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Kleinanzeigen Account
            </CardTitle>
            <CardDescription>
              Dieser Account wird im Dashboard und in den Live-Checks als Standard verwendet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountEmail">Email</Label>
              <Input
                id="accountEmail"
                type="email"
                value={form.accountEmail}
                onChange={(event) => updateField("accountEmail", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountPassword">Passwort</Label>
              <Input
                id="accountPassword"
                type="password"
                value={form.accountPassword}
                onChange={(event) =>
                  updateField("accountPassword", event.target.value)
                }
              />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.notifyOnSuccessfulLogin}
                onChange={(event) =>
                  updateField("notifyOnSuccessfulLogin", event.target.checked)
                }
              />
              Bei erfolgreichen Logins spaeter Telegram-Benachrichtigung senden
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Telegram Benachrichtigungen
            </CardTitle>
            <CardDescription>
              Token ist eingetragen. Fuer einen echten Test fehlt aktuell noch die Chat-ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegramToken">Bot Token</Label>
              <Input
                id="telegramToken"
                value={form.telegramBotToken}
                onChange={(event) =>
                  updateField("telegramBotToken", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegramChatId">Chat ID</Label>
              <Input
                id="telegramChatId"
                value={form.telegramChatId}
                onChange={(event) =>
                  updateField("telegramChatId", event.target.value)
                }
                placeholder="z.B. 123456789"
              />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.telegramNotificationsEnabled}
                onChange={(event) =>
                  updateField(
                    "telegramNotificationsEnabled",
                    event.target.checked
                  )
                }
              />
              Telegram als Benachrichtigungskanal aktivieren
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.notifyOnSearchRuns}
                onChange={(event) =>
                  updateField("notifyOnSearchRuns", event.target.checked)
                }
              />
              Spaeter Suchlaeufe und Treffer an Telegram senden
            </label>
            <div className="space-y-2">
              <Label htmlFor="testMessage">Testnachricht</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(event) => setTestMessage(event.target.value)}
                placeholder="Optional eigene Testnachricht"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => void handleTelegramTest()}
              disabled={testing}
            >
              <Send className={`mr-2 h-4 w-4 ${testing ? "animate-pulse" : ""}`} />
              Telegram Test senden
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Lokale Speicherung
          </CardTitle>
          <CardDescription>
            Bis Supabase angebunden ist, werden die Einstellungen lokal gespeichert.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Config-Datei:</span>{" "}
              {config?.configPath ?? "wird geladen..."}
            </div>
            <div>
              <span className="font-medium">.env vorhanden:</span>{" "}
              {config?.envFilePresent ? "Ja" : "Nein"}
            </div>
            <div>
              <span className="font-medium">OAuth Microsoft:</span>{" "}
              {config?.oauth.microsoftConfigured ? "Ja" : "Nein"}
            </div>
            <div>
              <span className="font-medium">OAuth Gmail:</span>{" "}
              {config?.oauth.gmailConfigured ? "Ja" : "Nein"}
            </div>
            <div>
              <span className="font-medium">AI Provider:</span>{" "}
              {config?.ai.provider ?? "n/a"}
            </div>
            <div>
              <span className="font-medium">AI konfiguriert:</span>{" "}
              {config?.ai.configured ? "Ja" : "Nein"}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="font-medium">Geplante Supabase Tabellen</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>`accounts` fuer Login-Profile und Cookie-Metadaten</li>
              <li>`notification_channels` fuer Telegram und spaetere Kanaele</li>
              <li>`saved_searches`, `search_runs`, `scraped_items` fuer Suchhistorie</li>
              <li>`notification_events` fuer Bot-Notifies und Auditing</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {lastTelegramResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Letzter Telegram Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Status:</span>{" "}
              {lastTelegramResult.success ? "Erfolgreich" : "Fehlgeschlagen"}
            </div>
            <div>
              <span className="font-medium">Meldung:</span>{" "}
              {lastTelegramResult.message}
            </div>
            {lastTelegramResult.error && (
              <div>
                <span className="font-medium">Fehler:</span>{" "}
                {lastTelegramResult.error}
              </div>
            )}
            <div>
              <span className="font-medium">Zeit:</span>{" "}
              {new Date(lastTelegramResult.timestamp).toLocaleString("de-DE")}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Nächster Schritt Richtung DB
          </CardTitle>
          <CardDescription>
            Die App laeuft jetzt lokal. Fuer Supabase ist das Schema bereits vorbereitet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className={`mr-2 h-4 w-4 ${saving ? "animate-pulse" : ""}`} />
            Settings speichern
          </Button>
          <div className="text-sm text-muted-foreground">
            Wenn du spaeter Supabase aktivierst, koennen diese Werte aus der lokalen JSON-Datei migriert werden.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
