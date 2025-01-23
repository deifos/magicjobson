import JobSearch from "@/components/job-search";
import Footer from "@/components/footer";
import { GitHubCorner } from "@/components/github-corner";

export default function Home() {
  return (
    <div className="h-screen bg-[#1a1a1a] font-mono flex flex-col relative">
      <GitHubCorner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="inline-block">
              <h1 className="text-6xl font-bold text-[#ff6b6b] mb-2 animate-pulse">
                🏀 Magic JOBson
              </h1>
              <div className="h-1 w-full bg-gradient-to-r from-[#ff6b6b] to-[#ff8585]" />
            </div>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed">
              Drop your URL and watch our all-star AI scout find the perfect
              career opportunities!
              <br />
              <span className="text-[#ff6b6b]">Game on! 🎯</span>
            </p>
          </div>
          <JobSearch />
        </div>
      </main>
      <Footer />
    </div>
  );
}
