import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Clock, Euro } from "lucide-react";

const recentItems = [
  {
    id: 1,
    name: "Spielkonsole",
    location: "Heidelberg",
    time: "vor 2 Min.",
    price: 299,
    image: "console",
  },
  {
    id: 2,
    name: "Fahrrad",
    location: "Karlsruhe",
    time: "vor 14 Min.",
    price: 450,
    image: "bike",
  },
  {
    id: 3,
    name: "Schiefsofa",
    location: "Mannheim",
    time: "vor 29 Min.",
    price: 680,
    image: "sofa",
  },
];

const gradients = [
  "from-blue-500/20 to-purple-500/20",
  "from-green-500/20 to-emerald-500/20",
  "from-orange-500/20 to-red-500/20",
];

export default function RecentItems() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.2 }}
    >
      <Card className="dash-card">
        <CardHeader className="dash-card-header">
          <CardTitle className="dash-title flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Renefen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.2 }}
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 p-4 bg-secondary/25 hover:bg-secondary/35 border border-border/40 hover:border-border/60 transition-all duration-200 cursor-pointer"
              style={{ borderRadius: "0.75rem" }}
            >
              {/* Item Image Placeholder */}
              <div
                className={`w-14 h-14 bg-gradient-to-br ${gradients[index]} flex items-center justify-center`}
                style={{ borderRadius: "0.5rem" }}
              >
                <Euro className="h-7 w-7 text-white/80" />
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.name}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs ml-2 bg-primary/10 text-primary border-primary/30"
                  >
                    {item.price}€
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {item.location}
                  </p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
