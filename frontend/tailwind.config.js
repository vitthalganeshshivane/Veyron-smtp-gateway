/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Oracle Neutral Ladder from DESIGN.md
        canvas: '#ffffff',
        'canvas-soft': '#fbf9f8',
        'canvas-tint': '#f5f4f2',
        'canvas-warm': '#f1efed',
        hairline: '#e4e1dd',
        divider: '#e9e7e4',
        'field-border': '#d4cfca',
        
        // Inks & Primaries
        ink: '#161513',
        'ink-deep': '#211e1c',
        primary: '#312d2a',
        'primary-pressed': '#47423e',
        'on-primary': '#ffffff',
        
        // Brand & Accents
        'brand-mark': '#c74634',
        'accent-gold': '#f0cc71',
        'accent-gold-soft': '#f7e0a1',
        'band-teal': '#d6e5e5',
        'band-forest': '#33553c',
        
        // Semantics
        link: '#006b8f',
        focus: '#227e9e',
        error: '#d63b25',
        'disabled-ink': '#aea8a2'
      },
      fontFamily: {
        serif: ['Georgia', 'Gelasio', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace']
      },
      borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '15px',
        full: '9999px'
      },
      letterSpacing: {
        tightest: '0px',
        tighter: '0px',
        tight: '0px',
        normal: '0px',
        wide: '0px',
        wider: '0px',
        widest: '0px'
      },
      spacing: {
        section: '48px',
        gutter: '72px'
      }
    },
  },
  plugins: [],
}
