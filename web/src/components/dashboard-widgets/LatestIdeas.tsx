import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ChevronRight, Lightbulb } from "lucide-react";

const ideas = [
  "Anzeige klonen & speichern",
  "KI-Bewertung & Scoring",
  "Auto-Favorisieren",
];

export default function LatestIdeas() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="dash-card">
        <CardHeader className="dash-card-header flex flex-row items-center justify-between">
          <CardTitle className="dash-title flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Letzte Ideen
          </CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {ideas.map((idea, index) => (
            <motion.div
              key={idea}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.2 }}
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Badge variant="secondary" className="dash-chip">
                {idea}
              </Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
