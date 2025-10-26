import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, MapPin } from "lucide-react";

const mockAlumni = [
  {
    id: 1,
    name: "Sarah Mitchell",
    avatar: "SM",
    title: "Senior Software Engineer",
    company: "Google",
    location: "San Francisco, CA",
    graduationYear: "2018",
    skills: ["Python", "Machine Learning", "Cloud Architecture"]
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "MC",
    title: "Product Manager",
    company: "Meta",
    location: "Seattle, WA",
    graduationYear: "2017",
    skills: ["Product Strategy", "User Research", "Agile"]
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    avatar: "ER",
    title: "Data Scientist",
    company: "Amazon",
    location: "Austin, TX",
    graduationYear: "2019",
    skills: ["Data Analysis", "Python", "SQL", "Tableau"]
  },
  {
    id: 4,
    name: "James Wilson",
    avatar: "JW",
    title: "UX Designer",
    company: "Apple",
    location: "Cupertino, CA",
    graduationYear: "2020",
    skills: ["UI/UX", "Figma", "User Research"]
  },
  {
    id: 5,
    name: "Priya Sharma",
    avatar: "PS",
    title: "DevOps Engineer",
    company: "Microsoft",
    location: "Redmond, WA",
    graduationYear: "2016",
    skills: ["Kubernetes", "AWS", "CI/CD", "Docker"]
  },
  {
    id: 6,
    name: "David Kim",
    avatar: "DK",
    title: "Cybersecurity Analyst",
    company: "IBM",
    location: "New York, NY",
    graduationYear: "2019",
    skills: ["Security", "Penetration Testing", "Network Security"]
  }
];

export default function Alumni() {
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
                placeholder="Search by name, skill, or company..."
                className="pl-10"
              />
            </div>
            <Button variant="accent">Search</Button>
          </div>
        </div>

        <div className="space-y-4">
          {mockAlumni.map((alumni) => (
            <div key={alumni.id} className="bg-card rounded-xl shadow-card border p-6 transition-smooth hover:shadow-lg">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {alumni.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{alumni.name}</h3>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{alumni.title} at {alumni.company}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{alumni.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="accent" size="sm">
                        View Profile
                      </Button>
                      <Button variant="outline" size="sm">
                        Message
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full font-medium">
                      Class of {alumni.graduationYear}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {alumni.skills.map((skill, index) => (
                      <span key={index} className="text-xs px-3 py-1 bg-muted text-foreground rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
