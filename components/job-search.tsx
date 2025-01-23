"use client";

import { useState } from "react";
import { Search, MapPin, DollarSign, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { JobCategory } from "@/types/jobs";
import { scrapeJobs } from "@/lib/actions";
import { toast } from "sonner";

export default function JobSearch() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);

  const handleSearch = async () => {
    if (!url) {
      toast.error("Please enter a URL to search for jobs");
      return;
    }

    setIsLoading(true);
    try {
      const result = await scrapeJobs(url);
      if (result.success && result.data) {
        setJobCategories(result.data);
        toast.success("Successfully scraped jobs from the website");
      } else {
        toast.error(result.error || "Failed to scrape jobs from the website");
      }
    } catch (error) {
      console.error("Error scraping jobs:", error);
      toast.error("An error occurred while scraping jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
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
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-xl">
                      {category.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {category.tags?.map((tag, index) => (
                        <Badge 
                          key={`${tag}-${index}`} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6">
                  {category.jobs?.map((job) => (
                    <div 
                      key={job.id} 
                      className="border rounded-lg p-6 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 whitespace-pre-line">
                        {job.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <p className="text-gray-500">
              {isLoading 
                ? "Searching for jobs..."
                : "Enter a company's website URL above to start searching for jobs"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
