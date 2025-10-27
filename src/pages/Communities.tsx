import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Community {
  id: string;
  name: string;
  description: string;
  slug: string;
  memberCount?: number;
  isMember?: boolean;
}

export default function Communities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCommunities();
  }, [user]);

  const fetchCommunities = async () => {
    try {
      const { data: communitiesData, error } = await supabase
        .from('communities')
        .select('*');

      if (error) throw error;

      if (!communitiesData) {
        setCommunities([]);
        setLoading(false);
        return;
      }

      // Fetch member counts and check if user is a member
      const communitiesWithDetails = await Promise.all(
        communitiesData.map(async (community) => {
          const { count } = await supabase
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id);

          let isMember = false;
          if (user) {
            const { data: memberData } = await supabase
              .from('community_members')
              .select('id')
              .eq('community_id', community.id)
              .eq('user_id', user.id)
              .single();
            isMember = !!memberData;
          }

          return {
            ...community,
            memberCount: count || 0,
            isMember
          };
        })
      );

      setCommunities(communitiesWithDetails);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      toast.error('Please sign in to join communities');
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Successfully joined community!');
      fetchCommunities();
    } catch (error: any) {
      console.error('Error joining community:', error);
      toast.error(error.message || 'Failed to join community');
    }
  };

  const handleOpenCommunity = (communitySlug: string) => {
    navigate(`/communities/${communitySlug}`);
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Communities</h1>
          <p className="text-lg text-muted-foreground">
            Join communities to connect with peers, share knowledge, and collaborate
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading communities...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <div key={community.id} className="bg-card rounded-xl shadow-card border p-6 transition-smooth hover:shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2">{community.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {community.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>{community.memberCount} members</span>
                </div>

                <div className="flex items-center gap-2">
                  {community.isMember ? (
                    <Button 
                      variant="accent" 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenCommunity(community.slug)}
                    >
                      Open
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleJoinCommunity(community.id)}
                    >
                      Join
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
