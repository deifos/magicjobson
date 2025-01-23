import { XIcon } from "./XIcon";

export default function Footer() {
  return (
    <footer className="w-full py-6 mt-auto border-t border-[#ff6b6b]/20">
      <div className="container mx-auto px-4">
        <p className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          Made with 💛 by Vlad
          <a
            href="https://x.com/deifosv"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-blue-400 transition-colors inline-flex items-center"
          >
            <XIcon className="w-5 h-5" />
          </a>
          , coded using Windsurf, scrapping powered by
          <a
            href="https://www.firecrawl.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ff6b6b] hover:text-[#ff8585] transition-colors"
          >
            Firecrawl🔥
          </a>
        </p>
      </div>
    </footer>
  );
}
