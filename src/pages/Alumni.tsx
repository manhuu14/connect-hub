import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, MapPin, Github, Linkedin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface AlumniProfile {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profile_pic_url?: string;
  github_url?: string;
  linkedin_url?: string;
  skills: string[];
}

export default function Alumni() {
  const [searchQuery, setSearchQuery] = useState("");
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchAlumni = async (query = "") => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-alumni', {
        body: { searchQuery: query }
      });

      if (error) throw error;

      if (data?.success) {
        setAlumni(data.data || []);
      } else {
        throw new Error(data?.error || 'Failed to fetch alumni');
      }
    } catch (error) {
      console.error('Error searching alumni:', error);
      toast({
        title: "Error",
        description: "Failed to fetch alumni. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchAlumni();
  }, []);

  const handleSearch = () => {
    searchAlumni(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Search Alumni</h1>
          <p className="text-lg text-muted-foreground">
            Connect with alumni for mentorship, career guidance, and networking
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-card border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, skill, title, or bio..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>
            <Button variant="accent" onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {loading && alumni.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading alumni...</p>
          </div>
        ) : alumni.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No alumni found. Try a different search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alumni.map((profile) => (
              <div key={profile.id} className="bg-card rounded-xl shadow-card border p-6 transition-smooth hover:shadow-lg">
                <div className="flex flex-col md:flex-row gap-6">
                  {profile.profile_pic_url ? (
                    <img 
                      src={profile.profile_pic_url} 
                      alt={profile.name}
                      className="h-20 w-20 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold flex-shrink-0">
                      {getInitials(profile.name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{profile.name}</h3>
                        {profile.title && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Briefcase className="h-4 w-4" />
                            <span>{profile.title}</span>
                          </div>
                        )}
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {profile.github_url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(profile.github_url, '_blank')}
                          >
                            <Github className="h-4 w-4" />
                          </Button>
                        )}
                        {profile.linkedin_url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(profile.linkedin_url, '_blank')}
                          >
                            <Linkedin className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="accent" size="sm">
                          View Profile
                        </Button>
                      </div>
                    </div>

                    {profile.skills && profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <span key={index} className="text-xs px-3 py-1 bg-muted text-foreground rounded-full font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
