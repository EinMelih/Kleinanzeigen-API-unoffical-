import { PageStatusNotice } from "@/components/PageStatusNotice";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { appClient } from "@/lib/app-client";
import { FeatureStatus } from "@/lib/app-types";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Cookie,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings2,
  Shield,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    color: "text-blue-500",
  },
  { name: "Auth", href: "/auth/login", icon: Shield, color: "text-emerald-500" },
  { name: "Cookies", href: "/cookies", icon: Cookie, color: "text-amber-500" },
  { name: "Search", href: "/search", icon: Search, color: "text-pink-500" },
  { name: "Health", href: "/health", icon: Activity, color: "text-cyan-500" },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings2,
    color: "text-violet-500",
  },
  { name: "Items", href: "/items", icon: Package, color: "text-green-500" },
  { name: "Messages", href: "/messages", icon: MessageSquare, color: "text-orange-500" },
  { name: "Radar", href: "/radar", icon: Bell, color: "text-yellow-500" },
  { name: "Profil", href: "/profile", icon: User, color: "text-purple-500" },
];

const PAGE_STATUS: Record<
  string,
  { status: FeatureStatus; title: string; description: string }
> = {
  "/": {
    status: "live",
    title: "Dashboard ist live an die API gekoppelt",
    description:
      "Hier siehst du echten Status fuer Account, Cookies, Search-Speicher und den Implementierungsstand.",
  },
  "/auth/login": {
    status: "live",
    title: "Auth nutzt echte Login- und Check-Endpunkte",
    description:
      "Login und Live-Check gehen direkt gegen die vorhandene Browser- und Cookie-Automation.",
  },
  "/cookies": {
    status: "live",
    title: "Cookie-Management ist aktiv",
    description:
      "Status, Details, Refresh und Auto-Refresh laufen gegen die echten Backend-Endpunkte.",
  },
  "/search": {
    status: "live",
    title: "Search und Scraping sind live",
    description:
      "Live-Suche, lokale Trefferordner und Bulk-Scrape sprechen die API direkt an.",
  },
  "/health": {
    status: "live",
    title: "Health zeigt echten Backend-Zustand",
    description:
      "API, Message-Service, Cookie-Zahlen und Persistenzmodus werden live geladen.",
  },
  "/settings": {
    status: "partial",
    title: "Settings sind lokal gespeichert",
    description:
      "Account und Telegram sind bearbeitbar, die Werte landen aktuell in .env plus lokaler JSON-Datei statt Datenbank.",
  },
  "/items": {
    status: "preview",
    title: "Items ist aktuell nur UI-Vorschau",
    description:
      "Die Seite ist sichtbar, aber noch nicht mit echten Backend-Daten oder Persistenz verdrahtet.",
  },
  "/messages": {
    status: "preview",
    title: "Messages ist noch UI-first",
    description:
      "Es gibt echte Message-Endpunkte, die Seite selbst nutzt aber noch Mock-Daten und dient als Vorschau.",
  },
  "/radar": {
    status: "preview",
    title: "Radar ist noch nicht live verdrahtet",
    description:
      "Die UI zeigt die geplante Richtung. Automatische Notifies und Regeln kommen spaeter.",
  },
  "/profile": {
    status: "preview",
    title: "Profil ist noch Prototyp",
    description:
      "Die Seite ist nur visuell vorbereitet und noch nicht an eine Persistenzschicht angebunden.",
  },
};

interface HeaderStatus {
  apiOnline: boolean;
  accountLabel: string;
  accountState: string;
}

function getHeaderStatusLabel(
  configured: boolean,
  email: string,
  isLoggedIn: boolean
): { accountLabel: string; accountState: string } {
  if (!configured) {
    return {
      accountLabel: "Kein Standard-Account",
      accountState: "nicht konfiguriert",
    };
  }

  return {
    accountLabel: email,
    accountState: isLoggedIn ? "Cookie aktiv" : "nicht eingeloggt",
  };
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerStatus, setHeaderStatus] = useState<HeaderStatus>({
    apiOnline: false,
    accountLabel: "Lade Status...",
    accountState: "warte auf API",
  });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      try {
        const overview = await appClient.getOverview();
        const account = getHeaderStatusLabel(
          overview.account.configured,
          overview.account.email,
          overview.account.isLoggedIn
        );

        if (!cancelled) {
          setHeaderStatus({
            apiOnline: overview.status === "success",
            accountLabel: account.accountLabel,
            accountState: account.accountState,
          });
        }
      } catch {
        if (!cancelled) {
          setHeaderStatus({
            apiOnline: false,
            accountLabel: "API nicht erreichbar",
            accountState: "Backend pruefen",
          });
        }
      }
    };

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const currentStatus = PAGE_STATUS[location.pathname];

  return (
    <div className="min-h-screen bg-background">
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-lg"
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed left-0 top-0 h-full w-72 bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-2xl transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-6 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-primary via-green-400 to-primary rounded-lg flex items-center justify-center text-background font-bold text-lg shadow-lg">
                  ka
                </div>
              </div>
              <h1 className="text-lg font-bold text-primary">kleinanzeigen</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-4 w-4 transition-colors ${
                      isActive ? item.color : "group-hover:" + item.color
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card/95 backdrop-blur-xl border-r border-border/50 px-6 pb-4">
          <div className="flex h-16 items-center border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-green-400 to-primary rounded-xl flex items-center justify-center text-background font-bold text-xl shadow-lg">
                ka
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary">kleinanzeigen</h1>
                <p className="text-xs text-muted-foreground">Control Center</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-4 w-4 transition-colors ${
                      isActive ? item.color : "group-hover:" + item.color
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/50 bg-background/95 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-primary/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 items-center justify-between gap-4">
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    headerStatus.apiOnline ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>{headerStatus.apiOnline ? "API online" : "API offline"}</span>
              </div>
              <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                {headerStatus.accountState}
              </div>
              <div className="text-xs text-muted-foreground truncate max-w-[260px]">
                {headerStatus.accountLabel}
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6 animate-fade-in">
              {currentStatus && (
                <PageStatusNotice
                  status={currentStatus.status}
                  title={currentStatus.title}
                  description={currentStatus.description}
                />
              )}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
