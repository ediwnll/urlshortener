/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Digital Brutalist palette
        'snip-black': '#0a0a0a',
        'snip-white': '#f5f5f0',
        'snip-gray': '#1a1a1a',
        'snip-accent': '#d4ff00',
        'snip-accent-dark': '#a8cc00',
        'snip-error': '#ff3333',
        'snip-success': '#00ff88',
      },
      fontFamily: {
        'mono': ['Space Mono', 'monospace'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
