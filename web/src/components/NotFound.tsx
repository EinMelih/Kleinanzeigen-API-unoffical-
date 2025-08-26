import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { FileQuestion, Home, Search } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6 p-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground max-w-md">
          Sorry, we couldn't find the page you're looking for. It might have
          been moved, deleted, or you entered the wrong URL.
        </p>
      </div>

      <div className="flex space-x-3">
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard/search">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Link>
        </Button>
      </div>
    </div>
  );
}
