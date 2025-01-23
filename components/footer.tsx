export default function Footer() {
  return (
    <footer className="w-full py-6 mt-auto border-t border-[#ff6b6b]/20">
      <div className="container mx-auto px-4">
        <p className="text-center text-gray-500 text-sm">
          Made with 💛 by Vlad, coded using Windsurf, scrapping powered by{" "}
          <a
            href="https://www.firecrawl.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ff6b6b] hover:text-[#ff8585] transition-colors"
          >
            firecrawl🔥
          </a>
        </p>
      </div>
    </footer>
  );
}
