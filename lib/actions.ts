"use server";

import { JobCategory, Job } from "@/types/jobs";
import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// Define the schema for job data extraction
const jobSchema = z.object({
  categories: z.array(
    z.object({
      category: z.string(),
      tags: z.array(z.string()),
      jobs: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
        })
      ),
    })
  ),
});

export async function scrapeJobs(url: string): Promise<{
  success: boolean;
  data?: JobCategory[];
  error?: string;
}> {
  if (!FIRECRAWL_API_KEY) {
    return {
      success: false,
      error: "Firecrawl API key is not configured",
    };
  }

  try {
    const app = new FirecrawlApp({
      apiKey: FIRECRAWL_API_KEY,
    });

    const scrapeResult = await app.scrapeUrl(url, {
      formats: ["json"],
      jsonOptions: {
        schema: jobSchema,
        prompt:
          "Extract job listings from this page. Group them by category (like Engineering, Design, Marketing, etc). For each job, extract the title and description. Add relevant tags for each category.",
      },
    });

    if (!scrapeResult.success) {
      throw new Error(`Failed to scrape: ${scrapeResult.error}`);
    }

    console.log('Raw scrape result:', JSON.stringify(scrapeResult, null, 2));
    // Access the json property directly from scrapeResult
    const extractedData = scrapeResult.json;

    if (!extractedData?.categories || !Array.isArray(extractedData.categories)) {
      console.log('Extracted data:', extractedData);
      return {
        success: false,
        error: "No job data found on the page",
      };
    }

    // Transform the scraped data into our JobCategory format
    const categories: JobCategory[] = extractedData.categories.map(
      (category, index) => ({
        id: index + 1,
        title: category.category,
        tags: category.tags || [],
        jobs: (category.jobs || []).map((job, jobIndex) => ({
          id: (index + 1) * 1000 + jobIndex,
          title: job.title,
          description: job.description,
        })),
      })
    );

    console.log('Transformed categories:', JSON.stringify(categories, null, 2));

    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error("Error scraping jobs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to scrape jobs",
    };
  }
}
