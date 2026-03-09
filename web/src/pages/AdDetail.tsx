import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export default function AdDetail() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ad Detail</CardTitle>
        <CardDescription>
          Diese Detailansicht ist aktuell nicht an einen echten Route-Loader angebunden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Die Listen- und Detailansicht fuer Ads ist im Frontend noch eine Vorschau.
          Der Fokus liegt aktuell auf Auth, Search, Cookies, Health und Settings.
        </p>
        <Button asChild>
          <Link to="/ads">Zurueck zu Ads</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
