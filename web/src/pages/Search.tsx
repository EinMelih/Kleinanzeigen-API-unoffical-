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
import { motion } from "framer-motion";
import {
  Euro,
  ExternalLink,
  FolderOpen,
  ImageIcon,
  Loader2,
  MapPin,
  Search as SearchIcon,
  User,
  Database,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SearchArticle {
  id: string;
  title: string;
  price: string;
  priceType?: string;
  location: string;
  date?: string;
  url: string;
  images?: string[];
  localImages?: string[];
  thumbnail?: string;
  description?: string;
  seller?: {
    name?: string;
    type?: string;
    rating?: string;
    badges?: string[];
  };
}

interface SearchResult {
  status: string;
  count: number;
  articles: SearchArticle[];
  searchUrl?: string;
  folder?: string;
}

interface LocalSearchFolder {
  name: string;
  articleCount: number;
  path: string;
}

const RADIUS_OPTIONS = [
  { value: "", label: "Kein Radius" },
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "20", label: "20 km" },
  { value: "30", label: "30 km" },
  { value: "50", label: "50 km" },
  { value: "100", label: "100 km" },
  { value: "150", label: "150 km" },
  { value: "200", label: "200 km" },
];

const SORT_OPTIONS = [
  { value: "RELEVANCE", label: "Relevanz" },
  { value: "SORTING_DATE", label: "Neueste zuerst" },
  { value: "PRICE_AMOUNT", label: "Preis aufsteigend" },
];

