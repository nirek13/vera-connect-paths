import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, MessageCircle, User } from "lucide-react";

interface ConnectionsListProps {
  profile: any;
}

export const ConnectionsList = ({ profile }: ConnectionsListProps) => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchConnections = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from("connections")
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(id, first_name, last_name, title, avatar_url, user_type, skills),
          addressee:profiles!connections_addressee_id_fkey(id, first_name, last_name, title, avatar_url, user_type, skills)
        `)
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
        .eq("status", "accepted");

      if (data) {
        const processedConnections = data.map(conn => ({
          ...conn,
          connection_profile: conn.requester_id === profile.id ? conn.addressee : conn.requester,
        }));
        setConnections(processedConnections);
      }
      setLoading(false);
    };

    fetchConnections();
  }, [profile?.id]);

  const filteredConnections = connections.filter(conn =>
    conn.connection_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.connection_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.connection_profile?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartChat = async (connectionProfile: any) => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: profile.id,
        user2_id: connectionProfile.id
      });

      if (error) throw error;

      toast({
        title: "Chat started!",
        description: `You can now message ${connectionProfile.first_name} ${connectionProfile.last_name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading connections...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {filteredConnections.length} connection{filteredConnections.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {filteredConnections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No connections found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search terms" : "Start building your network by discovering new connections"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnections.map((connection) => (
            <Card key={connection.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={connection.connection_profile?.avatar_url} />
                    <AvatarFallback>
                      {connection.connection_profile?.first_name?.[0]}
                      {connection.connection_profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {connection.connection_profile?.first_name} {connection.connection_profile?.last_name}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {connection.connection_profile?.title || "Professional"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="self-start capitalize">
                  {connection.connection_profile?.user_type}
                </Badge>
              </CardHeader>
              <CardContent>
                {connection.connection_profile?.skills && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {connection.connection_profile.skills.slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {connection.connection_profile.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{connection.connection_profile.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleStartChat(connection.connection_profile)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm">
                    View Profile
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