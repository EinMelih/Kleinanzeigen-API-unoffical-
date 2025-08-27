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
  Edit3,
  Eye,
  Filter,
  MapPin,
  Package,
  Plus,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  attributes: {
    condition: string;
    color?: string;
    material?: string;
    type?: string;
  };
  location: {
    zip: string;
    city: string;
    lat?: number;
    lon?: number;
  };
  owner: {
    platform_account_id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  linked_ads_count: number;
}

// Mock data
const mockItems: Item[] = [
  {
    id: "item_1",
    title: "iPhone 14 Pro 128GB Space Grau",
    description:
      "**Perfekter Zustand** - Nur 6 Monate alt\n\n- Alle Original-Zubehör\n- iOS 17.2\n- Keine Kratzer\n- Akku-Gesundheit: 98%",
    category: "Elektronik > Smartphones",
    attributes: {
      condition: "Sehr gut",
      color: "Space Grau",
      material: "Glas & Aluminium",
      type: "Smartphone",
    },
    location: {
      zip: "10115",
      city: "Berlin",
      lat: 52.52,
      lon: 13.405,
    },
    owner: {
      platform_account_id: "acc_123",
      name: "Max Mustermann",
    },
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:15:00Z",
    linked_ads_count: 2,
  },
  {
    id: "item_2",
    title: "MacBook Pro M2 14 Zoll",
    description:
      "**Gebraucht aber top**\n\n- M2 Chip 8-Core\n- 16GB RAM\n- 512GB SSD\n- macOS Ventura\n- Leichte Gebrauchsspuren",
    category: "Elektronik > Computer",
    attributes: {
      condition: "Gut",
      color: "Silber",
      material: "Aluminium",
      type: "Laptop",
    },
    location: {
      zip: "80331",
      city: "München",
      lat: 48.1351,
      lon: 11.582,
    },
    owner: {
      platform_account_id: "acc_456",
      name: "Anna Schmidt",
    },
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-18T16:45:00Z",
    linked_ads_count: 1,
  },
  {
    id: "item_3",
    title: "Vintage Lederjacke Größe M",
    description:
      "**Echte Vintage-Qualität**\n\n- 100% Leder\n- Made in Germany\n- 80er Jahre Stil\n- Perfekte Passform",
    category: "Mode > Jacken",
    attributes: {
      condition: "Gut",
      color: "Braun",
      material: "Leder",
      type: "Jacke",
    },
    location: {
      zip: "20095",
      city: "Hamburg",
      lat: 53.5511,
      lon: 9.9937,
    },
    owner: {
      platform_account_id: "acc_789",
      name: "Michael Weber",
    },
    created_at: "2024-01-05T11:20:00Z",
    updated_at: "2024-01-12T13:30:00Z",
    linked_ads_count: 0,
  },
];

