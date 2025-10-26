import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Home, MessageSquare, Briefcase, Search } from "lucide-react";

export const Header = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-white">CC</span>
            </div>
            <span className="text-xl font-bold hidden sm:inline">Campus Connect Hub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button
                variant={isActive("/") ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link to="/communities">
              <Button
                variant={isActive("/communities") ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Communities
              </Button>
            </Link>
            <Link to="/alumni">
              <Button
                variant={isActive("/alumni") ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Alumni
              </Button>
            </Link>
            <Link to="/opportunities">
              <Button
                variant={isActive("/opportunities") ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Opportunities
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="accent" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
