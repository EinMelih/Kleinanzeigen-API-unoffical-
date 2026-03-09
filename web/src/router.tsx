import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import { NotFound } from "./components/NotFound";
import Ads from "./pages/Ads";
import Auth from "./pages/Auth";
import Cookies from "./pages/Cookies";
import Dashboard from "./pages/Dashboard";
import Health from "./pages/Health";
import Items from "./pages/Items";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Radar from "./pages/Radar";
import Search from "./pages/Search";
import Settings from "./pages/Settings";

const rootRoute = createRootRoute({
  component: Layout,
  errorComponent: ErrorBoundary,
  notFoundComponent: NotFound,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const itemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items",
  component: Items,
});

const adsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ads",
  component: Ads,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: Messages,
});

const radarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/radar",
  component: Radar,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: Search,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/login",
  component: Auth,
});

const cookiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cookies",
  component: Cookies,
});

const healthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/health",
  component: Health,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: Profile,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  itemsRoute,
  adsRoute,
  messagesRoute,
  radarRoute,
  searchRoute,
  settingsRoute,
  authRoute,
  cookiesRoute,
  healthRoute,
  profileRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
