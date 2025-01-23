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
          location: z.string().optional(),
          salary: z.string().optional(),
          link: z.string().optional(),
        })
      ),
    })
  ),
});

// Schema to find career/jobs pages
const careerLinksSchema = z.object({
  links: z.array(
    z.object({
      url: z.string(),
      text: z.string(),
      isCareerPage: z.boolean(),
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

    // First, crawl the main page to find career/jobs links
    console.log("Crawling main page for career links...");
    const crawlResult = await app.scrapeUrl(url, {
      formats: ["json"],
      jsonOptions: {
        schema: careerLinksSchema,
        prompt: `Find all links that might lead to job listings or career pages. Look for:
                - Links containing words like "careers", "jobs", "work with us", "join our team"
                - Links in the footer or main navigation
                - Links that might lead to job opportunities
                
                For each link found, determine if it's likely a career page based on the link text and URL.
                Return all potential career-related links, sorted by likelihood of being a career page.`,
      },
    });

    if (!crawlResult.success) {
      throw new Error(`Failed to crawl main page: ${crawlResult.error}`);
    }

    console.log("Crawl result:", JSON.stringify(crawlResult, null, 2));

    // Find the most likely career page URL
    let jobPageUrl = url; // Default to original URL
    const links = crawlResult.json?.links || [];
    const careerLink = links.find((link) => link.isCareerPage);

    if (careerLink) {
      console.log("Found career page:", careerLink.url);
      // Make sure the URL is absolute
      jobPageUrl = new URL(careerLink.url, url).href;
    }

    // Now scrape the jobs page
    console.log("Scraping jobs from:", jobPageUrl);
    const scrapeResult = await app.scrapeUrl(jobPageUrl, {
      formats: ["json"],
      jsonOptions: {
        schema: jobSchema,
        prompt: `Extract all job listings from this page. Group them by department or category (like Engineering, Design, Marketing, etc).
                For each job:
                - Extract the exact job title
                - Get a detailed description
                - If available, include the location, salary, and direct link to apply
                - Add relevant tags for each category based on the skills and requirements mentioned
                
                If you find job listings, make sure to categorize them properly. If a job could belong to multiple categories,
                choose the most relevant one. Add appropriate tags to help with searchability.
                
                Example of good tags for Engineering:
                - For Frontend: "react", "javascript", "ui/ux"
                - For Backend: "python", "apis", "databases"
                - For DevOps: "aws", "kubernetes", "ci/cd"`,
      },
    });

    if (!scrapeResult.success) {
      throw new Error(`Failed to scrape jobs: ${scrapeResult.error}`);
    }

    console.log("Scrape result:", JSON.stringify(scrapeResult, null, 2));

    const extractedData = scrapeResult.json;

    if (
      !extractedData?.categories ||
      !Array.isArray(extractedData.categories)
    ) {
      console.log("No job data found:", extractedData);
      return {
        success: false,
        error: `No job listings found${
          careerLink ? " even on the careers page" : ""
        }`,
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
          description: [
            job.description,
            job.location && `📍 ${job.location}`,
            job.salary && `💰 ${job.salary}`,
            job.link && `🔗 ${job.link}`,
          ]
            .filter(Boolean)
            .join("\n"),
        })),
      })
    );

    console.log("Transformed categories:", JSON.stringify(categories, null, 2));

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
