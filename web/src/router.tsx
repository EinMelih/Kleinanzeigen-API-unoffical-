import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { lazy } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import { NotFound } from "./components/NotFound";
import { adsApi, analyticsApi } from "./lib/api";
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

// Create the root route using createRootRoute
const rootRoute = createRootRoute({
  component: Layout,
  errorComponent: ErrorBoundary,
  notFoundComponent: NotFound,
});

// Index route (Dashboard) - the default route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

// Dashboard routes with nested structure
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});

// Items route
const itemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items",
  component: Items,
});

// Ads routes
const adsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ads",
  component: Ads,
});

const adDetailRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/ads/$id",
  component: lazy(() => import("./pages/AdDetail")), // Lazy loaded component
  loader: async ({ params }) => {
    // Fetch specific ad data
    return adsApi.getById(params.id);
  },
});

const adEditRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/ads/$id/edit",
  component: () => <div>Ad Edit Page</div>, // Placeholder component
  loader: async ({ params }) => {
    // Fetch ad data for editing
    return adsApi.getById(params.id);
  },
});

// Messages route
const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: Messages,
});

// Radar route
const radarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/radar",
  component: Radar,
});

// Search route
const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: Search,
});

// Analytics route
const analyticsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/analytics",
  component: lazy(() => import("./pages/Analytics")), // Lazy loaded component
  loader: async () => {
    // Fetch analytics data
    return analyticsApi.getOverview();
  },
});

// Settings route
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => <div>Settings Page</div>, // Placeholder component
});

// Auth login route
const authLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/login",
  component: Auth,
});

// Auth logout route
const authLogoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/logout",
  beforeLoad: () => {
    // Handle logout logic
    return { success: true };
  },
});

// Cookies route
const cookiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cookies",
  component: Cookies,
});

// Health route
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

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  itemsRoute,
  adsRoute,
  messagesRoute,
  radarRoute,
  searchRoute,
  dashboardRoute.addChildren([
    adDetailRoute,
    adEditRoute,
    analyticsRoute,
  ]),
  settingsRoute,
  authLoginRoute,
  authLogoutRoute,
  cookiesRoute,
  healthRoute,
  profileRoute,
]);

// Create the router
export const router = createRouter({ routeTree });

// Register the router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
