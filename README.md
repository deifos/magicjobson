# MagicJobson

A slam-dunk approach to job hunting! MagicJobson is a dynamic job search tool that helps you find job opportunities across company websites with a basketball-themed twist.

## Screenshots

### Home Screen

![Home Screen](/public/screenshots/magicJobsonScreen1.JPG)
_The main search interface with position filtering_

### Search Results

![Search Results](/public/screenshots/magicJobsonScreen2.JPG)
_Job search results organized by categories_

## Features

- Smart Job Scraping: Enter any company website URL and let MagicJobson find their career opportunities
- Position Filtering: Narrow down your search by specifying your dream position
- Category Organization: Jobs are neatly organized by categories with clear job counts
- Location Display: See job locations at a glance
- Interactive UI: Enjoy fun loading messages and celebratory confetti animations
- Fast Performance: Server-side rendering and efficient job scraping
- Modern Design: Beautiful, responsive UI with a retro basketball theme

## Tech Stack

- Framework: Next.js 15 with App Router
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- Job Scraping: Firecrawl API
- Form Validation: Zod
- Animations: Canvas Confetti
- Toast Notifications: Sonner

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/magicjobson.git
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file with your Firecrawl API key:

```env
FIRECRAWL_API_KEY=your_api_key_here
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

1. Enter a company's website URL in the search bar
2. (Optional) Enter your desired position to filter results
3. Click "Take the Shot!" to start the search
4. Browse through categorized job listings
5. Click "Apply Now" on any job to go directly to the application

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Powered by [Firecrawl](https://firecrawl.co) for job scraping
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons by [Lucide](https://lucide.dev)
