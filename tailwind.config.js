/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./packages/studio/src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#ffffff',
                    hover: '#c9ccd1',
                },
                secondary: '#767d88',
                accent: {
                    DEFAULT: '#404040',
                    hover: '#7d848e',
                },
                'app-bg': '#000000',
                'panel-bg': '#030303',
                'card-bg': '#1a1a1a',
                'elevated-bg': '#1a1a1a',
                'header-bg': '#000000',
                'text-secondary': '#767d88',
                'text-muted': '#7d848e',
                'text-dim': '#a7a7a7',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            boxShadow: {
                '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.8)',
                '4xl': '0 45px 80px -20px rgba(0, 0, 0, 0.9)',
            }
        },
    },
    plugins: [],
}