export default function Search() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<SearchArticle | null>(null);
  const [mode, setMode] = useState<"live" | "local">("local");
  const [localFolders, setLocalFolders] = useState<LocalSearchFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const { toast } = useToast();

  // Form state
  const [query, setQuery] = useState("");
  const [count, setCount] = useState("10");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("RELEVANCE");
  const [includeDetails, setIncludeDetails] = useState(false);

  // Load local folders on mount
  useEffect(() => {
    loadLocalFolders();
  }, []);

  const loadLocalFolders = async () => {
    try {
      const response = await fetch("/api/local-searches");
      const data = await response.json();
      if (data.folders) {
        setLocalFolders(data.folders);
        if (data.folders.length > 0 && !selectedFolder) {
          setSelectedFolder(data.folders[0].name);
        }
      }
    } catch (error) {
      console.error("Failed to load local folders:", error);
    }
  };

  const loadLocalSearch = async (folder: string) => {
    if (!folder) return;

    setLoading(true);
    setResults(null);
    setSelectedArticle(null);

    try {
      const response = await fetch(`/api/local-search/${encodeURIComponent(folder)}`);
      const data = await response.json();

      if (data.status === "success") {
        setResults(data);
        toast({
          title: "Lokale Ergebnisse geladen",
          description: `${data.count} Artikel aus "${folder}"`,
        });
      } else {
        throw new Error(data.message || "Laden fehlgeschlagen");
      }
    } catch (error) {
      console.error("Load local error:", error);
      toast({
        title: "Fehler beim Laden",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLiveSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Suchbegriff fehlt",
        description: "Bitte gib einen Suchbegriff ein",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResults(null);
    setSelectedArticle(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          count: parseInt(count) || 10,
          location: location.trim() || undefined,
          radius: radius ? parseInt(radius) : undefined,
          minPrice: minPrice ? parseInt(minPrice) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
          sortBy,
          includeDetails,
          downloadImages: true, // Download images for local viewing
        }),
      });

      const data = await response.json();

      if (data.status === "success" || data.result?.articles) {
        setResults({
          status: "success",
          count: data.result?.articles?.length || 0,
          articles: data.result?.articles || [],
          searchUrl: data.result?.searchUrl,
        });
        toast({
          title: "Suche erfolgreich",
          description: `${data.result?.articles?.length || 0} Artikel gefunden`,
        });
        // Refresh local folders after search with download
        loadLocalFolders();
      } else {
        throw new Error(data.message || "Suche fehlgeschlagen");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Fehler bei der Suche",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (article: SearchArticle): string | null => {
    // Prefer local images
    if (article.localImages && article.localImages.length > 0) {
      return `/api${article.localImages[0]}`;
    }
    if (article.images && article.images.length > 0) {
      // Check if it's a local path
      if (article.images[0].startsWith("/images/")) {
        return `/api${article.images[0]}`;
      }
      return article.images[0];
    }
    if (article.thumbnail) return article.thumbnail;
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          🔍 Kleinanzeigen Suche
        </h1>
        <p className="text-muted-foreground">
          Live-Suche oder lokale gespeicherte Ergebnisse durchsuchen
        </p>
      </motion.div>

      {/* Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2"
      >
        <Button
          variant={mode === "local" ? "default" : "outline"}
          onClick={() => setMode("local")}
          className="flex-1"
        >
          <Database className="h-4 w-4 mr-2" />
          Lokale Ergebnisse ({localFolders.length})
        </Button>
        <Button
          variant={mode === "live" ? "default" : "outline"}
          onClick={() => setMode("live")}
          className="flex-1"
        >
          <Wifi className="h-4 w-4 mr-2" />
          Live-Suche
        </Button>
      </motion.div>

      {/* Local Mode - Folder Selection */}
      {mode === "local" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderOpen className="h-5 w-5 mr-2 text-primary" />
                Gespeicherte Suchen
              </CardTitle>
              <CardDescription>
                Wähle eine gespeicherte Suche aus dem lokalen Speicher
              </CardDescription>
            </CardHeader>
            <CardContent>
              {localFolders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Keine lokalen Suchen gefunden. Führe eine Live-Suche mit "Bilder speichern" durch.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="folder">Such-Ordner wählen</Label>
                    <select
                      id="folder"
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {localFolders.map((folder) => (
                        <option key={folder.name} value={folder.name}>
                          {folder.name} ({folder.articleCount} Artikel)
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={() => loadLocalSearch(selectedFolder)}
                    disabled={loading || !selectedFolder}
                    size="lg"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Lade...
                      </>
                    ) : (
                      <>
                        <FolderOpen className="mr-2 h-5 w-5" />
                        Ergebnisse laden
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Live Mode - Search Form */}
      {mode === "live" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SearchIcon className="h-5 w-5 mr-2 text-primary" />
                Live-Suche
              </CardTitle>
              <CardDescription>
                Suche auf Kleinanzeigen.de und speichere die Ergebnisse lokal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Query */}
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="query">Suchbegriff *</Label>
                  <Input
                    id="query"
                    placeholder="z.B. iPhone 15, PS5, Fahrrad..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLiveSearch()}
                    className="text-lg"
                  />
                </div>

                {/* Count */}
                <div className="space-y-2">
                  <Label htmlFor="count">Anzahl</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="10"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Ort</Label>
                  <Input
                    id="location"
                    placeholder="z.B. Köln, Berlin..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Radius */}
                <div className="space-y-2">
                  <Label htmlFor="radius">Radius</Label>
                  <select
                    id="radius"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {RADIUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label htmlFor="sortBy">Sortierung</Label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div className="space-y-2">
                  <Label htmlFor="minPrice">Preis von (€)</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>

                {/* Max Price */}
                <div className="space-y-2">
                  <Label htmlFor="maxPrice">Preis bis (€)</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    min="0"
                    placeholder="unbegrenzt"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>

                {/* Include Details Checkbox */}
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDetails}
                      onChange={(e) => setIncludeDetails(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Details laden (langsamer)</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleLiveSearch}
                  disabled={loading}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Suche läuft...
                    </>
                  ) : (
                    <>
                      <SearchIcon className="mr-2 h-5 w-5" />
                      Suchen & Speichern
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results */}
      {results && results.articles && results.articles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  📦 {results.count || results.articles.length} Ergebnisse
                  {results.folder && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      aus {results.folder}
                    </span>
                  )}
                </span>
                {results.searchUrl && (
                  <a
                    href={results.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Auf Kleinanzeigen öffnen
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.articles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden h-full"
                      onClick={() => setSelectedArticle(article)}
                    >
                      {/* Image */}
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {getImageUrl(article) ? (
                          <img
                            src={getImageUrl(article)!}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                        {/* Price Badge */}
                        <div className="absolute bottom-2 right-2">
                          <Badge className="bg-primary/90 text-primary-foreground font-bold">
                            {article.price}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-semibold line-clamp-2 text-sm">
                          {article.title}
                        </h3>

                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="line-clamp-1">{article.location}</span>
                        </div>

                        {article.seller?.name && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            <span>{article.seller.name}</span>
                            {article.seller.type === "commercial" && (
                              <Badge variant="outline" className="ml-2 text-[10px]">
                                Gewerblich
                              </Badge>
                            )}
                          </div>
                        )}

                        {article.date && (
                          <p className="text-[10px] text-muted-foreground/70">
                            {article.date}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedArticle(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{selectedArticle.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedArticle(null)}
                  >
                    ✕
                  </Button>
                </div>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center">
                    <Euro className="h-4 w-4 mr-1" />
                    {selectedArticle.price}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {selectedArticle.location}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Images */}
                {((selectedArticle.localImages || selectedArticle.images) &&
                  (selectedArticle.localImages?.length || selectedArticle.images?.length)) && (
                  <div className="grid gap-2 grid-cols-3">
                    {(selectedArticle.localImages || selectedArticle.images || []).map((img, idx) => (
                      <img
                        key={idx}
                        src={img.startsWith("/images/") ? `/api${img}` : img}
                        alt={`Bild ${idx + 1}`}
                        className="rounded-lg aspect-square object-cover"
                      />
                    ))}
                  </div>
                )}

                {/* Description */}
                {selectedArticle.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Beschreibung</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedArticle.description}
                    </p>
                  </div>
                )}

                {/* JSON Data */}
                <div>
                  <h4 className="font-semibold mb-2">JSON Daten</h4>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[300px]">
                    {JSON.stringify(selectedArticle, null, 2)}
                  </pre>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Auf Kleinanzeigen öffnen
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
