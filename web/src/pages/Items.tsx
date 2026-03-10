import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { appClient } from "@/lib/app-client";
import { TrackedItem } from "@/lib/app-types";
import {
  ExternalLink,
  ImageIcon,
  MapPin,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("de-DE");
}

export default function Items() {
  const [items, setItems] = useState<TrackedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TrackedItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await appClient.getItems();
      setItems(response.items);
      if (!selectedItem && response.items[0]) {
        setSelectedItem(response.items[0]);
      }
    } catch (error) {
      toast({
        title: "Items konnten nicht geladen werden",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const filteredItems = items.filter((item) =>
    [
      item.title,
      item.location,
      item.sellerName || "",
      item.description || "",
      item.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground">
            Lokaler Listing-Store aus Search, Scrape, Artikel-Loads und Messaging.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadItems()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Neu laden
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{items.length}</div>
            <div className="text-sm text-muted-foreground">Tracked Listings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {items.filter((item) => item.messageCount > 0).length}
            </div>
            <div className="text-sm text-muted-foreground">Mit Nachrichtenbezug</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {new Set(items.map((item) => item.sellerName).filter(Boolean)).size}
            </div>
            <div className="text-sm text-muted-foreground">Verschiedene Anbieter</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listing-Liste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Titel, Ort, Anbieter"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                  Lade Items...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                  Noch keine Items im lokalen Store.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedItem?.id === item.id
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="line-clamp-2 font-medium">{item.title}</div>
                      <Badge variant="outline">{item.source}</Badge>
                    </div>
                    <div className="mt-2 text-lg font-semibold text-primary">
                      {item.price}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{item.location}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedItem?.title || "Kein Item ausgewaehlt"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedItem ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                <div className="text-center">
                  <Package className="mx-auto mb-3 h-10 w-10 opacity-50" />
                  <p>Waehle links ein Item aus.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                  <div className="overflow-hidden rounded-xl border bg-muted/20">
                    {selectedItem.imageUrl ? (
                      <img
                        src={
                          selectedItem.imageUrl.startsWith("/images/")
                            ? `/api${selectedItem.imageUrl}`
                            : selectedItem.imageUrl
                        }
                        alt={selectedItem.title}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-primary">
                      {selectedItem.price}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{selectedItem.source}</Badge>
                      {selectedItem.messageCount > 0 && (
                        <Badge variant="secondary">
                          <MessageSquare className="mr-1 h-3 w-3" />
                          {selectedItem.messageCount} Message
                        </Badge>
                      )}
                      {selectedItem.sellerType && (
                        <Badge variant="outline">{selectedItem.sellerType}</Badge>
                      )}
                    </div>
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <div className="rounded-lg border p-3">
                        <div className="text-muted-foreground">Standort</div>
                        <div className="font-medium">{selectedItem.location}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-muted-foreground">Anbieter</div>
                        <div className="font-medium">{selectedItem.sellerName || "n/a"}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-muted-foreground">Erst gesehen</div>
                        <div className="font-medium">{formatDate(selectedItem.firstSeenAt)}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-muted-foreground">Zuletzt aktualisiert</div>
                        <div className="font-medium">{formatDate(selectedItem.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedItem.description && (
                  <div className="rounded-xl border p-4">
                    <div className="mb-2 font-medium">Beschreibung</div>
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {selectedItem.description}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="mb-3 font-medium">Metadaten</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Artikel-ID</span>
                        <span className="font-mono">{selectedItem.id}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Conversation</span>
                        <span>{selectedItem.conversationId || "keine"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Ordner</span>
                        <span className="truncate text-right">
                          {selectedItem.localFolder || "n/a"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="mb-3 font-medium">Aktionen</div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild>
                        <a href={selectedItem.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Anzeige öffnen
                        </a>
                      </Button>
                      {selectedItem.sellerName && (
                        <Button variant="outline" disabled>
                          <User className="mr-2 h-4 w-4" />
                          {selectedItem.sellerName}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
