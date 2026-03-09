import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RuleBuilder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rule Builder</CardTitle>
        <CardDescription>
          Der Rule Builder ist aktuell als naechster Ausbauschritt eingeplant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Sinnvoll wird diese Seite erst, wenn Search-Runs, Notification Events und
          User-Settings persistent gespeichert werden. Das vorbereitete Supabase-Schema
          deckt diese Richtung bereits ab.
        </p>
      </CardContent>
    </Card>
  );
}
