import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, GraduationCap, TrendingUp } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-10" />
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm font-medium text-secondary-foreground mb-4">
            <TrendingUp className="h-4 w-4" />
            Connect, Learn, Grow Together
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Welcome to <span className="gradient-primary bg-clip-text text-transparent">Campus Connect Hub</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your premier platform for connecting students and alumni. Share knowledge, discover opportunities, and build meaningful relationships that shape your future.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/auth">
              <Button size="lg" variant="accent" className="gap-2">
                <GraduationCap className="h-5 w-5" />
                Get Started
              </Button>
            </Link>
            <Link to="/communities">
              <Button size="lg" variant="outline" className="gap-2">
                <Users className="h-5 w-5" />
                Explore Communities
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <Link to="/communities">
            <div className="bg-card p-6 rounded-xl shadow-card border transition-smooth hover:shadow-lg cursor-pointer">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Vibrant Communities</h3>
              <p className="text-muted-foreground">
                Join topic-based communities to share resources, discuss ideas, and collaborate with peers.
              </p>
            </div>
          </Link>

          <Link to="/opportunities">
            <div className="bg-card p-6 rounded-xl shadow-card border transition-smooth hover:shadow-lg cursor-pointer">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Career Opportunities</h3>
              <p className="text-muted-foreground">
                Access exclusive job postings, internships, and referrals from our alumni network.
              </p>
            </div>
          </Link>

          <Link to="/alumni">
            <div className="bg-card p-6 rounded-xl shadow-card border transition-smooth hover:shadow-lg cursor-pointer">
              <div className="h-12 w-12 rounded-lg bg-secondary/50 flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mentorship Network</h3>
              <p className="text-muted-foreground">
                Connect with experienced alumni for guidance, career advice, and professional growth.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
