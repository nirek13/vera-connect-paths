
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyCompanies } from "./MyCompanies";
import { CreateCompany } from "./CreateCompany";
import { CompanyDirectory } from "./CompanyDirectory";

interface CompaniesPageProps {
  profile: any;
}

export const CompaniesPage = ({ profile }: CompaniesPageProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
        <p className="text-gray-600">Manage company profiles and discover organizations</p>
      </div>

      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="my-companies">My Companies</TabsTrigger>
          <TabsTrigger value="create">Create Company</TabsTrigger>
        </TabsList>
        
        <TabsContent value="directory" className="mt-6">
          <CompanyDirectory profile={profile} />
        </TabsContent>
        
        <TabsContent value="my-companies" className="mt-6">
          <MyCompanies profile={profile} />
        </TabsContent>
        
        <TabsContent value="create" className="mt-6">
          <CreateCompany profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
