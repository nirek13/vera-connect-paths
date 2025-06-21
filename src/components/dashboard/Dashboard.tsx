
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, Building2, TrendingUp } from "lucide-react";
import { RecentActivity } from "./RecentActivity";
import { ConnectionInsights } from "./ConnectionInsights";

interface DashboardProps {
  profile: any;
}

export const Dashboard = ({ profile }: DashboardProps) => {
  const [stats, setStats] = useState({
    connections: 0,
    credentials: 0,
    companies: 0,
    networkGrowth: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;

      // Fetch connections count
      const { count: connectionsCount } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
        .eq("status", "accepted");

      // Fetch credentials count
      const { count: credentialsCount } = await supabase
        .from("credentials")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);

      // Fetch companies count (for company users)
      const { count: companiesCount } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("created_by", profile.id);

      setStats({
        connections: connectionsCount || 0,
        credentials: credentialsCount || 0,
        companies: companiesCount || 0,
        networkGrowth: Math.floor(Math.random() * 15) + 5, // Mock data
      });
    };

    fetchStats();
  }, [profile?.id]);

  const statCards = [
    {
      title: "Connections",
      value: stats.connections,
      description: "Professional connections",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "ProofCards",
      value: stats.credentials,
      description: "Verified credentials",
      icon: Award,
      color: "text-green-600",
    },
    {
      title: "Companies",
      value: stats.companies,
      description: "Companies you represent",
      icon: Building2,
      color: "text-purple-600",
    },
    {
      title: "Network Growth",
      value: `+${stats.networkGrowth}%`,
      description: "This month",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your professional network and credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity profile={profile} />
        <ConnectionInsights profile={profile} />
      </div>
    </div>
  );
};
