"use server";

import { JobCategory } from "@/types/jobs";
import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

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

export async function scrapeJobs(
  url: string,
  position?: string
): Promise<{
  success: boolean;
  data?: JobCategory[];
  error?: string;
  statusCode?: number;
}> {
  try {
    const app = new FirecrawlApp({
      apiKey: FIRECRAWL_API_KEY,
    });

    // First, crawl the main page to find career/jobs links
    const crawlResult = await app.scrapeUrl(url, {
      formats: ["json"],
      jsonOptions: {
        schema: careerLinksSchema,
        prompt: `Find all links that might lead to job listings or career pages. Focus on links containing words like "careers", "jobs", "work with us", "join our team", especially in the footer or main navigation.`,
      },
    });

    if (!crawlResult.success || !crawlResult.json?.links?.length) {
      throw new Error("No career links found");
    }

    // Find the most likely career page
    const careerLink = crawlResult.json.links.find(
      (link) =>
        link.isCareerPage &&
        (link.url.includes("/careers") || link.url.includes("/jobs"))
    );

    if (!careerLink) {
      throw new Error("No suitable career page found");
    }

    let jobPageUrl: string;
    if (careerLink.url.startsWith("http")) {
      jobPageUrl = careerLink.url;
    } else if (careerLink.url.startsWith("/")) {
      // Handle relative URLs
      const baseUrl = new URL(url);
      jobPageUrl = `${baseUrl.protocol}//${baseUrl.host}${careerLink.url}`;
    } else {
      jobPageUrl = `${url.replace(/\/$/, "")}/${careerLink.url}`;
    }

    // Now scrape the jobs page with a schema that includes the "View all jobs" button
    const jobsResult = await app.scrapeUrl(jobPageUrl, {
      formats: ["json"],
      jsonOptions: {
        schema: z.object({
          categories: z.array(
            z.object({
              category: z.string(),
              jobs: z.array(
                z.object({
                  title: z.string(),
                  description: z.string().optional(),
                  location: z.string().optional(),
                  link: z.string().optional(),
                })
              ),
              totalJobs: z.number().optional(),
              jobCount: z.string().optional(), // For parsing text like "204 jobs"
            })
          ),
          viewAllJobsLink: z.string().optional(),
        }),
        prompt: `Extract job listings and look for a "View all jobs" or similar button that leads to a complete job listing page. For each job, get the title, description if available, location if available, and application link if available. Group jobs by their categories.`,
      },
    });

    if (!jobsResult.success) {
      throw new Error(`Failed to scrape jobs page: ${jobsResult.error}`);
    }

    // If there's a "View all jobs" link, scrape that page as well
    if (jobsResult.json?.viewAllJobsLink) {
      const viewAllUrl = new URL(jobsResult.json.viewAllJobsLink, jobPageUrl)
        .href;

      const allJobsResult = await app.scrapeUrl(viewAllUrl, {
        formats: ["json"],
        jsonOptions: {
          schema: z.object({
            categories: z.array(
              z.object({
                category: z.string(),
                jobs: z.array(
                  z.object({
                    title: z.string(),
                    description: z.string().optional(),
                    location: z.string().optional(),
                    link: z.string().optional(),
                  })
                ),
                totalJobs: z.number().optional(),
                jobCount: z.string().optional(), // For parsing text like "204 jobs"
              })
            ),
          }),
          prompt: `Extract job listings from this page. For each category:
                  1. Look for and extract the TOTAL number of jobs available by:
                     - Finding text patterns like "204 jobs", "50+ positions", "Showing 1-10 of 50"
                     - Store this in 'jobCount' field as text
                     - If a specific number is found, store in 'totalJobs'
                  2. For each job within the category:
                     - Get the title, description, location, and application link
                     - Extract at least 5 jobs per category if available${position ? `
                     - Focus on jobs matching the position: "${position}"
                     - Look for this position in job titles and descriptions
                     - Prioritize exact or close matches` : ''}
                  3. Group jobs by their categories (e.g., Engineering, Design, Product)
                  4. Make sure to look at job counts in headers, footers, or category titles`,
        },
      });

      if (allJobsResult.success && allJobsResult.json?.categories) {
        // Filter and map the scraped data to match JobCategory type
        const categoriesWithCounts = allJobsResult.json.categories
          .map((category, categoryIndex) => {
            // Filter jobs if position is specified
            const filteredJobs = position
              ? category.jobs.filter(
                  (job) =>
                    job.title?.toLowerCase().includes(position.toLowerCase()) ||
                    job.description?.toLowerCase().includes(position.toLowerCase())
                )
              : category.jobs;

            return {
              id: categoryIndex + 1,
              title: category.category,
              tags: [],
              totalJobs: position
                ? filteredJobs.length // If filtering by position, total is filtered count
                : category.totalJobs ||
                  (() => {
                    if (category.jobCount) {
                      const match = category.jobCount.match(/\d+/);
                      return match ? parseInt(match[0], 10) : category.jobs.length;
                    }
                    return category.jobs.length;
                  })(),
              jobs: (position ? filteredJobs : category.jobs.slice(0, 5)).map(
                (job, jobIndex) => ({
                  id: (categoryIndex + 1) * 1000 + jobIndex,
                  title: job.title,
                  description: job.description || "",
                  location: job.location,
                  link: job.link,
                })
              ),
            };
          })
          .filter((category) => category.jobs.length > 0); // Remove empty categories

        return {
          success: true,
          data: categoriesWithCounts,
        };
      }
    }

    // If no "View all jobs" link or if that page failed, return the jobs from the main careers page
    const filteredCategories = jobsResult.json?.categories
      ?.map((category, categoryIndex) => {
        // Filter jobs if position is specified
        const filteredJobs = position
          ? category.jobs.filter(
              (job) =>
                job.title?.toLowerCase().includes(position.toLowerCase()) ||
                job.description?.toLowerCase().includes(position.toLowerCase())
            )
          : category.jobs;

        return {
          id: categoryIndex + 1,
          title: category.category,
          tags: [],
          totalJobs: position
            ? filteredJobs.length // If filtering by position, total is filtered count
            : category.totalJobs ||
              (() => {
                if (category.jobCount) {
                  const match = category.jobCount.match(/\d+/);
                  return match ? parseInt(match[0], 10) : category.jobs.length;
                }
                return category.jobs.length;
              })(),
          jobs: (position ? filteredJobs : category.jobs).map((job, jobIndex) => ({
            id: (categoryIndex + 1) * 1000 + jobIndex,
            title: job.title,
            description: job.description || "",
            location: job.location,
            link: job.link,
          })),
        };
      })
      .filter((category) => category.jobs.length > 0) || []; // Remove empty categories

    return {
      success: true,
      data: filteredCategories,
    };
  } catch (error) {
    console.error("Error scraping jobs:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Handle specific error types
    if (errorMessage.includes("408") || errorMessage.includes("timed out")) {
      return {
        success: false,
        error:
          "This site is taking too long to respond. Please try again later.",
        statusCode: 408,
      };
    }

    if (errorMessage.includes("404")) {
      return {
        success: false,
        error:
          "We couldn't find that page. Double-check the URL and try again!",
        statusCode: 404,
      };
    }

    if (errorMessage.includes("403")) {
      return {
        success: false,
        error:
          "This site isn't letting us access their jobs right now. Try again later.",
        statusCode: 403,
      };
    }

    if (errorMessage.includes("400")) {
      return {
        success: false,
        error: "Please enter a valid website URL (e.g., company.com)",
        statusCode: 400,
      };
    }

    // Generic error message for other cases
    return {
      success: false,
      error: "Something went wrong. Please try again later.",
      statusCode: 500,
    };
  }
}
