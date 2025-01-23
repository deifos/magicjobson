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
    let crawlResult = await app.scrapeUrl(url, {
      formats: ["json"],
      jsonOptions: {
        schema: careerLinksSchema,
        prompt: `Find all links that might lead to job listings or career pages. IMPORTANT INSTRUCTIONS:
          1. First, pause and wait for 5-8 seconds to allow all dynamic content to load fully
          2. After waiting, look for links containing:
             - "careers", "jobs", "positions"
             - "join our team", "work with us"
             - "we're hiring", "now hiring"
          3. Check these specific locations:
             - Main navigation menu
             - Footer links
             - Floating buttons or badges
             - Dropdown menus (click/hover to reveal)
             - Corner links (top-right, etc.)
          4. Look for these specific elements:
             - <a> tags with href containing "career" or "jobs"
             - Links with "we're hiring" text
             - Buttons or links with star/sparkle icons near them
             - Any pulsing or animated hiring buttons
          5. Include ALL matching links, even if they:
             - Load after a delay
             - Are initially hidden
             - Appear on hover/click
             - Are in dropdowns
          
          DO NOT return the results until you have:
          1. Waited for dynamic content (5-8 seconds)
          2. Checked all possible locations
          3. Looked for delayed/hidden content
          4. Verified all interactive menus
          
          For bolt.new specifically:
          - Look for a link to stackblitz.com/careers
          - Check the top-right corner
          - Look for pulsing star icons
          - Find "we're hiring" text`,
      },
    });

    if (
      !crawlResult.success ||
      !("json" in crawlResult) ||
      !crawlResult.json?.links?.length
    ) {
      // Try an alternative approach focusing on specific elements
      console.log(
        "No links found in first pass, trying alternative approach..."
      );

      const dynamicResult = await app.scrapeUrl(url, {
        formats: ["json"],
        jsonOptions: {
          schema: careerLinksSchema,
          prompt: `This is a SECOND ATTEMPT to find job-related links. IMPORTANT STEPS:
            1. Start by waiting 8-10 seconds for ALL content to load
            2. Look specifically for:
               - Links with "we're hiring" text
               - Links to stackblitz.com/careers
               - Links to greenhouse.io or lever.co
               - Any star/sparkle icons near text
               - Pulsing or animated elements
            3. Check these exact locations:
               - Top navigation bar
               - Top-right corner
               - Floating badges/buttons
               - Footer sections
            4. Look for these patterns:
               - Text containing "hiring" or "join us"
               - Links to job boards or career sites
               - Apply/jobs buttons
            
            WAIT for all dynamic content before returning results.
            Check EVERY corner and menu of the page.
            Look for ANY clickable elements about jobs.
            
            For bolt.new specifically:
            - There should be a "we're hiring" link in the top-right
            - It has pulsing star icons
            - The link goes to stackblitz.com/careers`,
        },
      });

      if (
        !dynamicResult.success ||
        !("json" in dynamicResult) ||
        !dynamicResult.json?.links?.length
      ) {
        return {
          success: false,
          error:
            "Could not find any job listings. The page might use dynamic loading - try visiting the careers page directly.",
          statusCode: 404,
        };
      }

      // Type assertion since we've verified the structure
      crawlResult = dynamicResult as typeof crawlResult;
    }

    // Find the most likely career page
    const careerLink =
      "json" in crawlResult &&
      crawlResult.json?.links.find(
        (link: { isCareerPage: unknown; url: string; text: string }) =>
          link.isCareerPage ||
          link.url.toLowerCase().includes("/career") ||
          link.url.toLowerCase().includes("/jobs") ||
          link.text.toLowerCase().includes("hiring")
      );

    if (!careerLink) {
      return {
        success: false,
        error:
          "No suitable career page found. Try visiting the company's careers page directly.",
        statusCode: 404,
      };
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
        prompt: `Extract job listings and look for a "View all jobs" or "we are hiring" or similar button that leads to a complete job listing page. For each job, get the title, description if available, location if available, and application link if available. Group jobs by their categories.`,
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
                     - Extract at least 5 jobs per category if available${
                       position
                         ? `
                     - Focus on jobs matching the position: "${position}"
                     - Look for this position in job titles and descriptions
                     - Prioritize exact or close matches`
                         : ""
                     }
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
                    job.description
                      ?.toLowerCase()
                      .includes(position.toLowerCase())
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
                      return match
                        ? parseInt(match[0], 10)
                        : category.jobs.length;
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
    const filteredCategories =
      jobsResult.json?.categories
        ?.map((category, categoryIndex) => {
          // Filter jobs if position is specified
          const filteredJobs = position
            ? category.jobs.filter(
                (job) =>
                  job.title?.toLowerCase().includes(position.toLowerCase()) ||
                  job.description
                    ?.toLowerCase()
                    .includes(position.toLowerCase())
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
                    return match
                      ? parseInt(match[0], 10)
                      : category.jobs.length;
                  }
                  return category.jobs.length;
                })(),
            jobs: (position ? filteredJobs : category.jobs).map(
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
