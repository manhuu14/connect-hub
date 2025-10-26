import { Heart, MessageCircle, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockPosts = [
  {
    id: 1,
    author: "Sarah Johnson",
    role: "Computer Science '24",
    avatar: "SJ",
    timestamp: "2 hours ago",
    title: "Data Structures Study Material - Finals Week",
    content: "Hey everyone! I've compiled comprehensive notes on Trees, Graphs, and Dynamic Programming. Perfect for upcoming finals. Check out the attached PDF...",
    likes: 42,
    comments: 15,
    category: "Study Material"
  },
  {
    id: 2,
    author: "Michael Chen",
    role: "Software Engineer at TechCorp",
    avatar: "MC",
    timestamp: "5 hours ago",
    title: "Internship Opportunity - Frontend Development",
    content: "Our team is looking for passionate frontend developers for summer internships. Great opportunity to work on React, TypeScript, and modern web technologies...",
    likes: 89,
    comments: 23,
    category: "Opportunity"
  },
  {
    id: 3,
    author: "Emily Rodriguez",
    role: "Mechanical Engineering '23",
    avatar: "ER",
    timestamp: "1 day ago",
    title: "CAD Project Showcase - Senior Design",
    content: "Excited to share our team's final CAD project! We designed an automated assembly line prototype using SolidWorks...",
    likes: 56,
    comments: 12,
    category: "Achievement"
  },
];

export const RecentPosts = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Recent Posts</h2>
          <Button variant="outline" size="sm">View All</Button>
        </div>

        <div className="grid gap-6">
          {mockPosts.map((post) => (
            <article key={post.id} className="bg-card rounded-xl shadow-card border p-6 transition-smooth hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {post.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{post.author}</h3>
                      <p className="text-sm text-muted-foreground">{post.role} • {post.timestamp}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium">
                      {post.category}
                    </div>
                    <h4 className="text-lg font-semibold">{post.title}</h4>
                    <p className="text-muted-foreground">{post.content}</p>
                  </div>

                  <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Heart className="h-4 w-4" />
                      {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
