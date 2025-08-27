import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Timer, TrendingUp } from "lucide-react";

const trendingItems = [
  {
    id: 1,
    name: "Gaming Stuhl",
    price: 299,
    originalPrice: 450,
    discount: 34,
    timeLeft: "00:24",
    category: "Möbel",
  },
  {
    id: 2,
    name: "iPhone 14",
    price: 850,
    originalPrice: 1050,
    discount: 19,
    timeLeft: "02:15",
    category: "Elektronik",
  },
];

export default function TrendingItems() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.3 }}
    >
      <Card className="dash-card">
        <CardHeader className="dash-card-header">
          <CardTitle className="dash-title flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trendartikel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.2 }}
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-secondary/25 hover:bg-secondary/35 border border-border/40 hover:border-border/60 transition-all duration-200 cursor-pointer"
              style={{ borderRadius: "0.75rem" }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">
                  {item.name}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  {item.timeLeft}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">
                    {item.price}€
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {item.originalPrice}€
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-destructive/20 text-destructive border-destructive/30"
                  >
                    -{item.discount}%
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
