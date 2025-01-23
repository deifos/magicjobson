import JobSearch from "@/components/job-search";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1a1a1a] font-mono">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-block">
            <h1 className="text-6xl font-bold text-[#ff6b6b] mb-2 animate-pulse">
              🏀 Magic JOBson
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-[#ff6b6b] to-[#ff8585]" />
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed">
            Drop your URL and watch our all-star AI scout find the perfect career opportunities! 
            <br />
            <span className="text-[#ff6b6b]">Game on! 🎯</span>
          </p>
        </div>
        <JobSearch />
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Made with 🏀 by the Magic JOBson team</p>
        </footer>
      </div>
    </main>
  );
}
