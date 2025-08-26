import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ad } from "@/lib/api";
import { Link, useLoaderData } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Edit, Euro, MapPin } from "lucide-react";

export default function AdDetail() {
  const ad = useLoaderData({ from: "/dashboard/ads/$id" }) as Ad;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/dashboard/ads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ads
          </Link>
        </Button>
        <Button asChild>
          <Link to="/dashboard/ads/$id/edit" params={{ id: ad.id }}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Ad
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{ad.title}</CardTitle>
              <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  {ad.location}
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {new Date(ad.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              <Euro className="mr-1 h-4 w-4" />
              {ad.price.toLocaleString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {ad.description}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Created:</span>
              <span className="ml-2 text-muted-foreground">
                {new Date(ad.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>
              <span className="ml-2 text-muted-foreground">
                {new Date(ad.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
