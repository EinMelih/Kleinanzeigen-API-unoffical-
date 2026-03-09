import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MyAds() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meine Anzeigen</CardTitle>
        <CardDescription>
          Diese Ansicht ist derzeit nur konzeptionell vorgesehen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Fuer eine echte Anzeigenverwaltung brauchen wir zuerst persistente Datenquellen
          oder direkte Kleinanzeigen-Endpoints fuer eigene Inserate.
        </p>
      </CardContent>
    </Card>
  );
}
