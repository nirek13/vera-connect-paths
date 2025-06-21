
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus } from "lucide-react";

interface CreateCompanyProps {
  profile: any;
}

export const CreateCompany = ({ profile }: CreateCompanyProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Company created!",
        description: `${formData.name} has been successfully created.`,
      });
      // Reset form
      setFormData({
        name: "",
        description: "",
        logo_url: "",
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Create Company Profile</span>
          </CardTitle>
          <CardDescription>
            Create a company profile to represent your organization and issue credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your company, its mission, and what it does..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL (Optional)</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Provide a URL to your company logo image
              </p>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {loading ? "Creating..." : "Create Company"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Company Preview */}
      {formData.name && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>This is how your company will appear</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="Company logo" 
                    className="h-10 w-10 object-contain rounded"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{formData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formData.description || "No description provided"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
