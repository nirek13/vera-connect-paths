
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Award, Users, Search } from "lucide-react";

interface IssueCredentialsProps {
  profile: any;
}

export const IssueCredentials = ({ profile }: IssueCredentialsProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_id: "",
    expiration_date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch users (for issuing credentials to)
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, title, avatar_url, user_type")
        .neq("id", profile.id)
        .limit(20);

      // Fetch companies (that user can issue from)
      const { data: companiesData } = await supabase
        .from("companies")
        .select("*")
        .eq("created_by", profile.id);

      setUsers(usersData || []);
      setCompanies(companiesData || []);
    };

    fetchData();
  }, [profile.id]);

  const filteredUsers = users.filter(user =>
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIssueCredential = async () => {
    if (!selectedUser || !formData.title) {
      toast({
        title: "Error",
        description: "Please select a recipient and enter a credential title",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("credentials")
      .insert({
        user_id: selectedUser.id,
        issuer_id: profile.id,
        company_id: formData.company_id || null,
        title: formData.title,
        description: formData.description,
        expiration_date: formData.expiration_date || null,
        metadata: {
          issued_by_name: `${profile.first_name} ${profile.last_name}`,
          issued_by_title: profile.title,
        },
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "ProofCard issued!",
        description: `Successfully issued "${formData.title}" to ${selectedUser.first_name} ${selectedUser.last_name}`,
      });
      // Reset form
      setFormData({
        title: "",
        description: "",
        company_id: "",
        expiration_date: "",
      });
      setSelectedUser(null);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Issue ProofCard</span>
          </CardTitle>
          <CardDescription>
            Issue verified credentials to professionals in your network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recipient Selection */}
          <div className="space-y-4">
            <Label>Select Recipient</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for professionals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchTerm && (
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                        selectedUser?.id === user.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchTerm("");
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.title || "Professional"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedUser && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={selectedUser.avatar_url} />
                      <AvatarFallback>
                        {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedUser.first_name} {selectedUser.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.title || "Professional"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Credential Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Credential Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., JavaScript Developer Certification"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the credential and what it represents..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Issuing Organization (Optional)</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company or leave blank for personal" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration">Expiration Date (Optional)</Label>
              <Input
                id="expiration"
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            onClick={handleIssueCredential}
            disabled={loading || !selectedUser || !formData.title}
            className="w-full"
          >
            {loading ? "Issuing..." : "Issue ProofCard"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
