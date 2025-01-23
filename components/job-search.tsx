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
import confetti from 'canvas-confetti';

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
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

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

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#ff6b6b', '#ff8585', '#1a1a1a']
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleSearch = async () => {
    if (!url) {
      toast.error(" Whoops! You forgot to pass the ball (URL)!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage(funnyLoadingMessages[0]);
    setJobCategories([]);
    setIsShaking(false);
    
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
        triggerConfetti();
      } else {
        setError(result.error || "Something went wrong. Please try again.");
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 820); // Animation duration + small buffer
        toast.error("Oops!", {
          description: result.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Something went wrong. Please try again later.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 820);
      toast.error("Error", {
        description: "Something went wrong. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto font-mono">
      <div className={`bg-[#2a2a2a] rounded-lg shadow-neon border-2 border-[#ff6b6b] p-6 mb-8 transition-all ${isShaking ? 'animate-shake' : ''}`}>
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
        {error && !isLoading && (
          <div className="mt-4 p-4 bg-[#1a1a1a] border border-[#ff6b6b] rounded-lg">
            <div className="flex items-center gap-2 text-[#ff6b6b]">
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {jobCategories.length > 0 ? (
          jobCategories.map((category) => (
            <Card
              key={category.id}
              className="bg-[#2a2a2a] border-[#ff6b6b] shadow-neon"
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-[#ff6b6b]" />
                      <CardTitle className="text-xl text-[#ff6b6b]">
                        {category.title}
                      </CardTitle>
                    </div>
                    {category.jobs[0]?.description && (
                      <Badge className="bg-[#ff6b6b] text-black font-mono">
                        {category.jobs[0].description
                          .split("\n")
                          .find(line => line.includes("Showing"))
                          ?.trim()}
                      </Badge>
                    )}
                  </div>
                </div>
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
