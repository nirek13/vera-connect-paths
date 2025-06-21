
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, UserCheck, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConnectionRequestsProps {
  profile: any;
}

export const ConnectionRequests = ({ profile }: ConnectionRequestsProps) => {
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!profile?.id) return;

      // Fetch incoming requests
      const { data: incoming } = await supabase
        .from("connections")
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(id, first_name, last_name, title, avatar_url, user_type, bio, skills)
        `)
        .eq("addressee_id", profile.id)
        .eq("status", "pending");

      // Fetch outgoing requests
      const { data: outgoing } = await supabase
        .from("connections")
        .select(`
          *,
          addressee:profiles!connections_addressee_id_fkey(id, first_name, last_name, title, avatar_url, user_type, bio, skills)
        `)
        .eq("requester_id", profile.id)
        .eq("status", "pending");

      setIncomingRequests(incoming || []);
      setOutgoingRequests(outgoing || []);
      setLoading(false);
    };

    fetchRequests();
  }, [profile?.id]);

  const handleRequest = async (requestId: string, action: "accepted" | "declined") => {
    const { error } = await supabase
      .from("connections")
      .update({ 
        status: action,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: action === "accepted" ? "Request accepted!" : "Request declined",
        description: action === "accepted" 
          ? "You are now connected!" 
          : "The request has been declined.",
      });
    }
  };

  const cancelRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOutgoingRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: "Request cancelled",
        description: "Connection request has been cancelled.",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  return (
    <Tabs defaultValue="incoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="incoming" className="flex items-center space-x-2">
          <UserCheck className="h-4 w-4" />
          <span>Incoming ({incomingRequests.length})</span>
        </TabsTrigger>
        <TabsTrigger value="outgoing" className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Sent ({outgoingRequests.length})</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="incoming" className="mt-6">
        {incomingRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No incoming requests</h3>
              <p className="text-gray-600">You have no pending connection requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {incomingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.requester?.avatar_url} />
                        <AvatarFallback>
                          {request.requester?.first_name?.[0]}{request.requester?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {request.requester?.first_name} {request.requester?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {request.requester?.title || "Professional"}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {request.requester?.user_type}
                          </Badge>
                          {request.requester?.skills && request.requester.skills.length > 0 && (
                            <div className="flex space-x-1">
                              {request.requester.skills.slice(0, 2).map((skill: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {request.requester?.bio && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {request.requester.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleRequest(request.id, "accepted")}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequest(request.id, "declined")}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="outgoing" className="mt-6">
        {outgoingRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No sent requests</h3>
              <p className="text-gray-600">You haven't sent any connection requests yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {outgoingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.addressee?.avatar_url} />
                        <AvatarFallback>
                          {request.addressee?.first_name?.[0]}{request.addressee?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {request.addressee?.first_name} {request.addressee?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {request.addressee?.title || "Professional"}
                        </p>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {request.addressee?.user_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Pending</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelRequest(request.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
