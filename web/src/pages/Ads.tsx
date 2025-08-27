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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Archive,
  Edit3,
  Eye,
  Filter,
  Globe,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface Ad {
  id: string;
  item_id: string;
  item_title: string;
  platform: string;
  status: "draft" | "active" | "paused" | "archived" | "sold" | "deleted";
  price: {
    value: number;
    type: "fixed" | "negotiable";
    currency: string;
  };
  shipping: {
    mode: string;
    method_label: string;
    price: number;
  };
  opp_enabled: boolean;
  opp_provider?: string;
  boosts: {
    highlight: boolean;
    top: boolean;
    gallery: boolean;
    bump: boolean;
    option_duration_days?: number;
  };
  timestamps: {
    posted_at: string;
    ends_at: string;
    last_synced_at: string;
  };
  views: number;
  messages_count: number;
  owner: {
    platform_account_id: string;
    name: string;
  };
}

// Mock data
const mockAds: Ad[] = [
  {
    id: "ad_1",
    item_id: "item_1",
    item_title: "iPhone 14 Pro 128GB Space Grau",
    platform: "Kleinanzeigen",
    status: "active",
    price: {
      value: 899,
      type: "negotiable",
      currency: "EUR",
    },
    shipping: {
      mode: "shipping",
      method_label: "Versand möglich",
      price: 5.99,
    },
    opp_enabled: true,
    opp_provider: "PayPal",
    boosts: {
      highlight: true,
      top: false,
      gallery: true,
      bump: false,
      option_duration_days: 7,
    },
    timestamps: {
      posted_at: "2024-01-20T10:00:00Z",
      ends_at: "2024-02-20T10:00:00Z",
      last_synced_at: "2024-01-25T15:30:00Z",
    },
    views: 156,
    messages_count: 8,
    owner: {
      platform_account_id: "acc_123",
      name: "Max Mustermann",
    },
  },
  {
    id: "ad_2",
    item_id: "item_2",
    item_title: "MacBook Pro M2 14 Zoll",
    platform: "Kleinanzeigen",
    status: "paused",
    price: {
      value: 1299,
      type: "fixed",
      currency: "EUR",
    },
    shipping: {
      mode: "pickup",
      method_label: "Nur Abholung",
      price: 0,
    },
    opp_enabled: false,
    boosts: {
      highlight: false,
      top: false,
      gallery: false,
      bump: false,
    },
    timestamps: {
      posted_at: "2024-01-15T14:00:00Z",
      ends_at: "2024-02-15T14:00:00Z",
      last_synced_at: "2024-01-22T09:15:00Z",
    },
    views: 89,
    messages_count: 3,
    owner: {
      platform_account_id: "acc_456",
      name: "Anna Schmidt",
    },
  },
  {
    id: "ad_3",
    item_id: "item_3",
    item_title: "Vintage Lederjacke Größe M",
    platform: "Kleinanzeigen",
    status: "draft",
    price: {
      value: 299,
      type: "negotiable",
      currency: "EUR",
    },
    shipping: {
      mode: "both",
      method_label: "Versand & Abholung",
      price: 8.99,
    },
    opp_enabled: true,
    opp_provider: "Klarna",
    boosts: {
      highlight: false,
      top: false,
      gallery: false,
      bump: false,
    },
    timestamps: {
      posted_at: "2024-01-25T16:00:00Z",
      ends_at: "2024-02-25T16:00:00Z",
      last_synced_at: "2024-01-25T16:00:00Z",
    },
    views: 0,
    messages_count: 0,
    owner: {
      platform_account_id: "acc_789",
      name: "Michael Weber",
    },
  },
];

const statusConfig = {
  draft: { label: "Entwurf", color: "bg-gray-500", icon: Edit3 },
  active: { label: "Aktiv", color: "bg-green-500", icon: Play },
  paused: { label: "Pausiert", color: "bg-yellow-500", icon: Pause },
  archived: { label: "Archiviert", color: "bg-blue-500", icon: Archive },
  sold: { label: "Verkauft", color: "bg-purple-500", icon: ShoppingCart },
  deleted: { label: "Gelöscht", color: "bg-red-500", icon: Trash2 },
};

