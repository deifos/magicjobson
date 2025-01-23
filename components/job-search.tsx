"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, ExternalLink, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobCategory } from "@/types/jobs";
import { scrapeJobs } from "@/lib/actions";
import { toast } from "sonner";

const funnyLoadingMessages = [
  " Dribbling through job postings...",
  " Taking a three-point shot at the job board...",
  " Fast breaking through career pages...",
  " Slam dunking those applications...",
  " Performing a job search alley-oop...",
  " Running a full-court press on opportunities...",
  " Executing the perfect job search play...",
  " Calling a timeout to strategize...",
  " Warming up the recruitment engine...",
  " Setting up the perfect assist...",
];

export default function JobSearch() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessage(
          funnyLoadingMessages[Math.floor(Math.random() * funnyLoadingMessages.length)]
        );
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleSearch = async () => {
    if (!url) {
      toast.error(" Whoops! You forgot to pass the ball (URL)!");
      return;
    }

    setIsLoading(true);
    setLoadingMessage(funnyLoadingMessages[0]);
    
    try {
      toast.loading("", {
        description: "Our all-star team is scouting for the best positions!",
      });
      
      const result = await scrapeJobs(url);
      console.log("Search result:", result);

      if (result.success && result.data) {
        setJobCategories(result.data);
        toast.success(` Swish! Found ${result.data.length} job categories!`, {
          description: "Time to make your career move!",
        });
      } else {
        toast.error(" Air Ball!", {
          description: result.error || "Missed the shot at finding jobs. Let's try again!",
        });
        setJobCategories([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(" Foul Play!", {
        description: "Technical difficulties in the game. Let's reset and try again!",
      });
      setJobCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto font-mono">
      <div className="bg-[#2a2a2a] rounded-lg shadow-neon border-2 border-[#ff6b6b] p-6 mb-8">
        <div className="flex gap-2">
          <Input
            placeholder="Drop the URL and let's score some jobs! "
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-[#1a1a1a] text-[#ff6b6b] border-[#ff6b6b] placeholder:text-[#ff6b6b]/50"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSearch} 
            disabled={isLoading} 
            size="lg"
            className="bg-[#ff6b6b] hover:bg-[#ff8585] text-black font-bold"
          >
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? " Running..." : " Take the Shot!"}
          </Button>
        </div>
        {isLoading && (
          <div className="mt-4 text-center text-[#ff6b6b] animate-pulse">
            {loadingMessage}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {jobCategories.length > 0 ? (
          jobCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden border-2 border-[#ff6b6b] bg-[#2a2a2a] text-white">
              <CardHeader className="bg-[#1a1a1a] border-b border-[#ff6b6b]">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-[#ff6b6b]" />
                        <CardTitle className="text-xl text-[#ff6b6b]">{category.title}</CardTitle>
                        {category.jobs[0]?.description
                          .split("\n")
                          .find(line => line.includes("Showing 5 of")) && (
                          <Badge className="bg-[#ff6b6b] text-black font-mono">
                            {category.jobs[0].description
                              .split("\n")
                              .find(line => line.includes("Showing 5 of"))
                              ?.replace("\n\nShowing ", "")
                              ?.replace(" available positions in this category", "")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.tags?.map((tag, index) => (
                      <Badge
                        key={`${tag}-${index}`}
                        variant="secondary"
                        className="bg-[#ff6b6b]/20 text-[#ff6b6b] hover:bg-[#ff6b6b]/30"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-[#2a2a2a]">
                <div className="grid gap-6">
                  {category.jobs?.map((job) => {
                    const lines = job.description.split("\n");
                    const mainDescription = lines[0];
                    const location = lines
                      .find((line) => line.startsWith(""))
                      ?.replace("", "");
                    const link = lines
                      .find((line) => line.startsWith(""))
                      ?.replace("", "");

                    const descriptionWithoutTotal = mainDescription?.split(
                      "\n\nShowing"
                    )[0];

                    return (
                      <div
                        key={job.id}
                        className="group relative bg-[#1a1a1a] rounded-lg p-4 transition-all hover:shadow-neon border border-[#ff6b6b]/30 hover:border-[#ff6b6b]"
                      >
                        <div className="flex flex-col gap-2">
                          <h3 className="text-lg font-semibold text-[#ff6b6b]">
                            {job.title}
                          </h3>

                          <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-2">
                            {location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-[#ff6b6b]" />
                                <span>{location}</span>
                              </div>
                            )}
                          </div>

                          <p className="text-gray-300 mb-4">
                            {descriptionWithoutTotal}
                          </p>

                          {link && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-[#ff6b6b] hover:text-[#ff8585] transition-colors"
                            >
                              Apply Now
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-[#2a2a2a] rounded-lg border-2 border-[#ff6b6b]">
            <div className="text-[#ff6b6b]">
              {isLoading
                ? loadingMessage
                : " The court is ready! Drop a URL above to start the job search game!"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
