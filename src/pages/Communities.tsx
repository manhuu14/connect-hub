import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, TrendingUp } from "lucide-react";

const mockCommunities = [
  {
    id: 1,
    name: "Computer Science & Technology",
    description: "Discuss algorithms, programming languages, and tech innovations",
    members: 1243,
    posts: 892,
    category: "Academic",
    trending: true
  },
  {
    id: 2,
    name: "Career Development",
    description: "Job opportunities, interview tips, and professional growth",
    members: 2156,
    posts: 1534,
    category: "Professional",
    trending: true
  },
  {
    id: 3,
    name: "Research & Publications",
    description: "Share research papers, collaborate on projects, and seek guidance",
    members: 687,
    posts: 423,
    category: "Academic",
    trending: false
  },
  {
    id: 4,
    name: "Alumni Network",
    description: "Connect with alumni, seek mentorship, and share experiences",
    members: 3421,
    posts: 2876,
    category: "Networking",
    trending: true
  },
  {
    id: 5,
    name: "Startup Ecosystem",
    description: "Entrepreneurship, startups, and innovation discussions",
    members: 891,
    posts: 645,
    category: "Professional",
    trending: false
  },
  {
    id: 6,
    name: "Study Groups",
    description: "Form study groups, share notes, and prepare for exams together",
    members: 1567,
    posts: 1234,
    category: "Academic",
    trending: false
  }
];

export default function Communities() {
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
            />
          </div>
          <Button variant="accent" className="gap-2">
            <Users className="h-4 w-4" />
            Create Community
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCommunities.map((community) => (
            <div key={community.id} className="bg-card rounded-xl shadow-card border p-6 transition-smooth hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                {community.trending && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full font-medium">
                    <TrendingUp className="h-3 w-3" />
                    Trending
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-2">{community.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {community.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>{community.members.toLocaleString()} members</span>
                <span>•</span>
                <span>{community.posts.toLocaleString()} posts</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full font-medium">
                  {community.category}
                </span>
                <Button variant="outline" size="sm">
                  Join
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
