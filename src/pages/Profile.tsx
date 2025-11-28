import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { User, Briefcase, MapPin, Mail, Calendar, Plus, X } from "lucide-react";

interface Profile {
  name: string;
  bio: string;
  avatar_url: string;
}

interface Skill {
  id: string;
  skill_name: string;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ name: "", bio: "", avatar_url: "" });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-user-profile', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setProfile({
        name: data.data.name || "",
        bio: data.data.bio || "",
        avatar_url: data.data.profile_pic_url || "",
      });
      setSkills(data.data.skills || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    // Skills are now fetched with profile
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('user-profile-management', {
        body: {
          action: 'update-profile',
          userId: user.id,
          profileData: {
            name: profile.name,
            bio: profile.bio,
          }
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSkill.trim()) return;

    try {
      const { data, error } = await supabase.functions.invoke('user-profile-management', {
        body: {
          action: 'add-skill',
          userId: user.id,
          profileData: {
            skill_name: newSkill.trim(),
          }
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to add skill');
      }

      toast.success("Skill added!");
      setNewSkill("");
      fetchProfile();
    } catch (error: any) {
      console.error("Error adding skill:", error);
      toast.error(error.message || "Failed to add skill");
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('user-profile-management', {
        body: {
          action: 'remove-skill',
          userId: user.id,
          profileData: {
            skill_id: skillId,
          }
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove skill');
      }

      toast.success("Skill removed!");
      fetchProfile();
    } catch (error: any) {
      console.error("Error removing skill:", error);
      toast.error(error.message || "Failed to remove skill");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-xl shadow-card border p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <Button
              variant={isEditing ? "outline" : "accent"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold">
                {profile.name ? profile.name[0].toUpperCase() : user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{profile.name || "Set your name"}</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground">
                    {profile.bio || "No bio added yet. Click Edit Profile to add one."}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t">
              <h3 className="font-semibold mb-4">Skills</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="gap-2 pr-1">
                    {skill.skill_name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-destructive/20"
                      onClick={() => handleRemoveSkill(skill.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {skills.length === 0 && (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  className="flex-1"
                />
                <Button type="submit" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
