import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, User } from "lucide-react";
import { format } from "date-fns";

interface ChatWindowProps {
  conversation: any;
  profile: any;
}

export const ChatWindow = ({ conversation, profile }: ChatWindowProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversation?.id) return;

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data);
        // Mark messages as read
        await supabase.rpc('mark_messages_as_read', {
          conv_id: conversation.id,
          user_id: profile.id
        });
      }
      setLoading(false);
    };

    fetchMessages();

    // Set up real-time subscription for new messages
    const messagesSubscription = supabase
      .channel(`messages:${conversation.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        }, 
        (payload) => {
          // Fetch the complete message with sender info
          supabase
            .from("messages")
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setMessages(prev => [...prev, data]);
                // Mark as read if not sent by current user
                if (data.sender_id !== profile.id) {
                  supabase.rpc('mark_messages_as_read', {
                    conv_id: conversation.id,
                    user_id: profile.id
                  });
                }
              }
            });
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [conversation?.id, profile?.id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);

    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: profile.id,
        content: newMessage.trim(),
        message_type: 'text'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={conversation.other_participant?.avatar_url} />
            <AvatarFallback>
              {conversation.other_participant?.first_name?.[0]}
              {conversation.other_participant?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">
              {conversation.other_participant?.first_name} {conversation.other_participant?.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {conversation.other_participant?.title || "Professional"}
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === profile.id ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[70%] ${
                    message.sender_id === profile.id ? "flex-row-reverse space-x-reverse" : ""
                  }`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`rounded-lg px-3 py-2 ${
                      message.sender_id === profile.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === profile.id ? "text-blue-100" : "text-gray-500"
                      }`}>
                        {format(new Date(message.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};