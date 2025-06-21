import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MessageCircle } from "lucide-react";

interface NewChatDialogProps {
  profile: any;
  onConversationCreated: () => void;
}

export const NewChatDialog = ({ profile, onConversationCreated }: NewChatDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConnections = async () => {
      if (!profile?.id || !open) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("connections")
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(id, first_name, last_name, title, avatar_url, user_type),
          addressee:profiles!connections_addressee_id_fkey(id, first_name, last_name, title, avatar_url, user_type)
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
  }, [profile?.id, open]);

  const filteredConnections = connections.filter(conn =>
    conn.connection_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.connection_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.connection_profile?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartConversation = async (connectionProfile: any) => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: profile.id,
        user2_id: connectionProfile.id
      });

      if (error) throw error;

      toast({
        title: "Conversation started!",
        description: `You can now chat with ${connectionProfile.first_name} ${connectionProfile.last_name}`,
      });

      setOpen(false);
      setSearchTerm("");
      onConversationCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogDescription>
            Choose a connection to start chatting with
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">Loading connections...</div>
            ) : filteredConnections.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No connections found</h3>
                <p className="text-gray-600 text-sm">
                  {searchTerm ? "Try adjusting your search terms" : "Connect with professionals first to start chatting"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleStartConversation(connection.connection_profile)}
                  >
                    <Avatar>
                      <AvatarImage src={connection.connection_profile?.avatar_url} />
                      <AvatarFallback>
                        {connection.connection_profile?.first_name?.[0]}
                        {connection.connection_profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {connection.connection_profile?.first_name} {connection.connection_profile?.last_name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {connection.connection_profile?.title || "Professional"}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {connection.connection_profile?.user_type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};