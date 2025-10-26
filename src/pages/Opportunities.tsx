import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, DollarSign, Building } from "lucide-react";

const mockOpportunities = [
  {
    id: 1,
    title: "Frontend Developer Intern",
    company: "TechCorp Solutions",
    location: "Remote",
    type: "Internship",
    salary: "$25-30/hour",
    postedBy: "Michael Chen",
    postedDate: "2 days ago",
    description: "Looking for passionate frontend developers proficient in React and TypeScript. Great learning opportunity!",
    skills: ["React", "TypeScript", "CSS"]
  },
  {
    id: 2,
    title: "Software Engineering Intern",
    company: "Google",
    location: "Mountain View, CA",
    type: "Internship",
    salary: "$40-50/hour",
    postedBy: "Sarah Mitchell",
    postedDate: "5 days ago",
    description: "Summer internship program for talented CS students. Work on real-world projects with experienced mentors.",
    skills: ["Python", "Data Structures", "Algorithms"]
  },
  {
    id: 3,
    title: "Junior Data Analyst",
    company: "DataInsights Inc",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$70k-85k/year",
    postedBy: "Emily Rodriguez",
    postedDate: "1 week ago",
    description: "Entry-level position for recent graduates. Experience with SQL and data visualization tools required.",
    skills: ["SQL", "Python", "Tableau", "Excel"]
  },
  {
    id: 4,
    title: "UX Design Intern",
    company: "DesignHub",
    location: "San Francisco, CA",
    type: "Internship",
    salary: "$28-35/hour",
    postedBy: "James Wilson",
    postedDate: "3 days ago",
    description: "Join our design team to create intuitive user experiences. Portfolio required.",
    skills: ["Figma", "UI/UX", "Prototyping"]
  },
  {
    id: 5,
    title: "Backend Developer",
    company: "CloudScale Systems",
    location: "Remote",
    type: "Full-time",
    salary: "$90k-120k/year",
    postedBy: "Priya Sharma",
    postedDate: "4 days ago",
    description: "Build scalable backend systems using modern technologies. 1-2 years experience preferred.",
    skills: ["Node.js", "AWS", "Docker", "Kubernetes"]
  },
  {
    id: 6,
    title: "Cybersecurity Analyst Intern",
    company: "SecureNet",
    location: "New York, NY",
    type: "Internship",
    salary: "$30-38/hour",
    postedBy: "David Kim",
    postedDate: "6 days ago",
    description: "Learn from industry experts in cybersecurity. Hands-on experience with security tools and practices.",
    skills: ["Network Security", "Python", "Linux"]
  }
];

export default function Opportunities() {
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
          <Button variant="accent" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Post Opportunity
          </Button>
        </div>

        <div className="grid gap-6">
          {mockOpportunities.map((opportunity) => (
            <div key={opportunity.id} className="bg-card rounded-xl shadow-card border p-6 transition-smooth hover:shadow-lg">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building className="h-8 w-8 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{opportunity.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          opportunity.type === "Internship" 
                            ? "bg-accent/10 text-accent" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {opportunity.type}
                        </span>
                      </div>
                      <h4 className="text-lg text-muted-foreground mb-3">{opportunity.company}</h4>
                    </div>
                    <Button variant="accent">Apply Now</Button>
                  </div>

                  <p className="text-muted-foreground mb-4">{opportunity.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{opportunity.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{opportunity.salary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Posted {opportunity.postedDate}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {opportunity.skills.map((skill, index) => (
                      <span key={index} className="text-xs px-3 py-1 bg-muted text-foreground rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Posted by <span className="font-medium text-foreground">{opportunity.postedBy}</span>
                    </p>
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
