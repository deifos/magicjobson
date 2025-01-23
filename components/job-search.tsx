"use client";

import { useState } from "react";
import { Search, MapPin, DollarSign, ExternalLink, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobCategory } from "@/types/jobs";
import { scrapeJobs } from "@/lib/actions";
import { toast } from "sonner";

export default function JobSearch() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);

  const handleSearch = async () => {
    if (!url) {
      toast.error("Please enter a URL to search for jobs");
      return;
    }

    setIsLoading(true);
    try {
      const result = await scrapeJobs(url);
      console.log("Search result:", result);

      if (result.success && result.data) {
        setJobCategories(result.data);
        toast.success(`Found ${result.data.length} job categories!`);
      } else {
        toast.error(result.error || "Failed to find jobs");
        setJobCategories([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred while searching for jobs");
      setJobCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
        <div className="flex gap-2">
          <Input
            placeholder="Enter company website URL (e.g., company.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSearch} disabled={isLoading} size="lg">
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? "Searching..." : "Find Jobs"}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {jobCategories.length > 0 ? (
          jobCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        {category.jobs.some((job) =>
                          job.description.includes("Showing 5 of")
                        ) && (
                          <Badge variant="outline" className="text-xs">
                            {category.jobs[0].description
                              .split("\n")
                              .find((line) => line.includes("Showing 5 of"))
                              ?.replace("Showing ", "")
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
                        className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6">
                  {category.jobs?.map((job) => {
                    // Extract location, salary, and link from the description
                    const lines = job.description.split("\n");
                    const mainDescription = lines[0];
                    const location = lines
                      .find((line) => line.startsWith("📍"))
                      ?.replace("📍 ", "");
                    const link = lines
                      .find((line) => line.startsWith("🔗"))
                      ?.replace("🔗 ", "");

                    // Remove the total jobs message from the description
                    const descriptionWithoutTotal = mainDescription?.split(
                      "\n\nShowing"
                    )[0];

                    return (
                      <div
                        key={job.id}
                        className="group relative bg-gray-50 rounded-lg p-4 transition-all hover:shadow-md"
                      >
                        <div className="flex flex-col gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.title}
                          </h3>

                          <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-2">
                            {location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{location}</span>
                              </div>
                            )}
                          </div>

                          <p className="text-gray-600 mb-4">
                            {descriptionWithoutTotal}
                          </p>

                          {link && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
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
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="text-gray-500">
              {isLoading
                ? "Searching for jobs..."
                : "Enter a company's website URL above to start searching for jobs"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
