import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";

interface ConversationsListProps {
  profile: any;
  onConversationSelect: (conversation: any) => void;
  selectedConversation: any;
  refreshTrigger: number;
}

export const ConversationsList = ({ 
  profile, 
  onConversationSelect, 
  selectedConversation,
  refreshTrigger 
}: ConversationsListProps) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          participant_1:profiles!conversations_participant_1_id_fkey(id, first_name, last_name, avatar_url, title),
          participant_2:profiles!conversations_participant_2_id_fkey(id, first_name, last_name, avatar_url, title),
          messages(content, created_at, sender_id, read_at)
        `)
        .or(`participant_1_id.eq.${profile.id},participant_2_id.eq.${profile.id}`)
        .order("last_message_at", { ascending: false });

      if (data) {
        const processedConversations = data.map(conv => {
          const otherParticipant = conv.participant_1_id === profile.id 
            ? conv.participant_2 
            : conv.participant_1;
          
          const lastMessage = conv.messages?.[conv.messages.length - 1];
          const unreadCount = conv.messages?.filter(
            msg => msg.sender_id !== profile.id && !msg.read_at
          ).length || 0;

          return {
            ...conv,
            other_participant: otherParticipant,
            last_message: lastMessage,
            unread_count: unreadCount,
          };
        });

        setConversations(processedConversations);
      }
      setLoading(false);
    };

    fetchConversations();

    // Set up real-time subscription for conversations
    const conversationsSubscription = supabase
      .channel('conversations')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `participant_1_id=eq.${profile.id},participant_2_id=eq.${profile.id}`
        }, 
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages'
        }, 
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, [profile?.id, refreshTrigger]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Conversations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading conversations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Conversations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-gray-600 text-sm">Start a new conversation with your connections</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-b transition-colors ${
                    selectedConversation?.id === conversation.id ? "bg-blue-50 border-blue-200" : ""
                  }`}
                  onClick={() => onConversationSelect(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={conversation.other_participant?.avatar_url} />
                      <AvatarFallback>
                        {conversation.other_participant?.first_name?.[0]}
                        {conversation.other_participant?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {conversation.other_participant?.first_name} {conversation.other_participant?.last_name}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="ml-2">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.other_participant?.title || "Professional"}
                      </p>
                      {conversation.last_message && (
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">
                            {conversation.last_message.content}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};