import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Analytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>
          Analytics ist aktuell noch kein Live-Modul.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Die fruehere Seite basierte auf nicht vorhandenen Loadern und Demo-Daten.
          Wenn du echte Analytics willst, sollten wir sie spaeter auf Basis von Search-Runs,
          Notifications und gespeicherten Items aufbauen.
        </p>
      </CardContent>
    </Card>
  );
}
