
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Users } from "lucide-react";

interface FindConnectionsProps {
  profile: any;
}

export const FindConnections = ({ profile }: FindConnectionsProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [connectionRequests, setConnectionRequests] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!profile?.id) return;

      // Get current connections to exclude them
      const { data: connections } = await supabase
        .from("connections")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);

      const connectedUserIds = new Set(
        connections?.flatMap(conn => [conn.requester_id, conn.addressee_id]) || []
      );
      connectedUserIds.add(profile.id); // Exclude self

      // Fetch all users except connected ones
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not("id", "in", `(${Array.from(connectedUserIds).join(",")})`)
        .limit(20);

      if (data) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, [profile?.id]);

  const sendConnectionRequest = async (targetUserId: string) => {
    const { error } = await supabase
      .from("connections")
      .insert({
        requester_id: profile.id,
        addressee_id: targetUserId,
        status: "pending",
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setConnectionRequests([...connectionRequests, targetUserId]);
      toast({
        title: "Connection request sent!",
        description: "Your request has been sent successfully.",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.skills?.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-8">Loading professionals...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search professionals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {filteredUsers.length} professional{filteredUsers.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No professionals found</h3>
            <p className="text-gray-600">Try adjusting your search terms or check back later for new members</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {user.first_name} {user.last_name}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {user.title || "Professional"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="self-start capitalize">
                  {user.user_type}
                </Badge>
              </CardHeader>
              <CardContent>
                {user.skills && user.skills.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {user.skills.slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {user.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{user.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {user.bio && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{user.bio}</p>
                )}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => sendConnectionRequest(user.id)}
                    disabled={connectionRequests.includes(user.id)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {connectionRequests.includes(user.id) ? "Sent" : "Connect"}
                  </Button>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
