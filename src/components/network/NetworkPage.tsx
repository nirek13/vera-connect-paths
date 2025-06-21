
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectionsList } from "./ConnectionsList";
import { FindConnections } from "./FindConnections";
import { ConnectionRequests } from "./ConnectionRequests";
import { NetworkInsights } from "./NetworkInsights";

interface NetworkPageProps {
  profile: any;
}

export const NetworkPage = ({ profile }: NetworkPageProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Network</h1>
        <p className="text-gray-600">Manage your professional connections and grow your network</p>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connections" className="mt-6">
          <ConnectionsList profile={profile} />
        </TabsContent>
        
        <TabsContent value="discover" className="mt-6">
          <FindConnections profile={profile} />
        </TabsContent>
        
        <TabsContent value="requests" className="mt-6">
          <ConnectionRequests profile={profile} />
        </TabsContent>
        
        <TabsContent value="insights" className="mt-6">
          <NetworkInsights profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
