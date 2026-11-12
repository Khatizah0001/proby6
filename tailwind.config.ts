import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { fontFamily: { sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'] }, colors: { navy: { DEFAULT: '#0B1437', 2: '#111C4E' } } } },
  plugins: [],
}
export default config
