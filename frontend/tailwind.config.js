export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: { navy: { 50: '#EEF2F8', 100: '#D5DEEC', 600: '#1D4272', 700: '#15335A', 800: '#0F2A4A', 900: '#0A1D35' } },
      boxShadow: { card: '0 1px 2px rgba(15,42,74,.05), 0 4px 16px -6px rgba(15,42,74,.10)' },
    },
  },
  plugins: [],
};
