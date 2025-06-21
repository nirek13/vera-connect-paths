
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { LogOut, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  session: Session;
  profile: any;
}

export const Header = ({ session, profile }: HeaderProps) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {profile?.first_name || session.user.email}!
          </h1>
          <p className="text-gray-600">
            {profile?.title || "Professional"} • {profile?.user_type || "professional"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="capitalize">
            {profile?.user_type || "professional"}
          </Badge>
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};
