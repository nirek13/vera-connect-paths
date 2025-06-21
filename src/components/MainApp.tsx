import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { NetworkPage } from "@/components/network/NetworkPage";
import { CredentialsPage } from "@/components/credentials/CredentialsPage";
import { CompaniesPage } from "@/components/companies/CompaniesPage";
import { ChatPage } from "@/components/chat/ChatPage";

interface MainAppProps {
  session: Session;
}

export const MainApp = ({ session }: MainAppProps) => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [session.user.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <Header session={session} profile={profile} />
        <main className="flex-1 p-6">
          {currentPage === "dashboard" && <Dashboard profile={profile} />}
          {currentPage === "profile" && <ProfilePage profile={profile} setProfile={setProfile} />}
          {currentPage === "network" && <NetworkPage profile={profile} />}
          {currentPage === "credentials" && <CredentialsPage profile={profile} />}
          {currentPage === "companies" && <CompaniesPage profile={profile} />}
          {currentPage === "chat" && <ChatPage profile={profile} />}
        </main>
      </div>
    </div>
  );
};