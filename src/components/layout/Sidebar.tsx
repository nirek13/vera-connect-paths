import { Button } from "@/components/ui/button";
import { 
  Home, 
  User, 
  Users, 
  Award, 
  Building2,
  Network,
  MessageCircle
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar = ({ currentPage, onPageChange }: SidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "profile", label: "Profile", icon: User },
    { id: "network", label: "Network", icon: Users },
    { id: "credentials", label: "ProofCards", icon: Award },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "chat", label: "Messages", icon: MessageCircle },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-2">
          <Network className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-blue-600">Vera</h1>
        </div>
      </div>
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onPageChange(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};