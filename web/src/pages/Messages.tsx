import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  Ban,
  Check,
  Eye,
  Filter,
  Image,
  MessageSquare,
  Paperclip,
  PaperclipIcon,
  Plus,
  Send,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  thread_id: string;
  direction: "in" | "out" | "system";
  text: string;
  timestamp: string;
  status: "sent" | "failed" | "seen";
  error_code?: string;
  attachments?: Array<{
    id: string;
    type: "image" | "file";
    name: string;
    url: string;
    preview_url?: string;
  }>;
}

interface Thread {
  id: string;
  other_party: {
    name: string;
    id?: string;
    avatar?: string;
  };
  ad_title: string;
  ad_id?: string;
  ad_deleted: boolean;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  status: "open" | "archived" | "blocked";
  messages: Message[];
  created_at: string;
  updated_at: string;
}

// Mock data
const mockThreads: Thread[] = [
  {
    id: "thread_1",
    other_party: {
      name: "Sarah Müller",
      id: "user_456",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    ad_title: "iPhone 14 Pro 128GB Space Grau",
    ad_id: "ad_1",
    ad_deleted: false,
    last_message: "Hallo! Ist das iPhone noch verfügbar?",
    last_message_time: "2024-01-25T16:30:00Z",
    unread_count: 2,
    status: "open",
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-01-25T16:30:00Z",
    messages: [
      {
        id: "msg_1",
        thread_id: "thread_1",
        direction: "in",
        text: "Hallo! Ist das iPhone noch verfügbar?",
        timestamp: "2024-01-25T16:30:00Z",
        status: "seen",
      },
      {
        id: "msg_2",
        thread_id: "thread_1",
        direction: "out",
        text: "Ja, das iPhone ist noch verfügbar! Möchten Sie es sich anschauen?",
        timestamp: "2024-01-25T16:35:00Z",
        status: "sent",
      },
      {
        id: "msg_3",
        thread_id: "thread_1",
        direction: "in",
        text: "Gerne! Können Sie mir mehr Bilder schicken?",
        timestamp: "2024-01-25T16:40:00Z",
        status: "seen",
      },
    ],
  },
  {
    id: "thread_2",
    other_party: {
      name: "Thomas Weber",
      id: "user_789",
    },
    ad_title: "MacBook Pro M2 14 Zoll",
    ad_id: "ad_2",
    ad_deleted: false,
    last_message: "Können Sie den Preis noch etwas reduzieren?",
    last_message_time: "2024-01-24T14:15:00Z",
    unread_count: 0,
    status: "open",
    created_at: "2024-01-15T14:00:00Z",
    updated_at: "2024-01-24T14:15:00Z",
    messages: [
      {
        id: "msg_4",
        thread_id: "thread_2",
        direction: "in",
        text: "Können Sie den Preis noch etwas reduzieren?",
        timestamp: "2024-01-24T14:15:00Z",
        status: "seen",
      },
      {
        id: "msg_5",
        thread_id: "thread_2",
        direction: "out",
        text: "Leider ist der Preis bereits sehr fair für die Qualität. Aber ich kann Ihnen gerne bei der Abholung helfen.",
        timestamp: "2024-01-24T14:20:00Z",
        status: "sent",
      },
    ],
  },
  {
    id: "thread_3",
    other_party: {
      name: "Lisa Schmidt",
      id: "user_123",
    },
    ad_title: "Vintage Lederjacke Größe M",
    ad_id: "ad_3",
    ad_deleted: true,
    last_message: "Die Jacke wurde leider bereits verkauft.",
    last_message_time: "2024-01-22T11:00:00Z",
    unread_count: 0,
    status: "archived",
    created_at: "2024-01-05T11:20:00Z",
    updated_at: "2024-01-22T11:00:00Z",
    messages: [
      {
        id: "msg_6",
        thread_id: "thread_3",
        direction: "system",
        text: "Die Jacke wurde leider bereits verkauft.",
        timestamp: "2024-01-22T11:00:00Z",
        status: "sent",
      },
    ],
  },
];

const ThreadCard = ({
  thread,
  onSelect,
  onArchive,
  onBlock,
}: {
  thread: Thread;
  onSelect: (thread: Thread) => void;
  onArchive: (thread: Thread) => void;
  onBlock: (thread: Thread) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card
      variant="glass"
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => onSelect(thread)}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {thread.other_party.avatar ? (
              <img
                src={thread.other_party.avatar}
                alt={thread.other_party.name}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                {thread.other_party.name}
              </h3>
              <div className="flex items-center space-x-2">
                {thread.unread_count > 0 && (
                  <Badge variant="default" className="text-xs">
                    {thread.unread_count}
                  </Badge>
                )}
                <Badge
                  variant={thread.status === "open" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {thread.status === "open"
                    ? "Offen"
                    : thread.status === "archived"
                    ? "Archiviert"
                    : "Gesperrt"}
                </Badge>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mb-1">
              {thread.ad_deleted ? (
                <span className="text-red-500">Anzeige gelöscht</span>
              ) : (
                thread.ad_title
              )}
            </div>

            <div className="text-sm text-muted-foreground line-clamp-2">
              {thread.last_message}
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              {new Date(thread.last_message_time).toLocaleString("de-DE")}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(thread);
                }}
              >
                <Archive className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onBlock(thread);
                }}
              >
                <Ban className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const MessageBubble = ({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}
  >
    <div className={`max-w-xs lg:max-w-md ${isOwn ? "order-2" : "order-1"}`}>
      <div
        className={`rounded-lg px-4 py-2 ${
          message.direction === "system"
            ? "bg-muted/50 text-muted-foreground text-center"
            : isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        <div className="text-sm">{message.text}</div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center space-x-2">
                {attachment.type === "image" && attachment.preview_url ? (
                  <img
                    src={attachment.preview_url}
                    alt={attachment.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted/50 rounded flex items-center justify-center">
                    <PaperclipIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <span className="text-xs">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timestamp & Status */}
      <div
        className={`flex items-center space-x-2 mt-1 text-xs text-muted-foreground ${
          isOwn ? "justify-end" : "justify-start"
        }`}
      >
        <span>
          {new Date(message.timestamp).toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {isOwn && (
          <div className="flex items-center space-x-1">
            {message.status === "sent" && <Check className="h-3 w-3" />}
            {message.status === "seen" && <Eye className="h-3 w-3" />}
            {message.status === "failed" && (
              <X className="h-3 w-3 text-red-500" />
            )}
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

export default function Messages() {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  const filteredThreads = mockThreads.filter((thread) => {
    const matchesSearch =
      thread.other_party.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      thread.ad_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.last_message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || thread.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread);
  };

  const handleArchive = (thread: Thread) => {
    toast({
      title: "Thread archiviert",
      description: `"${thread.other_party.name}" wurde archiviert`,
    });
  };

  const handleBlock = (thread: Thread) => {
    toast({
      title: "Benutzer gesperrt",
      description: `"${thread.other_party.name}" wurde gesperrt`,
      variant: "destructive",
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedThread) return;

    toast({
      title: "Nachricht gesendet",
      description: "Ihre Nachricht wurde in die Queue eingereiht",
    });

    setNewMessage("");
  };

  const handleBackToList = () => {
    setSelectedThread(null);
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
            Nachrichten & Chats
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Kommunikation rund um Inserate
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Chat
        </Button>
      </motion.div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Threads</TabsTrigger>
          <TabsTrigger value="chat" disabled={!selectedThread}>
            Chat
          </TabsTrigger>
        </TabsList>

        {/* Threads Tab */}
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
                    placeholder="Name, Anzeige oder Nachricht..."
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
                    <option value="open">Offen</option>
                    <option value="archived">Archiviert</option>
                    <option value="blocked">Gesperrt</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Übersicht</Label>
                  <div className="flex space-x-2">
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                    >
                      Alle ({mockThreads.length})
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                    >
                      Ungelesen (
                      {mockThreads.filter((t) => t.unread_count > 0).length})
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                    >
                      Offen (
                      {mockThreads.filter((t) => t.status === "open").length})
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Threads List */}
          <div className="space-y-4">
            {filteredThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onSelect={handleThreadSelect}
                onArchive={handleArchive}
                onBlock={handleBlock}
              />
            ))}
          </div>

          {filteredThreads.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Threads gefunden</p>
              <p className="text-sm">
                Passen Sie Ihre Filter an oder starten Sie einen neuen Chat
              </p>
            </div>
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          {selectedThread && (
            <div className="space-y-6">
              {/* Chat Header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Zurück
                    </Button>

                    <div className="flex items-center space-x-3">
                      {selectedThread.other_party.avatar ? (
                        <img
                          src={selectedThread.other_party.avatar}
                          alt={selectedThread.other_party.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {selectedThread.other_party.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedThread.ad_deleted
                            ? "Anzeige gelöscht"
                            : selectedThread.ad_title}
                        </p>
                      </div>
                    </div>

                    <div className="ml-auto flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchive(selectedThread)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archivieren
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBlock(selectedThread)}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Sperren
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              <Card className="min-h-[400px]">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {selectedThread.messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.direction === "out"}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Message Input */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    <Button size="sm" variant="outline">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Image className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Nachricht eingeben..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Senden
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Nachrichten werden in die Queue eingereiht und nach
                    Bestätigung gesendet
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
