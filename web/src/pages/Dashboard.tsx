import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Monitor,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface HealthData {
  status: string;
  timestamp: string;
  cookieFiles: number;
  cookiesInFile: number;
  totalFiles: number;
  validFiles: number;
  expiredFiles: number;
  totalCookieCount: number;
  nextExpiry: string;
  validityDuration: string;
}

interface ChromeStatus {
  isRunning: boolean;
  port: number;
  lastCheck: string;
}

// Mock data for demo
const mockStats = {
  radarItems: 127,
  activeAds: 45,
  messages: 12,
  tasks: 8,
  systemHealth: 94,
  todayViews: 1247,
  totalUsers: 3420,
  avgResponseTime: 120,
};

const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color = "text-primary",
  delay = 0,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  color?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    <Card
      variant="elevated"
      className="group hover:shadow-lg transition-all duration-300"
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {change}
              </p>
            )}
          </div>
          <div
            className={`p-3 rounded-xl bg-gradient-to-br from-background to-muted group-hover:shadow-lg transition-all duration-300 ${color}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  color = "text-primary",
  delay = 0,
}: {
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  color?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5 }}
  >
    <Card
      variant="glass"
      className="group cursor-pointer hover:scale-105 transition-all duration-300"
      onClick={onClick}
    >
      <CardContent className="p-6 text-center">
        <div
          className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-background to-muted flex items-center justify-center group-hover:shadow-glow transition-all duration-300 ${color}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default function Dashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [chromeStatus, setChromeStatus] = useState<ChromeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // In a real app, these would be actual API calls
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading

      // Mock health data
      setHealthData({
        status: "healthy",
        timestamp: new Date().toISOString(),
        cookieFiles: 5,
        cookiesInFile: 12,
        totalFiles: 15,
        validFiles: 14,
        expiredFiles: 1,
        totalCookieCount: 180,
        nextExpiry: new Date(Date.now() + 86400000 * 7).toISOString(),
        validityDuration: "7 days",
      });

      setChromeStatus({
        isRunning: true,
        port: 9222,
        lastCheck: new Date().toISOString(),
      });
    } catch (error) {
      toast({
        title: "Error loading dashboard",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Loading your workspace...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your RogueAnzeigen workspace overview.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-600 border-green-500/20"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            System Online
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            className="hover:bg-primary/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Radar Items"
          value={mockStats.radarItems}
          change="+18% today"
          icon={Target}
          color="text-primary"
          delay={0.1}
        />
        <StatCard
          title="Active Ads"
          value={mockStats.activeAds}
          change="+5 new"
          icon={Users}
          color="text-purple-500"
          delay={0.2}
        />
        <StatCard
          title="Messages"
          value={mockStats.messages}
          change="+3 unread"
          icon={MessageSquare}
          color="text-orange-500"
          delay={0.3}
        />
        <StatCard
          title="System Health"
          value={`${mockStats.systemHealth}%`}
          change="Excellent"
          icon={Activity}
          color="text-green-500"
          delay={0.4}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card variant="gradient" className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-primary" />
                System Status
              </CardTitle>
              <CardDescription>
                Real-time system health and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Chrome Status</span>
                    <Badge
                      variant={
                        chromeStatus?.isRunning ? "default" : "destructive"
                      }
                    >
                      {chromeStatus?.isRunning ? "Running" : "Stopped"}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-1000"
                      style={{ width: chromeStatus?.isRunning ? "100%" : "0%" }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Cookie Health</span>
                    <Badge variant="default">
                      {healthData?.validFiles}/{healthData?.totalFiles} Valid
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: healthData
                          ? `${
                              (healthData.validFiles / healthData.totalFiles) *
                              100
                            }%`
                          : "0%",
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 text-center">
                <div className="p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-primary">
                    {mockStats.todayViews}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Views Today
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-orange-500">
                    {mockStats.avgResponseTime}ms
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg Response
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-purple-500">
                    {mockStats.totalUsers}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Users
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickActionCard
                title="Start Search"
                description="Begin radar monitoring"
                icon={Search}
                onClick={() => toast({ title: "Search started!" })}
                color="text-primary"
                delay={0.7}
              />
              <QuickActionCard
                title="View Analytics"
                description="Performance insights"
                icon={BarChart3}
                onClick={() => toast({ title: "Analytics opened!" })}
                color="text-cyan-500"
                delay={0.8}
              />
              <QuickActionCard
                title="Check Rules"
                description="SAFE configurations"
                icon={CheckCircle}
                onClick={() => toast({ title: "Rules checked!" })}
                color="text-green-500"
                delay={0.9}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest events and system activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  icon: Eye,
                  text: "New ad detected: iPhone 14 Pro",
                  time: "2 min ago",
                  color: "text-primary",
                },
                {
                  icon: MessageSquare,
                  text: "Message received from seller",
                  time: "5 min ago",
                  color: "text-orange-500",
                },
                {
                  icon: Target,
                  text: "Radar scan completed successfully",
                  time: "10 min ago",
                  color: "text-green-500",
                },
                {
                  icon: AlertCircle,
                  text: "Rate limit reached, cooling down",
                  time: "15 min ago",
                  color: "text-yellow-500",
                },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
