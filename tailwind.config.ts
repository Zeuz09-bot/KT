import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        /* ── Quiet Tech Luxury Brand Palette ──────────────── */
        brand: {
          navy: '#3B4854', // Hero Brand Color (Slate Navy)
          charcoal: '#18191B', // Device & Core Box (Obsidian Charcoal)
          cream: '#F3EFEA', // Environment & Web Base (Limestone Cream)
          canvas: '#F3EFEA', // Web canvas alias
          silver: '#D4D8DD', // Metallic Accent (Brushed Silver / Chrome)
          champagne: '#C5B49C', // Editorial Accent (Champagne Foil)
          white: '#FFFFFF', // Pure White (Contrast Negative Space)

          /* Storefront Aliases & Overrides */
          blue: '#3B4854', // Hero Slate Navy
          blueDark: '#2F3A44',
          blueLight: '#E8ECF0',
          navyDark: '#18191B', // Obsidian Charcoal
          surface: '#F3EFEA', // Limestone Cream

          /* Essential Functional Status */
          whatsapp: '#25D366',
          whatsappDark: '#1DA851',
          danger: '#E5484D',
          dangerLight: '#FFF0F0',
          success: '#16A34A',
          successLight: '#F0FDF4',
          warning: '#F59E0B',
          warningLight: '#FFFBEB',
        },
        /* ── Quiet Luxury Neutral Scale ───────────────────── */
        neutral: {
          0: '#FFFFFF',
          50: '#FBF9F7',
          100: '#F3EFEA', // Limestone Cream
          200: '#E6E1DA',
          300: '#D4D8DD', // Brushed Silver
          400: '#A9AFB7',
          500: '#7E8690',
          600: '#5A636D',
          700: '#3B4854', // Slate Navy
          800: '#272B2E',
          900: '#18191B', // Obsidian Charcoal
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        editorial: ['var(--font-cinzel)', 'Georgia', 'serif'],
      },
      letterSpacing: {
        display: '0.025em',
        editorial: '0.18em',
        'editorial-wide': '0.22em',
      },
      borderRadius: {
        'card-sm': '12px',
        'card-md': '16px',
        'card-lg': '24px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(24,25,27,0.06), 0 1px 2px -1px rgba(24,25,27,0.04)',
        'card-hover': '0 8px 24px -4px rgba(59,72,84,0.12), 0 2px 6px -1px rgba(24,25,27,0.06)',
        modal: '0 24px 64px 0 rgba(24,25,27,0.22)',
        metallic: '0 0 0 1px rgba(212,216,221,0.6), 0 4px 12px rgba(24,25,27,0.04)',
        foil: '0 0 0 1px rgba(197,180,156,0.4), 0 4px 14px rgba(197,180,156,0.15)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-down': 'slide-down 0.2s ease-out',
        shimmer: 'shimmer 1.8s linear infinite',
        'accordion-down': 'accordion-down 0.18s ease-out',
        'accordion-up': 'accordion-up 0.18s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;

