import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
  MessageSquare,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: "system" | "ads" | "messages" | "performance";
}

interface RadarMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  priority: "low" | "medium" | "high";
  category: "inquiry" | "offer" | "question" | "complaint";
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: "notif_1",
    type: "success",
    title: "Inserat erfolgreich veröffentlicht",
    message: "Ihr iPhone 14 Pro Inserat ist jetzt online",
    timestamp: "2024-01-25T16:30:00Z",
    read: false,
    category: "ads",
  },
  {
    id: "notif_2",
    type: "warning",
    title: "Niedriger Lagerbestand",
    message: "Vintage Lederjacke ist fast ausverkauft",
    timestamp: "2024-01-25T15:45:00Z",
    read: false,
    category: "system",
  },
  {
    id: "notif_3",
    type: "info",
    title: "Neue Nachricht erhalten",
    message: "Sarah Müller hat eine Frage zu Ihrem iPhone",
    timestamp: "2024-01-25T15:20:00Z",
    read: false,
    category: "messages",
  },
  {
    id: "notif_4",
    type: "success",
    title: "Performance gesteigert",
    message: "Ihr MacBook Inserat hat 25% mehr Aufrufe",
    timestamp: "2024-01-25T14:30:00Z",
    read: true,
    category: "performance",
  },
];

const mockMessages: RadarMessage[] = [
  {
    id: "msg_1",
    sender: "Sarah Müller",
    content: "Ist das iPhone noch verfügbar?",
    timestamp: "2024-01-25T16:30:00Z",
    priority: "high",
    category: "inquiry",
  },
  {
    id: "msg_2",
    sender: "Thomas Weber",
    content: "Können Sie den Preis reduzieren?",
    timestamp: "2024-01-25T15:45:00Z",
    priority: "medium",
    category: "offer",
  },
  {
    id: "msg_3",
    sender: "Lisa Schmidt",
    content: "Wann können Sie liefern?",
    timestamp: "2024-01-25T15:20:00Z",
    priority: "low",
    category: "question",
  },
];

const NotificationCard = ({
  notification,
  onDismiss,
  onRead,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}) => {
  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return CheckCircle;
      case "warning":
        return AlertTriangle;
      case "error":
        return AlertTriangle;
      case "info":
        return Info;
      default:
        return Info;
    }
  };

  const getColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-blue-500";
    }
  };

  const Icon = getIcon(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      className="relative"
    >
      <Card
        className={`group hover:shadow-lg transition-all duration-300 ${
          notification.read ? "opacity-60" : "opacity-100"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Icon className={`h-5 w-5 mt-0.5 ${getColor(notification.type)}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <div className="flex items-center space-x-2">
                  {!notification.read && (
                    <Badge variant="default" className="text-xs">
                      Neu
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {notification.category}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {notification.message}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleString("de-DE")}
                </span>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRead(notification.id)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismiss(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const MessageCard = ({ message }: { message: RadarMessage }) => {
  const getPriorityColor = (priority: RadarMessage["priority"]) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-50 dark:bg-red-950/20";
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
      case "low":
        return "border-green-500 bg-green-50 dark:bg-green-950/20";
      default:
        return "border-gray-500 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  const getCategoryIcon = (category: RadarMessage["category"]) => {
    switch (category) {
      case "inquiry":
        return MessageSquare;
      case "offer":
        return TrendingUp;
      case "question":
        return Info;
      case "complaint":
        return AlertTriangle;
      default:
        return MessageSquare;
    }
  };

  const CategoryIcon = getCategoryIcon(message.category);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      <Card
        className={`border-l-4 ${getPriorityColor(
          message.priority
        )} hover:shadow-md transition-all duration-300`}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <CategoryIcon className="h-4 w-4 mt-1 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">{message.sender}</h4>
                <Badge variant="outline" className="text-xs">
                  {message.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {message.content}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {message.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(message.timestamp).toLocaleString("de-DE")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function Radar() {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [messages, setMessages] = useState<RadarMessage[]>(mockMessages);
  const [showRead, setShowRead] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "messages">(
    "notifications"
  );

  const unreadCount = notifications.filter((n) => !n.read).length;
  const highPriorityMessages = messages.filter(
    (m) => m.priority === "high"
  ).length;

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleReadNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifications = showRead
    ? notifications
    : notifications.filter((n) => !n.read);

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
            Radar
          </h1>
          <p className="text-muted-foreground">
            Überwachen Sie alle Aktivitäten und Benachrichtigungen
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{unreadCount}</div>
            <div className="text-sm text-muted-foreground">Ungelesen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {highPriorityMessages}
            </div>
            <div className="text-sm text-muted-foreground">Wichtig</div>
          </div>
        </div>
      </motion.div>

      {/* Radar Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <Bell className="h-8 w-8 mx-auto mb-3 text-blue-500" />
              <div className="text-2xl font-bold">{notifications.length}</div>
              <div className="text-sm text-muted-foreground">
                Benachrichtigungen
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 text-green-500" />
              <div className="text-2xl font-bold">{messages.length}</div>
              <div className="text-sm text-muted-foreground">Nachrichten</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 mx-auto mb-3 text-purple-500" />
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-muted-foreground">
                Aktive Inserate
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <Zap className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Boosts aktiv</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === "notifications" ? "default" : "ghost"}
          onClick={() => setActiveTab("notifications")}
          className="relative"
        >
          <Bell className="h-4 w-4 mr-2" />
          Benachrichtigungen
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === "messages" ? "default" : "ghost"}
          onClick={() => setActiveTab("messages")}
          className="relative"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Nachrichten
          {highPriorityMessages > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {highPriorityMessages}
            </Badge>
          )}
        </Button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "notifications" ? (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Controls */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Benachrichtigungen</h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRead(!showRead)}
                >
                  {showRead ? (
                    <EyeOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {showRead ? "Alle verstecken" : "Alle anzeigen"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNotifications([])}
                >
                  Alle löschen
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Benachrichtigungen</p>
                  <p className="text-sm">Alle sind auf dem neuesten Stand</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onDismiss={handleDismissNotification}
                    onRead={handleReadNotification}
                  />
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="messages"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Controls */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Nachrichten</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  Hoch: {messages.filter((m) => m.priority === "high").length}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Mittel:{" "}
                  {messages.filter((m) => m.priority === "medium").length}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Niedrig: {messages.filter((m) => m.priority === "low").length}
                </Badge>
              </div>
            </div>

            {/* Messages List */}
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Nachrichten</p>
                  <p className="text-sm">Alle Nachrichten wurden bearbeitet</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
