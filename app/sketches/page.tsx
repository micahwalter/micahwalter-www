import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sketches",
  description: "Visual explorations and creative work",
};

export default function SketchesPage() {
  return (
    <div className="max-w-wide mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-charcoal mb-4">
          Sketches
        </h1>
        <p className="text-lg text-gray">
          Visual explorations and creative experiments
        </p>
      </header>

      <div className="text-center py-20 text-gray">
        <p className="text-xl">Coming soon...</p>
        <p className="mt-4">
          This section will showcase visual work and creative experiments.
        </p>
      </div>
    </div>
  );
}
