import JobSearch from "@/components/job-search";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Magic JOBson
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter any company website and let our AI magic find and organize their job listings for you.
          </p>
        </div>
        <JobSearch />
      </div>
    </main>
  );
}
