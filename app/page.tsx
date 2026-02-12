export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-800">
      <div className="text-center px-6 py-12 max-w-2xl">
        <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in">
          Welcome!
        </h1>

        <p className="text-xl text-purple-100 mb-8">
          Your Next.js website is now live on AWS CloudFront
        </p>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
          <div className="grid gap-4 text-left">
            <StatusItem emoji="✅" text="Next.js 15 with App Router" />
            <StatusItem emoji="✅" text="TypeScript enabled" />
            <StatusItem emoji="✅" text="Tailwind CSS configured" />
            <StatusItem emoji="✅" text="S3 + CloudFront hosting" />
            <StatusItem emoji="✅" text="GitHub Actions CI/CD" />
            <StatusItem emoji="✅" text="HTTPS enabled" />
          </div>
        </div>

        <div className="mt-8 text-purple-200 text-sm">
          <p>Built with Next.js • Deployed to AWS</p>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-3 text-white">
      <span className="text-2xl">{emoji}</span>
      <span className="text-lg">{text}</span>
    </div>
  );
}
