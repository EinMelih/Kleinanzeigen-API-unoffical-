import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Archive,
  DollarSign,
  Eye,
  Filter,
  Grid3X3,
  Heart,
  List,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Settings,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

interface Ad {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  status: "active" | "sold" | "paused" | "expired";
  views: number;
  beobachter: number;
  timeAgo: string;
  image?: string;
  badges: string[];
  category: string;
  location: string;
}

const mockAds: Ad[] = [
  {
    id: "1",
    title: "Titel der Anzeige (2 Zeilen...)",
    price: 490,
    status: "active",
    views: 1200,
    beobachter: 24,
    timeAgo: "424h +18%",
    badges: ["Highlight", "Top", "Direkt-kaufen"],
    category: "Elektronik",
    location: "Berlin",
  },
  {
    id: "2",
    title: "Titel der Anzeige (2 Zeilen...)",
    price: 490,
    status: "active",
    views: 1200,
    beobachter: 24,
    timeAgo: "424h +18%",
    badges: ["Highlight", "Top", "Direkt-kaufen"],
    category: "Möbel",
    location: "Hamburg",
  },
  {
    id: "3",
    title: "Titel der Anzeige (2 Zeilen...)",
    price: 490,
    status: "active",
    views: 1200,
    beobachter: 24,
    timeAgo: "424h +18%",
    badges: ["Highlight", "Top", "Direkt-kaufen"],
    category: "Fahrzeuge",
    location: "München",
  },
  {
    id: "4",
    title: "Titel der Anzeige (2 Zeilen...)",
    price: 490,
    status: "active",
    views: 1200,
    beobachter: 24,
    timeAgo: "424h +18%",
    badges: ["Highlight", "Top", "Direkt-kaufen"],
    category: "Elektronik",
    location: "Köln",
  },
  {
    id: "5",
    title: "Titel der Anzeige (2 Zeilen...)",
    price: 490,
    status: "sold",
    views: 1200,
    beobachter: 24,
    timeAgo: "424h +18%",
    badges: ["Highlight", "Top", "Direkt-kaufen"],
    category: "Kleidung",
    location: "Frankfurt",
  },
  {
    id: "6",
    title: "Titel der Anzeige (2 Zeilen...)",
    price: 490,
    status: "paused",
    views: 1200,
    beobachter: 24,
    timeAgo: "424h +18%",
    badges: ["Highlight", "Top", "Direkt-kaufen"],
    category: "Sport",
    location: "Stuttgart",
  },
  {
    id: "7",
    title: "Titel der Anzeige (2 Zeilen...)",
    price: 490,
    status: "active",
    views: 1200,
    beobachter: 24,
    timeAgo: "424h +18%",
    badges: ["Highlight", "Top", "Direkt-kaufen"],
    category: "Bücher",
    location: "Düsseldorf",
  },
  {
    id: "8",
    title: "Titel der Anzeige (2 Zeilen...)",
    price: 490,
    status: "active",
    views: 1200,
    beobachter: 24,
    timeAgo: "424h +18%",
    badges: ["Highlight", "Top", "Direkt-kaufen"],
    category: "Elektronik",
    location: "Leipzig",
  },
];

const statusColors = {
  active: "bg-success/10 text-success border-success/20",
  sold: "bg-muted text-muted-foreground border-muted",
  paused: "bg-warning/10 text-warning border-warning/20",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels = {
  active: "Active",
  sold: "Verkauft",
  paused: "Pausiert",
  expired: "Abgelaufen",
};

export default function MyAds() {
  const [ads, setAds] = useState<Ad[]>(mockAds);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());

  const filteredAds = ads.filter((ad) => {
    const matchesSearch =
      ad.title.toLowerCase().includes(filter.toLowerCase()) ||
      ad.category.toLowerCase().includes(filter.toLowerCase()) ||
      ad.location.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleAdSelection = (adId: string) => {
    const newSelected = new Set(selectedAds);
    if (newSelected.has(adId)) {
      newSelected.delete(adId);
    } else {
      newSelected.add(adId);
    }
    setSelectedAds(newSelected);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for ads:`, Array.from(selectedAds));
    setSelectedAds(new Set());
  };

  const stats = {
    total: ads.length,
    active: ads.filter((ad) => ad.status === "active").length,
    sold: ads.filter((ad) => ad.status === "sold").length,
    paused: ads.filter((ad) => ad.status === "paused").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meine Anzeigen</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte deine aktiven und vergangenen Inseraten
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Einstellungen
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            Neue Anzeige
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktiv</p>
                <p className="text-2xl font-bold text-success">
                  {stats.active}
                </p>
              </div>
              <Play className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-muted">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verkauft</p>
                <p className="text-2xl font-bold">{stats.sold}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pausiert</p>
                <p className="text-2xl font-bold text-warning">
                  {stats.paused}
                </p>
              </div>
              <Pause className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter • Sort • Tags
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">Compact</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nach Titel, Kategorie oder Ort suchen..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="sold">Verkauft</SelectItem>
                <SelectItem value="paused">Pausiert</SelectItem>
                <SelectItem value="expired">Abgelaufen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedAds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
              <span className="text-sm">
                {selectedAds.size} Anzeige(n) ausgewählt
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("pause")}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausieren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("activate")}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Aktivieren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("boost")}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Boost
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("archive")}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archivieren
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ads Grid/List */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-4"
        }
      >
        {filteredAds.map((ad) => (
          <Card
            key={ad.id}
            className={`relative cursor-pointer transition-all hover:shadow-md ${
              selectedAds.has(ad.id) ? "ring-2 ring-primary bg-primary/5" : ""
            } ${statusColors[ad.status]}`}
            onClick={() => toggleAdSelection(ad.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium line-clamp-2">
                  {ad.title}
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{ad.price} €</span>
                <Badge variant="secondary" className="text-xs">
                  {statusLabels[ad.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Placeholder for image */}
              <div className="w-full h-32 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg mb-3"></div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>Views {ad.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>Beob. {ad.beobachter}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {ad.timeAgo}
                </div>

                <div className="flex flex-wrap gap-1">
                  {ad.badges.map((badge) => (
                    <Badge key={badge} variant="outline" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {selectedAds.size > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Bulk Actions</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pausieren
                  </Button>
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Aktivieren
                  </Button>
                  <Button size="sm" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Preis ±%/€
                  </Button>
                  <Button size="sm" variant="outline">
                    <Star className="h-4 w-4 mr-2" />
                    Boost
                  </Button>
                  <Button size="sm" variant="outline">
                    <Archive className="h-4 w-4 mr-2" />
                    Archivieren
                  </Button>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedAds(new Set())}
              >
                Auswahl aufheben
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
