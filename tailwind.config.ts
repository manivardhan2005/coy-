import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coy: {
          pink: "#FF3366",
          rose: "#FF4E78",
          purple: "#7928CA",
          dark: "#121214",
          card: "#1C1C20",
          border: "#2E2E34",
          muted: "#8E8E93"
        }
      },
      keyframes: {
        pulseMatch: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' }
        }
      },
      animation: {
        'pulse-match': 'pulseMatch 2s infinite ease-in-out'
      }
    },
  },
  plugins: [],
};
export default config;
