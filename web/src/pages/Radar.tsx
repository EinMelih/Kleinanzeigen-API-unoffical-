import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { appClient } from "@/lib/app-client";
import { NotificationSummary, RadarResponse } from "@/lib/app-types";
import {
  Bell,
  ExternalLink,
  Eye,
  Inbox,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("de-DE");
}

function getVariant(type: NotificationSummary["type"]) {
  switch (type) {
    case "success":
      return "default" as const;
    case "error":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

export default function Radar() {
  const [data, setData] = useState<RadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRead, setShowRead] = useState(false);
  const { toast } = useToast();

  const loadRadar = async () => {
    try {
      setLoading(true);
      const response = await appClient.getRadar();
      setData(response);
    } catch (error) {
      toast({
        title: "Radar konnte nicht geladen werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRadar();
  }, []);

  const handleRead = async (id: string) => {
    try {
      await appClient.markNotificationRead(id);
      await loadRadar();
    } catch (error) {
      toast({
        title: "Notification konnte nicht aktualisiert werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await appClient.deleteNotification(id);
      await loadRadar();
    } catch (error) {
      toast({
        title: "Notification konnte nicht geloescht werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  };

  const handleClear = async () => {
    try {
      await appClient.clearNotifications();
      await loadRadar();
    } catch (error) {
      toast({
        title: "Notifications konnten nicht geleert werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  };

  const visibleNotifications = (data?.notifications || []).filter(
    (notification) => showRead || !notification.read
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Radar</h1>
          <p className="text-muted-foreground">
            Lokale Notifications, Search-Ereignisse und Message-Highlights.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadRadar()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Neu laden
          </Button>
          <Button variant="outline" onClick={() => setShowRead((current) => !current)}>
            {showRead ? "Nur ungelesene" : "Auch gelesene"}
          </Button>
          <Button variant="destructive" onClick={() => void handleClear()}>
            <Trash2 className="mr-2 h-4 w-4" />
            Alles loeschen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{data?.stats.notificationCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Notifications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {data?.stats.unreadNotificationCount ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Ungelesen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{data?.stats.conversationCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Konversationen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{data?.stats.trackedItemCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Tracked Items</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                Lade Notifications...
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                Keine Notifications im aktuellen Filter.
              </div>
            ) : (
              visibleNotifications.map((notification) => (
                <div key={notification.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getVariant(notification.type)}>
                          {notification.type}
                        </Badge>
                        <Badge variant="outline">{notification.category}</Badge>
                        {!notification.read && <Badge>Neu</Badge>}
                      </div>
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {notification.message}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(notification.timestamp)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRead(notification.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Lesen
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleDelete(notification.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Entfernen
                      </Button>
                      {notification.link && (
                        <Button size="sm" asChild>
                          <a href={notification.link} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Öffnen
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                Message-Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.conversations || []).length === 0 ? (
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                  Noch keine synchronisierten Konversationen.
                </div>
              ) : (
                data?.conversations.slice(0, 6).map((conversation) => (
                  <div key={conversation.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{conversation.sellerName}</div>
                      {conversation.unread && <Badge>Neu</Badge>}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {conversation.articleTitle}
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm">
                      {conversation.lastMessage || "Keine letzte Nachricht"}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {formatDate(conversation.lastMessageDate || conversation.updatedAt)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Systemhinweise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                Search-, Scrape-, Telegram- und Message-Ereignisse landen jetzt im selben lokalen Event-Store.
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                Gelesene Notifications koennen ausgeblendet werden, bleiben aber im lokalen Store erhalten.
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                Fuer echte eingehende Messages nutze in `Messages` den Button `Live syncen`.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
