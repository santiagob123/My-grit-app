/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 - scan all your source files
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./global.css",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        primary: "#FFFFFF",
        secondary: "#1C1C1E",
        accent: "#0A84FF",
        muted: "#8E8E93",
        danger: "#FF453A",
        success: "#32D74B",
        card: "#121212",
      },
    },
  },
  plugins: [],
};
