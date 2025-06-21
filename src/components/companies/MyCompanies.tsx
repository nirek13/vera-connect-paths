
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Award, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MyCompaniesProps {
  profile: any;
}

export const MyCompanies = ({ profile }: MyCompaniesProps) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMyCompanies = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("created_by", profile.id)
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

    fetchMyCompanies();
  }, [profile?.id]);

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete ${companyName}? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", companyId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      toast({
        title: "Company deleted",
        description: `${companyName} has been successfully deleted.`,
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading your companies...</div>;
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No companies yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first company profile to start issuing credentials
          </p>
          <Button>Create Company</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {companies.map((company) => (
        <Card key={company.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
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
                    Created {format(new Date(company.created_at), "MMM d, yyyy")}
                  </CardDescription>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteCompany(company.id, company.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {company.description && (
              <p className="text-sm text-muted-foreground">{company.description}</p>
            )}

            {/* Company Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Award className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-blue-600">
                  {company.credential_count}
                </div>
                <div className="text-xs text-blue-600">ProofCards Issued</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-green-600">
                  {Math.floor(Math.random() * 50) + 10}
                </div>
                <div className="text-xs text-green-600">Employees</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-2">
              <Button size="sm" className="flex-1">
                Manage
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                View Public
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
