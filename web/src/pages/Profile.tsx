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
  Bell,
  Bookmark,
  Edit3,
  Eye,
  Heart,
  MessageCircle,
  Plus,
  Save,
  Search,
  Settings,
  Star,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  activeAds: number;
  adsLast30Days: number;
  totalViews: number;
  rating: number;
  memberSince: string;
}

interface SavedSearch {
  id: string;
  title: string;
  query: string;
  location: string;
  priceRange: { min: number; max: number };
  notifications: boolean;
  created: string;
  lastMatches: number;
}

interface FollowedUser {
  id: string;
  displayName: string;
  avatar?: string;
  lastSeen: string;
  mutualFollows: boolean;
  adCount: number;
}

interface BookmarkedAd {
  id: string;
  title: string;
  price: number;
  location: string;
  image?: string;
  saved: string;
  status: "active" | "sold" | "removed";
}

// Mock data
const mockProfile: UserProfile = {
  id: "user_123",
  displayName: "Max Mustermann",
  email: "max.mustermann@email.com",
  activeAds: 11,
  adsLast30Days: 12,
  totalViews: 2847,
  rating: 4.8,
  memberSince: "2022-03-15",
};

const mockSavedSearches: SavedSearch[] = [
  {
    id: "search_1",
    title: "iPhone 14 Pro Max",
    query: "iPhone 14 Pro Max",
    location: "Berlin",
    priceRange: { min: 800, max: 1200 },
    notifications: true,
    created: "2024-01-15",
    lastMatches: 3,
  },
  {
    id: "search_2",
    title: "Gaming PC RTX 4070",
    query: "Gaming PC RTX 4070",
    location: "München",
    priceRange: { min: 1000, max: 2000 },
    notifications: false,
    created: "2024-01-20",
    lastMatches: 7,
  },
  {
    id: "search_3",
    title: "BMW E46 Touring",
    query: "BMW E46 Touring",
    location: "Hamburg",
    priceRange: { min: 5000, max: 15000 },
    notifications: true,
    created: "2024-01-10",
    lastMatches: 2,
  },
];

const mockFollowedUsers: FollowedUser[] = [
  {
    id: "user_456",
    displayName: "Anna Schmidt",
    lastSeen: "2 Stunden",
    mutualFollows: true,
    adCount: 8,
  },
  {
    id: "user_789",
    displayName: "Michael Weber",
    lastSeen: "1 Tag",
    mutualFollows: false,
    adCount: 15,
  },
  {
    id: "user_101",
    displayName: "Lisa Johnson",
    lastSeen: "3 Tage",
    mutualFollows: true,
    adCount: 4,
  },
];

const mockBookmarks: BookmarkedAd[] = [
  {
    id: "ad_1",
    title: "iPhone 13 Pro 128GB Space Grau",
    price: 750,
    location: "Berlin Mitte",
    saved: "Vor 2 Tagen",
    status: "active",
  },
  {
    id: "ad_2",
    title: "MacBook Pro M2 14 Zoll",
    price: 1899,
    location: "München",
    saved: "Vor 1 Woche",
    status: "sold",
  },
  {
    id: "ad_3",
    title: "Vintage Lederjacke Größe M",
    price: 85,
    location: "Hamburg",
    saved: "Vor 3 Tagen",
    status: "active",
  },
];

