
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, Target } from "lucide-react";

interface ConnectionInsightsProps {
  profile: any;
}

export const ConnectionInsights = ({ profile }: ConnectionInsightsProps) => {
  const [insights, setInsights] = useState({
    connectionGoal: 100,
    currentConnections: 0,
    mutualConnections: 0,
    industryBreakdown: [] as Array<{ industry: string; count: number }>,
  });

  useEffect(() => {
    const fetchInsights = async () => {
      if (!profile?.id) return;

      // Fetch current connections
      const { count: connectionsCount } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
        .eq("status", "accepted");

      // Mock industry data for now
      const mockIndustryData = [
        { industry: "Technology", count: Math.floor(Math.random() * 20) + 5 },
        { industry: "Finance", count: Math.floor(Math.random() * 15) + 3 },
        { industry: "Healthcare", count: Math.floor(Math.random() * 10) + 2 },
        { industry: "Education", count: Math.floor(Math.random() * 8) + 1 },
      ];

      setInsights({
        connectionGoal: 100,
        currentConnections: connectionsCount || 0,
        mutualConnections: Math.floor((connectionsCount || 0) * 0.3),
        industryBreakdown: mockIndustryData,
      });
    };

    fetchInsights();
  }, [profile?.id]);

  const progressPercentage = (insights.currentConnections / insights.connectionGoal) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Network Insights</span>
        </CardTitle>
        <CardDescription>Your networking progress and connections breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Goal Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Connection Goal</span>
            <span className="text-sm text-muted-foreground">
              {insights.currentConnections} / {insights.connectionGoal}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-600">{insights.currentConnections}</div>
            <div className="text-xs text-blue-600">Total Connections</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Target className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-600">{insights.mutualConnections}</div>
            <div className="text-xs text-green-600">Mutual Connections</div>
          </div>
        </div>

        {/* Industry Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">Industry Breakdown</h4>
          <div className="space-y-2">
            {insights.industryBreakdown.map((item) => (
              <div key={item.industry} className="flex items-center justify-between text-sm">
                <span>{item.industry}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
