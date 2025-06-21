
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  profile: any;
}

export const RecentActivity = ({ profile }: RecentActivityProps) => {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!profile?.id) return;

      // Fetch recent connections
      const { data: connections } = await supabase
        .from("connections")
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(first_name, last_name, avatar_url),
          addressee:profiles!connections_addressee_id_fkey(first_name, last_name, avatar_url)
        `)
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent credentials
      const { data: credentials } = await supabase
        .from("credentials")
        .select(`
          *,
          issuer:profiles!credentials_issuer_id_fkey(first_name, last_name, avatar_url)
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Combine and sort activities
      const allActivities = [
        ...(connections || []).map(conn => ({
          type: "connection",
          data: conn,
          created_at: conn.created_at,
        })),
        ...(credentials || []).map(cred => ({
          type: "credential",
          data: cred,
          created_at: cred.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setActivities(allActivities);
    };

    fetchRecentActivity();
  }, [profile?.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest connections and credentials</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    activity.type === "connection"
                      ? activity.data.requester?.avatar_url || activity.data.addressee?.avatar_url
                      : activity.data.issuer?.avatar_url
                  }
                />
                <AvatarFallback>
                  {activity.type === "connection"
                    ? (activity.data.requester?.first_name?.[0] || activity.data.addressee?.first_name?.[0] || "U")
                    : (activity.data.issuer?.first_name?.[0] || "I")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {activity.type === "connection" ? (
                    <>
                      Connected with{" "}
                      <span className="font-medium">
                        {activity.data.requester_id === profile.id
                          ? `${activity.data.addressee?.first_name} ${activity.data.addressee?.last_name}`
                          : `${activity.data.requester?.first_name} ${activity.data.requester?.last_name}`}
                      </span>
                    </>
                  ) : (
                    <>
                      Received credential:{" "}
                      <span className="font-medium">{activity.data.title}</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
              <Badge variant={activity.type === "connection" ? "default" : "secondary"}>
                {activity.type === "connection" ? "Connection" : "Credential"}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
