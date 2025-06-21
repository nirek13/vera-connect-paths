
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Search, Users, Award } from "lucide-react";

interface CompanyDirectoryProps {
  profile: any;
}

export const CompanyDirectory = ({ profile }: CompanyDirectoryProps) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(`
          *,
          creator:profiles!companies_created_by_fkey(first_name, last_name, title, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (data) {
        // Fetch credential counts for each company
        const companiesWithStats = await Promise.all(
          data.map(async (company) => {
            const { count: credentialCount } = await supabase
              .from("credentials")
              .select("*", { count: "exact", head: true })
              .eq("company_id", company.id);

            return {
              ...company,
              credential_count: credentialCount || 0,
            };
          })
        );
        setCompanies(companiesWithStats);
      }
      setLoading(false);
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading companies...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {filteredCompanies.length} compan{filteredCompanies.length !== 1 ? 'ies' : 'y'}
        </Badge>
      </div>

      {filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No companies found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search terms" : "No companies have been created yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={company.logo_url} />
                    <AvatarFallback>
                      <Building2 className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{company.name}</CardTitle>
                    <CardDescription className="truncate">
                      {company.description || "No description available"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Company Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <Award className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-blue-600">
                      {company.credential_count}
                    </div>
                    <div className="text-xs text-blue-600">ProofCards</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <Users className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-green-600">
                      {Math.floor(Math.random() * 50) + 10}
                    </div>
                    <div className="text-xs text-green-600">Employees</div>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={company.creator?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {company.creator?.first_name?.[0]}{company.creator?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    Created by {company.creator?.first_name} {company.creator?.last_name}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1">
                    View Profile
                  </Button>
                  <Button variant="outline" size="sm">
                    Follow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
