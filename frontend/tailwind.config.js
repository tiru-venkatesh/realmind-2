export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        sand: { 50:'#faf9f7', 100:'#f4f2ee', 200:'#e8e4dd', 300:'#d6cfc5', 400:'#b8ae9f', 500:'#9a8e7d' },
        clay: { DEFAULT:'#c2622a', hover:'#a8521f', light:'#fdf3ec' },
      },
    },
  },
  plugins: [],
};
