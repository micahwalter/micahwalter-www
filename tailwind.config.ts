import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#fafaf2",
        charcoal: "#191919",
        gray: "#5F5F5F",
        accent: "#F5B684",
      },
      fontFamily: {
        serif: ["var(--font-eb-garamond)", "Georgia", "serif"],
      },
      maxWidth: {
        reading: "645px",
        wide: "1340px",
      },
    },
  },
  plugins: [],
} satisfies Config;