const AdCard = ({
  ad,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
}: {
  ad: Ad;
  onEdit: (ad: Ad) => void;
  onDelete: (ad: Ad) => void;
  onView: (ad: Ad) => void;
  onStatusChange: (ad: Ad, status: Ad["status"]) => void;
}) => {
  const status = statusConfig[ad.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        variant="glass"
        className="group hover:shadow-lg transition-all duration-300"
      >
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={`${status.color} text-white`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {ad.platform}
                  </Badge>
                  {ad.opp_enabled && (
                    <Badge variant="default" className="text-xs bg-orange-500">
                      OPP
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {ad.item_title}
                </h3>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => onView(ad)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(ad)}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(ad)}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price & Shipping */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-lg">
                    {ad.price.value.toLocaleString("de-DE")} {ad.price.currency}
                  </span>
                  {ad.price.type === "negotiable" && (
                    <Badge variant="outline" className="text-xs">
                      VB
                    </Badge>
                  )}
                </div>
                {ad.shipping.price > 0 && (
                  <div className="text-sm text-muted-foreground">
                    +{ad.shipping.price.toFixed(2)} {ad.price.currency} Versand
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ad.shipping.method_label}</span>
                </div>
                {ad.opp_enabled && (
                  <div className="text-sm text-muted-foreground">
                    Direkt kaufen: {ad.opp_provider}
                  </div>
                )}
              </div>
            </div>

            {/* Boosts */}
            {Object.values(ad.boosts).some(Boolean) && (
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <div className="flex space-x-1">
                  {ad.boosts.highlight && (
                    <Badge variant="outline" className="text-xs">
                      Highlight
                    </Badge>
                  )}
                  {ad.boosts.top && (
                    <Badge variant="outline" className="text-xs">
                      Top
                    </Badge>
                  )}
                  {ad.boosts.gallery && (
                    <Badge variant="outline" className="text-xs">
                      Galerie
                    </Badge>
                  )}
                  {ad.boosts.bump && (
                    <Badge variant="outline" className="text-xs">
                      Bump
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold">{ad.views}</div>
                <div className="text-muted-foreground">Aufrufe</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{ad.messages_count}</div>
                <div className="text-muted-foreground">Nachrichten</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">
                  {Math.ceil(
                    (new Date(ad.timestamps.ends_at).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}
                </div>
                <div className="text-muted-foreground">Tage</div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Gepostet:</span>
                <span>
                  {new Date(ad.timestamps.posted_at).toLocaleDateString(
                    "de-DE"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Läuft bis:</span>
                <span>
                  {new Date(ad.timestamps.ends_at).toLocaleDateString("de-DE")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Letztes Update:</span>
                <span>
                  {new Date(ad.timestamps.last_synced_at).toLocaleDateString(
                    "de-DE"
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {ad.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(ad, "paused")}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausieren
                </Button>
              )}
              {ad.status === "paused" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(ad, "active")}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Aktivieren
                </Button>
              )}
              {ad.status === "draft" && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onStatusChange(ad, "active")}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Veröffentlichen
                </Button>
              )}
              <Button size="sm" variant="outline" className="ml-auto">
                <TrendingUp className="h-4 w-4 mr-1" />
                Boosts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function Ads() {
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const { toast } = useToast();

  const filteredAds = mockAds.filter((ad) => {
    const matchesSearch = ad.item_title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || ad.status === selectedStatus;
    const matchesPlatform =
      !selectedPlatform || ad.platform === selectedPlatform;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const platforms = Array.from(new Set(mockAds.map((ad) => ad.platform)));
  const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = mockAds.filter((ad) => ad.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  const handleEdit = (ad: Ad) => {
    toast({
      title: "Inserat bearbeiten",
      description: `Bearbeite "${ad.item_title}"`,
    });
  };

  const handleDelete = (ad: Ad) => {
    toast({
      title: "Inserat löschen",
      description: `Lösche "${ad.item_title}"`,
      variant: "destructive",
    });
  };

  const handleView = (ad: Ad) => {
    setSelectedAd(ad);
  };

  const handleStatusChange = (ad: Ad, newStatus: Ad["status"]) => {
    toast({
      title: "Status geändert",
      description: `${ad.item_title} ist jetzt ${statusConfig[newStatus].label}`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Ads (Inserate)
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Inserate auf verschiedenen Plattformen
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          <Plus className="h-4 w-4 mr-2" />
          Neues Inserat
        </Button>
      </motion.div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Liste</TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedAd}>
            Detailansicht
          </TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-6">
          {/* Status Overview */}
          <div className="grid gap-4 md:grid-cols-6">
            {Object.entries(statusConfig).map(([status, config]) => (
              <Card key={status} className="text-center">
                <CardContent className="p-4">
                  <div
                    className={`w-3 h-3 rounded-full mx-auto mb-2 ${config.color}`}
                  />
                  <div className="font-semibold">{statusCounts[status]}</div>
                  <div className="text-sm text-muted-foreground">
                    {config.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter & Suche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Suche</Label>
                  <Input
                    id="search"
                    placeholder="Artikel-Titel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="w-full p-2 border rounded-md bg-background"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Alle Status</option>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <option key={status} value={status}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Plattform</Label>
                  <select
                    id="platform"
                    className="w-full p-2 border rounded-md bg-background"
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                  >
                    <option value="">Alle Plattformen</option>
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="flex space-x-2">
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                    >
                      OPP ({mockAds.filter((ad) => ad.opp_enabled).length})
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                    >
                      Boosts (
                      {
                        mockAds.filter((ad) =>
                          Object.values(ad.boosts).some(Boolean)
                        ).length
                      }
                      )
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ads Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAds.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>

          {filteredAds.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Inserate gefunden</p>
              <p className="text-sm">
                Passen Sie Ihre Filter an oder erstellen Sie ein neues Inserat
              </p>
            </div>
          )}
        </TabsContent>

        {/* Detail Tab */}
        <TabsContent value="detail" className="space-y-6">
          {selectedAd && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Ad Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2"
              >
                <Card variant="elevated">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl">
                        {selectedAd.item_title}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => handleEdit(selectedAd)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </Button>
                        <Button variant="outline">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Boosts
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {selectedAd.platform} •{" "}
                      {statusConfig[selectedAd.status].label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Price & Shipping */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="font-semibold mb-2">Preis & Zahlung</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">
                              Preis:
                            </span>
                            <span className="font-medium text-lg">
                              {selectedAd.price.value.toLocaleString("de-DE")}{" "}
                              {selectedAd.price.currency}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">Typ:</span>
                            <span className="font-medium">
                              {selectedAd.price.type === "fixed"
                                ? "Festpreis"
                                : "Verhandlungsbasis"}
                            </span>
                          </div>
                          {selectedAd.opp_enabled && (
                            <div className="flex justify-between p-2 bg-muted/30 rounded">
                              <span className="text-muted-foreground">
                                Direkt kaufen:
                              </span>
                              <span className="font-medium">
                                {selectedAd.opp_provider}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Versand</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">
                              Modus:
                            </span>
                            <span className="font-medium">
                              {selectedAd.shipping.mode}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">
                              Methode:
                            </span>
                            <span className="font-medium">
                              {selectedAd.shipping.method_label}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">
                              Kosten:
                            </span>
                            <span className="font-medium">
                              {selectedAd.shipping.price > 0
                                ? `${selectedAd.shipping.price.toFixed(2)} ${
                                    selectedAd.price.currency
                                  }`
                                : "Kostenlos"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Boosts */}
                    <div>
                      <h3 className="font-semibold mb-2">Boosts & Features</h3>
                      <div className="grid gap-2 md:grid-cols-2">
                        {Object.entries(selectedAd.boosts).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between p-2 bg-muted/30 rounded"
                            >
                              <span className="text-muted-foreground capitalize">
                                {key}:
                              </span>
                              <span className="font-medium">
                                {value ? "Aktiv" : "Inaktiv"}
                                {key === "option_duration_days" &&
                                  value &&
                                  ` (${value} Tage)`}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div>
                      <h3 className="font-semibold mb-2">Zeitplan</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">
                            Gepostet:
                          </span>
                          <span>
                            {new Date(
                              selectedAd.timestamps.posted_at
                            ).toLocaleString("de-DE")}
                          </span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">
                            Läuft bis:
                          </span>
                          <span>
                            {new Date(
                              selectedAd.timestamps.ends_at
                            ).toLocaleString("de-DE")}
                          </span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">
                            Letztes Update:
                          </span>
                          <span>
                            {new Date(
                              selectedAd.timestamps.last_synced_at
                            ).toLocaleString("de-DE")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Status & Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Status & Aktionen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          statusConfig[selectedAd.status].color
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {statusConfig[selectedAd.status].label}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedAd.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            handleStatusChange(selectedAd, "paused")
                          }
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pausieren
                        </Button>
                      )}
                      {selectedAd.status === "paused" && (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full"
                          onClick={() =>
                            handleStatusChange(selectedAd, "active")
                          }
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Aktivieren
                        </Button>
                      )}
                      {selectedAd.status === "draft" && (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full"
                          onClick={() =>
                            handleStatusChange(selectedAd, "active")
                          }
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Veröffentlichen
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Aufrufe:</span>
                      <span className="font-medium">{selectedAd.views}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Nachrichten:
                      </span>
                      <span className="font-medium">
                        {selectedAd.messages_count}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Verbleibende Tage:
                      </span>
                      <span className="font-medium">
                        {Math.ceil(
                          (new Date(selectedAd.timestamps.ends_at).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Owner Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Besitzer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{selectedAd.owner.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account ID:</span>
                      <span className="font-mono text-xs">
                        {selectedAd.owner.platform_account_id}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
