
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Target, Search, Network, AlertCircle } from "lucide-react";

interface NetworkInsightsProps {
  profile: any;
}

export const NetworkInsights = ({ profile }: NetworkInsightsProps) => {
  const [insights, setInsights] = useState({
    totalConnections: 0,
    connectionsByType: {} as Record<string, number>,
    mutualConnections: 0,
    networkGrowth: 0,
    connectionPaths: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState<any>(null);
  const [pathLoading, setPathLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!profile?.id) return;

      // Get total connections
      const { data: connections, count } = await supabase
        .from("connections")
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(user_type),
          addressee:profiles!connections_addressee_id_fkey(user_type)
        `, { count: "exact" })
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
        .eq("status", "accepted");

      // Calculate connections by user type
      const typeBreakdown: Record<string, number> = {};
      connections?.forEach(conn => {
        const connectedUserType = conn.requester_id === profile.id 
          ? conn.addressee?.user_type 
          : conn.requester?.user_type;
        if (connectedUserType) {
          typeBreakdown[connectedUserType] = (typeBreakdown[connectedUserType] || 0) + 1;
        }
      });

      // Mock mutual connections calculation
      const mutualCount = Math.floor((count || 0) * 0.3);

      setInsights({
        totalConnections: count || 0,
        connectionsByType: typeBreakdown,
        mutualConnections: mutualCount,
        networkGrowth: Math.floor(Math.random() * 20) + 5,
        connectionPaths: [],
      });
      setLoading(false);
    };

    fetchInsights();
  }, [profile?.id]);

  const findConnectionPath = async (targetUserId: string) => {
    setPathLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('find_connection_path', {
        start_user_id: profile.id,
        target_user_id: targetUserId
      });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch profile info for each user in the path
        const pathUserIds = data[0].path_users;
        const { data: pathProfiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, title, avatar_url")
          .in("id", pathUserIds);

        setInsights(prev => ({
          ...prev,
          connectionPaths: [{
            ...data[0],
            profiles: pathProfiles
          }]
        }));
      } else {
        setInsights(prev => ({
          ...prev,
          connectionPaths: []
        }));
      }
    } catch (error) {
      console.error("Error finding connection path:", error);
    }
    
    setPathLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading insights...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalConnections}</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mutual Connections</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.mutualConnections}</div>
            <p className="text-xs text-muted-foreground">Shared connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{insights.networkGrowth}%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Types</CardTitle>
          <CardDescription>Breakdown of your connections by user type</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(insights.connectionsByType).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No connection data available</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(insights.connectionsByType).map(([type, count]) => {
                const percentage = (count / insights.totalConnections) * 100;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">{type}s</span>
                      <span className="text-sm text-muted-foreground">{count} connections</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Path Finder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Connection Path Finder</span>
          </CardTitle>
          <CardDescription>
            Find how you're connected to other professionals through mutual connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => {
                // Mock user search - in real app, you'd have a user search component
                const mockUser = { id: "mock-user-id", name: "Sample User" };
                setSearchUser(mockUser);
                findConnectionPath(mockUser.id);
              }}
              disabled={pathLoading}
            >
              <Search className="mr-2 h-4 w-4" />
              {pathLoading ? "Searching..." : "Find Sample Path"}
            </Button>
          </div>

          {insights.connectionPaths.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium">Connection Path Found:</h4>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {insights.connectionPaths[0].path_length} degree{insights.connectionPaths[0].path_length !== 1 ? 's' : ''} of separation
                </Badge>
              </div>
              {/* Display the path - simplified for demo */}
              <div className="text-sm text-muted-foreground">
                Path visualization would go here with user profiles
              </div>
            </div>
          ) : searchUser && !pathLoading ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No connection path found</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Network Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Network Health Score</CardTitle>
          <CardDescription>How strong and diverse is your professional network?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Score</span>
              <span className="text-2xl font-bold text-green-600">85/100</span>
            </div>
            <Progress value={85} className="h-3" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Diversity</span>
                  <span className="font-medium">Good</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Engagement</span>
                  <span className="font-medium">Excellent</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
