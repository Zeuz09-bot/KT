import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1F5CFF',
          navy: '#0A1240',
          darkNavy: '#0B1437',
          surface: '#F8FAFC',
          whatsapp: '#25D366',
          danger: '#E5484D',
        },
      },
      borderRadius: {
        'card-sm': '12px',
        'card-md': '16px',
        'card-lg': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
