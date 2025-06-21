import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationsList } from "./ConversationsList";
import { ChatWindow } from "./ChatWindow";
import { NewChatDialog } from "./NewChatDialog";

interface ChatPageProps {
  profile: any;
}

export const ChatPage = ({ profile }: ChatPageProps) => {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleConversationSelect = (conversation: any) => {
    setSelectedConversation(conversation);
  };

  const handleNewConversation = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Connect and communicate with your professional network</p>
        </div>
        <NewChatDialog profile={profile} onConversationCreated={handleNewConversation} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <ConversationsList
            profile={profile}
            onConversationSelect={handleConversationSelect}
            selectedConversation={selectedConversation}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              profile={profile}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-500">Choose a conversation from the list or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};