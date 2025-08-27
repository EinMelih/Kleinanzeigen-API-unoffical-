import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  Cookie,
  Globe,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Shield,
  User,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    color: "text-blue-500",
  },
  { name: "Items", href: "/items", icon: Package, color: "text-green-500" },
  { name: "Ads", href: "/ads", icon: Globe, color: "text-purple-500" },
  {
    name: "Nachrichten",
    href: "/messages",
    icon: MessageSquare,
    color: "text-orange-500",
  },
  {
    name: "Radar",
    href: "/radar",
    icon: Bell,
    color: "text-orange-500",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    color: "text-cyan-500",
  },
  {
    name: "Tasks & Events",
    href: "/tasks-events",
    icon: Zap,
    color: "text-yellow-500",
  },
  {
    name: "Regeln (SAFE)",
    href: "/rules",
    icon: Shield,
    color: "text-red-500",
  },
  {
    name: "Mein Profil",
    href: "/profile",
    icon: User,
    color: "text-purple-500",
  },
  { name: "Auth", href: "/auth", icon: Shield, color: "text-primary" },
  { name: "Cookies", href: "/cookies", icon: Cookie, color: "text-primary" },
  { name: "Health", href: "/health", icon: Activity, color: "text-green-500" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
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
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-red-800 rounded-full"></div>
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
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card/95 backdrop-blur-xl border-r border-border/50 px-6 pb-4">
          <div className="flex h-16 items-center border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-green-400 to-primary rounded-xl flex items-center justify-center text-background font-bold text-xl shadow-lg">
                  ka
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-red-800 rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary">
                  kleinanzeigen
                </h1>
                <p className="text-xs text-muted-foreground">Workspace</p>
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
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/50 bg-background/95 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-primary/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>SAFE ON</span>
                <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Live
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden sm:flex items-center space-x-2 text-xs text-muted-foreground">
                <span>Proxy: OK</span>
                <span>•</span>
                <span>Rate: SLOW</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