const ItemCard = ({
  item,
  onEdit,
  onDelete,
  onView,
}: {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onView: (item: Item) => void;
}) => (
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
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {item.category.split(" > ")[0]}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {item.attributes.condition}
                </Badge>
                {item.linked_ads_count > 0 && (
                  <Badge variant="default" className="text-xs">
                    {item.linked_ads_count} Ads
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => onView(item)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(item)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Description Preview */}
          <div className="text-sm text-muted-foreground line-clamp-2">
            {item.description
              .replace(/\*\*(.*?)\*\*/g, "$1")
              .replace(/\n/g, " ")}
          </div>

          {/* Attributes */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {item.attributes.color && (
              <div className="flex items-center space-x-1">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Farbe:</span>
                <span>{item.attributes.color}</span>
              </div>
            )}
            {item.attributes.material && (
              <div className="flex items-center space-x-1">
                <Package className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Material:</span>
                <span>{item.attributes.material}</span>
              </div>
            )}
          </div>

          {/* Location & Owner */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>
                {item.location.zip} {item.location.city}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{item.owner.name}</span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground">
            Erstellt: {new Date(item.created_at).toLocaleDateString("de-DE")}
            {item.updated_at !== item.created_at && (
              <span className="ml-2">
                • Aktualisiert:{" "}
                {new Date(item.updated_at).toLocaleDateString("de-DE")}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function Items() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { toast } = useToast();

  const filteredItems = mockItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || item.category.startsWith(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set(mockItems.map((item) => item.category.split(" > ")[0]))
  );

  const handleEdit = (item: Item) => {
    toast({
      title: "Item bearbeiten",
      description: `Bearbeite "${item.title}"`,
    });
  };

  const handleDelete = (item: Item) => {
    toast({
      title: "Item löschen",
      description: `Lösche "${item.title}"`,
      variant: "destructive",
    });
  };

  const handleView = (item: Item) => {
    setSelectedItem(item);
  };

  const handleCreateAd = (item: Item) => {
    toast({
      title: "Inserat erstellen",
      description: `Erstelle Inserat für "${item.title}"`,
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
            Items (Artikel)
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Artikel und deren Eigenschaften
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          <Plus className="h-4 w-4 mr-2" />
          Neues Item
        </Button>
      </motion.div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Liste</TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedItem}>
            Detailansicht
          </TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter & Suche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="search">Suche</Label>
                  <Input
                    id="search"
                    placeholder="Titel oder Beschreibung..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategorie</Label>
                  <select
                    id="category"
                    className="w-full p-2 border rounded-md bg-background"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Alle Kategorien</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex space-x-2">
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                    >
                      Alle ({mockItems.length})
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                    >
                      Mit Ads (
                      {mockItems.filter((i) => i.linked_ads_count > 0).length})
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Items gefunden</p>
              <p className="text-sm">
                Passen Sie Ihre Filter an oder erstellen Sie ein neues Item
              </p>
            </div>
          )}
        </TabsContent>

        {/* Detail Tab */}
        <TabsContent value="detail" className="space-y-6">
          {selectedItem && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Item Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2"
              >
                <Card variant="elevated">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl">
                        {selectedItem.title}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => handleEdit(selectedItem)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCreateAd(selectedItem)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Inserat erstellen
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {selectedItem.category} •{" "}
                      {selectedItem.attributes.condition}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="font-semibold mb-2">Beschreibung</h3>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg">
                          {selectedItem.description}
                        </pre>
                      </div>
                    </div>

                    {/* Attributes */}
                    <div>
                      <h3 className="font-semibold mb-2">Eigenschaften</h3>
                      <div className="grid gap-2 md:grid-cols-2">
                        {Object.entries(selectedItem.attributes).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between p-2 bg-muted/30 rounded"
                            >
                              <span className="text-muted-foreground capitalize">
                                {key}:
                              </span>
                              <span className="font-medium">{value}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h3 className="font-semibold mb-2">Standort</h3>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>
                            {selectedItem.location.zip}{" "}
                            {selectedItem.location.city}
                          </span>
                        </div>
                        {selectedItem.location.lat &&
                          selectedItem.location.lon && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Koordinaten: {selectedItem.location.lat},{" "}
                              {selectedItem.location.lon}
                            </div>
                          )}
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
                {/* Owner Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Besitzer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{selectedItem.owner.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account ID:</span>
                      <span className="font-mono text-xs">
                        {selectedItem.owner.platform_account_id}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Metadaten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Erstellt:</span>
                      <span>
                        {new Date(selectedItem.created_at).toLocaleString(
                          "de-DE"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Aktualisiert:
                      </span>
                      <span>
                        {new Date(selectedItem.updated_at).toLocaleString(
                          "de-DE"
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Linked Ads */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Verknüpfte Inserate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        {selectedItem.linked_ads_count} Inserat
                        {selectedItem.linked_ads_count !== 1 ? "e" : ""}
                      </Badge>
                    </div>
                    {selectedItem.linked_ads_count > 0 && (
                      <Button variant="outline" className="w-full">
                        Alle anzeigen
                      </Button>
                    )}
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
