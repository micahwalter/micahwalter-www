export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-charcoal/10">
      <div className="max-w-wide mx-auto px-6 py-12">
        <div className="text-center space-y-4">
          <p className="text-gray italic text-lg">
            Investigations in AI, Cloud, and Creativity
          </p>
          <p className="text-gray text-sm">
            &copy; {currentYear} Micah Walter. All rights reserved.
          </p>
          <p className="text-gray text-sm">
            <a href="/about" className="hover:text-charcoal transition-colors no-underline">
              About
            </a>
            {" · "}
            <a href="/newsletter" className="hover:text-charcoal transition-colors no-underline">
              Newsletter
            </a>
            {" · "}
            <a href="/exposures" className="hover:text-charcoal transition-colors no-underline">
              Exposures
            </a>
            {" · "}
            <a href="/emails" className="hover:text-charcoal transition-colors no-underline">
              Email Archive
            </a>
            {" · "}
            <a href="/colophon" className="hover:text-charcoal transition-colors no-underline">
              Colophon
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
