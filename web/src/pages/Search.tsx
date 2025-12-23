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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Euro,
  ExternalLink,
  FolderOpen,
  ImageIcon,
  List,
  Loader2,
  MapPin,
  Search as SearchIcon,
  User,
  Database,
  Wifi,
  Download,
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
  downloadedImages?: Array<{ url: string; localPath: string }>;
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

  // Search Form state
  const [query, setQuery] = useState("");
  const [count, setCount] = useState("10");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("RELEVANCE");
  const [includeDetails, setIncludeDetails] = useState(false);

  // Scraper Form state
  const [bulkUrls, setBulkUrls] = useState("");
  const [downloadImages, setDownloadImages] = useState(true);

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

  // Unused single scrape logic removed

  const handleBulkScrape = async () => {
    let urls = bulkUrls.split("\n").map(u => u.trim()).filter(u => u.length > 0);

    // Auto-convert numeric IDs to URLs
    urls = urls.map(u => {
        if (/^\d+$/.test(u)) {
            return `https://www.kleinanzeigen.de/s-anzeige/${u}`;
        }
        return u;
    });

    if (urls.length === 0) {
       toast({ title: "Keine Daten", description: "Bitte URLs oder IDs eingeben", variant: "destructive" });
       return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, downloadImages }),
      });

      const data = await response.json();

      if (data.status === "success" && data.results) {
        const successful = data.results.filter((r: any) => r.success).map((r: any) => r.article);

        setResults({
            status: "success",
            count: successful.length,
            articles: successful,
            folder: "Scraped Results"
        });

        toast({
            title: "Scraping abgeschlossen",
            description: `${data.successfulScrapes} von ${data.totalUrls} erfolgreich`,
            variant: data.failedScrapes > 0 ? "default" : "default"
        });
      } else {
        throw new Error(data.message || "Scraping fehlgeschlagen");
      }
    } catch (error) {
      console.error("Scrape error:", error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Fatal Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (article: SearchArticle): string | null => {
    // Prefer downloaded/local items
    if (article.downloadedImages && article.downloadedImages.length > 0) {
        // If the path is absolute or relative on server, we need to serve it.
        // Assuming /api/images proxy or similar if configured, or just mapped paths.
        // localPath might be file system path. url is remote.
        // However, in Search.tsx earlier:
        // if (article.localImages) -> /api${article.localImages[0]}

        // Let's standardise on "localImages" property or handle "downloadedImages" logic
        // "downloadedImages": [{url, localPath}]
        // We probably need to map these to a serving URL.
        // For now, let's use the remote url or if we have mapping logic.
        // But wait! standard "articles" from local search have "localImages" which are relative URLs like "/images/search/..."

        // Only if we scraped just now, we might have `downloadedImages`
        // We really want to display them from local if possible.
        // But the previous implementation assumed pre-existing folder structure known to backend.
        // The /scrape endpoint returns localPath. We need to convert it to a serve-able URL if we want to show it immediately?
        // Actually, backend static serve is on /images/*.

        // Let's fallback to remote image for fresh scrape to ensure it works.
        return article.downloadedImages[0].url;
    }

    // Existing logic for loaded local search
    if (article.localImages && article.localImages.length > 0) {
      return `/api${article.localImages[0]}`;
    }
    if (article.images && article.images.length > 0) {
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
          🔍 Kleinanzeigen Scraper
        </h1>
        <p className="text-muted-foreground">
          Suchen, Scrapen und Daten lokal verwalten
        </p>
      </motion.div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-xl">
          <TabsTrigger value="search">Suche (Live & Lokal)</TabsTrigger>
          <TabsTrigger value="scraper">URL Scraper (Single & Bulk)</TabsTrigger>
        </TabsList>

        {/* ==================== SEARCH TAB ==================== */}
        <TabsContent value="search" className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 max-w-md">
            <Button
              variant={mode === "local" ? "default" : "outline"}
              onClick={() => setMode("local")}
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              Lokal ({localFolders.length})
            </Button>
            <Button
              variant={mode === "live" ? "default" : "outline"}
              onClick={() => setMode("live")}
              className="flex-1"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Live
            </Button>
          </div>

          {/* Local Folder Select */}
          {mode === "local" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FolderOpen className="h-5 w-5 mr-2 text-primary" />
                    Gespeicherte Ergebnisse laden
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {localFolders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Keine lokalen Suchen gefunden.
                    </p>
                  ) : (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <select
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
                      >
                        {loading ? <Loader2 className="animate-spin" /> : "Laden"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Live Search Form */}
          {mode === "live" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <SearchIcon className="h-5 w-5 mr-2 text-primary" />
                    Neue Suche starten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2 lg:col-span-2">
                      <Label>Suchbegriff</Label>
                      <Input
                        placeholder="z.B. iPhone 15"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLiveSearch()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Anzahl</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={count}
                        onChange={(e) => setCount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ort</Label>
                      <Input
                        placeholder="z.B. Köln"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                       <Label>Radius</Label>
                       <select
                         value={radius}
                         onChange={(e) => setRadius(e.target.value)}
                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                       >
                         {RADIUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <Label>Sortierung</Label>
                       <select
                         value={sortBy}
                         onChange={(e) => setSortBy(e.target.value)}
                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                       >
                         {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Preis Min (€)</Label>
                      <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Preis Max (€)</Label>
                      <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2 flex items-center pt-8">
                       <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeDetails}
                          onChange={(e) => setIncludeDetails(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm">Details laden</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleLiveSearch} disabled={loading} size="lg">
                      {loading ? <Loader2 className="mr-2 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
                      Suchen & Speichern
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* ==================== UNIFIED SCRAPER TAB ==================== */}
        <TabsContent value="scraper" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center">
                 <List className="h-5 w-5 mr-2 text-primary" />
                 Direkt-Scraper
               </CardTitle>
               <CardDescription>
                 Scrape einzelne oder mehrere Artikel gleichzeitig.
                 Unterstützt <strong>URLs</strong> und <strong>Artikel-IDs</strong>.
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label>URLs oder IDs (eine pro Zeile)</Label>
                 <Textarea
                   placeholder="https://www.kleinanzeigen.de/... &#10;12345678 &#10;..."
                   value={bulkUrls}
                   onChange={(e) => setBulkUrls(e.target.value)}
                   className="min-h-[200px] font-mono text-sm"
                 />
                 <p className="text-xs text-muted-foreground">
                   Tipp: Du kannst auch einfach nur die ID (z.B. 2938471) eingeben.
                 </p>
               </div>
               <div className="flex items-center space-x-2">
                  <input
                   type="checkbox"
                   id="dl-bulk"
                   checked={downloadImages}
                   onChange={(e) => setDownloadImages(e.target.checked)}
                   className="rounded border-gray-300"
                 />
                 <Label htmlFor="dl-bulk">Bilder herunterladen</Label>
               </div>
               <Button onClick={handleBulkScrape} disabled={loading || !bulkUrls} className="w-full">
                 {loading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                 Scraping starten
               </Button>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== RESULTS GRID ==================== */}
      {results && results.articles && results.articles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Ergebnisse: {results.count || results.articles.length} Artikel
            </h2>
            {results.folder && (
               <Badge variant="secondary"><FolderOpen className="w-3 h-3 mr-1"/> {results.folder}</Badge>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.articles.map((article, index) => (
              <motion.div
                key={article.id || index}
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
                        onError={(e: any) => {
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
                       {article.price && (
                        <Badge className="bg-primary/90 text-primary-foreground font-bold">
                            {article.price}
                        </Badge>
                       )}
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2 text-sm">
                      {article.title || "Ohne Titel"}
                    </h3>

                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="line-clamp-1">{article.location || "Unbekannt"}</span>
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
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
                <div className="grid gap-2 grid-cols-3">
                    {/* Combine all sources but prefer downloaded/local */}
                    {(() => {
                        const imgs = [];
                        if (selectedArticle.downloadedImages) {
                             imgs.push(...selectedArticle.downloadedImages.map(d => d.url));
                        } else if (selectedArticle.localImages) {
                             imgs.push(...selectedArticle.localImages.map(l => `/api${l}`));
                        } else if (selectedArticle.images) {
                             imgs.push(...selectedArticle.images.map(i => i.startsWith('/images') ? `/api${i}` : i));
                        }
                        return imgs.slice(0, 9).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Bild ${idx + 1}`}
                            className="rounded-lg aspect-square object-cover bg-muted"
                          />
                        ));
                    })()}
                </div>

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