const ActivityCard = ({
  icon: Icon,
  title,
  value,
  change,
  color = "text-primary",
}: {
  icon: any;
  title: string;
  value: string | number;
  change?: string;
  color?: string;
}) => (
  <Card
    variant="glass"
    className="group hover:shadow-lg transition-all duration-300"
  >
    <CardContent className="p-4">
      <div className="flex items-center space-x-3">
        <div
          className={`p-2 rounded-lg bg-gradient-to-br from-background to-muted ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-lg font-bold">{value}</p>
          {change && (
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {change}
            </p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(mockProfile);
  const [editedName, setEditedName] = useState(profile.displayName);
  const { toast } = useToast();

  const handleSaveProfile = () => {
    setProfile({ ...profile, displayName: editedName });
    setIsEditing(false);
    toast({
      title: "Profil gespeichert",
      description: "Ihre Änderungen wurden erfolgreich gespeichert.",
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
            Mein Profil
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Kleinanzeigen-Aktivitäten und Einstellungen
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20"
        >
          <User className="h-3 w-3 mr-1" />
          Account Manager
        </Badge>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger
            value="bookmarks"
            className="flex items-center space-x-2"
          >
            <Bookmark className="h-4 w-4" />
            <span>Merkliste</span>
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Folge ich</span>
          </TabsTrigger>
          <TabsTrigger
            value="followers"
            className="flex items-center space-x-2"
          >
            <UserCheck className="h-4 w-4" />
            <span>Follower</span>
          </TabsTrigger>
          <TabsTrigger value="searches" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Suchaufträge</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Edit3 className="h-5 w-5 mr-2 text-primary" />
                      Profil bearbeiten
                    </CardTitle>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isEditing) {
                          handleSaveProfile();
                        } else {
                          setIsEditing(true);
                        }
                      }}
                    >
                      {isEditing ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Speichern
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Anzeigenname</Label>
                      {isEditing ? (
                        <Input
                          id="displayName"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="transition-all duration-200"
                        />
                      ) : (
                        <div className="p-3 rounded-lg bg-muted/50 text-sm font-medium">
                          {profile.displayName}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>E-Mail</Label>
                      <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                        {profile.email}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                      Deine Aktivität
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <ActivityCard
                        icon={TrendingUp}
                        title="Anzeigen online"
                        value={profile.activeAds}
                        change="Aktuell aktiv"
                        color="text-primary"
                      />
                      <ActivityCard
                        icon={Plus}
                        title="Letzten 30 Tage"
                        value={profile.adsLast30Days}
                        change="Neue Anzeigen"
                        color="text-green-500"
                      />
                      <ActivityCard
                        icon={Eye}
                        title="Gesamtaufrufe"
                        value={profile.totalViews.toLocaleString()}
                        change="+15% diese Woche"
                        color="text-blue-500"
                      />
                      <ActivityCard
                        icon={Star}
                        title="Bewertung"
                        value={`${profile.rating}/5.0`}
                        change="Excellent"
                        color="text-orange-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-gray-500" />
                    Schnellaktionen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Anzeige erstellen
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Nachrichten verwalten
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Benachrichtigungen
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Account Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Mitglied seit:
                    </span>
                    <span>
                      {new Date(profile.memberSince).toLocaleDateString(
                        "de-DE"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account ID:</span>
                    <span className="font-mono text-xs">{profile.id}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Bookmarks Tab */}
        <TabsContent value="bookmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bookmark className="h-5 w-5 mr-2 text-primary" />
                Meine Merkliste
                <Badge variant="secondary" className="ml-2">
                  {mockBookmarks.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Ihre gespeicherten Anzeigen und Favoriten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockBookmarks.map((bookmark, index) => (
                  <motion.div
                    key={bookmark.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      variant="glass"
                      className="group hover:shadow-lg transition-all duration-300"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                              {bookmark.title}
                            </h3>
                            <Badge
                              variant={
                                bookmark.status === "active"
                                  ? "default"
                                  : bookmark.status === "sold"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {bookmark.status === "active"
                                ? "Aktiv"
                                : bookmark.status === "sold"
                                ? "Verkauft"
                                : "Entfernt"}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-primary">
                              {bookmark.price.toLocaleString("de-DE")} €
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {bookmark.location}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Gespeichert {bookmark.saved}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Anzeigen
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Heart className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-primary" />
                Nutzer denen ich folge
                <Badge variant="secondary" className="ml-2">
                  {mockFollowedUsers.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Profile die Sie verfolgen und deren neue Anzeigen Sie
                interessieren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockFollowedUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      variant="glass"
                      className="group hover:shadow-md transition-all duration-300"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">
                                  {user.displayName}
                                </h3>
                                {user.mutualFollows && (
                                  <Badge variant="outline" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    Gegenseitig
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.adCount} Anzeigen • Online vor{" "}
                                {user.lastSeen}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Nachricht
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-3 w-3 mr-1" />
                              Anzeigen
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Followers Tab */}
        <TabsContent value="followers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="h-5 w-5 mr-2 text-primary" />
                Meine Follower
                <Badge variant="secondary" className="ml-2">
                  8
                </Badge>
              </CardTitle>
              <CardDescription>
                Nutzer die Ihrem Profil folgen und über neue Anzeigen informiert
                werden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Follower-Funktionalität in Entwicklung</p>
                <p className="text-sm">
                  Bald können Sie sehen, wer Ihnen folgt
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved Searches Tab */}
        <TabsContent value="searches" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2 text-primary" />
                    Meine Suchaufträge
                    <Badge variant="secondary" className="ml-2">
                      {mockSavedSearches.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Gespeicherte Suchanfragen und automatische
                    Benachrichtigungen
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Suche
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSavedSearches.map((search, index) => (
                  <motion.div
                    key={search.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      variant="glass"
                      className="group hover:shadow-md transition-all duration-300"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{search.title}</h3>
                              {search.notifications && (
                                <Badge variant="outline" className="text-xs">
                                  <Bell className="h-3 w-3 mr-1" />
                                  Benachrichtigungen
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>{search.location}</span>
                              <span className="mx-2">•</span>
                              <span>
                                {search.priceRange.min}€ -{" "}
                                {search.priceRange.max}€
                              </span>
                              <span className="mx-2">•</span>
                              <span>{search.lastMatches} neue Treffer</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Erstellt am{" "}
                              {new Date(search.created).toLocaleDateString(
                                "de-DE"
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              Ergebnisse
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
