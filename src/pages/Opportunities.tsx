import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Briefcase, MapPin, Clock, Building } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Referral {
  id: string;
  job_title: string;
  company: string;
  location: string;
  description: string;
  referral_link: string;
  created_at: string;
  status: string;
  profiles: {
    name: string;
  };
}

export default function Opportunities() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<string | null>(null);

  // Post opportunity form state
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [referralLink, setReferralLink] = useState("");

  // Apply form state
  const [applyMessage, setApplyMessage] = useState("");

  useEffect(() => {
    fetchUserRole();
    fetchReferrals();
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data: referralsData, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const referralsWithProfiles = await Promise.all(
        (referralsData || []).map(async (referral) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', referral.alumnus_id)
            .single();

          return {
            ...referral,
            profiles: { name: profileData?.name || 'Unknown' }
          };
        })
      );

      setReferrals(referralsWithProfiles);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handlePostOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('referrals')
        .insert({
          alumnus_id: user.id,
          job_title: jobTitle,
          company,
          location,
          description,
          referral_link: referralLink,
          status: 'open'
        });

      if (error) throw error;

      toast.success('Opportunity posted successfully!');
      setIsPostDialogOpen(false);
      setJobTitle("");
      setCompany("");
      setLocation("");
      setDescription("");
      setReferralLink("");
      fetchReferrals();
    } catch (error: any) {
      console.error('Error posting opportunity:', error);
      toast.error(error.message || 'Failed to post opportunity');
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedReferral) return;

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          student_id: user.id,
          referral_id: selectedReferral,
          message: applyMessage,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Application submitted successfully!');
      setIsApplyDialogOpen(false);
      setApplyMessage("");
      setSelectedReferral(null);
    } catch (error: any) {
      console.error('Error applying:', error);
      if (error.code === '23505') {
        toast.error('You have already applied to this opportunity');
      } else {
        toast.error(error.message || 'Failed to submit application');
      }
    }
  };

  const openApplyDialog = (referralId: string) => {
    setSelectedReferral(referralId);
    setIsApplyDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Job Opportunities</h1>
            <p className="text-lg text-muted-foreground">
              Exclusive opportunities shared by our alumni network
            </p>
          </div>
          {userRole === 'alumni' && (
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="accent" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Post Opportunity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Post Job Opportunity</DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePostOpportunity} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referralLink">Application Link (optional)</Label>
                    <Input
                      id="referralLink"
                      type="url"
                      value={referralLink}
                      onChange={(e) => setReferralLink(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full">Post Opportunity</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">Loading opportunities...</div>
        ) : referrals.length === 0 ? (
          <div className="bg-card rounded-xl shadow-card border p-12 text-center">
            <p className="text-muted-foreground">No opportunities available at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {referrals.map((referral) => (
              <div key={referral.id} className="bg-card rounded-xl shadow-card border p-6 transition-smooth hover:shadow-lg">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building className="h-8 w-8 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{referral.job_title}</h3>
                        <h4 className="text-lg text-muted-foreground mb-3">{referral.company}</h4>
                      </div>
                      {userRole === 'student' && (
                        <Button variant="accent" onClick={() => openApplyDialog(referral.id)}>
                          Apply Now
                        </Button>
                      )}
                    </div>

                    <p className="text-muted-foreground mb-4">{referral.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{referral.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Posted {new Date(referral.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Posted by <span className="font-medium text-foreground">{referral.profiles?.name}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Opportunity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleApply} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="applyMessage">Why are you interested?</Label>
                <Textarea
                  id="applyMessage"
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Tell us why you're a good fit for this opportunity..."
                />
              </div>
              <Button type="submit" className="w-full">Submit Application</Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
