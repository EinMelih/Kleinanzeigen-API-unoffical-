import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { appClient } from "@/lib/app-client";
import { MessagesResponse } from "@/lib/app-types";
import {
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";

function formatDate(value?: string): string {
  if (!value) {
    return "n/a";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("de-DE");
}

function getDirectionStyles(direction: "in" | "out" | "system"): string {
  if (direction === "out") {
    return "ml-auto bg-primary text-primary-foreground";
  }

  if (direction === "system") {
    return "mx-auto bg-muted text-muted-foreground";
  }

  return "mr-auto bg-muted/70";
}

export default function Messages() {
  const [data, setData] = useState<MessagesResponse | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [draft, setDraft] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const loadStoredMessages = async () => {
    try {
      setLoading(true);
      const [messages, overview] = await Promise.all([
        appClient.getMessages(),
        appClient.getOverview(),
      ]);
      setData(messages);
      setAccountEmail(overview.account.email);

      if (!selectedConversationId && messages.conversations[0]) {
        setSelectedConversationId(messages.conversations[0].id);
      }
    } catch (error) {
      toast({
        title: "Messages konnten nicht geladen werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStoredMessages();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await appClient.refreshMessages(accountEmail || undefined);
      setData(response);
      if (!selectedConversationId && response.conversations[0]) {
        setSelectedConversationId(response.conversations[0].id);
      }
      toast({
        title: "Conversation-Refresh erfolgreich",
        description: `${response.conversationCount} Konversationen synchronisiert`,
      });
    } catch (error) {
      toast({
        title: "Conversation-Refresh fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredConversations = (data?.conversations || []).filter((conversation) => {
    const haystack = [
      conversation.sellerName,
      conversation.articleTitle,
      conversation.lastMessage || "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchTerm.toLowerCase());
  });

  const selectedConversation =
    filteredConversations.find((conversation) => conversation.id === selectedConversationId) ||
    filteredConversations[0] ||
    null;

  const handleSend = async () => {
    if (!selectedConversation || !draft.trim() || !accountEmail) {
      return;
    }

    try {
      setSending(true);
      const response = await appClient.sendMessage({
        email: accountEmail,
        articleId: selectedConversation.articleId,
        receiverId: selectedConversation.sellerId || undefined,
        message: draft.trim(),
      });

      toast({
        title: response.success ? "Nachricht gesendet" : "Senden fehlgeschlagen",
        description: response.message,
        variant: response.success ? "default" : "destructive",
      });

      if (response.success) {
        setDraft("");
        await handleRefresh();
      }
    } catch (error) {
      toast({
        title: "Nachricht konnte nicht gesendet werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Lokaler Verlauf plus echter Refresh aus dem Kleinanzeigen-Postfach.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadStoredMessages()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Lokal neu laden
          </Button>
          <Button onClick={() => void handleRefresh()} disabled={refreshing || !accountEmail}>
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Live syncen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{data?.conversationCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Konversationen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {data?.conversations.reduce(
                (count, conversation) =>
                  count + conversation.messages.filter((message) => message.direction === "in").length,
                0
              ) ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Eingehende Messages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-lg font-semibold truncate">
              {accountEmail || "kein Account"}
            </div>
            <div className="text-sm text-muted-foreground">Aktiver Standard-Account</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Konversationsliste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Anbieter, Artikel, Text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                  Lade Konversationen...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                  Noch keine Konversationen im lokalen Store.
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedConversation?.id === conversation.id
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{conversation.sellerName}</div>
                      {conversation.unread && <Badge>Neu</Badge>}
                    </div>
                    <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {conversation.articleTitle}
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm">
                      {conversation.lastMessage || "Keine letzte Nachricht"}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {formatDate(conversation.lastMessageDate || conversation.updatedAt)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>{selectedConversation?.articleTitle || "Keine Konversation ausgewaehlt"}</span>
              {selectedConversation?.conversationUrl && (
                <a
                  className="text-sm font-normal text-primary hover:underline"
                  href={selectedConversation.conversationUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Auf Kleinanzeigen öffnen
                </a>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedConversation ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-50" />
                  <p>Waehle links eine Konversation aus.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{selectedConversation.sellerName}</Badge>
                  <Badge variant="outline">Artikel-ID {selectedConversation.articleId}</Badge>
                  <Badge variant="outline">
                    {selectedConversation.messages.length} Eintraege
                  </Badge>
                </div>

                <div className="flex min-h-[420px] flex-col gap-3 rounded-lg border bg-muted/20 p-4">
                  {selectedConversation.messages.length === 0 ? (
                    <div className="m-auto text-sm text-muted-foreground">
                      Noch keine gespeicherten Messages.
                    </div>
                  ) : (
                    selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${getDirectionStyles(
                          message.direction
                        )}`}
                      >
                        <div className="whitespace-pre-wrap">{message.text}</div>
                        <div className="mt-2 text-[11px] opacity-70">
                          {message.timestamp}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3 rounded-xl border p-4">
                  <div className="text-sm font-medium">Antwort senden</div>
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Nachricht an den Anbieter"
                    className="min-h-[140px]"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      Sendet ueber `POST /message/send` mit deinem aktuell eingeloggten Account.
                    </div>
                    <Button
                      onClick={() => void handleSend()}
                      disabled={sending || !draft.trim() || !accountEmail}
                    >
                      {sending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Senden
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
