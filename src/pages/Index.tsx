import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { RecentPosts } from "@/components/home/RecentPosts";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <RecentPosts />
    </div>
  );
};

export default Index;
