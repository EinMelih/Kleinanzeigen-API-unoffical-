import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsOverview } from "@/lib/api";
import { useLoaderData } from "@tanstack/react-router";
import { BarChart3, Eye, MousePointer, Target, TrendingUp } from "lucide-react";

export default function Analytics() {
  const analytics = useLoaderData({
    from: "/dashboard/analytics",
  }) as AnalyticsOverview;

  const stats = [
    {
      title: "Total Ads",
      value: analytics.totalAds,
      icon: BarChart3,
      description: "All ads in the system",
    },
    {
      title: "Active Ads",
      value: analytics.activeAds,
      icon: Target,
      description: "Currently active ads",
    },
    {
      title: "Total Views",
      value: analytics.views.toLocaleString(),
      icon: Eye,
      description: "Total page views",
    },
    {
      title: "Total Clicks",
      value: analytics.clicks.toLocaleString(),
      icon: MousePointer,
      description: "Total ad clicks",
    },
    {
      title: "Conversion Rate",
      value: `${analytics.conversionRate.toFixed(2)}%`,
      icon: TrendingUp,
      description: "Click to view ratio",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Overview</h1>
        <p className="text-muted-foreground">
          Monitor your advertising performance and insights
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Rate</span>
              <Badge variant="secondary">
                {((analytics.activeAds / analytics.totalAds) * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Engagement Rate</span>
              <Badge variant="secondary">
                {((analytics.clicks / analytics.views) * 100).toFixed(2)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
