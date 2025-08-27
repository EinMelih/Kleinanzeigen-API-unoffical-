import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Activity, Shield } from "lucide-react";

const monitoringData = {
  events: 268,
  queues: 12,
  limits: 45,
  captcha: 63,
};

export default function Monitoring() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.5 }}
    >
      <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm shadow-[0_8px_40px_-12px_rgba(0,0,0,0.45)] hover:shadow-[0_10px_48px_-10px_rgba(0,0,0,0.55)] transition-shadow duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              className="text-center p-3 bg-secondary/20"
              style={{ borderRadius: "0.75rem" }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-foreground">
                {monitoringData.events}
              </div>
              <div className="text-xs text-muted-foreground">Events</div>
              {/* Mini Chart */}
              <div className="mt-2 h-6 flex items-end justify-center gap-1">
                {[3, 7, 4, 8, 6, 9, 5, 7].map((height, index) => (
                  <motion.div
                    key={index}
                    className="w-1 bg-primary/60"
                    style={{
                      borderRadius: "0.125rem",
                      height: `${height * 2 + 4}px`,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${height * 2 + 4}px` }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
                  />
                ))}
              </div>
            </motion.div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Queues</span>
                <span className="font-medium text-foreground">
                  {monitoringData.queues}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Limits</span>
                <span className="font-medium text-foreground">
                  {monitoringData.limits}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Captcha</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {monitoringData.captcha}
                  </span>
                  <motion.div
                    className="w-8 h-8 bg-primary/20 flex items-center justify-center"
                    style={{ borderRadius: "50%" }}
                    whileHover={{
                      scale: 1.1,
                      backgroundColor: "rgba(45,225,118,0.3)",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Shield className="h-4 w-4 text-primary" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="text-xs bg-success/20 text-success border-success/30"
            >
              System OK
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs bg-warning/20 text-warning border-warning/30"
            >
              Queue Full
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
