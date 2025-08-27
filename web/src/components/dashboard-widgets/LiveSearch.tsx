import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Search, TrendingUp } from "lucide-react";

const timeFilters = ["1h", "6h", "12h", "24h"];

export default function LiveSearch() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
    >
      <Card className="dash-card">
        <CardHeader className="dash-card-header flex flex-row items-center justify-between">
          <CardTitle className="dash-title flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Live-Suche
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wave Chart Placeholder */}
          <div
            className="h-24 w-full bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 relative overflow-hidden"
            style={{ borderRadius: "0.75rem" }}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 400 80"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M0,60 Q50,20 100,40 T200,30 T300,50 T400,25"
                stroke="rgb(45,225,118)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              <motion.path
                d="M0,60 Q50,20 100,40 T200,30 T300,50 T400,25 L400,80 L0,80 Z"
                fill="url(#gradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor="rgb(45,225,118)"
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(45,225,118)"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Time Filters */}
          <div className="flex items-center gap-2">
            {timeFilters.map((filter, index) => (
              <motion.div
                key={filter}
                whileHover={{ y: -1, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  variant={index === 2 ? "default" : "secondary"}
                  className={`dash-chip text-xs ${
                    index === 2 ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  {filter}
                </Badge>
              </motion.div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 h-6"
            >
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
