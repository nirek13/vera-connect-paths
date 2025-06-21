
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyCredentials } from "./MyCredentials";
import { IssueCredentials } from "./IssueCredentials";
import { CredentialRequests } from "./CredentialRequests";

interface CredentialsPageProps {
  profile: any;
}

export const CredentialsPage = ({ profile }: CredentialsPageProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ProofCards</h1>
        <p className="text-gray-600">Manage your verified professional credentials and achievements</p>
      </div>

      <Tabs defaultValue="my-credentials" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-credentials">My ProofCards</TabsTrigger>
          <TabsTrigger value="issue">Issue ProofCards</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-credentials" className="mt-6">
          <MyCredentials profile={profile} />
        </TabsContent>
        
        <TabsContent value="issue" className="mt-6">
          <IssueCredentials profile={profile} />
        </TabsContent>
        
        <TabsContent value="requests" className="mt-6">
          <CredentialRequests profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
