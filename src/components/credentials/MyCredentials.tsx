
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Calendar, Building2, User, Share2, Download } from "lucide-react";
import { format } from "date-fns";

interface MyCredentialsProps {
  profile: any;
}

export const MyCredentials = ({ profile }: MyCredentialsProps) => {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from("credentials")
        .select(`
          *,
          issuer:profiles!credentials_issuer_id_fkey(id, first_name, last_name, title, avatar_url, user_type),
          company:companies(id, name, logo_url, description)
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (data) {
        setCredentials(data);
      }
      setLoading(false);
    };

    fetchCredentials();
  }, [profile?.id]);

  if (loading) {
    return <div className="text-center py-8">Loading your ProofCards...</div>;
  }

  if (credentials.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No ProofCards yet</h3>
          <p className="text-gray-600">
            Your verified credentials and achievements will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {credentials.map((credential) => (
        <Card key={credential.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Award className="h-6 w-6 text-blue-600" />
              <Badge variant="secondary">ProofCard</Badge>
            </div>
            <CardTitle className="text-lg">{credential.title}</CardTitle>
            {credential.description && (
              <CardDescription className="line-clamp-2">
                {credential.description}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Issuer Information */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={credential.issuer?.avatar_url || credential.company?.logo_url} />
                <AvatarFallback>
                  {credential.company ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  Issued by {credential.company?.name || 
                    `${credential.issuer?.first_name} ${credential.issuer?.last_name}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {credential.issuer?.title || "Verified Issuer"}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-muted-foreground">
                  Issued {format(new Date(credential.issued_date), "MMM d, yyyy")}
                </span>
              </div>
              {credential.expiration_date && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-muted-foreground">
                    Expires {format(new Date(credential.expiration_date), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Verification Badge */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">Verified Credential</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
